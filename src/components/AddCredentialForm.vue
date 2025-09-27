<template>
  <div class="add-credential-form">
    <div class="form-group mb-4">
      <label for="origin" class="block text-sm font-medium text-gray-700 mb-1">网站</label>
      <input
        type="text"
        v-model="form.origin"
        id="origin"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        placeholder="https://example.com"
      />
    </div>
    
    <div class="form-group mb-4">
      <label for="username" class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
      <input
        type="text"
        v-model="form.username"
        id="username"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        placeholder="your_username"
      />
    </div>
    
    <div class="form-group mb-4">
      <div class="flex justify-between mb-1">
        <label for="password" class="block text-sm font-medium text-gray-700">密码</label>
        <button 
          type="button"
          class="text-xs text-primary hover:text-primary/80 transition-colors"
          @click="generatePassword"
        >
          生成密码
        </button>
      </div>
      <input
        type="text"
        v-model="form.password"
        id="password"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        placeholder="your_password"
      />
    </div>
    
    <div class="flex space-x-3">
      <button
        type="button"
        class="flex-1 py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
        @click="handleSave"
      >
        保存
      </button>
      <button
        type="button"
        class="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
        @click="$emit('cancel')"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddCredentialForm',
  props: {
    editingCredential: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      form: {
        origin: '',
        username: '',
        password: ''
      }
    }
  },
  watch: {
    editingCredential: {
      handler(newVal) {
        if (newVal) {
          // 填充表单数据
          this.form = {
            origin: newVal.origin || '',
            username: newVal.username || '',
            password: newVal.password || ''
          }
        } else {
          // 重置表单
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    handleSave() {
      // 表单验证
      if (!this.form.origin) {
        alert('请输入网站地址')
        return
      }
      
      if (!this.form.username) {
        alert('请输入用户名')
        return
      }
      
      if (!this.form.password) {
        alert('请输入密码')
        return
      }
      
      // 构造凭据对象
      const credential = {
        ...this.form,
        timestamp: Date.now()
      }
      
      // 发送保存事件
      this.$emit('save', credential)
      
      // 重置表单
      this.resetForm()
    },
    resetForm() {
      this.form = {
        origin: '',
        username: '',
        password: ''
      }
    },
    generatePassword() {
      // 生成一个16位的随机密码
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
      let password = ''
      for (let i = 0; i < 16; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length)
        password += charset[randomIndex]
      }
      this.form.password = password
    }
  }
}
</script>