<template>
  <div id="app" class="w-[350px] min-h-[400px] bg-white shadow-md">
    <div v-if="debugInfo" class="p-2 bg-yellow-100 text-xs">
      {{ debugInfo }}
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      debugInfo: null
    }
  },
  mounted() {
    // 添加调试信息
    this.debugInfo = 'Vue应用已挂载';
    console.log('App mounted successfully');
    
    // 动态检查用户状态并导航到正确的路由
    this.checkUserStatus();
  },
  methods: {
    async checkUserStatus() {
      try {
        // 检查是否已完成设置
        const setupResult = await new Promise((resolve) => {
          chrome.storage.local.get('isSetupComplete', (result) => {
            resolve(result.isSetupComplete || false);
          });
        });
        
        // 动态显示调试信息
        this.debugInfo = `设置状态: ${setupResult ? '已完成' : '未完成'}`;
        
        if (!setupResult) {
          // 如果未完成设置，导航到设置界面
          if (this.$route.path !== '/setup') {
            this.$router.push('/setup');
          }
          return;
        }
        
        // 如果已完成设置，检查密码状态
        const passwordStatus = await this.checkPasswordStatus();
        
        if (passwordStatus.isUnlocked) {
          // 如果已解锁，导航到主界面
          if (this.$route.path !== '/main') {
            this.$router.push('/main');
          }
        } else {
          // 如果未解锁，导航到解锁界面
          if (this.$route.path !== '/unlock') {
            this.$router.push('/unlock');
          }
        }
        
        // 更新调试信息
        this.debugInfo += `, 解锁状态: ${passwordStatus.isUnlocked ? '已解锁' : '未解锁'}`;
      } catch (error) {
        console.error('检查用户状态时出错:', error);
        this.debugInfo = `检查状态失败: ${error.message}`;
        // 出错时默认导航到设置界面
        this.$router.push('/setup');
      }
    },
    
    checkPasswordStatus() {
      return new Promise((resolve) => {
        // 使用消息传递检查密码状态
        chrome.runtime.sendMessage(
          { action: 'CHECK_PASSWORD_STATUS' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('发送消息失败:', chrome.runtime.lastError);
              resolve({ isUnlocked: false });
              return;
            }
            console.log('检查密码状态响应:', response);
            resolve({
              isUnlocked: response && response.success === true && response.isUnlocked === true
            });
          }
        );
      });
    }
  }
}
</script>