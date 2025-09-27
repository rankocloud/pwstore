/**
 * 内容脚本 - 负责网页表单识别与数据捕获
 */

let plainPassword = '';
let usernameSelector = 'input[type="email"], input[type="text"], input[autocomplete="username"], input[autocomplete="email"], input[id="username"]';
let passwordSelector = 'input[type="password"], input[autocomplete="current-password"], input[autocomplete="password"]';
let loginButtonSelector = 'button[type="submit"], input[type="submit"], button, input[type="button"], [onclick]';
let useUsernameSetting = false;
let usePasswordSetting = false;
let useLoginButtonSetting = false;

// 检测登录表单
function detectLoginForms() {
  let pageRecognitionSettings = [];
  // 获取页面识别配置
  chrome.runtime.sendMessage({ action: 'GET_PAGE_RECOGNITION_SETTINGS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('获取页面识别配置失败:', chrome.runtime.lastError.message);
      return;
    }
    pageRecognitionSettings = response.settings;
    console.log('页面识别配置:', pageRecognitionSettings);
  });

  if(pageRecognitionSettings.length > 0) {
    pageRecognitionSettings = pageRecognitionSettings.filter(item => item.domain === window.location.hostname);
  }

  let useUsernameSetting = false;
  let usePasswordSetting = false;
  let useLoginButtonSetting = false;

  if(pageRecognitionSettings.length > 0) {
    const setting = pageRecognitionSettings[0];
    if(setting.usernameSelector) {
      useUsernameSetting = true;
      usernameSetting = setting.usernameSelector;
      if(usernameSetting.type === 'attribute') {
        usernameSelector = `input[${usernameSetting.value}]`;
      } 
      else {
        usernameSelector = `input[${usernameSetting.type}="${usernameSetting.value}"]`;
      }
    }
    if(setting.passwordSelector) {
      usePasswordSetting = true;
      passwordSetting = setting.passwordSelector;
      if(passwordSetting.type === 'attribute') {
        passwordSelector = `input[${passwordSetting.value}]`;
      } 
      else {
        passwordSelector = `input[${passwordSetting.type}="${passwordSetting.value}"]`;
      }
    }
    if(setting.loginButtonSelector) {
      useLoginButtonSetting = true;
      loginButtonSetting = setting.loginButtonSelector;
      let eleType = 'input';
      if(loginButtonSelector.element === 'button') {
        eleType = 'button';
      }
      if(loginButtonSetting.type === 'attribute') {
        loginButtonSelector = `${eleType}[${loginButtonSetting.value}]`;
      } 
      else {
        loginButtonSelector = `${eleType}[${loginButtonSetting.type}="${loginButtonSetting.value}"]`;
      }
    }
  }

  // 查找页面上所有表单
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // 查找用户名和密码字段
    const usernameFields = form.querySelectorAll(usernameSelector);
    const passwordFields = form.querySelectorAll(passwordSelector);

    // 过滤掉隐藏的元素
    usernameFields = Array.from(usernameFields).filter(item => {
      const eleStyle = getComputedStyle(item);
      return eleStyle.display !== 'none' && eleStyle.visibility !== 'hidden';
    })
    passwordFields = Array.from(passwordFields).filter(item => {
      const eleStyle = getComputedStyle(item);
      return eleStyle.display !== 'none' && eleStyle.visibility !== 'hidden';
    })

    if(usernameFields.length === 0 || passwordFields.length === 0) {
      return;
    }

    // 点击登录后，密码输入框的文本可能会被加密，需要实时读取密码输入框文本
    passwordFields[0].addEventListener('input', (e) => {
      plainPassword = e.target.value;
      console.log('密码输入中：', '*'.repeat(e.target.value.length));
    })
    
    const candidateSubmitButtons = form.querySelectorAll(loginButtonSelector);
    if(candidateSubmitButtons.length === 0) {
      return;
    }
    let submitButton = null;
    if(userLoginButtonSetting) {
      submitButton = candidateSubmitButtons[0];
    }
    else {
      // 进一步筛选，文本包含登录、提交、sign in、log in、submit
      for (let btn of candidateSubmitButtons) {
        const text = btn.textContent.trim().toLowerCase();
        if(!text) {
          text = btn.value.trim().toLowerCase();
        }
        if(
          text.includes('登录') || 
          text.includes('提交') || 
          text.includes('sign in') || 
          text.includes('log in') ||
          text.includes('submit')) {
          submitButton = btn;
          break;
        }
      }
    }

    if(!submitButton) {
      submitButton = candidateSubmitButtons[0];
    }
    
    
    // 构造表单数据
    const formData = {
      usernameField: usernameFields[0],
    }
    // 监听登录点击事件
    submitButton.addEventListener('click',async function(e){
      console.log('检测到登录按钮点击', e.target);
      captureCredentials(formData);
      await delay(1000);
    });
    
    // 为表单添加提交事件监听器
    form.addEventListener('submit',async function(e){
      console.log('表单提交被捕获');
      captureCredentials(formData);
      await delay(1000);
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 捕获凭据
function captureCredentials(formData) {
  console.log("captureCredentials: 开始捕获凭据");
  
  // 获取表单数据
  const username = formData.usernameField.value;
  const password = plainPassword;
  const origin = window.location.hostname;
  
  console.log("captureCredentials: 表单数据", {
    username: username ? username : '空',
    password: password ? '******' : '空',
    origin
  });
  
  // 检查用户名和密码是否有效
  if (username && password) {
    console.log(`captureCredentials: 尝试保存凭据: 网站 ${origin}, 用户名 ${username}`);
    
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

  let usernameField = null;
  let passwordField = null;
  
  // 查找用户名和密码字段
  let usernameFields = document.querySelectorAll(usernameSelector);
  let passwordFields = document.querySelectorAll(passwordSelector);

  // 过滤掉隐藏的元素
  usernameFields = Array.from(usernameFields).filter(item => {
    const eleStyle = getComputedStyle(item);
    return eleStyle.display !== 'none' && eleStyle.visibility !== 'hidden';
  })
  passwordFields = Array.from(passwordFields).filter(item => {
    const eleStyle = getComputedStyle(item);
    return eleStyle.display !== 'none' && eleStyle.visibility !== 'hidden';
  })

  if(usernameFields.length === 0 || passwordFields.length === 0) {
    return;
  }
  usernameField = usernameFields[0];
  passwordField = passwordFields[0];

  // 如果没有设置表单识别设置，优先填充标记了autocomplete属性的字段
  if(!useUsernameSetting) {
    const filteredUsernameFields = Array.from(usernameFields).filter(field => {
      return field.matches('input[autocomplete="email"], input[autocomplete="username"]');
    });
    if(filteredUsernameFields.length > 0) {
      usernameField = filteredUsernameFields[0];
    }
    else {
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
          usernameField = field;
          break;
        }
      }
    }
  }
  if(!usePasswordSetting) {
    const filteredPasswordFields = Array.from(passwordFields).filter(field => {
      return field.matches('input[autocomplete="current-password"], input[autocomplete="password"]');
    });
    if(filteredPasswordFields.length > 0) {
      passwordField = filteredPasswordFields[0];
    }
  }

  console.log('autoFillCredentials: 用户名字段', usernameField);
  console.log('autoFillCredentials: 密码字段', passwordField);

  // 用户名和密码填充
  usernameField.value = username;
  passwordField.value = password;
  // 触发输入事件以更新表单状态
  const events = ['input', 'change', 'blur'];
  [usernameField, passwordField].forEach(field => {
    if (field) {
      events.forEach(event => {
        field.dispatchEvent(new Event(event, { bubbles: true }));
      });
    }
  });
  // 显示填充成功通知
  showNotification('已自动填充登录信息');
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
  const domain = window.location.hostname;
  
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