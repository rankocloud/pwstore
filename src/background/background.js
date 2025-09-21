/**
 * 后台服务 - 处理加密逻辑、存储管理和消息调度
 */

// 导入加密模块
importScripts('../utils/crypto.js');

// 全局状态
let masterPassword = null;
let isSetupComplete = false;
const secureMem = new SecureMemory();

// 初始化
async function initialize() {
  const setup = await chrome.storage.local.get("isSetupComplete");
  isSetupComplete = setup.isSetupComplete || false;
}

// 验证主密码
async function verifyMasterPassword(password) {
  // 尝试解密存储的测试数据
  const storedTest = await chrome.storage.local.get("test_encrypted");
  if (!storedTest.test_encrypted) return false;
  
  try {
    const decrypted = await decryptData(storedTest.test_encrypted, password);
    return decrypted === "test_data";
  } catch (e) {
    return false;
  }
}

// 设置主密码
async function setMasterPassword(password) {
  // 创建测试数据
  const encryptedTest = await encryptData("test_data", password);
  await chrome.storage.local.set({ 
    test_encrypted: encryptedTest,
    isSetupComplete: true
  });
  
  // 安全存储主密码在内存中
  secureMem.store(password);
  masterPassword = password;
  isSetupComplete = true;
  
  return true;
}

// 加密并存储凭据
async function encryptAndStore(data) {
  console.log("encryptAndStore: 收到保存凭据请求", { origin: data.origin, username: data.username });
  
  if (!masterPassword) {
    console.error("encryptAndStore: 保存失败 - 主密码未设置或密码库未解锁");
    return { success: false, error: "密码库未解锁，请先解锁密码管理器" };
  }
  
  try {
    // 获取现有凭据
    const stored = await chrome.storage.local.get("credentials");
    const credentials = stored.credentials || [];
    
    // 生成唯一ID
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // 加密密码
    const encryptedPassword = await encryptData(data.password, masterPassword);
    
    // 检查是否已存在相同网站和用户名的凭据
    const existingIndex = credentials.findIndex(
      cred => cred.origin === data.origin && cred.username === data.username
    );
    
    if (existingIndex >= 0) {
      // 更新现有凭据
      console.log("encryptAndStore: 更新现有凭据");
      credentials[existingIndex] = {
        ...credentials[existingIndex],
        encryptedPassword,
        lastUpdated: Date.now()
      };
    } else {
      // 添加新凭据
      console.log("encryptAndStore: 添加新凭据");
      credentials.push({
        id,
        origin: data.origin,
        username: data.username,
        encryptedPassword,
        created: Date.now(),
        lastUpdated: Date.now(),
        categories: []
      });
    }
    
    // 保存到存储
    await chrome.storage.local.set({ credentials });
    
    console.log("encryptAndStore: 凭据保存成功");
    return { success: true };
  } catch (error) {
    console.error("存储凭据失败:", error);
    return { success: false, error: `保存失败: ${error.message}` };
  }
}

// 获取特定网站的凭据
async function getCredentialForOrigin(origin) {
  if (!masterPassword) {
    return null;
  }
  
  try {
    const stored = await chrome.storage.local.get("credentials");
    const credentials = stored.credentials || [];
    
    // 查找匹配的凭据
    const credential = credentials.find(cred => cred.origin === origin);
    
    if (!credential) {
      return null;
    }
    
    // 解密密码
    const password = await decryptData(credential.encryptedPassword, masterPassword);
    
    return {
      id: credential.id,
      origin: credential.origin,
      username: credential.username,
      password
    };
  } catch (error) {
    console.error("获取凭据失败:", error);
    return null;
  }
}

// 获取特定域名的所有凭据
async function getCredentialsForDomain(domain) {
  if (!masterPassword) {
    return [];
  }
  
  try {
    const stored = await chrome.storage.local.get("credentials");
    const credentials = stored.credentials || [];
    
    // 匹配域名，支持子域名匹配
    const matchingCredentials = credentials.filter(cred => {
      try {
        const credDomain = new URL(cred.origin).hostname;
        return credDomain === domain || 
               credDomain.endsWith('.' + domain) || 
               domain.endsWith('.' + credDomain);
      } catch (e) {
        // 如果URL解析失败，尝试直接匹配
        return cred.origin.includes(domain);
      }
    });
    
    // 解密密码
    const decryptedCredentials = [];
    for (const cred of matchingCredentials) {
      try {
        const password = await decryptData(cred.encryptedPassword, masterPassword);
        decryptedCredentials.push({
          id: cred.id,
          origin: cred.origin,
          username: cred.username,
          password: password
        });
      } catch (e) {
        console.error("解密密码失败:", e);
        // 继续处理其他凭据，不中断整个过程
      }
    }
    
    return decryptedCredentials;
  } catch (error) {
    console.error("获取域名凭据失败:", error);
    return [];
  }
}

// 获取所有凭据
async function getAllCredentials() {
  if (!masterPassword) {
    return [];
  }
  
  try {
    const stored = await chrome.storage.local.get("credentials");
    const credentials = stored.credentials || [];
    
    // 返回不含密码的凭据列表
    return credentials.map(cred => ({
      id: cred.id,
      origin: cred.origin,
      username: cred.username,
      created: cred.created,
      lastUpdated: cred.lastUpdated,
      categories: cred.categories || []
    }));
  } catch (error) {
    console.error("获取凭据列表失败:", error);
    return [];
  }
}

// 获取特定凭据的密码
async function getPassword(credentialId) {
  if (!masterPassword) {
    return null;
  }
  
  try {
    const stored = await chrome.storage.local.get("credentials");
    const credentials = stored.credentials || [];
    
    // 查找匹配的凭据
    const credential = credentials.find(cred => cred.id === credentialId);
    
    if (!credential) {
      return null;
    }
    
    // 解密密码
    return await decryptData(credential.encryptedPassword, masterPassword);
  } catch (error) {
    console.error("获取密码失败:", error);
    return null;
  }
}

// 删除凭据
async function deleteCredential(credentialId) {
  try {
    const stored = await chrome.storage.local.get("credentials");
    const credentials = stored.credentials || [];
    
    // 过滤掉要删除的凭据
    const updatedCredentials = credentials.filter(cred => cred.id !== credentialId);
    
    // 保存到存储
    await chrome.storage.local.set({ credentials: updatedCredentials });
    
    return { success: true };
  } catch (error) {
    console.error("删除凭据失败:", error);
    return { success: false, error: error.message };
  }
}

// 添加凭据分类
async function addCredentialCategory(credentialId, category) {
  try {
    const stored = await chrome.storage.local.get(["credentials", "categories"]);
    const credentials = stored.credentials || [];
    const categories = stored.categories || {};
    
    // 更新凭据的分类
    const credIndex = credentials.findIndex(cred => cred.id === credentialId);
    if (credIndex >= 0) {
      if (!credentials[credIndex].categories) {
        credentials[credIndex].categories = [];
      }
      
      if (!credentials[credIndex].categories.includes(category)) {
        credentials[credIndex].categories.push(category);
      }
    }
    
    // 更新分类列表
    if (!categories[category]) {
      categories[category] = [];
    }
    
    if (!categories[category].includes(credentialId)) {
      categories[category].push(credentialId);
    }
    
    // 保存到存储
    await chrome.storage.local.set({ 
      credentials,
      categories
    });
    
    return { success: true };
  } catch (error) {
    console.error("添加分类失败:", error);
    return { success: false, error: error.message };
  }
}

// 搜索凭据
function searchCredentials(credentials, query) {
  if (!query) return credentials;
  
  const lowerQuery = query.toLowerCase();
  return credentials.filter(cred => {
    // 搜索网站、用户名和分类
    const matchesOrigin = cred.origin.toLowerCase().includes(lowerQuery);
    const matchesUsername = cred.username.toLowerCase().includes(lowerQuery);
    const matchesCategory = (cred.categories || []).some(
      cat => cat.toLowerCase().includes(lowerQuery)
    );
    
    return matchesOrigin || matchesUsername || matchesCategory;
  });
}

// 锁定密码库
function lockVault() {
  masterPassword = null;
  secureMem.clear();
}

// 消息处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data } = message;
  
  // 异步响应处理
  const respond = async () => {
    switch (action) {
      case "IS_SETUP_COMPLETE":
        return { isSetupComplete };
        
      case "VERIFY_MASTER_PASSWORD":
        const isValid = await verifyMasterPassword(data.password);
        if (isValid) {
          secureMem.store(data.password);
          masterPassword = data.password;
        }
        return { success: isValid };
        
      case "SET_MASTER_PASSWORD":
        return await setMasterPassword(data.password);
        
      case "SAVE_CREDENTIAL":
        return await encryptAndStore(data);
        
      case "GET_CREDENTIAL_FOR_ORIGIN":
        return await getCredentialForOrigin(data.origin);
        
      case "GET_CREDENTIALS_FOR_DOMAIN":
        // 兼容新旧参数格式
        const domain = message.data && message.data.domain ? message.data.domain : data;
        console.log("处理GET_CREDENTIALS_FOR_DOMAIN请求", { domain: domain });
        const domainCredentials = await getCredentialsForDomain(domain);
        console.log("找到匹配凭据数量", { count: domainCredentials.length });
        return { success: true, credentials: domainCredentials };
        
      case "GET_CREDENTIALS":
        return await getAllCredentials();
        
      case "GET_PASSWORD":
        return await getPassword(data.id);
        
      case "DELETE_CREDENTIAL":
        return await deleteCredential(data.id);
        
      case "ADD_CATEGORY":
        return { success: true, name: data.name };
        
      case "UPDATE_CREDENTIAL_CATEGORIES":
        for (const category of data.categories) {
          await addCredentialCategory(data.credentialId, category);
        }
        return { success: true };
        
      case "SEARCH_CREDENTIALS":
        const allCreds = await getAllCredentials();
        return searchCredentials(allCreds, data.query);
        
      case "LOCK_VAULT":
        lockVault();
        return { success: true };
        
      case "GENERATE_PASSWORD":
        return generatePassword(data.length, data.options);
        
      default:
        return { success: false, error: "未知操作" };
    }
  };
  
  // 处理异步响应
  respond().then(sendResponse);
  return true; // 保持消息通道开放以进行异步响应
});

// 初始化
initialize();