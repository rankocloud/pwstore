<template>
  <div class="setup-wizard p-4">
    <h2 class="text-2xl font-semibold mb-4">设置主密码</h2>
    <p class="mb-6 text-gray-600">
      请设置一个强密码来保护您的凭据。此密码不会被存储在任何地方，请务必牢记。
    </p>
    
    <div class="form-group mb-4">
      <input
        type="password"
        v-model="masterPassword"
        id="masterPassword"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        placeholder="输入主密码 (至少12位)"
        @input="updatePasswordStrength"
      />
    </div>
    
    <div class="password-strength mb-4">
      <div class="flex justify-between items-center mb-2">
        <span>密码强度: </span>
        <span :class="strengthClass">{{ strengthLabel }}</span>
      </div>
      <div class="strength-meter h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          id="strengthMeter"
          :style="{ width: strengthWidth }"
          :class="strengthMeterClass"
          class="strength-meter-fill h-full transition-all duration-300"
        ></div>
      </div>
    </div>
    
    <div class="form-group mb-6">
      <input
        type="password"
        v-model="confirmPassword"
        id="confirmPassword"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        placeholder="确认主密码"
      />
    </div>
    
    <button
      id="setupButton"
      class="btn btn-block w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
      @click="handleSetupSubmit"
    >
      创建密码库
    </button>
  </div>
</template>

<script>
export default {
  name: 'SetupWizard',
  data() {
    return {
      masterPassword: '',
      confirmPassword: '',
      strengthLabel: '无',
      strengthWidth: '0%',
      strengthClass: '',
      strengthMeterClass: ''
    }
  },
  methods: {
    updatePasswordStrength() {
      const password = this.masterPassword
      let score = 0
      let label = '无'
      let width = '0%'
      let className = ''
      let meterClassName = ''
      
      if (password) {
        // 长度检查
        if (password.length >= 12) {
          score += 2
        } else if (password.length >= 8) {
          score += 1
        }
        
        // 复杂度检查
        if (/[a-z]/.test(password)) score += 1
        if (/[A-Z]/.test(password)) score += 1
        if (/[0-9]/.test(password)) score += 1
        if (/[^a-zA-Z0-9]/.test(password)) score += 1
        
        // 设置强度标签和样式
        if (score >= 5) {
          label = '强'
          width = '100%'
          className = 'text-green-600'
          meterClassName = 'bg-green-500'
        } else if (score >= 3) {
          label = '中'
          width = '60%'
          className = 'text-yellow-600'
          meterClassName = 'bg-yellow-500'
        } else {
          label = '弱'
          width = '30%'
          className = 'text-red-600'
          meterClassName = 'bg-red-500'
        }
      }
      
      // 更新UI
      this.strengthLabel = label
      this.strengthWidth = width
      this.strengthClass = className
      this.strengthMeterClass = meterClassName
    },
    async handleSetupSubmit() {
      const masterPassword = this.masterPassword
      const confirmPassword = this.confirmPassword
      
      // 验证输入
      if (!masterPassword) {
        alert('请输入主密码')
        return
      }
      
      if (masterPassword.length < 12) {
        alert('主密码至少需要12位')
        return
      }
      
      if (masterPassword !== confirmPassword) {
        alert('两次输入的密码不一致')
        return
      }
      
      // 发送消息到后台进行设置
      const response = await this.sendMessage({ 
        action: 'SET_MASTER_PASSWORD', 
        data: { password: masterPassword } 
      })
      
      if (response.success) {
        alert('密码库创建成功')
        this.$router.push('/unlock')
      } else {
        alert('创建失败: ' + response.error)
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