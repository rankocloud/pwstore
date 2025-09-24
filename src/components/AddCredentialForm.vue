<template>
  <div class="add-credential-form">
    <div class="form-group mb-4">
      <label for="website" class="block text-sm font-medium text-gray-700 mb-1">网站</label>
      <input
        type="text"
        v-model="form.website"
        id="website"
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
    
    <div class="form-group mb-6">
      <label for="category" class="block text-sm font-medium text-gray-700 mb-1">分类</label>
      <select
        v-model="form.category"
        id="category"
        class="form-control w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
      >
        <option value="">选择分类</option>
        <option value="社交媒体">社交媒体</option>
        <option value="电子邮箱">电子邮箱</option>
        <option value="购物网站">购物网站</option>
        <option value="金融服务">金融服务</option>
        <option value="开发者工具">开发者工具</option>
        <option value="其他">其他</option>
      </select>
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
  data() {
    return {
      form: {
        website: '',
        username: '',
        password: '',
        category: ''
      }
    }
  },
  methods: {
    handleSave() {
      // 表单验证
      if (!this.form.website) {
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
        updatedAt: new Date().toISOString()
      }
      
      // 发送保存事件
      this.$emit('save', credential)
      
      // 重置表单
      this.resetForm()
    },
    resetForm() {
      this.form = {
        website: '',
        username: '',
        password: '',
        category: ''
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