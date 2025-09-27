<template>
  <div class="credential-item p-3 border border-gray-200 rounded-md mb-3 hover:shadow-md transition-shadow">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-medium text-lg">{{ credential.origin }}</h3>
      <div class="flex space-x-2">
        <button 
          class="text-gray-500 hover:text-primary transition-colors"
          @click="handleCopyUsername"
          title="复制用户名"
        >
          📋
        </button>
        <button 
          class="text-gray-500 hover:text-primary transition-colors"
          @click="handleCopyPassword"
          title="复制密码"
        >
          🔑
        </button>
        <button 
          class="text-gray-500 hover:text-primary transition-colors"
          @click="$emit('edit', credential)"
          title="编辑"
        >
          ✏️
        </button>
        <button 
          class="text-gray-500 hover:text-danger transition-colors"
          @click="$emit('delete', credential.id)"
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
    
    <div class="mb-2">
      <div class="text-sm text-gray-600 mb-1">
        <span class="font-medium">用户名: </span>
        <span>{{ credential.username }}</span>
      </div>
      <div class="text-sm text-gray-600">
        <span class="font-medium">密码: </span>
        <span class="text-gray-400">••••••••</span>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'CredentialItem',
  props: {
    credential: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleCopyUsername() {
      navigator.clipboard.writeText(this.credential.username).then(() => {
        this.showToast('用户名已复制')
      })
    },
    async handleCopyPassword() {
      const response = await this.sendMessage({ action: 'GET_PASSWORD', data: this.credential })
      if (response.success) {
        navigator.clipboard.writeText(response.password).then(() => {
        this.showToast('密码已复制')
      })
      } 
      else {
        this.showToast('获取密码失败')
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    },
    showToast(message) {
      // 创建一个简单的toast提示
      const toast = document.createElement('div')
      toast.textContent = message
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-dark text-white px-4 py-2 rounded-md shadow-lg z-50'
      document.body.appendChild(toast)
      
      // 3秒后移除toast
      setTimeout(() => {
        toast.remove()
      }, 3000)
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