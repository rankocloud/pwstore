# 本地密码管理器

一个使用Vue 3、Vite、Tailwind CSS开发的Chrome扩展密码管理器。

## 功能特性

- 🔒 主密码保护
- 📝 安全存储网站凭据（网站、用户名、密码）
- 🔍 凭据搜索功能
- 🗂️ 凭据分类管理
- 🔑 随机密码生成
- 📋 一键复制用户名和密码
- ⏱️ 自动锁定功能
- 📅 主密码过期提醒
- 📤 数据导出功能

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **路由**: Vue Router
- **包管理**: Yarn
- **浏览器扩展API**: Chrome Extensions API

## 开发指南

### 环境准备

1. 确保已安装Node.js (推荐v16+)和Yarn
2. 克隆项目仓库
3. 安装依赖：

```bash
cd local-password-manager
 yarn install
```

### 开发流程

1. 启动开发服务器：

```bash
 yarn dev
```

2. 构建生产版本：

```bash
 yarn build
```

3. 构建后的文件会生成在`dist`目录中

### 加载Chrome扩展

1. 打开Chrome浏览器，进入`chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录

## 项目结构

```
├── dist/             # 构建输出目录
├── icons/            # 扩展图标
├── src/              # 源代码
│   ├── background/   # 后台服务worker
│   ├── components/   # Vue组件
│   ├── popup/        # 弹出界面相关文件
│   ├── router/       # 路由配置
│   ├── utils/        # 工具函数
│   ├── App.vue       # 主应用组件
│   ├── main.js       # 应用入口
│   └── style.css     # 全局样式
├── manifest.json     # Chrome扩展配置
├── package.json      # 项目配置和依赖
└── vite.config.js    # Vite配置
```

## 安全性说明

- 主密码不会被存储在任何地方，请务必牢记
- 所有凭据数据使用主密码加密后存储在Chrome的本地存储中
- 扩展不会将您的任何数据发送到外部服务器
- 请定期备份您的密码数据

## 注意事项

- 忘记主密码将导致所有存储的凭据无法恢复
- 建议定期更换主密码以提高安全性
- 请勿在公共设备上使用"记住密码"功能

## License

MIT