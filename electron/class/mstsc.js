const rdp = require("./rdp/rdp.js")
const { pub } = require('./public.js')
const Electron = require('ee-core/electron');


class Mstsc{
    // address: 要连接的地址（默认为空字符串''）
    // username: 用于连接的用户名（默认为空字符串''）
    // password: 用于连接的密码（默认为空字符串''）
    // deleteCredentialsAfter: 断开连接后删除凭据和临时文件（默认为true）
    // safeMode: 启用处理连接的“安全模式”（请参阅注意事项）（默认为false）
    // autoReconnect: 在错误断开连接后自动重新连接（默认为true）
    // fullscreen: 作为全屏应用程序启动（默认为true）
    // colors: 位颜色深度（默认为32）
    // compression: 确定是否必须压缩连接（默认为true）
    // connectionType: 连接类型，可以是“调制解调器”，“低”，“卫星”，“高”，“广域网”，“局域网”，“自动”中的一个（默认为“自动”）
    // networkAutoDetect: 根据检测到的网络类型自动设置一些连接参数（默认为true）
    // bandwidthAutoDetect: 根据检测到的带宽类型自动设置一些连接参数（默认为true）
    // showWallpaper: 在远程计算机上显示墙纸（默认为false）
    // fontSmoothing: 启用字体平滑（默认为false）
    // desktopComposition: 启用桌面组合，对Aero有用（默认为false）
    // showDraggedWindow: 在拖动时显示完整窗口内容（默认为false）
    // showMenuAnimations: 显示菜单动画（默认为false）
    // showThemes: 显示主题（默认为true）
    // showBlinkingCursor: 在输入控件上显示闪烁的光标（默认为true）
    // audioPlayMode: 确定播放哪个音频流，可以是“本地”，“远程”，“无”中的一个（默认为“本地”）
    // audioCaptureMode: 在本地计算机上启用音频捕获（默认为false）
    // enableLocalPrinters: 在远程计算机上启用本地打印机（默认为true）
    // enableLocalCOMPorts: 在远程计算机上启用本地COM端口（默认为false）
    // enableSmartCards: 在远程计算机上启用本地智能卡（默认为true）
    // enableClipboard: 在本地和远程计算机之间启用剪贴板共享（默认为true）
    // enablePlugAndPlayDevices: 根据指定的HID或通配符*（默认为空字符串''）确定Plug And Play设备的子集（用分号;分隔）
    // enableDrives: 根据标签或通配符*（默认为空字符串''）确定用于远程计算机的本地驱动器的子集（用分号;分隔）
    // enablePos: 在远程计算机上启用本地POS（默认为false）
    // launch: 连接时启动的应用程序（默认为空字符串''）
    // launchWorkingDirectory: 连接时启动的应用程序的工作目录（默认为空字符串''）
    // smartSizing: 确定本地设备是否缩放远程会话的内容以适应窗口大小（默认为true）
    // dynamicResolution: 确定调整本地窗口大小时是否自动更新远程会话的解析(默认为true)
    // width: 桌面宽度（默认为1024）
    // height: 桌面高度（默认为768）
    // winposstr: 窗口位置（默认为'0,1,0,0,8192,8192'）

    async connect(server_config,callback){
        // 基础配置
        let mstsc_config = {
            address:`${server_config.host}:${server_config.port}`,
            username:server_config.username,
            password:server_config.password
        }

        // 如果mstsc_options是字符串，转换为对象
        if(typeof server_config.mstsc_options == 'string'){
            server_config.mstsc_options = JSON.parse(server_config.mstsc_options)
        }

        // 合并配置
        if(server_config.mstsc_options){
            mstsc_config = Object.assign(mstsc_config,server_config.mstsc_options)
        }

        if(!mstsc_config.fullscreen){
            mstsc_config.fullscreen = false
            let bounds = Electron.mainWindow.getBounds()
            // 如果没有设置宽高，使用主窗口的宽高
            if(!mstsc_config.width || !mstsc_config.height){
                mstsc_config.width = bounds.width
                mstsc_config.height = bounds.height
            }

            // 设置窗口位置
            mstsc_config.winposstr = `0,1,${bounds.x},${bounds.y},8192,8192`
        }

        // 磁盘共享
        if(mstsc_config.enableDrives){
            mstsc_config.enableDrives = "*"
        }

        // 连接
        rdp(mstsc_config).then(function(){
            pub.log('connected')
            return callback('connected')
        })
    }
}

module.exports = Mstsc