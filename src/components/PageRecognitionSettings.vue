<template>
  <div class="page-recognition-settings">
    <h3 class="text-lg font-medium mb-4">页面识别偏好设置</h3>
    
    <!-- 域名识别设置列表 -->
    <div v-if="domainSettings.length > 0" class="mb-6">
      <h4 class="text-md font-medium mb-2">已保存的域名设置</h4>
      <div class="space-y-3">
        <div 
          v-for="(setting, index) in domainSettings" 
          :key="index"
          class="border border-gray-200 rounded-md p-3 bg-white"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium">{{ setting.domain }}</span>
            <button 
              class="text-sm text-danger hover:text-danger/80"
              @click="removeDomainSetting(index)"
            >
              删除
            </button>
          </div>
          
          <div class="text-sm text-gray-600 mb-2">
            <div class="mb-1">用户名选择器: {{ setting.usernameSelector.type }}={{ setting.usernameSelector.value }}</div>
            <div class="mb-1">密码选择器: {{ setting.passwordSelector.type }}={{ setting.passwordSelector.value }}</div>
            <div>登录按钮选择器: {{ setting.loginButtonSelector.type }}={{ setting.loginButtonSelector.value }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加新的域名设置表单 -->
    <div class="form-container border border-gray-200 rounded-md p-4 bg-white">
      <h4 class="text-md font-medium mb-3">添加新的域名设置</h4>
      
      <div class="form-group mb-3">
        <label for="domain" class="block text-sm font-medium text-gray-700 mb-1">域名</label>
        <input
          type="text"
          id="domain"
          v-model="newSetting.domain"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          placeholder="例如: example.com"
        />
      </div>
      
      <!-- 用户名选择器设置 -->
      <div class="mb-4">
        <h5 class="text-sm font-medium mb-2">用户名选择器</h5>
        <div class="flex space-x-2">
          <select
            v-model="newSetting.usernameSelector.type"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="type">type</option>
            <option value="autocomplete">autocomplete</option>
            <option value="id">id</option>
            <option value="class">class</option>
          </select>
          <input
            type="text"
            v-model="newSetting.usernameSelector.value"
            class="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="值"
          />
        </div>
      </div>
      
      <!-- 密码选择器设置 -->
      <div class="mb-4">
        <h5 class="text-sm font-medium mb-2">密码选择器</h5>
        <div class="flex space-x-2">
          <select
            v-model="newSetting.passwordSelector.type"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="type">type</option>
            <option value="autocomplete">autocomplete</option>
            <option value="id">id</option>
            <option value="class">class</option>
          </select>
          <input
            type="text"
            v-model="newSetting.passwordSelector.value"
            class="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="值"
          />
        </div>
      </div>
      
      <!-- 登录按钮选择器设置 -->
      <div class="mb-4">
        <h5 class="text-sm font-medium mb-2">登录按钮选择器</h5>
        <div class="flex space-x-2 mb-2">
          <select
            v-model="newSetting.loginButtonSelector.element"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="input">input</option>
            <option value="button">button</option>
          </select>
        </div>
        <div class="flex space-x-2">
          <select
            v-model="newSetting.loginButtonSelector.type"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="type">type</option>
            <option value="id">id</option>
            <option value="class">class</option>
          </select>
          <input
            type="text"
            v-model="newSetting.loginButtonSelector.value"
            class="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            placeholder="值"
          />
        </div>
      </div>
      
      <button
        type="button"
        class="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
        @click="addDomainSetting"
      >
        添加设置
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageRecognitionSettings',
  data() {
    return {
      domainSettings: [],
      newSetting: {
        domain: '',
        usernameSelector: {
          type: 'type',
          value: 'email'
        },
        passwordSelector: {
          type: 'type',
          value: 'password'
        },
        loginButtonSelector: {
          element: 'input',
          type: 'type',
          value: 'submit'
        }
      }
    }
  },
  async mounted() {
    await this.loadSettings()
  },
  methods: {
    async loadSettings() {
      const response = await this.sendMessage({ action: 'GET_PAGE_RECOGNITION_SETTINGS' })
      if (response.success && response.settings) {
        this.domainSettings = response.settings
      }
    },
    async addDomainSetting() {
      if (!this.newSetting.domain.trim()) {
        alert('请输入域名')
        return
      }
      
      // 创建新的设置对象
      const settingToAdd = {
        domain: this.newSetting.domain.trim(),
        usernameSelector: {
          ...this.newSetting.usernameSelector
        },
        passwordSelector: {
          ...this.newSetting.passwordSelector
        },
        loginButtonSelector: {
          ...this.newSetting.loginButtonSelector
        }
      }
      
      // 添加到列表并保存
      this.domainSettings.push(settingToAdd)
      await this.saveSettings()
      
      // 重置表单
      this.newSetting = {
        domain: '',
        usernameSelector: {
          type: 'type',
          value: 'email'
        },
        passwordSelector: {
          type: 'type',
          value: 'password'
        },
        loginButtonSelector: {
          element: 'input',
          type: 'type',
          value: 'submit'
        }
      }
    },
    async removeDomainSetting(index) {
      this.domainSettings.splice(index, 1)
      await this.saveSettings()
    },
    async saveSettings() {
      const response = await this.sendMessage({
        action: 'SAVE_PAGE_RECOGNITION_SETTINGS',
        data: this.domainSettings
      })
      
      if (!response.success) {
        alert('保存失败: ' + (response.error || '未知错误'))
        // 重新加载设置以恢复可能的更改
        await this.loadSettings()
      }
    },
    sendMessage(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response || { success: false })
        })
      })
    }
  }
}
</script>

<style scoped>
.page-recognition-settings {
  max-width: 800px;
  margin: 0 auto;
}

.form-container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

/* 添加简单的动画效果 */
.form-container {
  transition: box-shadow 0.2s ease-in-out;
}

.form-container:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
</style>