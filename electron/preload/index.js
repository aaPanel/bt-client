/*************************************************
 ** preload为预加载模块，该文件将会在程序启动时加载 **
 *************************************************/
const Addon = require('ee-core/addon');
const { createServer } = require('../class/socks5.js');
const { pub } = require('../class/public.js');
const Services = require('ee-core/services');
const fs = require('fs');

/**
* 预加载模块入口
*/
module.exports = async () => {

  // 示例功能模块，可选择性使用和修改
  Addon.get('tray').create();
  Addon.get('security').create();
  Addon.get('autoUpdater').create();

  global.SftpItems = {};

  // 启动内置代理服务器
  global.socks = createServer();
  global.socks.start('127.0.0.1',null,()=>{
      let socks5PortPath = pub.get_root_path() + "/run"
      if (!fs.existsSync(socks5PortPath) ) {
          fs.mkdirSync(socks5PortPath);
      }
      fs.writeFileSync(socks5PortPath + "/socks5_port.pl", "" + global.socks.port);
      pub.log(pub.lang('代理服务器已启动: {}:{}',global.socks.address,global.socks.port))
  });

  // 统计
  Services.get('user').total();

  // 免登录
  if(pub.C('not_password') === true){
      global.password_hash = pub.C('password_hash');
      global.socks.syncProxy(); // 同步代理池
      Services.get('user').getPanelOv(); // 同步面板信息

      // 从云端同步面板和SSH信息
      Services.get('user').syncPanelFromCloud();
      Services.get('user').syncSshFromCloud();
  }

}