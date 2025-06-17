'use strict';
const { Client } = require('ssh2')
const { pub } = require("./public.js");
const {SocksClient} = require('socks')
const fs = require('fs');




function Terminal() {
    this.conn = null;
    this.host = null;
    this.port = 22;
    this.username = 'root';
    this.password = null;
    this.private_key = null;
    this.key_password = null;
    this.event = null;
    this.stream = null;
    this.channel = null;
    this.auth_type = 0;
    this.proxy_id = 0;
    this._video_addr = null;
    this.time = 0;
    this.ssh_id = 0;
    this.is_recording = 0;
    this.width = 100;
    this.height = 29;
    this.is_heartbeat = false;
    this.connected = false;
}

Terminal.prototype.connect = function(args, event) {
    let sshConfig = args.data;
    if (sshConfig.host) this.host = sshConfig.host;
    if (sshConfig.port) this.port = sshConfig.port;
    if (sshConfig.username) this.username = sshConfig.username;
    if (sshConfig.password) this.password = sshConfig.password;
    if (sshConfig.auth_type) this.auth_type = sshConfig.auth_type;
    if (sshConfig.private_key) this.private_key = sshConfig.private_key;
    if (sshConfig.privateKey) this.private_key = sshConfig.privateKey;
    if (sshConfig.key_password) this.key_password = sshConfig.key_password;
    if (sshConfig.proxy_id) this.proxy_id = sshConfig.proxy_id;
    if (sshConfig.ssh_id) this.ssh_id = sshConfig.ssh_id;
    if (sshConfig.is_recording) this.is_recording = sshConfig.is_recording;



    if (event) this.event = event;
    if(args.channel) this.channel = args.channel;


    if(!this.channel) throw new Error('Channel is required');
    if(!this.host) throw new Error('Host is required');
    if(!this.password && !this.private_key) throw new Error('Only one of password and privateKey is required');

    this.time = pub.time();

    let video_path  = pub.get_data_path() + "/video";
    if(!fs.existsSync(video_path)){
        fs.mkdirSync(video_path);
    }
        
    this._video_addr = video_path + "/" + this.time + ".json";
    
    // 连接SSH
    // 是否使用代理服务器
    if(this.proxy_id){
        this.connect_proxy();
    }else{
        this.connect_ssh();
    }
}


// def record(self, rtype, data):
// if os.path.exists(public.get_panel_path() + "/data/open_ssh_login.pl") and self._video_addr:
//     path = self._video_addr
//     if rtype == 'header':
//         with open(path, 'w') as fw:
//             fw.write(json.dumps(data) + '\n')
//             return True
//     else:
//         with open(path, 'r') as fr:
//             content = json.loads(fr.read())
//             stdout = content["stdout"]
//         atime = time.time()
//         iodata = [atime - self.time, data]
//         stdout.append(iodata)
//         content["stdout"] = stdout
//         with open(path, 'w') as fw:
//             fw.write(json.dumps(content) + '\n')
//             self.time = atime
//             return True
// return False


/**
 * @name 记录录屏数据
 * @param {string} rtype 数据类型
 * @param {object} data 数据
 * @returns {boolean}
 */
Terminal.prototype.record = function(rtype,data) {
    if(!this.is_recording || !this.ssh_id) return false;
    if(rtype == 'header'){
        pub.write_file(this._video_addr, JSON.stringify(data) + '\n');
        return true;
    }

    if (!fs.existsSync(this._video_addr)){
        return false
    }
    
    // 将输出记录以追加的方式写到新的数据文件
    let video_data_addr = this._video_addr + ".list"
    let atime = pub.time();
    let iodata = [atime - this.time, data];
    this.time = atime;
    fs.appendFile(video_data_addr,JSON.stringify(iodata) + "\n",function(err){
        console.log(err)
    })
    return true;
}

/**
 * @name 记录录屏头部
 * @param {object} data 头部数据
 * @returns {boolean}
 */
Terminal.prototype.record_header = function() {
    if(!this.is_recording || !this.ssh_id) return false;

    let pdata = {
        ssh_id: this.ssh_id,
        ssh_user: this.username,
        start_time: this.time,
        filename: this._video_addr
    }

    pub.M('screen_recording').insert(pdata);

    this.record('header',{
        version: 1,
        width: this.width,
        height: this.height,
        timestamp: parseInt(this.time),
        env: {
            TERM: "xterm",
            SHELL: "/bin/bash",
        },
        stdout: []
    });

}

/**
 * @name 使用代理服务器连接SSH
 * @returns {void}
 */
Terminal.prototype.connect_proxy = function() {
    let that = this;


    let proxy = {
        proxy:{
            host: global.socks.address,
            port: Number(global.socks.port),
            type: 5
        },
        command: 'connect',
        destination: {
            host: this.host,
            port: this.port
        }
    }

    SocksClient.createConnection(proxy, function(err,info) {
        if(err){
            that.event.sender.send(that.channel, pub.echo_color(pub.lang('代理服务器连接失败: {}', err.message), 'error'));
            return;
        }

        let connect_info = {
            sock: info.socket,
            username: that.username
        }

        if(that.auth_type == 0 || !that.private_key){
            connect_info.password = that.password;
        }else{
            connect_info.privateKey = that.private_key;
            if(that.key_password){
                connect_info.passphrase = that.key_password;
            }
        }

        that.start_connect(connect_info);
    });

}


Terminal.prototype.connect_ssh = function() {
    let connect_info = {
        // SSH连接信息
        host: this.host,
        port: this.port,
        username: this.username,
        tryKeyboard: false,
        algorithms: {
            compress: [
                'zlib@openssh.com',
                'zlib',
                'none',
            ],
        },
        // 心跳包
        keepaliveInterval: 20 * 1000,
        keepaliveCountMax: 6,
    }



    if(this.auth_type == 0 || !this.private_key){
        connect_info.password = this.password;
    }else{
        connect_info.privateKey = this.private_key;
        if(this.key_password){
            connect_info.passphrase = this.key_password;
        }
    }

    this.start_connect(connect_info);
}


// 开始连接
Terminal.prototype.start_connect = function(connect_info){
    // 实例化SSH连接
    this.conn = new Client();
    // 连接SSH
    let that = this;
    let debugMsgList = {
        "Local ident": "本地标识",
        "Custom crypto binding not available": "自定义加密绑定不可用",
        "Client": "客户端",
        "Remote ident": "远程标识",
        "Inbound: Handshake in progress": "入站: 握手进行中",
        "Handshake:": "握手",
        "(local)": "(本地)",
        "(remote)": "(远程)",
        "Received DH Reply": "接收到DH回复",
        "Host accepted by default": "默认信任主机",
        "Host accepted": "已信任主机",
        "Inbound:": "入站:",
        "Verifying signature": "正在验证签名",
        "Verified signature": "已验证签名",
        "Handshake completed": "握手完成",
        "Received EXT_INFO": "接收到: EXT_INFO",
        "Received SERVICE_ACCEPT": "接收到: SERVICE_ACCEPT",
        "Received USERAUTH_FAILURE": "支持的用户验证方式: ",
        "none auth failed": "服务端不支持匿名登录",
        "password auth failed": "密码验证失败",
        "(no verification)": "(无验证)",
        "(verified)": "(已验证)",
        ") C->S compression:" : ") C->S 支持的压缩算法:",
        ") S->C compression:" : ") S->C 支持的压缩算法:",
        "compression: none" : "选中的压缩算法: 无",
        "compression: zlib": "选中的压缩算法: zlib",
        "KEX method:": "支持的KEX方法:",
        "Host key format:": "支持的密钥格式:",
        "cipher:": "支持的加密算法:",
        "Cipher:":"选中的加密算法:",
        "<implicit>": "<隐式>",
        "S->C": "[服务端->客户端]",
        "C->S": "[客户端->服务端]",

    };
    this.connected = false;
    this.language = pub.get_language();
    connect_info.debug = function(msg){
        if(that.connected) return;
        // if(msg.indexOf("Sending") > -1) return;
        // if(msg.indexOf("CHANNEL_DATA") > -1) return;
        // if(msg.indexOf("Received") > -1) return;
        // if(msg.indexOf("CHANNEL") > -1) return;
        if(msg.indexOf("CHANNEL_SUCCESS (r:0)") > -1){
            that.connected = true;
        }
        
        if(that.language == 'zh'){
            for (let key in debugMsgList){
                if(msg.indexOf(key) > -1){
                    msg = msg.replace(key,debugMsgList[key]);
                }
            }
        }

        that.event.sender.send(that.channel, pub.echo_color(msg), 'info');

    }
    this.conn.on('ready', () => {
        // 创建一个shell
        that.conn.shell({ term: 'xterm-256color' },(err, stream) => {

            // 连接失败
            if (err) {
                that.event.sender.send(that.channel, pub.echo_color(err.message, 'error'));
                // return this.disconnect();
                // console.log('connect_error:',err)
                throw err;
            }
            that.record_header();
            stream.on('close', () => {
                // 关闭连接
                that.event.sender.send(that.channel, pub.echo_color(pub.lang('SSH连接已关闭,按回车尝试重新连接'), 'info'));
                return that.disconnect();

            }).on('data', (data) => {
                // 终端数据输出
                that.event.sender.send(that.channel, data);
                that.record('iodata',data.toString('utf8'));
            });
            
            // 保存stream
            that.stream = stream;
            
            // 发送心跳包
            if (!that.is_heartbeat) that.heartbeat();
        });
    
    // }).on("close",()=>{
    //     console.log("connect closed")
    // }).on("end",()=>{
    //     console.log("connect end")
    // }).on('change password',(prompt,done) =>{
    //     console.log('change password',prompt,"done:",done);
    // }).on('banner',(message,language) => {
    //     consone.log("banner:",message,"language:",language)
    // }).on("handshake",(netotiated)=>{
    //     console.log("handshake",netotiated);
    // }).on('hostkeys',(keys)=>{
    //     console.log("hostkeys",keys);
    // }).on('keyboard-interactive',(name,instructions,instructionsLang,prompts,finish)=>{
    //     console.log('keyboard-interactive',"name",name,"instructions",instructions,"instructionsLang",instructionsLang,"prompts",prompts,"finish",finish);
    // }).on('rekey',()=>{
    //     console.log("rekey")
    // }).on("tcp connection",(details,accept,reject)=>{
    //     console.log("tcp connection","details",details,"accept",accept,"reject",reject)
    }).on('error', (err) => {
        // 错误
        // console.log('Client :: error :: ' + err,"level:",err.level);
        
        if(err.level == 'client-authentication'){
            // 密码错误
            that.event.sender.send(that.channel, pub.echo_color(pub.lang('认证失败，SSH帐号或密码错误: {}', err.message), 'error'));
        }else if(err.level == 'client-socket'){
            // 连接失败
            that.event.sender.send(that.channel, pub.echo_color(pub.lang('连接失败: {}', err.message), 'error'));
        }else if(err.level == 'client-timeout'){
            // 连接超时
            that.event.sender.send(that.channel, pub.echo_color(pub.lang('连接超时: {}', err.message), 'error'));
        }else if(err.level == 'client-ssh'){
            // SSH连接失败
            that.event.sender.send(that.channel, pub.echo_color(pub.lang('SSH连接失败: {}', err.message), 'error'));
        }else{
            that.event.sender.send(that.channel, pub.echo_color(err.message, 'error'));
        }
        if(err.level == 'client-socket') that.disconnect();
    }).connect(connect_info);
}

// 发送心跳包
Terminal.prototype.heartbeat = function() {
    let self = this;
    if(!self.stream || !self.conn) return;
    // setTimeout(() => {
    //     if(!self.stream || !self.conn) return;
    //     // 发送心跳包
    //     // self.stream.setWindow(self.height, self.width);
    //     // self.stream.write("");
        
    // }, 60*1000);
}

Terminal.prototype.write = function(data) {
    if(!this.stream){
        this.event.sender.send(this.channel, pub.echo_color(pub.lang('检测到SSH连接已断开，正在重新连接...'),'info'));
        this.connect_ssh();
    }else{
        this.stream.write(data);
    }
}

Terminal.prototype.disconnect = function() {
    // if(this.stream) {
    //     this.stream.exit(0);
    //     this.stream.end();
    // }
    if(this.conn) this.conn.end();
    this.conn = null;
    this.stream = null;
}

module.exports = { Terminal };