const { Application } = require('ee-core');
const { ContextMenu } = require('./class/menu.js');
const { pub } = require('./class/public.js');
const Electron = require('ee-core/electron');


class Index extends Application {

  constructor() {
    super();

  }


  /**
   * core app have been loaded
   */
  async ready() {
    // do some things
  }

  /**
   * electron app ready
   */
  async electronAppReady() {
    // do some things
  }

  /**
   * main window have been loaded
   */
  async windowReady() {
    // do some things
    // 延迟加载，无白屏
    const winOpt = this.config.windowsOption;
    const win = this.electron.mainWindow;
    // 设置窗口大小和位置
    let window = pub.C('window');
    if (window && window.size) {
      win.setSize(window.size[0], window.size[1]);
    }
    if (window && window.position) {
      win.setPosition(window.position[0], window.position[1]);
    }

    if (winOpt.show == false) {
      // 显示窗口
      win.once('ready-to-show', () => {
        win.show();
        win.focus();
      })
    }

    // 加载菜单
    win.webContents.on("context-menu", (event, params) => {
			let menu_obj = new ContextMenu(event, params);
			let contextMenu = menu_obj.get_context_menu();
			// 监听右键菜单关闭-清理相关状态
			contextMenu.on('menu-will-close', () => {
					global.tab_params = {
							type: 'default'
					};
			});
      if (contextMenu) contextMenu.popup({ window: win });
    });

    // 使用系统浏览器打开链接
    win.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      // 如果是about:blank#blocked 则不打开
      if (url == 'about:blank#blocked' || url == 'about:blank') return;

      require('electron').shell.openExternal(url);
    });


    // 当视图窗口大小改变时
    Electron.mainWindow.on('resize', () => {
      setTimeout(() => {
        for(let view_key in global.PanelViews){
            if(global.PanelViews[view_key].searchViewObj){
                global.PanelViews[view_key].searchViewObj.setBounds({ x: global.PanelViews[view_key].getBounds().width - 450, y: 40, width: 400, height: 70 })
            }
        }
      },10);
    });

    // 注册快捷键
    win.webContents.on('before-input-event', (event, input) => {
      // // F5 刷新
      // if (input.type === 'keyDown' && input.key === 'F5') {
      //   event.sender.reload();
      // }

      // // Ctrl + R 刷新
      // if (input.type === 'keyDown' && input.control && (input.key === 'r' || input.key === 'R')) {
      //   event.sender.reload();
      // }

      // // Ctrl + F5 强制刷新
      // if (input.type === 'keyDown' && input.control && input.key === 'F5') {
      //   event.sender.reloadIgnoringCache();
      // }

      // // Ctrl + Shift + R 强制刷新
      // if (input.type === 'keyDown' && input.control && input.shift && (input.key === 'R' || input.key === 'r')) {
      //   event.sender.reloadIgnoringCache();
      // }

      // Ctrl + Shift + C 复制
      if (input.type === 'keyUp' && input.control && input.shift && (input.key === 'C' || input.key === 'c')) {
        event.sender.copy();
      }

      // F11 切换全屏
      if (input.type === 'keyDown' && input.key === 'F11') {
        win.webContents.executeJavaScript('if(!document.fullscreenElement){document.documentElement.requestFullscreen();}else{if (document.exitFullscreen){document.exitFullscreen();}}', true);
      }

      // Ctrl + 1 切换到第一个标签
      
      if (input.type === 'keyDown' && input.control && (input.key in ['1', '2', '3', '4', '5', '6', '7', '8', '9','T'] || input.key === 'Tab')) {
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
   * before app close
   */
  async beforeClose() {
    // do some things
    // 记忆当前窗口大小和位置
    let win = this.electron.mainWindow;
    if (!win.isMaximized()) {
      // 只记忆非全屏状态
      let size = win.getSize();
      let position = win.getPosition();
      pub.C('window', { size: size, position: position });
    }
  }
}

Index.toString = () => '[class Index]';
module.exports = Index;