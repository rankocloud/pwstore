<template>
  <div class="settings">
    <h3 class="text-lg font-medium mb-4">设置</h3>
    
    <div class="form-group mb-4">
      <label for="autoLockTimeout" class="block text-sm font-medium text-gray-700 mb-1">自动锁定时间 (分钟)</label>
      <select
        v-model="form.autoLockTimeout"
        id="autoLockTimeout"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      >
        <option value="1">1 分钟</option>
        <option value="5">5 分钟</option>
        <option value="10">10 分钟</option>
        <option value="30">30 分钟</option>
        <option value="60">60 分钟</option>
        <option value="0">永不自动锁定</option>
      </select>
    </div>
    
    <div class="form-group mb-4">
      <label for="passwordExpiryDays" class="block text-sm font-medium text-gray-700 mb-1">主密码过期时间 (天)</label>
      <select
        v-model="form.passwordExpiryDays"
        id="passwordExpiryDays"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      >
        <option value="7">7 天</option>
        <option value="30">30 天</option>
        <option value="90">90 天</option>
        <option value="180">180 天</option>
        <option value="365">365 天</option>
        <option value="0">永不过期</option>
      </select>
    </div>
    
    <div class="form-group mb-4">
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          v-model="form.enableNotifications"
          class="mr-2 h-4 w-4 text-primary rounded focus:ring-primary/50"
        />
        <span>启用通知提醒</span>
      </label>
    </div>
    
    <div class="form-group mb-6">
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          v-model="form.enableAutoFill"
          class="mr-2 h-4 w-4 text-primary rounded focus:ring-primary/50"
        />
        <span>启用自动填充功能</span>
      </label>
    </div>
    
    <div class="mb-6">
      <button
        type="button"
        class="w-full py-2 px-4 bg-danger text-white rounded-md font-medium hover:bg-danger/90 transition-colors"
        @click="handleChangePassword"
      >
        修改主密码
      </button>
    </div>
    
    <div class="mb-6">
      <button
        type="button"
        class="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
        @click="handleExportData"
      >
        导出数据
      </button>
    </div>
    
    <button
      type="button"
      class="w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
      @click="handleSave"
    >
      保存设置
    </button>
  </div>
</template>

<script>
export default {
  name: 'SettingsForm',
  data() {
    return {
      form: {
        autoLockTimeout: '5',
        passwordExpiryDays: '90',
        enableNotifications: true,
        enableAutoFill: true
      }
    }
  },
  async mounted() {
    await this.loadSettings()
  },
  methods: {
    async loadSettings() {
      const response = await this.sendMessage({ action: 'GET_SETTINGS' })
      if (response.success && response.settings) {
        this.form = {
          ...this.form,
          ...response.settings
        }
      }
    },
    async handleSave() {
      // 发送保存事件
      this.$emit('update', this.form)
    },
    async handleChangePassword() {
      // 这里可以实现修改密码的逻辑
      // 为了简化，这里先不实现完整的修改密码功能
      alert('修改密码功能尚未实现')
    },
    async handleExportData() {
      const response = await this.sendMessage({ action: 'EXPORT_DATA' })
      if (response.success) {
        // 创建下载链接
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `passwords_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert('导出失败: ' + response.error)
      }
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