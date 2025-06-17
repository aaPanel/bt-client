'use strict';
const { Service } = require('ee-core');
const { pub } = require("../class/public.js");
const Electron = require('ee-core/electron');
const { dialog, BrowserWindow, ipcMain,BrowserView } = require('electron');
const { ContextMenu } = require("../class/menu.js");
const fs = require('fs');

class WindowService extends Service {

    constructor(ctx) {
        super(ctx);
    }

    /**
     * @name 设置窗口代理
     * @param {BrowserWindow} win 窗口对象
     * @param {String} proxy_id 代理ID
     */
    setProxy(win, proxy_id) {
        // 设置代理
        if (proxy_id > 0) {
            let proxy_info = pub.M('proxy_info').where('proxy_id=?', proxy_id).find();
            if (proxy_info) {
                if (proxy_info.proxy_type in [0, 1]) {
                    // HTTP代理
                    let protocol = proxy_info.proxy_type == 0 ? 'http' : 'https';
                    if (proxy_info.proxy_username && proxy_info.proxy_password) {
                        win.webContents.session.setProxy({ proxyRules: protocol + '://' + proxy_info.proxy_username + ':' + proxy_info.proxy_password + '@' + proxy_info.proxy_ip + ':' + proxy_info.proxy_port });
                    } else {
                        win.webContents.session.setProxy({ proxyRules: protocol + '://' + proxy_info.proxy_ip + ':' + proxy_info.proxy_port });
                    }
                } else if (proxy_info.proxy_type == 2) {
                    // SOCKS5代理
                    let proxy_config = { proxyRules: 'socks5://' + global.socks.address + ':' + global.socks.port };
                    win.webContents.session.setProxy(proxy_config);
                }
            }
        }

    }


    /**
     * @name 注册窗口快捷键
     * @param {BrowserWindow} win 窗口对象
     * @param return {void}
     */
    registerShortcut(win) {
        let self = this;
        // 注册页面快捷键
        win.webContents.on('before-input-event', (event, input) => {

            // F5 刷新
            if (input.type === 'keyDown' && input.key === 'F5') {
                event.sender.reload();
            }

            // Ctrl + R 刷新
            if (input.type === 'keyDown' && input.control && (input.key === 'r' || input.key === 'R')) {
                event.sender.reload();
            }

            // Ctrl + Shift + I 打开开发者工具
            if (input.type === 'keyDown' && input.control && input.shift && (input.key === 'I' || input.key === 'i')) {
                event.sender.openDevTools();
            }

            // Ctrl + F5 强制刷新
            if (input.type === 'keyDown' && input.control && input.key === 'F5') {
                event.sender.reloadIgnoringCache();
            }

            // Ctrl + F 弹出搜索框
            if (input.type === 'keyDown' && input.control && (input.key === 'F' || input.key === 'f')) {
                self.showSearchView(win);
            }



            // Ctrl + Shift + R 强制刷新
            if (input.type === 'keyDown' && input.control && input.shift && (input.key === 'R' || input.key === 'r')) {
                event.sender.reloadIgnoringCache();
            }

            // Ctrl + Shift + C 检查元素
            if (input.type === 'keyUp' && input.control && input.shift && (input.key === 'C' || input.key === 'c')) {
                event.sender.inspectElement(input.x, input.y);
            }

            // Ctrl + Shift + X 剪切
            if (input.type === 'keyUp' && input.control && input.shift && (input.key === 'X' || input.key === 'x')) {
                event.sender.cut();
            }

            // Ctrl + Shift + V 粘贴
            if (input.type === 'keyUp' && input.control && input.shift && (input.key === 'V' || input.key === 'v')) {
                event.sender.paste();
            }

            // F12 打开开发者工具
            if (input.type === 'keyDown' && input.key === 'F12') {
                event.sender.openDevTools();
            }

            // F11 切换全屏
            if (input.type === 'keyDown' && input.key === 'F11') {
                Electron.mainWindow.webContents.executeJavaScript('if(!document.fullscreenElement){document.documentElement.requestFullscreen();}else{if (document.exitFullscreen){document.exitFullscreen();}}', true);
            }

            // Ctrl + 1 切换到第一个标签
            if (input.type === 'keyDown' && input.control && (input.key in ['1', '2', '3', '4', '5', '6', '7', '8', '9'] || input.key === 'Tab')) {
                if (input.key === 'Tab') {
                    input.key = 'next';
                }

                // 如果在/home页面
                let url = Electron.mainWindow.webContents.getURL();
                if (url.indexOf('#/home') > -1 || url.indexOf('#/details') > -1) {
                    Electron.mainWindow.webContents.send('panel-switch', input.key);
                }else if(url.indexOf('#/xterm') > -1){
                    Electron.mainWindow.webContents.send('xterm-switch', input.key);
                }
            }
        });

    }


    /**
     * @name 错误处理
     * @param {BrowserWindow} win 窗口对象
     * @returns {void}
     */
    errorHandle(win) {
        // 页面加载失败
        win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
            let message = pub.lang('请检查网络连接');
            switch (errorDescription) {
                case 'ERR_TIMED_OUT':
                    message = pub.lang('连接超时');
                    break;
                case 'ERR_CONNECTION_REFUSED':
                    message = pub.lang('无法连接到网络');
                    // 重新加载
                    setTimeout(() => {
                        if (!PanelViews[view_key].reload_num) PanelViews[view_key].reload_num = 0;
                        PanelViews[view_key].reload_num++;
                        PanelViews[view_key].webContents.reload();
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

            if (errorDescription != 'ERR_CONNECTION_REFUSED' && PanelViews[view_key].reload_num < 40) {
                win.loadURL('file://' + pub.get_public_path() + '/html/error.html');
                dialog.showErrorBox(pub.lang('页面加载失败，{}', message), pub.lang('错误码：{}，错误描述：{}', errorCode, errorDescription));
            }
        });
    }


    /**
     * @name 创建右键菜单
     * @param {BrowserWindow} win 窗口对象
     * @param {String} proxy_id 代理ID
     * @returns {void}
     */
    createContextMenu(win, proxy_id) {
        // 创建右键菜单
        win.webContents.on('context-menu', (event, params) => {
            let menu_obj = new ContextMenu(event, params);
            let contextMenu = menu_obj.get_context_menu_panel(proxy_id);
            if (contextMenu) contextMenu.popup({ window: win.webContents });
        });
    }

    /**
     * @name 忽略证书错误
     * @param {BrowserWindow} win 窗口对象
     * @returns {void}
     */
    ignoreCertificateErrors(win) {
        // 忽略证书错误
        win.webContents.on('certificate-error', (event, url, error, certificate, callback) => {
            event.preventDefault();
            callback(true);
        });
    }


    /**
     * @name 打开内部链接
     * @param {String} url 链接地址
     * @param {String} proxy_id 代理ID
     * @returns {void}
     */
    openInternalLink(url, proxy_id,Details) {
        let main = Electron.mainWindow
        let win = new BrowserWindow();
        win.setBounds(main.getBounds())
        this.setEvent(win, proxy_id);
        let options = {}
        if(Details && Details.postBody && Details.postBody.data){
            options = {
                httpReferrer: Details.referrer.url,
                postData: Details.postBody.data,
                extraHeaders: 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8'
            }
        }
        win.loadURL(url,options);
    }

    /**
     * @name 获取URL中的host部分
     * @param {String} url 链接地址
     * @returns {String}
     */
    getHost(url) {
        if (url.indexOf('://') == -1) return '';
        let host = url.split('://')[1].split('/')[0];
        return host;
    }

    /**
     * @name 打开链接处理
     * @param {BrowserWindow} win 窗口对象
     * @returns {void}
     */
    openLink(win,proxy_id) {
        let self = this;
        // 使用系统默认浏览器打开链接
        win.webContents.setWindowOpenHandler((Details) => {
            // 是否为内部链接
            let url = Details.url;
            let src_url = win.webContents.getURL();
            let src_host = this.getHost(src_url);
            let dst_host = this.getHost(url);
            if (src_host == dst_host) {
                // 打开内部链接
                self.openInternalLink(url,proxy_id,Details)
                return { action: 'deny'}
            }

            // 如果是空白页则不处理
            if (url == 'about:blank#blocked' || url == 'about:blank') return { action: 'allow'};

            // 外部链接使用系统默认浏览器打开
            require('electron').shell.openExternal(url);
            return { action: 'deny'}
        });
    }
    /**
     * @name 推送下载列表到前端
     * @param {String} channel 通道
     */
    async send_download_list() {
        if (!global.download_window) return;
        let channel = 'panel_download_list'
        let data = pub.M('panel_download').order('download_id DESC').limit(20).select();
        for(let i=0;i<data.length;i++){
            if(data[i].status == 1){
                data[i].status = data[i].update_time - data[i].start_time > 5 ? -1 : 1;
            }
        }
  
        if (global.download_window) global.download_window.webContents.send(channel, pub.success_data(data));
    }

    /**
     * @name 推送下载进度到前端
     * @param {Number} download_id 下载ID
     * @returns {void}
     */
    async send_download_progress(download_id) {
        if (!global.download_window) return;
        let channel = 'panel_download_progress';
        let progress = pub.M('panel_download').where('download_id=?', download_id).find();
        let data = { download_id: download_id, data: progress };
        if (global.download_window) global.download_window.webContents.send(channel, data);
    }

    /**
     * @name 文件下载处理
     * @param {BrowserWindow} win 窗口对象
     * @returns {void}
     */
    downloadFile(win) {
        let self = this;
        // 监听下载事件
        win.webContents.session.on('will-download', (evt, item, webContents) => {
            if (!item) return;
            let download_speed = 0.00;

            // sql = `CREATE TABLE IF NOT EXISTS panel_download (
            //     \`download_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID
            //     \`url\` TEXT DEFAULT "",          -- URL
            //     \`filename\` TEXT DEFAULT "",      -- 文件名
            //     \`file_size\` INTEGER DEFAULT 0,  -- 文件大小
            //     \`save_path\` TEXT DEFAULT "",     -- 保存路径
            //     \`start_time\` INTEGER DEFAULT 0,     -- 下载时间
            //     \`end_time\` INTEGER DEFAULT 0,     -- 完成时间
            //     \`time_consuming\` INTEGER DEFAULT 0,     -- 耗时
            //     \`progress\` INTEGER DEFAULT 0,   -- 进度
            //     \`received_size\` INTEGER DEFAULT 0,   -- 已下载大小
            //     \`speed\` TEXT DEFAULT "",         -- 速度
            //     \`status\` INTEGER DEFAULT 0,     -- 状态 0=暂停 1=下载中 2=已完成 -1=下载失败
            //     \`error_msg\` TEXT DEFAULT ""      -- 错误信息
            // )`
            let filename = item.getFilename();
            let url = item.getURL();
            let file_size = item.getTotalBytes();
            let save_path = item.getSavePath();
            let percent = 0;
            let received = 0;
            let table = 'panel_download';
            let start_time = pub.time();
            if (pub.M(table).where('url=? AND start_time=?', [url, start_time]).count()) {
                return pub.log('Download is already exists');
            }

            let download_id = pub.M(table).insert({
                url: url,
                filename: filename,
                save_path: save_path,
                file_size: file_size,
                status: 1,
                start_time: start_time
            })

            let is_open_window = false;

            if (webContents.getURL() == ""){
                webContents.destroy()
            }

            item.on('updated', (event, state) => {
                let status = pub.M(table).where('download_id=?', download_id).getField('status')
                let pdata = {};
                if(status == -2){
                    // 手动取消下载
                    item.cancel();

                    // 通知前端取消下载
                    pdata = {
                        filename: filename,
                        download_url: url,
                        save_path: save_path,
                        percent: -1,
                        total: file_size,
                        received: 0,
                        download_speed: 0,
                        remaining_time: 0
                    }
                    Electron.mainWindow.webContents.send('download-progress', pdata);

                    // 删除文件
                    if(fs.existsSync(filename)){
                        fs.unlinkSync(filename);
                    }
                    return;
                }

                // 取消下载
                if (state === 'cancelled') {
                    pub.M(table).where('download_id=?', download_id).update({ status: -1, error_msg: 'Download is cancelled' });
                    return pub.log('Download is cancelled');
                } else if (state === 'interrupted') {
                    // 下载被中断
                    pub.M(table).where('download_id=?', download_id).update({ status: -1, error_msg: 'Download is interrupted' });
                    return pub.log('Download is interrupted but can be resumed');
                } else if (state === 'progressing') {
                    if (item.isPaused()) {
                        // 下载被暂停
                        pub.M(table).where('download_id=?', download_id).update({ status: 0 });
                        return pub.log('Download is paused');
                    }

                    // 下载进度
                    if (!save_path) save_path = item.getSavePath();
                    if (save_path == "") return;

                    // 打开下载窗口
                    if (!global.download_window && !is_open_window) {
                        this.open_download_window();
                        is_open_window = true;
                    } else {
                        // 推送下载列表到前端
                        if (item.is_send_list === undefined) {
                            self.send_download_list();
                            item.is_send_list = true;
                        }
                    }


                    received = item.getReceivedBytes();
                    if (file_size == 0 && received) return;

                    percent = Number((100 * (received / file_size)).toFixed(2));

                    // 计算每秒下载速度
                    let down_time = pub.time();
                    let now_time = down_time - start_time;
                    if (now_time > 0) {
                        download_speed = Number((received / now_time).toFixed(2));
                    }
                    // 计算下载还剩余时间
                    let remaining_time = Number(((file_size - received) / download_speed).toFixed(0));

                    pdata = {
                        filename: filename,
                        download_url: url,
                        save_path: save_path,
                        percent: percent,
                        total: file_size,
                        received: received,
                        download_speed: download_speed,
                        remaining_time: remaining_time
                    }

                    let update = {
                        progress: percent,
                        received_size: parseInt(received),
                        speed: download_speed,
                        update_time: down_time
                    };

                    if (percent == 100) {
                        // 下载完成
                        update.status = 2;
                        update.end_time = down_time;
                        update.time_consuming = update.end_time - start_time;
                        update.save_path = save_path;
                    }
                    // 更新数据库
                    pub.M(table).where('download_id=?', download_id).update(update);

                    // 推送下载进度到前端
                    Electron.mainWindow.webContents.send('download-progress', pdata);
                    self.send_download_progress(download_id);
                }
            });

            item.once('done', (event, state) => {
                if (state == 'cancelled' || state == 'interrupted') {
                    // 下载被取消
                    pub.M(table).where('download_id=?', download_id).update({ status: -1, error_msg: state });
                    self.send_download_progress(download_id);

                } else if (state == 'completed') {
                    // 下载完成
                    if (!save_path) save_path = item.getSavePath();
                    pub.M(table).where('download_id=?', download_id).update({ status: 2, progress: 100, save_path: save_path });
                    self.send_download_progress(download_id);
                }
            });
        });
    }


    /**
     * @name 打开下载窗口
     * @returns {Promise<void>}
     */
    async open_download_window() {
        let mainWindow = Electron.mainWindow;
        if (!mainWindow) {
            return;
        }
        // 防止重复打开
        if(global.download_window){
            global.download_window.focus(); // 窗口置顶
            return;
        }
        let url = 'file://' + pub.get_public_path() + '/html/download.html';
        let main_bounds = mainWindow.getBounds();
        let bounds = { x: main_bounds.x, y: main_bounds.y, width: 500, height: 400 };
        let options = {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            resizable: false,
            maximizable: false,
            minimizable: false,
            bounds: bounds,
        };
        

        // 创建视图
        global.download_window = new BrowserWindow(options);
        global.download_window.setBounds(bounds);
        // 设置为模态窗口
        global.download_window.setParentWindow(mainWindow);
        
        global.download_window.loadURL(url);
        global.download_window.on('closed', () => {
            global.download_window = null;
        });

        // 开发者模式
        if(pub.isDev()){
            // 打开开发者工具
            global.download_window.webContents.openDevTools();
            // 监听到文件变化
            this.download_window_reload()
        }
    }

    async download_window_reload() {
        let file = pub.get_public_path() + '/html/download.html';
        let fs = require('fs');
        let self = this;
        setTimeout(() => {
            fs.stat(file, (err, stats) => {
                if (stats && global.download_window) {
                    let mtime = stats.mtimeMs;
                    if (global.download_window.mtime === undefined) global.download_window.mtime = mtime;
                    if (global.download_window && global.download_window.mtime && mtime != global.download_window.mtime) {
                        global.download_window.mtime = mtime;
                        global.download_window.reload();
                    }
                }
            });
            self.download_window_reload();
        }, 1000);
    }

    /**
     * @name 处理HTTP认证
     * @param {BrowserWindow} win 窗口对象
     * @returns {void}
     */
    setLogin(win) {
        let is_login = false;
        win.webContents.on('login', (event, request, authInfo, callback) => {
            event.preventDefault();
            // 获取登录信息
            let url = request.url.split('/login')[0];
            if (!is_login) {
                // 从数据库获取登录信息
                let panel_info = pub.M('panel_info').where('url=?', url).find()
                if (panel_info && panel_info.username && panel_info.password) {
                    is_login = true; // 标记已经使用过数据库存储的帐号密码登录，如果失败则不再使用
                    return callback(panel_info.username, panel_info.password);
                }
            }

            // 打开登录窗口
            let options = {
                // 不显示标题栏
                frame: false,
                webPreferences: {
                    nodeIntegration: true,  // 是否集成Node
                    contextIsolation: false,    // 是否启用上下文隔离
                    enableRemoteModule: true    // 是否启用remote模块
                },
                resizable: false,
                maximizable: false
            };
            let main_bounds = Electron.mainWindow.getBounds();
            let bounds = { x: main_bounds.x, y: main_bounds.y, width: 415, height: 310 };
            let login_win = new BrowserWindow(options);
            login_win.setBounds(bounds);

            // 设为模态窗口
            login_win.setParentWindow(Electron.mainWindow);

            // 相对于主窗口居中
            login_win.center();

            login_win.loadURL('file://' + pub.get_public_path() + '/html/login.html');

            // 接收登录信息
            ipcMain.on('basicauth-login', (event, data) => {
                // 回调登录信息
                callback(data.username, data.password);

                // 移除事件并关闭窗口
                ipcMain.removeAllListeners('basicauth-login');
                login_win.close();

                // 保存登录信息
                if(data.remember){
                    pub.M('panel_info').where('url=?', url).update({ username: data.username, password: data.password });
                }
            });
        });
    }

    /**
     * @name 关闭搜索框
     * @param {BrowserView} win 视图或窗口对象
     * @returns {void}
     */
    closeSearchView(win) {
        if (win.searchViewObj) {
            win.webContents.stopFindInPage('clearSelection')
            if (win instanceof BrowserWindow){
                win.removeBrowserView(win.searchViewObj)
            }else{
                Electron.mainWindow.removeBrowserView(win.searchViewObj)
            }
            win.searchViewObj.webContents.destroy()
            win.searchViewObj = null

            // 取消事件监听
            ipcMain.removeAllListeners('close-search-view' + win.view_key);
            ipcMain.removeAllListeners('search-' + win.view_key);
        }
    }

    /**
     * @name 显示搜索框
     * @param {BrowserView} win 视图或窗口对象
     * @returns {void}
     * @description 显示搜索框
     */
    showSearchView(win) {
        if (win.searchViewObj) {
            this.closeSearchView(win);
        }

        let self = this;
        // 显示搜索框
        win.searchViewObj = new BrowserView({
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false,
              enableRemoteModule: true
            }
        })

        // 宽370 高70 显示在右上角
        if (win instanceof BrowserWindow){
            // 如果是窗口对象
            win.searchViewObj.setBounds({ x: win.getBounds().width - 385, y: 1, width: 375, height: 70 })
            // 窗口大小改变时
            win.on('resize', () => {
                setTimeout(() => {
                    win.searchViewObj.setBounds({ x: win.getBounds().width - 385, y: 1, width: 375, height: 70 })
                },10 );
            })
            // 窗口关闭事件
            win.on('close', () => {
                self.closeSearchView(win);
            })
        }else{
            // 如果是视图对象
            win.searchViewObj.setBounds({ x: win.getBounds().width - 385, y: 40, width: 375, height: 70 })
        }
        // 如果win是BrowserWindow对象，则将BrowserView添加到BrowserWindow中
        if (win instanceof BrowserWindow){
            win.addBrowserView(win.searchViewObj)
        }else{
            Electron.mainWindow.addBrowserView(win.searchViewObj)
        }
        
        win.searchViewObj.webContents.loadURL('file://' + pub.get_public_path() + '/html/search.html?view_key=' + win.view_key);
        win.searchViewObj.webContents.focus()

        // 关闭搜索视图时
        win.searchViewObj.webContents.on('close', () => {
            self.closeSearchView(win);
        })

        // 当按下ESC键时
        win.searchViewObj.webContents.on('before-input-event', (event, input) => {
            if (input.type === 'keyDown' && input.key === 'Escape') {
                self.closeSearchView(win);
            }
        })

        // 当想关闭搜索视图时
        ipcMain.on('close-search-view-' + win.view_key, () => {
            self.closeSearchView(win);
        })

        // 提交搜索内容
        ipcMain.on('search-' + win.view_key, (event, arg) => {
            if (!win.searchViewObj) return
            let searchObj = JSON.parse(arg)
            if (searchObj.value == '') {
                win.webContents.stopFindInPage('clearSelection')
                win.searchViewObj.webContents.send('found-in-page', { requestId: 0, activeMatchOrdinal: 0, matches: 0 })
                return
            }
            win.webContents.findInPage(searchObj.value,{findNext: searchObj.start, forward: searchObj.next})
        })
    }


    searchView(win) {
        let self = this;
        // 当在页面中找到内容时
        win.webContents.on('found-in-page', (event, arg) => {
            if (!win.searchViewObj) return
            // 向搜索视图发送找到的内容
            win.searchViewObj.webContents.send('found-in-page', arg)
        })


        // 失去焦点时隐藏搜索框
        win.webContents.on('blur', () => {
            if (win.searchViewObj) {
                // 当searchViewObj也失去焦点时，关闭搜索框
                if (!win.searchViewObj.webContents.isFocused()) {
                    self.closeSearchView(win);
                }
            }
        });

    }



    /**
     * @name 设置窗口事件
     * @param {BrowserWindow} win 窗口对象
     * @param {String} proxy_id 代理ID
     * @returns {void}
     */
    setEvent(win, proxy_id) {
        // 设置代理
        this.setProxy(win, proxy_id);
        // 注册快捷键
        this.registerShortcut(win);
        // 创建右键菜单
        this.createContextMenu(win, proxy_id);
        // 忽略证书错误
        this.ignoreCertificateErrors(win);
        // 打开链接处理
        this.openLink(win,proxy_id);
        // 文件下载处理
        this.downloadFile(win);
        // 处理HTTP认证
        this.setLogin(win);
        // 搜索视图
        this.searchView(win);
    }
}


WindowService.toString = () => '[class WindowService]';
module.exports = WindowService;
