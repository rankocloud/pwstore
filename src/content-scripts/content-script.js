/**
 * 内容脚本 - 负责网页表单识别与数据捕获
 */

// 检测登录表单
function detectLoginForms() {
  // 查找页面上所有表单
  const forms = document.querySelectorAll('form');
  const detectedForms = [];
  
  forms.forEach(form => {
    // 查找用户名和密码字段
    const usernameFields = form.querySelectorAll('input[type="email"], input[type="text"], input[autocomplete="username"], input[autocomplete="email"], input[id="username"]');
    const passwordFields = form.querySelectorAll('input[type="password"]');
    
    if (usernameFields.length > 0 && passwordFields.length > 0) {
      // 识别为登录表单
      const formData = {
        action: form.action || window.location.href,
        usernameField: usernameFields[0],
        passwordField: passwordFields[0],
        submitButton: form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), input[type="button"], button')
      };
      
      detectedForms.push(formData);
      
      // 为表单添加提交事件监听器
      form.addEventListener('submit', (e) => {
        console.log('表单提交被捕获');
        captureCredentials(formData);
      });
      
      // 添加点击提交按钮的监听器（处理不触发submit事件的情况）
      if (formData.submitButton) {
        formData.submitButton.addEventListener('click', () => {
          console.log('提交按钮点击被捕获');
          // 立即捕获凭据（表单提交前）
          captureCredentials(formData);
          // 再设置一个延迟捕获，以防表单在提交前有修改
          setTimeout(() => captureCredentials(formData), 100);
        });
      }
      
      // 添加表单重置前的事件监听，捕获重置前的最后状态
      form.addEventListener('reset', (e) => {
        console.log('表单重置被捕获，尝试在重置前保存凭据');
        captureCredentials(formData);
      });
    }
  });
  
  // 处理没有表单的情况（单独的输入字段）
  if (detectedForms.length === 0) {
    const usernameFields = document.querySelectorAll('input[type="email"], input[type="text"], input[autocomplete="username"], input[autocomplete="email"], input[id="username"]');
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    if (usernameFields.length > 0 && passwordFields.length > 0) {
      // 查找可能的提交按钮
      const possibleSubmitButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
      let submitButton = null;
      
      // 尝试找到最接近密码字段的按钮
      if (possibleSubmitButtons.length > 0) {
        submitButton = possibleSubmitButtons[0];
        for (const btn of possibleSubmitButtons) {
          if (btn.textContent.toLowerCase().includes('登录') || 
              btn.textContent.toLowerCase().includes('login') ||
              btn.value?.toLowerCase().includes('登录') ||
              btn.value?.toLowerCase().includes('login')) {
            submitButton = btn;
            break;
          }
        }
      }
      
      const formData = {
        action: window.location.href,
        usernameField: usernameFields[0],
        passwordField: passwordFields[0],
        submitButton: submitButton
      };
      
      detectedForms.push(formData);
      
      // 为提交按钮添加点击事件
      if (submitButton) {
        submitButton.addEventListener('click', () => {
          console.log('提交按钮点击被捕获（无表单）');
          setTimeout(() => captureCredentials(formData), 100);
        });
      }
    }
  }
  
  return detectedForms;
}

// 捕获凭据
function captureCredentials(formData) {
  console.log("captureCredentials: 开始捕获凭据");
  
  // 获取表单数据
  const username = formData.usernameField.value;
  const password = formData.passwordField.value;
  const origin = new URL(formData.action || window.location.href).origin;
  const hostname = window.location.hostname;
  
  console.log("captureCredentials: 表单数据", {
    username: username ? username : '空',
    password: password ? '******' : '空',
    origin: origin,
    action: formData.action || window.location.href
  });
  
  // 检查用户名和密码是否有效
  if (username && password) {
    console.log(`captureCredentials: 尝试保存凭据: 网站 ${hostname}, 用户名 ${username}`);
    
    // 向后台发送消息保存凭据，添加回调处理
    chrome.runtime.sendMessage({
      action: "SAVE_CREDENTIAL",
      data: { 
        origin,
        username,
        password,
        timestamp: Date.now()
      }
    }, (response) => {
      if (response) {
        if (response.success) {
          console.log('captureCredentials: 凭据保存成功');
          showNotification('凭据已保存到密码管理器');
        } else {
          console.error('captureCredentials: 凭据保存失败:', response.error || '未知错误');
          showNotification('凭据保存失败: ' + (response.error || '未知错误'), 'error');
        }
      } else {
        console.error('captureCredentials: 未收到响应，可能是密码库未解锁或发生其他错误');
        showNotification('无法保存凭据: 可能需要先解锁密码库', 'error');
      }
    });
  } else {
    console.log("captureCredentials: 用户名或密码为空，不保存凭据");
  }
}

// 自动填充凭据
function autoFillCredentials(credentials) {
  const { username, password } = credentials;
  
  // 查找用户名/邮箱字段
  const usernameFields = document.querySelectorAll('input[type="email"], input[type="text"], input[autocomplete="username"], input[autocomplete="email"]');
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  if (usernameFields.length > 0 && passwordFields.length > 0) {
    // 优先填充标记了autocomplete属性的字段
    const emailField = document.querySelector('input[autocomplete="email"], input[autocomplete="username"]');
    const passField = document.querySelector('input[autocomplete="current-password"], input[autocomplete="password"]');
    
    // 用户名字段填充
    let filledUsernameField = null;
    if (emailField) {
      emailField.value = username;
      filledUsernameField = emailField;
    } else {
      // 尝试找到最可能的用户名字段
      for (const field of usernameFields) {
        const fieldId = field.id.toLowerCase();
        const fieldName = field.name.toLowerCase();
        const fieldPlaceholder = (field.placeholder || '').toLowerCase();
        
        // 检查字段属性是否包含用户名相关关键词
        if (fieldId.includes('user') || fieldId.includes('email') || fieldId.includes('login') || 
            fieldName.includes('user') || fieldName.includes('email') || fieldName.includes('login') ||
            fieldPlaceholder.includes('用户') || fieldPlaceholder.includes('邮箱') || 
            fieldPlaceholder.includes('user') || fieldPlaceholder.includes('email')) {
          field.value = username;
          filledUsernameField = field;
          break;
        }
      }
      
      // 如果没有找到匹配的字段，使用第一个
      if (!filledUsernameField && usernameFields.length > 0) {
        usernameFields[0].value = username;
        filledUsernameField = usernameFields[0];
      }
    }
    
    // 密码字段填充
    let filledPasswordField = null;
    if (passField) {
      passField.value = password;
      filledPasswordField = passField;
    } else if (passwordFields.length > 0) {
      passwordFields[0].value = password;
      filledPasswordField = passwordFields[0];
    }
    
    // 触发输入事件以更新表单状态
    const events = ['input', 'change', 'blur'];
    [filledUsernameField, filledPasswordField].forEach(field => {
      if (field) {
        events.forEach(event => {
          field.dispatchEvent(new Event(event, { bubbles: true }));
        });
      }
    });
    
    // 显示填充成功通知
    showNotification('已自动填充登录信息');
  }
}

// 显示通知
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  const backgroundColor = type === 'error' ? '#ea4335' : '#4285f4';
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${backgroundColor};
    color: white;
    padding: 16px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  console.log(`显示通知: ${message} (类型: ${type})`);
  
  // 3秒后移除通知
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// 处理动态加载的表单
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      detectLoginForms();
    }
  });
});

// 初始化
function initialize() {
  // 检测页面上的登录表单
  detectLoginForms();
  
  // 监听DOM变化
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "AUTO_FILL") {
      autoFillCredentials(message.data);
      sendResponse({ success: true });
    } else if (message.action === "GET_DETECTED_FORMS") {
      // 返回检测到的登录表单数量
      const forms = detectLoginForms();
      sendResponse({ formCount: forms.length });
    }
  });
  
  // 请求当前网站的凭据
  requestCredentials();
}

// 请求当前网站的凭据
function requestCredentials() {
  const currentUrl = window.location.href;
  const domain = new URL(currentUrl).hostname;
  
  console.log("requestCredentials: 请求域名凭据", { domain: domain });
  
  chrome.runtime.sendMessage(
    { action: 'GET_CREDENTIALS_FOR_DOMAIN', data: { domain: domain } },
    (response) => {
      if (response && response.success && response.credentials && response.credentials.length > 0) {
        console.log("requestCredentials: 找到凭据", { credentialCount: response.credentials.length });
        // 使用第一个匹配的凭据自动填充
        autoFillCredentials(response.credentials[0]);
      } else {
        console.log("requestCredentials: 未找到凭据");
      }
    }
  );
}

// 当DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// 为调试添加的测试函数 - 允许通过控制台手动触发凭据保存
globalThis.testSaveCredentials = function(username, password) {
  console.log("testSaveCredentials: 手动触发凭据保存", { username, password });
  
  const origin = window.location.origin;
  
  chrome.runtime.sendMessage({
    action: "SAVE_CREDENTIAL",
    data: {
      origin,
      username,
      password,
      timestamp: Date.now()
    }
  }, (response) => {
    if (response) {
      if (response.success) {
        console.log('testSaveCredentials: 凭据保存成功');
        showNotification('测试凭据已保存到密码管理器');
      } else {
        console.error('testSaveCredentials: 凭据保存失败:', response.error || '未知错误');
        showNotification('测试凭据保存失败: ' + (response.error || '未知错误'), 'error');
      }
    } else {
      console.error('testSaveCredentials: 未收到响应，可能是密码库未解锁或发生其他错误');
      showNotification('无法保存测试凭据: 可能需要先解锁密码库', 'error');
    }
  });
};

// 方便调试的提示
console.log("密码管理器调试信息:");
console.log("- 要手动测试凭据保存，请在控制台运行: testSaveCredentials('用户名', '密码')");
console.log("- 当前页面URL: ", window.location.href);
console.log("- 当前页面origin: ", window.location.origin);