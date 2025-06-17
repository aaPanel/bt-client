const Electron = require('ee-core/electron');
const { BrowserView, dialog, BrowserWindow } = require('electron');
const { Controller } = require('ee-core');
const { pub } = require("../class/public.js");
const Log = require('ee-core/log');
const Services = require('ee-core/services');



global.PanelViews = {};
var LoadView = null;
var ShowKey = '';

class WindowController extends Controller {
    constructor(ctx) {
        super(ctx);
    }

    /**
     * @name 创建加载视图
     */
    async load(options) {
        LoadView = new BrowserView(options);
        LoadView.webContents.loadURL('file://' + pub.get_public_path() + '/html/loading.html');
    }

    /**
     * @name 显示加载视图
     */
    async show_load() {
        if (LoadView && !LoadView.is_show) {
            let mainWindow = Electron.mainWindow;
            if (mainWindow) {
                mainWindow.setBrowserView(LoadView);
                LoadView.is_show = true;
            }
        }
    }

    /**
     * @name 隐藏加载视图
     */
    async hide_load() {
        if (LoadView && LoadView.is_show) {
            let mainWindow = Electron.mainWindow;
            if (mainWindow) {
                mainWindow.removeBrowserView(LoadView);
                LoadView.is_show = false;
            }
        }
    }



    /**
     * 创建子视图
     * @param {object} args {
     *    view_key: string - 视图KEY
     *    url: string - 视图URL
     *    options: object - 视图选项 参考：https://www.electronjs.org/zh/docs/latest/api/browser-view#new-browserviewoptions-experimental-deprecated
     *    bounds: object - 视图位置 {x: number, y: number, width: number, height: number}
     *    auto_resize: object - 自动调整大小 {width: boolean, height: boolean,horizontal: boolean, vertical: boolean}
     * }
     * @param {object} event
     * @returns {object}
     */
    async create(args, event) {
        let channel = args.channel;
        let url = args.data.url;
        let bounds = args.data.bounds;
        let auto_resize = args.data.auto_resize;
        let view_key = args.data.view_key;
        let options = args.data.options;
        let proxy_id = args.data.proxy_id || 0;

        // 获取主窗口
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }

        // 判断视图是否存在
        if (global.PanelViews[view_key]) {
            // 如果视图已经存在，则直接显示
            mainWindow.setBrowserView(global.PanelViews[view_key]);
            return pub.send_success_msg(event, channel, pub.lang('视图已经存在,直接显示'));
        }

        if (!options) options = {};
        if (!options.webPreferences) options.webPreferences = {};

        // 开发者模式
        // options.webPreferences.devTools = true;


        // 创建视图
        global.PanelViews[view_key] = new BrowserView(options);

        // 打开开发者工具
        // global.PanelViews[view_key].webContents.openDevTools();


        // 设置主窗口视图
        mainWindow.setBrowserView(global.PanelViews[view_key]);
        global.PanelViews[view_key].is_show = true;
        global.PanelViews[view_key].view_key = view_key;
        ShowKey = view_key;

        // 设置视图位置和大小
        if (bounds) {
            if (bounds.x !== undefined) {
                bounds.x = parseInt(bounds.x);
                bounds.y = parseInt(bounds.y);
                bounds.width = parseInt(bounds.width);
                bounds.height = parseInt(bounds.height) + 1;
                global.PanelViews[view_key].setBounds(bounds);
            }
        }

        // 设置视图自动调整大小
        if (auto_resize) global.PanelViews[view_key].setAutoResize(auto_resize);


        // 设置事件
        Services.get('window').setEvent(global.PanelViews[view_key], proxy_id);

        // 加载URL
        global.PanelViews[view_key].webContents.loadURL(url);


        // 将加载视图置顶
        if (!LoadView) this.load(options); // 创建加载视图
        if (LoadView) {
            mainWindow.setBrowserView(LoadView);
            LoadView.is_show = true;
            bounds.x = parseInt(bounds.x);
            bounds.y = parseInt(bounds.y);
            bounds.width = parseInt(bounds.width);
            bounds.height = parseInt(bounds.height);
            LoadView.setBounds(bounds);
            LoadView.setAutoResize(auto_resize);

            // 隐藏子视图
            mainWindow.removeBrowserView(global.PanelViews[view_key]);
        }


        // 页面加载失败
        global.PanelViews[view_key].webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            let message = pub.lang('请检查网络连接');
            switch (errorDescription) {
                case 'ERR_TIMED_OUT':
                    message = pub.lang('连接超时');
                    break;
                case 'ERR_CONNECTION_REFUSED':
                    message = pub.lang('无法连接到网络');
                    // 重新加载
                    setTimeout(() => {
                        if (!global.PanelViews[view_key].reload_num) global.PanelViews[view_key].reload_num = 0;
                        global.PanelViews[view_key].reload_num++;
                        global.PanelViews[view_key].webContents.reload();
                    }, 500);
                    break;
                case 'ERR_CONNECTION_RESET':
                    message = pub.lang('网络连接被重置');
                    break;
                case 'ERR_NAME_NOT_RESOLVED':
                    message = pub.lang('无法解析域名');
                    break;
                case 'ERR_ABORTED':
                    message = pub.lang('连接被中止');
                    break;
            }

            if (errorDescription != 'ERR_CONNECTION_REFUSED' && global.PanelViews[view_key].reload_num < 40) {
                global.PanelViews[view_key].webContents.loadURL('file://' + pub.get_public_path() + '/html/error.html');
                if (LoadView.is_show) this.hide_load();

                dialog.showErrorBox(pub.lang('页面加载失败，{}', message), pub.lang('错误码：{}，错误描述：{}', errorCode, errorDescription));
            }
        });




        // 页面加载完成
        global.PanelViews[view_key].webContents.on('did-finish-load', () => {
            // 隐藏加载视图
            if (LoadView.is_show) this.hide_load();

            // 显示子视图
            global.PanelViews[view_key].loaded = true;
            if (global.PanelViews[view_key].is_show && ShowKey == view_key) {
                mainWindow.setBrowserView(global.PanelViews[view_key]);
            }
        });


        // 打开开发者工具
        // global.PanelViews[view_key].webContents.openDevTools();

        // Log.info('create view:', view_key);
        return pub.send_success_msg(event, channel, pub.lang('视图创建成功'));
    }

    /**
     * 销毁搜索视图
     * @param {object} win
     */
    closeSearchView(win){
        Services.get('window').closeSearchView(win);
    }


    /**
     * 销毁子视图
     * @param {object} args {
     *    view_key: string - 视图KEY
     * }
     * @param {object} event
     * @returns {object}
     */
    async destroy(args, event) {
        let channel = args.channel;
        let view_key = args.data.view_key;

        if (global.PanelViews[view_key]) {
            // 获取主窗口
            let mainWindow = Electron.mainWindow;
            if (!mainWindow) {
                return pub.send_error(event, channel, pub.lang('主窗口不存在'));
            }
            // 从主窗口移除视图
            mainWindow.removeBrowserView(global.PanelViews[view_key]);
            if (LoadView) this.hide_load();

            // 关闭搜索视图
            this.closeSearchView(global.PanelViews[view_key]);

            // 销毁视图
            global.PanelViews[view_key].webContents.destroy();

            // 删除视图索引
            delete global.PanelViews[view_key];

            // Log.info('destroy view:', view_key);
            return pub.send_success_msg(event, channel, pub.lang('视图已销毁'));
        }

        return pub.send_error(event, channel, pub.lang('视图不存在'));

    }


    /**
     * @name 显示子视图
     * @param {object} args {
     *    view_key: string - 视图KEY
     * }
     * @param {object} event
     * @returns {object}
     */
    async show(args, event) {
        let channel = args.channel;
        let view_key = args.data.view_key;

        if (global.PanelViews[view_key]) {
            // 获取主窗口
            let mainWindow = Electron.mainWindow;
            if (!mainWindow) {
                return pub.send_error(event, channel, pub.lang('主窗口不存在'));
            }
            // 显示视图
            if (global.PanelViews[view_key].loaded) {
                mainWindow.setBrowserView(global.PanelViews[view_key]);
                if(global.PanelViews[view_key].searchViewObj) {
                    mainWindow.addBrowserView(global.PanelViews[view_key].searchViewObj);
                }
                global.PanelViews[view_key].is_show = true;
                ShowKey = view_key;
                // Log.info('show view:', view_key);

                // 获取焦点
                global.PanelViews[view_key].webContents.focus();
                
            } else {
                this.show_load();
            }
            return pub.send_success_msg(event, channel, pub.lang('视图已显示'));
        }

        return pub.send_error(event, channel, pub.lang('视图不存在'));
    }

    /**
     * @name 隐藏子视图
     * @param {object} args {
     *   view_key: string - 视图KEY
     * }
     * @param {object} event
     * @returns {object}
     */
    async hide(args, event) {
        let channel = args.channel;
        let view_key = args.data.view_key;

        if (global.PanelViews[view_key]) {
            // 获取主窗口
            let mainWindow = Electron.mainWindow;
            if (!mainWindow) {
                return pub.send_error(event, channel, pub.lang('主窗口不存在'));
            }
            // 隐藏视图
            if (global.PanelViews[view_key].is_show) {
                // this.closeSearchView(global.PanelViews[view_key]);
                if(global.PanelViews[view_key].searchViewObj) {
                    mainWindow.removeBrowserView(global.PanelViews[view_key].searchViewObj);
                }
                mainWindow.removeBrowserView(global.PanelViews[view_key]);
                global.PanelViews[view_key].is_show = false;
                
            }
            this.hide_load();

            return pub.send_success_msg(event, channel, pub.lang('视图已隐藏'));
        }

        return pub.send_error(event, channel, pub.lang('视图不存在'));

    }


    /**
     * @name 刷新浏览器缓存
     * @param {object} args {
     *  view_key: string - 视图KEY
     * }
     * @param {object} event
     */
    async flush_cache(args, event) {
        let channel = args.channel;
        let view_key = args.data.view_key;

        if (global.PanelViews[view_key]) {
            global.PanelViews[view_key].webContents.reloadIgnoringCache();
            return pub.send_success_msg(event, channel, pub.lang('视图已刷新'));
        }

        return pub.send_error(event, channel, pub.lang('视图不存在'));
    }


    /**
     * @name 获取子视图列表
     * @param {object} event
     * @returns {object}
     */
    async list(args, event) {
        let channel = args.channel;
        let views = Object.keys(global.PanelViews);
        return pub.send_success(event, channel, views);
    }


    /**
     * @name 设置子视图位置和大小
     * @param {object} args {
     *   view_key: string - 视图KEY
     *   bounds: object - 视图位置 {x: number, y: number, width: number, height: number}
     * }
     * @param {object} event
     * @returns {object}
     */
    async set_bounds(args, event) {
        let channel = args.channel;
        let view_key = args.data.view_key;
        let bounds = args.data.bounds;

        if (global.PanelViews[view_key]) {
            bounds.x = parseInt(bounds.x);
            bounds.y = parseInt(bounds.y);
            bounds.width = parseInt(bounds.width);
            bounds.height = parseInt(bounds.height) + 1;
            global.PanelViews[view_key].setBounds(bounds);
            if (LoadView) LoadView.setBounds(bounds);
            // Log.info('set bounds:', view_key, bounds);
            return pub.send_success_msg(event, channel, pub.lang('视图位置设置成功'));
        }

        return pub.send_error(event, channel, pub.lang('视图不存在'));
    }


    /**
     * @name 设置子视图自动调整大小
     * @param {object} args {
     *   view_key: string - 视图KEY
     *   auto_resize: object - 自动调整大小 {width: boolean, height: boolean,horizontal: boolean, vertical: boolean}
     * }
     * @param {object} event
     * @returns {object}
     */
    async set_auto_resize(args, event) {
        let channel = args.channel;
        let view_key = args.data.view_key;
        let auto_resize = args.data.auto_resize;

        if (global.PanelViews[view_key]) {
            global.PanelViews[view_key].setAutoResize(auto_resize);
            if (LoadView) LoadView.setAutoResize(auto_resize);
            // Log.info('set auto resize:', view_key, auto_resize);
            return pub.send_success_msg(event, channel, pub.lang('视图自动调整大小设置成功'));
        }

        return pub.send_error(event, channel, pub.lang('视图不存在'));
    }


    /**
     * @name 主窗口最大化/还原
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async window_maximize(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }

        // MAC系统用全屏代替最大化
        if (process.platform == 'darwin') {
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
                return pub.send_success(event, channel, { FullScreen: false, Maximized: false });
            } else {
                mainWindow.setFullScreen(true);
                return pub.send_success(event, channel, { FullScreen: true, Maximized: true });
            }
        } else {
            if (mainWindow.isMaximized()) {
                mainWindow.restore();
                return pub.send_success(event, channel, { Maximized: false });
            } else {
                mainWindow.maximize();
                return pub.send_success(event, channel, { Maximized: true });
            }
        }
    }

    /**
     * @name 主窗口最小化
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async window_minimize(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }
        mainWindow.minimize();

        return pub.send_success_msg(event, channel, pub.lang('窗口已最小化'));
    }

    /**
     * @name 主窗口关闭
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async window_close(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }
        mainWindow.close();
        return pub.send_success_msg(event, channel, pub.lang('窗口已关闭'));
    }

    /**
     * @name 主窗口全屏
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async window_fullscreen(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
            return pub.send_success(event, channel, { FullScreen: false });
        } else {
            mainWindow.setFullScreen(true);
            return pub.send_success(event, channel, { FullScreen: true });
        }
    }

    /**
     * @name 主窗口置顶
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async window_top(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }
        if (mainWindow.isAlwaysOnTop()) {
            mainWindow.setAlwaysOnTop(false);
            return pub.send_success_msg(event, channel, pub.lang('窗口已取消置顶'));
        } else {
            mainWindow.setAlwaysOnTop(true);
            return pub.send_success_msg(event, channel, pub.lang('窗口已置顶'));
        }
    }

    /**
     * @name 退出应用
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async app_quit(args, event) {
        let channel = args.channel;
        if (args.data.action) {
            if (args.data.save) pub.C('exit_action', args.data.action);
            if (args.data.action == 'close') {
                Electron.mainWindow.close();
                return pub.send_success_msg(event, channel, pub.lang('已最小化到托盘'));
            }
        } else {
            let action = pub.C('exit_action');
            if (action == 'close') {
                Electron.mainWindow.close();
                return pub.send_success_msg(event, channel, pub.lang('已最小化到托盘'));
            }
        }
        const EE = require('ee-core/ee');
        EE.CoreApp.appQuit();
        return pub.send_success_msg(event, channel, pub.lang('应用已退出'));
    }

    /**
     * @name 获取退出操作
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async get_app_quit_action(args, event) {
        let channel = args.channel;
        let action = pub.C('exit_action');
        if (!action) {
            action = 'exit';
        }
        return pub.send_success(event, channel, { action: action });
    }

    /**
     * @name 重新加载
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async app_reload(args, event) {
        let channel = args.channel;
        Electron.mainWindow.reload();
        return pub.send_success_msg(event, channel, pub.lang('应用已重新加载'));
    }


    /**
     * @name 主窗口是否为全屏状态
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object}
     */
    async is_fullscreen(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }
        return pub.send_success(event, channel, { FullScreen: mainWindow.isFullScreen() });
    }

    /**
     * @name 主窗口是否为最大化状态
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async is_maximized(args, event) {
        let channel = args.channel;
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return pub.send_error(event, channel, pub.lang('主窗口不存在'));
        }
        return pub.send_success(event, channel, { Maximized: mainWindow.isMaximized() });
    }


    /**
     * @name 获取下载列表 -- 只返回最新的20条
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async get_download_list(args, event) {
        let channel = args.channel;
        let data = pub.M('panel_download').order('download_id DESC').limit(20).select();
        for (let i = 0; i < data.length; i++) {
            if (data[i].status == 1) {
                data[i].status = data[i].update_time - data[i].start_time > 5 ? -1 : 1;
            }
        }
        return pub.send_success(event, channel, data);
    }

    /**
     * @name 取消下载任务
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async cancel_download(args, event) {
        let channel = args.channel;
        let download_id = args.data.download_id;
        pub.M('panel_download').where('download_id=?', download_id).update({ status: -2 });
        return pub.send_success(event, channel, pub.lang('下载任务已取消'));
    }

    /**
     * @name 删除下载
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async remove_download(args, event) {
        let channel = args.channel;
        let download_id = args.data.download_id;
        let data = pub.M('panel_download').where('download_id=?', download_id).delete();
        return pub.send_success(event, channel, data);
    }

    /**
     * @name 打开文件下载窗口
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object}
     */
    async open_download_window(args, event) {
        let channel = args.channel;
        Services.get('window').open_download_window()
        return pub.send_success(event, channel, '下载窗口已打开');
    }
		
	/**
	 * @name 设置tab标签右键信息-存放至global
	 * @param {Object} args 参数
	 * @param {Object} event 事件
	 */
	async set_tab_context_menu(args, event) {
		let channel = args.channel;
		global.tab_params = args.data
		return pub.send_success(event, channel, 'tab标签右键信息已设置');
	}
	/**
	 * @name 刷新面板
	 * @param {Object} args 参数
	 * @param {Object} event 事件
	 */
	async refresh_panel(args, event) { 
		let channel = args.channel;
		global.PanelViews[args.data.view_key].webContents.reload();
		return pub.send_success(event, channel, '面板已刷新');
	}
	
}


WindowController.toString = () => '[class WindowController]';
module.exports = WindowController;


