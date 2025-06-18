# bt-client

[中文说明](README-zh.md) | English

A professional multi-machine management tool designed for unified management of multiple SSH connections and BT-Panel (Baota Panel). With an intuitive interface, users can easily manage multiple servers and improve operational efficiency.

## ✨ Key Features

- 🚀 **One-click Panel Installation & Binding** - Quickly install BT-Panel and automatically bind it for immediate use
- 😍 **Avoid Repeated Password Logins** - Save SSH connection information, no need to enter passwords repeatedly
- 👍 **Built-in Efficient SSH Terminal** - Support multi-tab SSH terminals with convenient operations
- 🔒 **Proxy Access Support** - Built-in proxy pool functionality, support server access through proxies
- 🖥️ **Multi-platform Support** - Support Windows, macOS, Linux platforms
- 📊 **Unified Panel Management** - Manage multiple BT-Panels in one interface

## 🔧 Tech Stack

- **Frontend**: Vue 3 + TypeScript + Element Plus
- **Desktop**: Electron
- **Build Tools**: Vite + UnoCSS
- **Terminal Component**: Xterm.js
- **Database**: SQLite3

## 💻 System Requirements

- **Windows**: Windows 7/8/10/11
- **macOS**: macOS 10.12+ (Support Intel and Apple Silicon M1/M2)
- **Linux**: Ubuntu 18.04+ / Other mainstream Linux distributions

## 🚀 Quick Start

### Environment Setup

Make sure your system has the following software installed:

- Node.js (v16.0.0 or higher)
- npm or yarn

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Development & Debugging

```bash
# Start full development environment (Frontend + Electron)
npm run dev

# Start frontend development server only
npm run dev-frontend

# Start Electron development environment only
npm run dev-electron

# Hot reload mode (recommended for development)
npm run reload

# Rebuild SQLite3 module
npm run re-sqlite
```

### Build & Package

```bash
# Build for macOS
npm run build-m

# Build for Linux
npm run build-l

# Build for Windows
npm run build-w
```

### Other Commands

```bash
# Clean build files
npm run clean

# Generate application icons
npm run icon

# Code encryption
npm run encrypt

# Start in test mode
npm run test
```

## 📁 Project Structure

```
bt-client/
├── electron/           # Electron main process code
│   ├── class/         # Core functionality classes
│   ├── controller/    # Controllers
│   ├── service/       # Business service layer
│   └── config/        # Configuration files
├── frontend/          # Vue.js frontend code
│   ├── src/
│   │   ├── components/  # Common components
│   │   ├── views/      # Page views
│   │   ├── store/      # Pinia state management
│   │   └── utils/      # Utility functions
└── public/            # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the AGPL 3.0 License. See the [LICENSE](LICENSE) file for details.

## 🔗 Related Links

- [BT-Panel Official Website](https://www.bt.cn)
- [Product Page](https://www.bt.cn/new/product_pc.html)
- [Documentation](https://www.bt.cn/bbs)