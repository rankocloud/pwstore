<template>
  <div class="unlock-screen p-6">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-dark mb-2">本地密码管理器</h2>
      <p class="text-gray-600">请输入主密码解锁</p>
    </div>
    
    <!-- 添加提示信息：浏览器重启后需要重新输入密码 -->
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-700">
      <p>💡 安全提示：浏览器重启后需要重新输入密码</p>
    </div>
    
    <div class="form-group mb-6">
      <input
        type="password"
        v-model="masterPassword"
        id="masterPassword"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        placeholder="输入主密码"
        @keyup.enter="handleUnlock"
        ref="passwordInput"
      />
    </div>
    
    <div class="form-group mb-6">
      <label class="flex items-center cursor-pointer">
        <input
          type="checkbox"
          v-model="rememberPassword"
          class="mr-2 h-4 w-4 text-primary rounded focus:ring-primary/50"
        />
        <span>记住密码</span>
        <select
          v-model="rememberDuration"
          :disabled="!rememberPassword"
          class="ml-3 p-1 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="1">1小时</option>
          <option value="2">2小时</option>
          <option value="6">6小时</option>
          <option value="12">12小时</option>
        </select>
      </label>
    </div>
    
    <button
      id="unlockButton"
      class="btn btn-block w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
      @click="handleUnlock"
    >
      解锁
    </button>
    
    <div class="mt-6 text-center">
      <button
        id="forgotPasswordButton"
        class="text-primary hover:text-primary/80 transition-colors"
        @click="handleForgotPassword"
      >
        忘记密码?
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UnlockScreen',
  data() {
    return {
      masterPassword: '',
      rememberPassword: false,
      rememberDuration: 6 // 默认6小时
    }
  },
  mounted() {
    // 自动聚焦到密码输入框
    this.$refs.passwordInput.focus()
  },
  methods: {
    async handleUnlock() {
      const masterPassword = this.masterPassword
      
      if (!masterPassword) {
        alert('请输入主密码')
        return
      }
      
      // 发送消息到后台进行解锁
      const response = await this.sendMessage({
        action: 'VERIFY_MASTER_PASSWORD',
        data: {
          password: masterPassword,
          rememberPassword: this.rememberPassword,
          rememberDuration: this.rememberDuration // 用户选择的记住密码时长
        }
      })
      
      if (response.success) {
        // 解锁成功，跳转到主界面
        this.$router.push('/main')
      } else {
        alert('密码错误，请重试')
        this.masterPassword = ''
        this.$refs.passwordInput.focus()
      }
    },
    handleForgotPassword() {
      // 忘记密码逻辑
      if (confirm('忘记密码将导致所有存储的密码丢失，是否继续?')) {
        this.sendMessage({
          action: 'RESET_PASSWORD'
        })
        this.$router.push('/setup')
      }
    },
    sendMessage(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response || {})
        })
      })
    }
  }
}
</script>