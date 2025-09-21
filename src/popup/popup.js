/**
 * 弹出界面主脚本
 */

// 状态管理
const state = {
  isSetupComplete: false,
  isUnlocked: false,
  credentials: [],
  activeTab: 'credentials',
  searchQuery: '',
  categories: []
};

// DOM元素
let rootElement;

// 初始化
async function initialize() {
  rootElement = document.getElementById('root');
  
  // 检查是否已完成设置
  const setupStatus = await sendMessage({ action: 'IS_SETUP_COMPLETE' });
  state.isSetupComplete = setupStatus.isSetupComplete;
  
  // 渲染界面
  render();
}

// 发送消息到后台
async function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

// 渲染界面
function render() {
  if (!state.isSetupComplete) {
    renderSetupWizard();
  } else if (!state.isUnlocked) {
    renderUnlockScreen();
  } else {
    renderMainInterface();
  }
}

// 渲染设置向导
function renderSetupWizard() {
  // 清空根元素
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }
  
  // 创建设置向导容器
  const wizardDiv = document.createElement('div');
  wizardDiv.className = 'setup-wizard';
  
  // 创建标题
  const heading = document.createElement('h2');
  heading.textContent = '设置主密码';
  wizardDiv.appendChild(heading);
  
  // 创建说明文本
  const description = document.createElement('p');
  description.textContent = '请设置一个强密码来保护您的凭据。此密码不会被存储在任何地方，请务必牢记。';
  wizardDiv.appendChild(description);
  
  // 创建表单组
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  
  // 创建密码输入框
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'masterPassword';
  passwordInput.className = 'form-control';
  passwordInput.placeholder = '输入主密码 (至少12位)';
  formGroup.appendChild(passwordInput);
  
  wizardDiv.appendChild(formGroup);
  
  // 创建密码强度指示器
  const strengthDiv = document.createElement('div');
  strengthDiv.className = 'password-strength';
  
  const strengthLabelDiv = document.createElement('div');
  strengthLabelDiv.textContent = '密码强度: ';
  const strengthLabelSpan = document.createElement('span');
  strengthLabelSpan.id = 'strengthLabel';
  strengthLabelSpan.textContent = '无';
  strengthLabelDiv.appendChild(strengthLabelSpan);
  strengthDiv.appendChild(strengthLabelDiv);
  
  const meterDiv = document.createElement('div');
  meterDiv.className = 'strength-meter';
  const meterFill = document.createElement('div');
  meterFill.id = 'strengthMeter';
  meterFill.className = 'strength-meter-fill';
  meterFill.style.width = '0%';
  meterDiv.appendChild(meterFill);
  strengthDiv.appendChild(meterDiv);
  
  wizardDiv.appendChild(strengthDiv);
  
  // 创建确认密码输入框
  const confirmFormGroup = document.createElement('div');
  confirmFormGroup.className = 'form-group';
  const confirmInput = document.createElement('input');
  confirmInput.type = 'password';
  confirmInput.id = 'confirmPassword';
  confirmInput.className = 'form-control';
  confirmInput.placeholder = '确认主密码';
  confirmFormGroup.appendChild(confirmInput);
  wizardDiv.appendChild(confirmFormGroup);
  
  // 创建按钮
  const setupButton = document.createElement('button');
  setupButton.id = 'setupButton';
  setupButton.className = 'btn btn-block';
  setupButton.textContent = '创建密码库';
  wizardDiv.appendChild(setupButton);
  
  // 将整个向导添加到根元素
  rootElement.appendChild(wizardDiv);
  
  // 添加事件监听
  document.getElementById('masterPassword').addEventListener('input', updatePasswordStrength);
  document.getElementById('setupButton').addEventListener('click', handleSetupSubmit);
}

// 更新密码强度指示器
function updatePasswordStrength() {
  const password = document.getElementById('masterPassword').value;
  let score = 0;
  let label = '无';
  let width = '0%';
  let className = '';
  
  if (password) {
    // 长度检查
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    }
    
    // 复杂度检查
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // 设置强度标签和样式
    if (score >= 5) {
      label = '强';
      width = '100%';
      className = 'strength-strong';
    } else if (score >= 3) {
      label = '中';
      width = '60%';
      className = 'strength-medium';
    } else {
      label = '弱';
      width = '30%';
      className = 'strength-weak';
    }
  }
  
  // 更新UI
  document.getElementById('strengthLabel').textContent = label;
  const meter = document.getElementById('strengthMeter');
  meter.style.width = width;
  meter.className = 'strength-meter-fill ' + className;
}

// 处理设置提交
async function handleSetupSubmit() {
  const masterPassword = document.getElementById('masterPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // 验证输入
  if (!masterPassword) {
    alert('请输入主密码');
    return;
  }
  
  if (masterPassword.length < 8) {
    alert('主密码至少需要8个字符');
    return;
  }
  
  if (masterPassword !== confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  // 设置主密码
  const result = await sendMessage({
    action: 'SET_MASTER_PASSWORD',
    data: { password: masterPassword }
  });
  
  if (result.success) {
    state.isSetupComplete = true;
    state.isUnlocked = true;
    render();
  } else {
    alert('设置主密码失败，请重试');
  }
}

// 渲染解锁屏幕
function renderUnlockScreen() {
  rootElement.innerHTML = `
    <div class="setup-wizard">
      <h2>解锁密码库</h2>
      <p>请输入您的主密码以访问密码库</p>
      
      <div class="form-group">
        <input type="password" id="unlockPassword" class="form-control" placeholder="输入主密码" />
      </div>
      
      <button id="unlockButton" class="btn btn-block">解锁</button>
    </div>
  `;
  
  // 添加事件监听
  document.getElementById('unlockButton').addEventListener('click', handleUnlock);
  document.getElementById('unlockPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
}

// 处理解锁
async function handleUnlock() {
  const password = document.getElementById('unlockPassword').value;
  
  if (!password) {
    alert('请输入主密码');
    return;
  }
  
  const result = await sendMessage({
    action: 'VERIFY_MASTER_PASSWORD',
    data: { password }
  });
  
  if (result.success) {
    state.isUnlocked = true;
    loadCredentials();
    render();
  } else {
    alert('密码错误，请重试');
  }
}

// 加载凭据列表
async function loadCredentials() {
  const credentials = await sendMessage({ action: 'GET_CREDENTIALS' });
  state.credentials = credentials || [];
}

// 渲染主界面
function renderMainInterface() {
  rootElement.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>本地密码管理器</h1>
        <button id="lockButton" class="btn btn-secondary">锁定</button>
      </div>
      
      <div class="tabs">
        <div id="credentialsTab" class="tab ${state.activeTab === 'credentials' ? 'active' : ''}">凭据</div>
        <div id="generatorTab" class="tab ${state.activeTab === 'generator' ? 'active' : ''}">密码生成器</div>
      </div>
      
      <div class="tab-content">
        ${state.activeTab === 'credentials' ? renderCredentialsTab() : renderGeneratorTab()}
      </div>
    </div>
  `;
  
  // 添加事件监听
  document.getElementById('lockButton').addEventListener('click', handleLock);
  document.getElementById('credentialsTab').addEventListener('click', () => {
    state.activeTab = 'credentials';
    render();
  });
  document.getElementById('generatorTab').addEventListener('click', () => {
    state.activeTab = 'generator';
    render();
  });
  
  // 凭据标签页的事件监听
  if (state.activeTab === 'credentials') {
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    
    // 为每个凭据项添加事件监听
    state.credentials.forEach(cred => {
      document.getElementById(`autofill-${cred.id}`)?.addEventListener('click', () => {
        autoFillCredential(cred.id);
      });
      
      document.getElementById(`copy-${cred.id}`)?.addEventListener('click', () => {
        copyPassword(cred.id);
      });
      
      document.getElementById(`delete-${cred.id}`)?.addEventListener('click', () => {
        deleteCredential(cred.id);
      });
    });
  }
  
  // 密码生成器标签页的事件监听
  if (state.activeTab === 'generator') {
    document.getElementById('generateButton')?.addEventListener('click', generateNewPassword);
    document.getElementById('copyGeneratedButton')?.addEventListener('click', copyGeneratedPassword);
    
    // 选项变更事件
    document.querySelectorAll('.generator-option').forEach(option => {
      option.addEventListener('change', updateGeneratorOptions);
    });
    
    // 长度滑块事件
    document.getElementById('lengthSlider')?.addEventListener('input', updateLengthValue);
  }
}

// 渲染凭据标签页
function renderCredentialsTab() {
  // 过滤凭据
  let filteredCredentials = state.credentials;
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filteredCredentials = state.credentials.filter(cred => {
      return cred.origin.toLowerCase().includes(query) || 
             cred.username.toLowerCase().includes(query);
    });
  }
  
  return `
    <div class="search-container">
      <input type="text" id="searchInput" class="search-input" placeholder="搜索凭据..." value="${state.searchQuery}" />
    </div>
    
    <div class="credential-list">
      ${filteredCredentials.length > 0 ? 
        filteredCredentials.map(cred => `
          <div class="credential-item">
            <div class="credential-info">
              <div class="credential-origin">${new URL(cred.origin).hostname}</div>
              <div class="credential-username">${cred.username}</div>
            </div>
            <div class="credential-actions">
              <button id="autofill-${cred.id}" class="btn">自动填充</button>
              <button id="copy-${cred.id}" class="btn">复制密码</button>
              <button id="delete-${cred.id}" class="btn btn-danger">删除</button>
            </div>
          </div>
        `).join('') : 
        '<div class="empty-state">没有保存的凭据</div>'
      }
    </div>
  `;
}

// 渲染密码生成器标签页
function renderGeneratorTab() {
  return `
    <div class="password-generator">
      <h3>生成强密码</h3>
      
      <div class="generated-password">
        <input type="text" id="generatedPassword" class="password-display" value="" readonly />
        <button id="copyGeneratedButton" class="copy-btn">复制</button>
      </div>
      
      <div class="form-group">
        <label>密码长度: <span id="lengthValue">16</span></label>
        <input type="range" id="lengthSlider" min="8" max="32" value="16" class="form-control" />
      </div>
      
      <div class="generator-options">
        <div class="option-group">
          <input type="checkbox" id="lowercase" class="generator-option" checked />
          <label for="lowercase">小写字母</label>
        </div>
        
        <div class="option-group">
          <input type="checkbox" id="uppercase" class="generator-option" checked />
          <label for="uppercase">大写字母</label>
        </div>
        
        <div class="option-group">
          <input type="checkbox" id="numbers" class="generator-option" checked />
          <label for="numbers">数字</label>
        </div>
        
        <div class="option-group">
          <input type="checkbox" id="symbols" class="generator-option" checked />
          <label for="symbols">特殊字符</label>
        </div>
      </div>
      
      <button id="generateButton" class="btn btn-block">生成密码</button>
    </div>
  `;
}

// 处理搜索
function handleSearch(e) {
  state.searchQuery = e.target.value;
  render();
}

// 自动填充凭据
async function autoFillCredential(credentialId) {
  try {
    // 获取凭据的密码
    const password = await sendMessage({
      action: 'GET_PASSWORD',
      data: { id: credentialId }
    });
    
    if (!password) {
      alert('获取密码失败');
      return;
    }
    
    // 查找对应的凭据信息
    const credential = state.credentials.find(cred => cred.id === credentialId);
    if (!credential) {
      alert('找不到凭据信息');
      return;
    }
    
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 向内容脚本发送自动填充请求
    await chrome.tabs.sendMessage(tab.id, {
      action: 'AUTO_FILL',
      data: {
        username: credential.username,
        password: password
      }
    });
    
    // 关闭弹出窗口
    window.close();
  } catch (error) {
    console.error('自动填充失败:', error);
    alert('自动填充失败，请重试');
  }
}

// 复制密码
async function copyPassword(credentialId) {
  const password = await sendMessage({
    action: 'GET_PASSWORD',
    data: { id: credentialId }
  });
  
  if (password) {
    navigator.clipboard.writeText(password)
      .then(() => {
        alert('密码已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败');
      });
  } else {
    alert('获取密码失败');
  }
}

// 删除凭据
async function deleteCredential(credentialId) {
  if (confirm('确定要删除这个凭据吗？')) {
    const result = await sendMessage({
      action: 'DELETE_CREDENTIAL',
      data: { id: credentialId }
    });
    
    if (result.success) {
      await loadCredentials();
      render();
    } else {
      alert('删除凭据失败');
    }
  }
}

// 处理锁定
async function handleLock() {
  await sendMessage({ action: 'LOCK_VAULT' });
  state.isUnlocked = false;
  render();
}

// 生成新密码
function generateNewPassword() {
  const length = parseInt(document.getElementById('lengthSlider').value);
  const options = {
    lowercase: document.getElementById('lowercase').checked,
    uppercase: document.getElementById('uppercase').checked,
    numbers: document.getElementById('numbers').checked,
    symbols: document.getElementById('symbols').checked
  };
  
  // 确保至少选择了一个选项
  if (!options.lowercase && !options.uppercase && !options.numbers && !options.symbols) {
    alert('请至少选择一种字符类型');
    return;
  }
  
  sendMessage({
    action: 'GENERATE_PASSWORD',
    data: { length, options }
  }).then(password => {
    document.getElementById('generatedPassword').value = password;
  });
}

// 复制生成的密码
function copyGeneratedPassword() {
  const password = document.getElementById('generatedPassword').value;
  
  if (password) {
    navigator.clipboard.writeText(password)
      .then(() => {
        alert('密码已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
        alert('复制失败');
      });
  } else {
    alert('请先生成密码');
  }
}

// 更新生成器选项
function updateGeneratorOptions() {
  // 确保至少有一个选项被选中
  const options = document.querySelectorAll('.generator-option');
  const anyChecked = Array.from(options).some(opt => opt.checked);
  
  if (!anyChecked) {
    this.checked = true;
  }
}

// 更新长度值显示
function updateLengthValue() {
  document.getElementById('lengthValue').textContent = this.value;
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initialize);