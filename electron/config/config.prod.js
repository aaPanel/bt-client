'use strict';

const path = require('path');
const { pub } = require('../class/public.js');

/**
 * 默认配置
 */
module.exports = appInfo => {
	const config = {};

	/**
	 * 开发者工具
	 */
	config.openDevTools = false;

	/**
	 * 应用程序顶部菜单
	 */
	config.openAppMenu = false;

	/**
	 * 主窗口
	 */
	config.windowsOption = {
		title: '堡塔',
		width: 1662,
		height: 900,
		minWidth: 500,
		minHeight: 300,
		skipTaskbar: false,
		webPreferences: {
			//webSecurity: false,
			contextIsolation: false, // false -> 可在渲染进程中使用electron的api，true->需要bridge.js(contextBridge)
			nodeIntegration: true,
			preload: path.join(appInfo.baseDir, 'preload', 'bridge.js'),
		},
		frame: false,
		show: false,
		icon: path.join(appInfo.home, 'public', 'images', 'logo-32.png'),
	};

	config.cross = {
		go: {
			enable: false,
			name: 'bt-server',
			args: [ '--user_path=' + pub.get_root_path()],
			appExit: false,
		}
	}

	/**
	 * 框架日志
	 */
	config.logger = {
		encoding: 'utf8',
		level: 'INFO',
		outputJSON: false,
		buffer: true,
		enablePerformanceTimer: false,
		rotator: 'day',
		appLogName: 'app.log',
		coreLogName: 'app-core.log',
		errorLogName: 'app-error.log',
	};

	/**
	 * 远程模式-web地址
	 */
	config.remoteUrl = {
		enable: false,
		url: '',
	};

	/**
	 * 内置socket服务
	 */
	config.socketServer = {
		enable: false,
		port: 7070,
		path: '/socket.io/',
		connectTimeout: 45000,
		pingTimeout: 30000,
		pingInterval: 25000,
		maxHttpBufferSize: 1e8,
		transports: ['polling', 'websocket'],
		cors: {
			origin: true,
		},
		channel: 'c1',
	};

	/**
	 * 内置http服务
	 */
	config.httpServer = {
		enable: false,
		https: {
			enable: false,
			key: '/public/ssl/localhost+1.key',
			cert: '/public/ssl/localhost+1.pem',
		},
		host: '127.0.0.1',
		port: 7071,
		cors: {
			origin: '*',
		},
		body: {
			multipart: true,
			formidable: {
				keepExtensions: true,
			},
		},
		filterRequest: {
			uris: ['favicon.ico'],
			returnData: '',
		},
	};

	/**
	 * 主进程
	 */
	config.mainServer = {
		protocol: 'file://',
		indexPath: '/public/dist/index.html',
		host: 'localhost',
		port: 7072,
	};

	/**
	 * 硬件加速
	 */
	config.hardGpu = {
		enable: true,
	};

	/**
	 * 异常捕获
	 */
	config.exception = {
		mainExit: false,
		childExit: true,
		rendererExit: true,
	};

	/**
	 * jobs
	 */
	config.jobs = {
		messageLog: true,
	};

	/**
	 * 插件功能
	 */
	config.addons = {
		window: {
			enable: true,
		},
		tray: {
			enable: true,
			title: '堡塔多机管理',
			icon: '/public/images/tray.png',
		},
		security: {
			enable: true,
		},
		awaken: {
			enable: true,
			protocol: 'bt-client',
			args: [],
		},
		autoUpdater: {
			enable: true,
			windows: true,
			macOS: true,
			linux: true,
			options: {
				provider: 'generic',
				url: 'https://download.bt.cn/bt-client/',
			},
			force: true,
		},
	};

	return {
		...config,
	};
};
