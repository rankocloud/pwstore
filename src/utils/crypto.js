/**
 * 加密模块 - 实现基于Web Crypto API的AES-256-GCM加密
 */

// 从主密码派生加密密钥
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await self.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  return self.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 加密数据
async function encryptData(plaintext, password) {
  const salt = self.crypto.getRandomValues(new Uint8Array(16));
  const iv = self.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encoder = new TextEncoder();
  const encrypted = await self.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(plaintext)
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
    salt: btoa(String.fromCharCode(...new Uint8Array(salt)))
  };
}

// 解密数据
async function decryptData(encryptedData, password) {
  const { ciphertext, iv, salt } = encryptedData;
  
  const key = await deriveKey(
    password,
    Uint8Array.from(atob(salt), c => c.charCodeAt(0))
  );
  
  const decrypted = await self.crypto.subtle.decrypt(
    { 
      name: "AES-GCM", 
      iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) 
    },
    key,
    Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// 敏感数据内存保护
class SecureMemory {
  constructor() {
    this.memory = new Uint8Array(0);
  }
  
  // 存储敏感数据
  store(data) {
    this.clear(); // 先清除旧数据
    const encoder = new TextEncoder();
    this.memory = encoder.encode(data);
    return this.memory;
  }
  
  // 读取敏感数据
  read() {
    const decoder = new TextDecoder();
    return decoder.decode(this.memory);
  }
  
  // 清除敏感数据
  clear() {
    // 覆盖内存内容
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0;
    }
    this.memory = new Uint8Array(0);
  }
  
  // 使用完自动清除的安全包装
  async withSecureData(data, callback) {
    try {
      this.store(data);
      return await callback(this.read());
    } finally {
      this.clear();
    }
  }
}

// 密码生成器
function generatePassword(length = 16, options = {
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true
}) {
  const charset = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  };
  
  let password = '';
  let allChars = '';
  
  // 根据选项构建字符集
  if (options.lowercase) {
    allChars += charset.lowercase;
    password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
  }
  
  if (options.uppercase) {
    allChars += charset.uppercase;
    password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
  }
  
  if (options.numbers) {
    allChars += charset.numbers;
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
  }
  
  if (options.symbols) {
    allChars += charset.symbols;
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];
  }
  
  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // 打乱顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// 检查密码强度
function checkPasswordStrength(password) {
  if (!password) return { score: 0, label: "无" };
  
  let score = 0;
  
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
  
  // 评分标签
  let label = "弱";
  if (score >= 5) label = "强";
  else if (score >= 3) label = "中";
  
  return { score, label };
}

// 使用全局变量暴露函数，以便Service Worker可以访问
self.deriveKey = deriveKey;
self.encryptData = encryptData;
self.decryptData = decryptData;
self.SecureMemory = SecureMemory;
self.generatePassword = generatePassword;
self.checkPasswordStrength = checkPasswordStrength;