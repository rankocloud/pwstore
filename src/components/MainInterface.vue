<template>
  <div class="main-interface">
    <!-- 头部 -->
    <div class="header flex justify-between items-center px-4 py-3 bg-dark text-white">
      <h1 class="text-xl font-medium">本地密码管理器</h1>
      <button 
        class="text-white hover:text-gray-300 transition-colors"
        @click="handleLock"
        title="锁定"
      >
        🔒
      </button>
    </div>
    
    <!-- 选项卡 -->
    <div class="tabs flex border-b flex-wrap">
      <button 
        :class="['flex-1 py-2 px-4 text-center', activeTab === 'credentials' ? 'border-b-2 border-primary text-primary' : 'text-gray-600']"
        @click="switchTab('credentials')"
      >
        凭据
      </button>
      <button 
        :class="['flex-1 py-2 px-4 text-center', activeTab === 'add' ? 'border-b-2 border-primary text-primary' : 'text-gray-600']"
        @click="switchTab('add')"
      >
        添加
      </button>
      <button 
        :class="['flex-1 py-2 px-4 text-center', activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-600']"
        @click="switchTab('settings')"
      >
        基础设置
      </button>
      <button 
        :class="['flex-1 py-2 px-4 text-center', activeTab === 'pageRecognition' ? 'border-b-2 border-primary text-primary' : 'text-gray-600']"
        @click="switchTab('pageRecognition')"
      >
        页面识别设置
      </button>
    </div>
    
    <!-- 搜索框 -->
    <div v-if="activeTab === 'credentials'" class="search-container p-4">
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          class="form-control w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          placeholder="搜索凭据..."
          @input="handleSearch"
        />
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content p-4">
      <!-- 凭据列表 -->
      <div v-if="activeTab === 'credentials'" class="credentials-list">
        <div v-if="filteredCredentials.length === 0" class="text-center py-8 text-gray-500">
          {{ searchQuery ? '没有找到匹配的凭据' : '还没有添加任何凭据' }}
        </div>
        <div v-else>
          <CredentialItem 
            v-for="credential in filteredCredentials"
            :key="credential.id"
            :credential="credential"
            @edit="handleEditCredential"
            @delete="handleDeleteCredential"
          />
        </div>
      </div>
      
      <!-- 添加凭据表单 -->
      <div v-if="activeTab === 'add'" class="add-credential-form">
        <AddCredentialForm 
          :editing-credential="editingCredential"
          @save="handleAddCredential" 
          @cancel="switchTab('credentials')"
        />
      </div>
      
      <!-- 设置页面 -->
      <div v-if="activeTab === 'settings'" class="settings">
        <SettingsForm @update="handleSettingsUpdate" />
      </div>
      
      <!-- 页面识别设置页面 -->
      <div v-if="activeTab === 'pageRecognition'" class="page-recognition-settings">
        <PageRecognitionSettings />
      </div>
    </div>
  </div>
</template>

<script>
import CredentialItem from './CredentialItem.vue'
import AddCredentialForm from './AddCredentialForm.vue'
import SettingsForm from './SettingsForm.vue'
import PageRecognitionSettings from './PageRecognitionSettings.vue'

export default {
  name: 'MainInterface',
  components: {
    CredentialItem,
    AddCredentialForm,
    SettingsForm,
    PageRecognitionSettings
  },
  data() {
    return {
      credentials: [],
      activeTab: 'credentials',
      searchQuery: '',
      editingCredential: null
    }
  },
  computed: {
    filteredCredentials() {
      if (!this.searchQuery) {
        return this.credentials
      }
      
      const query = this.searchQuery.toLowerCase()
      return this.credentials.filter(credential => 
        credential.origin.toLowerCase().includes(query) ||
        credential.username.toLowerCase().includes(query) ||
        (credential.categories && credential.categories.some(cat => cat.toLowerCase().includes(query)))
      )
    }
  },
  async mounted() {
    await this.loadCredentials()
  },
  methods: {
    async loadCredentials() {
      const response = await this.sendMessage({ action: 'GET_CREDENTIALS' })
      console.log("获取凭据结果：", response)
      if (response.success) {
        this.credentials = response.credentials || []
      }
    },
    switchTab(tab) {
      this.activeTab = tab
    },
    handleSearch() {
      // 搜索逻辑已经在computed属性中实现
    },
    async handleAddCredential(credential) {
      const response = await this.sendMessage({
        action: 'SAVE_CREDENTIAL',
        data: credential
      })
      
      if (response.success) {
        await this.loadCredentials()
        this.switchTab('credentials')
        alert('凭据添加成功')
      } else {
        alert('添加失败: ' + response.error)
      }
    },

    async handleEditCredential(credential) {
      // 设置为编辑模式并保存当前要编辑的凭据
      this.activeTab = 'add'
      this.editingCredential = credential
    },
    async handleDeleteCredential(id) {
      if (confirm('确定要删除这个凭据吗？')) {
        const response = await this.sendMessage({
          action: 'DELETE_CREDENTIAL',
          id
        })
        
        if (response.success) {
          await this.loadCredentials()
          alert('凭据已删除')
        } else {
          alert('删除失败: ' + response.error)
        }
      }
    },
    async handleSettingsUpdate(settings) {
      const response = await this.sendMessage({
        action: 'UPDATE_SETTINGS',
        settings
      })
      
      if (response.success) {
        alert('设置已更新')
      } else {
        alert('更新失败: ' + response.error)
      }
    },
    async handleLock() {
      await this.sendMessage({ action: 'LOCK_VAULT' })
      this.$router.push('/unlock')
    },
    sendMessage(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response)
        })
      })
    }
  }
}
</script>