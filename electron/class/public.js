const CryptoJS = require('crypto-js');
const { Sqlite } = require('./sqlite.js')
const { Page } = require('./page.js')
const request = require('request');
const fs = require('fs');
const Ps = require('ee-core/ps');
const path = require('path');
const net = require('net');
const { SocksProxyAgent } = require("socks-proxy-agent");
const NodeCache = require('node-cache');
const Cache = new NodeCache({ stdTTL: 360, checkperiod: 7200 });


class Public {

    /**
     * @name 创建数据库操作对象
     * @param {string} table 表名
     * @returns {Sqlite} 数据库操作对象
     * @example M('user').where('id',[1]).find()
     */
    M(table){
        const sqlite = new Sqlite();
        return sqlite.table(table);
    }

    /**
     * @name 读取或设置配置项
     * @param {string} key 配置项 [必填]
     * @param {string} value 配置值 [选填] 如果没有值则为读取配置项
     * @returns {any}
     * @example C('test','123')
     */
    C(key,value){
        if(!key) return;
        if(value === undefined) return this.config_get(key);

        let config_file = path.resolve(this.get_data_path() , 'config.json');
        let config = {};
        if(fs.existsSync(config_file)){
            config = JSON.parse(this.read_file(config_file));
        }
        config[key] = value;
        this.write_file(config_file,JSON.stringify(config));
    }

    /**
     * @name 获取应用版本
     * @returns {string}
     */
    getVersion(){
        return require('electron').app.getVersion()
    }


    /**
     * @name 获取配置项
     * @param {string} key 配置项
     * @returns {any}
     */
    config_get(key){
        let config_file = path.resolve(this.get_data_path() , 'config.json');
        if(!fs.existsSync(config_file)) {
            let default_config = {"max_common_use":10}
            this.write_file(config_file,JSON.stringify(default_config));
        }
        let config = JSON.parse(this.read_file(config_file));
        if(key === undefined) return config;
        return config[key];
    }

    /**
     * @name 设置配置项
     * @param {string} key 
     * @param {any} value 
     */
    config_set(key,value){
        return this.C(key,value);
    }

    /**
     * @name 发送POST请求
     * @param {string} url 请求地址
     * @param {object} data 请求数据
     * @param {function} callback(response,error) 回调函数
     * @param {number} timeout 超时时间(毫秒)
     * @returns {void}
     * @example http_post('http://bt.cn/api/test',{name:'test'},3000,function(response,error){})
     */
    http_post(url,data,callback,timeout){
        if(!timeout){
            timeout = 60 * 1000;
        }
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':'BT-Panel/PcClient 1.0'
        }
        request.post(url,{
            jsonReviver: true,
            headers: headers,
            form: data,
            timeout: timeout,
            // 忽略证书验证
            rejectUnauthorized: false
        }, function (error, response, body) {
            if(callback) callback(response,error);
        });
    }

    HttpPost(url,data,callback,timeout){
        return this.http_post(url,data,callback,timeout);
    }
    
    post(url,data,callback,timeout){
        return this.http_post(url,data,callback,timeout);
    }

    httpPost(url,data,callback,timeout){
        return this.http_post(url,data,callback,timeout);
    }


    /**
     * @name 发送GET请求
     * @param {string} url 请求地址
     * @param {function} callback(response,error) 回调函数
     * @param {number} timeout 超时时间(毫秒)
     * @returns {void}
     * @example http_get('http://bt.cn/api/test',3000,function(response,error){})
     */
    http_get(url,callback,timeout){
        if(!timeout){
            timeout = 60 * 1000;
        }
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':'BT-Panel/PcClient 1.0'
        }
        request.get(url,{
            headers: headers,
            timeout: timeout,
            jsonReviver: true,
            // 忽略证书验证
            rejectUnauthorized: false
        }, function (error, response, body) {
            if(callback) callback(response,error);
        });
    }

    HttpGet(url,callback,timeout){
        return this.http_get(url,callback,timeout);
    }

    get(url,callback,timeout){
        return this.http_get(url,callback,timeout);   
    }

    httpGet(url,callback,timeout){
        return this.http_get(url,callback,timeout);
    }

    /**
     * @name 通过代理发送POST请求
     * @param {string} url 请求地址
     * @param {object} data 请求数据
     * @param {number} proxy_id 代理ID
     * @param {function} callback(response,error) 回调函数
     * @param {number} timeout 超时时间(毫秒)
     * @returns {void}
     */
    httpPostProxy(url,data,proxy_id,callback,timeout){
        if(!timeout){
            timeout = 60 * 1000;
        }
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':'BT-Panel/PcClient 1.0'
        }

        let options = {
            headers: headers,
            form: data,
            timeout: timeout,
            jsonReviver: true,
            // 忽略证书验证
            rejectUnauthorized: false
        }

        let proxy_info = this.M('proxy_info').where('proxy_id=?',proxy_id).find()

        if(proxy_info){
            // 如果是HTTP代理
            if(proxy_info.proxy_type in [0,1]){
                let proxy = ''
                let protocol = proxy_info.proxy_type == 0 ? 'http' : 'https';
                if(proxy_info.proxy_username && proxy_info.proxy_password) {
                    proxy = `${protocol}://${proxy_info.proxy_username}:${proxy_info.proxy_password}@${proxy_info.proxy_ip}:${proxy_info.proxy_port}`
                }else{
                    proxy = `${protocol}://${proxy_info.proxy_ip}:${proxy_info.proxy_port}`
                }
                options.proxy = proxy;
            }else{
                // 如果是SOCKS5代理
                let proxy_url = `socks5://${global.socks.address}:${global.socks.port}`;
                let proxyAgent = new SocksProxyAgent(proxy_url);
                options.agent = proxyAgent;
            }
        }

        // 发送请求
        request.post(url,options, function (error, response, body) {
            if(callback) callback(response,error);
        });
    }

    /**
     * @name 通过代理发送GET请求
     * @param {string} url 请求地址
     * @param {number} proxy_id 代理ID
     * @param {function} callback(response,error) 回调函数
     * @param {number} timeout 超时时间(毫秒)
     * @returns {void}
     */
    httpGetProxy(url,proxy_id,callback,timeout){
        if(!timeout){
            timeout = 60 * 1000;
        }
        let headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent':'BT-Panel/PcClient 1.0'
        }

        let options = {
            headers: headers,
            timeout: timeout,
            jsonReviver: true,
            // 忽略证书验证
            rejectUnauthorized: false
        }

        let proxy_info = this.M('proxy_info').where('proxy_id=?',proxy_id).find()

        if(proxy_info){
            // 如果是HTTP代理
            if(proxy_info.proxy_type in [0,1]){
                let proxy = ''
                let protocol = proxy_info.proxy_type == 0 ? 'http' : 'https';
                if(proxy_info.proxy_username && proxy_info.proxy_password) {
                    proxy = `${protocol}://${proxy_info.proxy_username}:${proxy_info.proxy_password}@${proxy_info.proxy_ip}:${proxy_info.proxy_port}`
                }else{
                    proxy = `${protocol}://${proxy_info.proxy_ip}:${proxy_info.proxy_port}`
                }
                options.proxy = proxy;
            }else{
                // 如果是SOCKS5代理
                let proxy_url = `socks5://${global.socks.address}:${global.socks.port}`;
                let proxyAgent = new SocksProxyAgent(proxy_url);
                options.agent = proxyAgent;
            }
        }

        // 发送请求
        request.get(url,options, function (error, response, body) {
            if(callback) callback(response,error);
        });
    }


    /**
     * @name md5加密
     * @param {str} 要加密的字符串
     * @returns {string} 加密后的字符串 
     */
    md5(str){
        return CryptoJS.MD5(str).toString();
    }

    /**
     * @name sha256加密
     * @param {str} 要加密的字符串
     * @returns {string} 加密后的字符串 
     */
    sha256(str){
        return CryptoJS.SHA256(str).toString();
    }

    /**
     * @name 获取本机MAC地址
     * @returns {string} MAC地址
     * @example get_mac()
     */
    get_mac(){
        var os = require('os');
        var interfaces = os.networkInterfaces();
        let other_mac = '';
        let mac = '';
        let is_break = false;
        // 遍历网络接口
        for (var devName in interfaces) {
            var iface = interfaces[devName];
            // 遍历接口信息
            for (var i = 0; i < iface.length; i++) {
                var alias = iface[i];
                other_mac = alias.mac;

                // 如果是IPv4地址，且不是内部地址，则获取MAC地址
                if (alias.family === 'IPv4' && alias.internal === false) {
                    mac = alias.mac;
                    is_break = true;
                    break;
                }
            }
            if(is_break) break;
        }
        // 如果未获取到出口MAC地址，则使用其它MAC地址
        if(!mac) mac = other_mac;
        return mac;
    }

    /**
     * @name 获取本机IP地址
     * @returns {string} IP地址
     * @example get_ip()
     */
    get_ip(){
        var os = require('os');
        var interfaces = os.networkInterfaces();
        let ip = '';
        let is_break = false;
        // 遍历网络接口
        for (var devName in interfaces) {
            var iface = interfaces[devName];
            // 遍历接口信息
            for (var i = 0; i < iface.length; i++) {
                var alias = iface[i];
                // 如果是IPv4地址，且不是内部地址，则获取IP地址
                if (alias.family === 'IPv4' && alias.internal === false) {
                    ip = alias.address;
                    is_break = true;
                    break;
                }
            }
            if(is_break) break;
        }
        return ip;
    }

    /**
     * @name 获取根目录
     * @returns {string} 根目录
     * @example get_root_path()
     */
    get_root_path(){
        return Ps.getRootDir()
    }
    
    /**
     * @name 获取数据目录
     * @returns {string} 数据目录
     */
    get_data_path(){
        // 获取用户数据目录
        let data_path = path.resolve(this.get_root_path(),'data');

        // 如果不存在则创建
        if (!fs.existsSync(data_path)) {
            fs.mkdirSync(data_path);
        }
        return data_path;
    }

    /**
     * @name 获取public目录
     * @returns {string} public目录
     * @example get_public_path()
     */
    get_public_path(){
        return Ps.getPublicDir()
    }

   
    /**
     * @name 获取语言包目录
     * @returns {string} 语言包目录
     */
    get_language_path(){
        return path.resolve(Ps.getExtraResourcesDir() , 'languages');
    }

    /**
     * @name 判断是否为文件
     * @param {string} path 文件路径
     * @returns {bool} 是否为文件
     * @example is_file('/www/wwwroot/index.html')
     */
    is_file(path){
        return fs.existsSync(path) && fs.statSync(path).isFile();
    }




    /**
     * @name 读取文件
     * @param {path} 文件路径
     * @param {mode} 读取模式 r+ w+ a+
     * @returns {string} 文件内容
     */
    read_file(path,flag){
        if(!flag) flag = 'r';
        return fs.readFileSync(path,{flag:flag});
    }

    /**
     * @name 写入文件
     * @param {path} 文件路径
     * @param {data} 写入数据
     * @param {flag} 写入模式 r+ w+ a+
     */
    write_file(path,data,flag){
        if(!flag) flag = 'w';
        fs.writeFileSync(path,data,{flag:flag});
    }


    /**
     * @name 获取当前时间戳
     * @returns {int} 时间戳
     */
    time(){
        return Math.round(new Date().getTime() / 1000);
    }

    /**
     * @name 获取当前日期
     * @returns {string} 日期
     * @example get_date()
     */
    get_date(){
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
        return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }

    /**
     * @name 返回消息
     * @param {bool} status 
     * @param {string} msg 
     * @returns {object}
     */
    return_msg(status,msg){
        return {
            status: status,
            msg: msg
        }
    }


    /**
     * @name 返回成功消息
     * @param {string} msg
     * @returns {object}
     */
    success(msg){
        return this.return_msg(true,msg);
    }

    /**
     * @name 返回失败消息
     * @param {string} msg
     * @returns {object}
     */
    error(msg){
        return this.return_msg(false,msg);
    }

    /**
     * @name 返回数据
     * @param {bool} status
     * @param {string} msg
     * @param {*} data
     * @returns {object}
     */
    return_data(status,msg,data){
        return {
            status: status,
            msg: msg,
            data: data
        }
    }

    /**
     * @name 返回成功数据
     * @param {object} data
     * @returns {object}
     */
    success_data(data){
        return this.return_data(true,this.lang('操作成功'),data);
    }

    /**
     * @name 返回失败数据
     * @param {string} msg
     * @returns {object} 
     */
    error_data(msg){
        return this.return_data(false,msg,null);
    }

    /**
     * @name 写入日志到数据库
     * @param {number} log_type  日志类型 0.面板日志 1.终端日志 2.其它日志
     * @param {string} log_content 日志内容
     * @param {number} log_state 日志状态 0.正常 1.异常
     * @return {void}
     */
    write_log(log_type,log_content,log_state){
        if (!log_state){
            log_state = 0;
        }
        let log = {
            log_state: log_state,
            log_type: log_type,
            log_content: log_content,
            log_time: this.time()
        }
        this.M('logs').insert(log);
    }

    /**
     * @name 格式化终端输出颜色
     * @param {string} str
     * @param {string} color 
     * @returns {string}
     */
    echo_color(str,color){
        let color_map = {
            'black': '30',
            'red': '31',
            'green': '32',
            'yellow': '33',
            'blue': '34',
            'purple': '35',
            'cyan': '36',
            'white': '37',
            'error': '31',
            'info': '36',
            'success': '32',
            'warning': '33',
            'debug': '34',
        }
        if (!color_map[color]){
            color = 'white';
        }

        let date_str = new Date().toLocaleString();
        // 毫秒级时间
        let ms = new Date().getMilliseconds();
        if (ms < 10) ms = '00' + ms;
        if (ms < 100) ms = '0' + ms;
        date_str += ',' + ms;

        return `\x1b[${color_map[color]}m[${date_str}] - ${str}\x1b[0m\r\n`;
    }


    /**
     * @name 删首尾空格
     * @param {string} str 字符串
     * @returns {string} 返回结果
     */
    trim(str) {
        if (!str) return str;
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }

    /**
     * @name 删首尾指定字符
     * @param {string} str 字符串
     * @param {string} char 指定字符
     * @returns {string} 返回结果
     */
    trim_char(str, char) {
        if (!str) return str;
        return str.replace(new RegExp(`(^${char}*)|(${char}*$)`, 'g'), "");
    }

    /**
     * @name 获取分页
     * @param {number} count 总数
     * @param {number} page 当前页 默认1
     * @param {number} row 每页数量 默认10
     * @param {string} callback 回调函数名称 默认''
     * @returns {object}
     */
    page(count,page,row,callback){
        let p = new Page();
        return p.page(count,row,page,callback);
    }

    /**
     * @name 通过IPC返回数据给前端
     * @param {object} event    事件对象
     * @param {string} channel  通道
     * @param {object} data    数据
     * @returns {void}
     */
    send(event,channel,data){
        if (event.sender) event.sender.send(channel,data);
    }

    /**
     * @name 通过IPC返回成功数据给前端
     * @param {object} event    事件对象
     * @param {string} channel  通道
     * @param {object} data    数据
     */
    send_success(event,channel,data){
        return this.send(event,channel,this.success_data(data));
    }

    /**
     * @name 通过IPC返回失败数据给前端
     * @param {object} event    事件对象
     * @param {string} channel  通道
     * @param {object} data    数据
     */
    send_error(event,channel,data){
        return this.send(event,channel,this.error_data(data));
    }

    /**
     * @name 通过IPC返回成功消息给前端
     * @param {object} event    事件对象
     * @param {string} channel  通道
     * @param {string} msg    消息
     */
    send_success_msg(event,channel,msg){
        return this.send(event,channel,this.success(msg));
    }

    /**
     * @name 通过IPC返回失败消息给前端
     * @param {object} event    事件对象
     * @param {string} channel  通道
     * @param {string} msg    消息
     */
    send_error_msg(event,channel,msg){
        return this.send(event,channel,this.error(msg));
    }

    /**
     * @name 返回数据
     * @param {bool} status 状态
     * @param {string} msg 消息内容
     * @param {object} data 数据
     * @returns {object}
     */
    returnData(status,msg,data){
        return {
            status: status,
            msg: msg,
            data: data
        }
    }

    /**
     * @name 返回成功数据
     * @param {object} data 数据
     * @returns {object}
     */
    returnDataSuccess(data){
        return this.returnData(true,this.lang('操作成功'),data);
    }

    /**
     * @name 返回失败数据
     * @param {string} msg 失败原因
     * @returns {object}
     */
    returnDataError(msg){
        return this.returnData(false,msg,{});
    }

    /**
     * @name 返回消息
     * @param {bool} status 状态
     * @param {string} msg 消息内容
     * @returns {object}
     */
    returnMsg(status,msg){
        return {
            status: status,
            msg: msg
        }
    }

    /**
     * @name 返回失败消息 
     * @param {string} msg 消息内容 
     * @returns {object}
     */
    returnError(msg){
        return this.returnMsg(false,msg);
    }

    /**
     * @name 返回成功消息
     * @param {string} msg 消息内容
     * @returns {object}
     */
    returnSuccess(msg){
        return this.returnMsg(true,msg);
    }


    /**
     * @name AES-128-CBC加密 ZeroPadding
     * @param {string} data 数据
     * @param {string} key 密钥
     * @param {string} iv 偏移量
     * @returns {string} 加密后的数据Base64
     */
    aes_encrypt(data,key,iv){
        if(!data) return 
        if(key.length!=16 || iv.length!=16) return

        let sKey = CryptoJS.enc.Utf8.parse(key);
        let sIv = CryptoJS.enc.Utf8.parse(iv);
        let sContent = CryptoJS.enc.Utf8.parse(data);

        // 加密
        let encrypted = CryptoJS.AES.encrypt(sContent, sKey, {
            iv: sIv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });
        return encrypted.toString();
        
    }

    /**
     * @name AES-128-CBC解密 ZeroPadding
     * @param {string} data 加密后的数据Base64
     * @param {string} key 密钥
     * @param {string} iv 偏移量
     * @returns {string} 解密后的数据
     */
    aes_decrypt(data,key,iv){
        if(!data) return
        if(key.length!=16 || iv.length!=16) return
        
        let sKey = CryptoJS.enc.Utf8.parse(key);
        let sIv = CryptoJS.enc.Utf8.parse(iv);
        let decrypt = CryptoJS.AES.decrypt(data, sKey, {
            iv: sIv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });
        return CryptoJS.enc.Utf8.stringify(decrypt).toString();
    }

    /**
     * @name AES-128-ECB加密 ZeroPadding
     * @param {string} data 数据
     * @param {string} key 密钥
     * @returns {string} 加密后的数据Base64
     * @example aes_encrypt_ecb('123456','1234567890123456')
     */
    aes_encrypt_ecb(data,key){
        if(!data) return
        if(key.length!=16) return

        let sKey = CryptoJS.enc.Utf8.parse(key);
        let sContent = CryptoJS.enc.Utf8.parse(data);

        // 加密
        let encrypted = CryptoJS.AES.encrypt(sContent, sKey, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.ZeroPadding
        });
        return encrypted.toString();
    }

    /**
     * @name AES-128-ECB解密 ZeroPadding
     * @param {string} data 加密后的数据Base64
     * @param {string} key 密钥
     * @returns {string} 解密后的数据
     * @example aes_decrypt_ecb(data,'1234567890123456')
     */
    aes_decrypt_ecb(data,key){
        if(!data) return
        if(key.length!=16) return

        let sKey = CryptoJS.enc.Utf8.parse(key);
        let decrypt = CryptoJS.AES.decrypt(data, sKey, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.ZeroPadding
        });
        return CryptoJS.enc.Utf8.stringify(decrypt).toString();
	}
	/**
	 * @name 生成apitoken
	 */
		api_encrypt() {
			const token =this.random_string(32);
			const key = this.md5(token);
			return{
					token: key,
					token_crypt: token
			};
		}


    get_aes_key(){
        let src_key = "xwVZc1tz5RnRpQrU55wyMzRpgi4Qmf1G"
        let key = ""
        let iv = ""
        for(var i=0;i<src_key.length;i++){
            if (i%2){
                key += src_key[i]
            }else{
                iv += src_key[i]
            }
        }

        let result = {
            key:key,
            iv:iv
        }
        return result;
    }

    aes_default_encrypt(data){
        let keyIv = this.get_aes_key()
        return this.aes_encrypt(data,keyIv.key,keyIv.iv)
    }

    aes_default_decrypt(data){
        let keyIv = this.get_aes_key()
        return this.aes_decrypt(data,keyIv.key,keyIv.iv)
    }

    /**
     * @name 获取随机字符串
     * @param {number} len 长度
     * @returns {string} 随机字符串
     */
    random_string(len){
        let str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += str.charAt(Math.floor(Math.random() * str.length));
        }
        return result;
    }

    /**
     * @name 获取随机数字
     * @param {number} len 长度
     * @returns {string} 随机数字
     */
    random_number(len){
        let str = '0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += str.charAt(Math.floor(Math.random() * str.length));
        }
        return result;
    }

    /**
     * @name 获取随机字符串和数字
     * @param {number} len 长度
     * @returns {string} 随机字符串和数字
     */
    random_string_number(len){
        let str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < len; i++) {
            result += str.charAt(Math.floor(Math.random() * str.length));
        }
        return result;
    }

    /**
     * @name 获取操作系统 如：Windows10 19045.4651
     * @returns {string} 操作系统
     */
    get_os(){
        let os = require('os');
        let platform = os.platform();
        let release = os.release();
        if(platform == 'win32'){
            platform = 'Windows';
        }else if(platform == 'linux'){
            platform = 'Linux';
        }else if(platform == 'darwin'){
            platform = 'Mac';
        }
        return platform + ' ' + release + ' ' + os.arch();
    }

    /**
     * @name base64编码
     * @param {string} str
     * @returns {string}
     */
    base64_encode(str){
        return Buffer.from(str).toString('base64');
    }

    /**
     * @name base64解码
     * @param {string} str
     * @returns {string}
     */
    base64_decode(str){
        return Buffer.from(str, 'base64').toString();
    }


    /**
     * @name 解析Token
     * @param {string} app_token - Token
     * @returns {object}
     * @returns {boolean}
     */
    parse_token(app_token) {
        let token_str = this.base64_decode(app_token);
        let split_token = token_str.split('|');
        if(split_token.length != 4) return false;

        let result = {
        url: split_token[0],
        request_token: split_token[1],
        app_token: split_token[3],
        app_key: split_token[2]
        }
        let url_arr = result.url.split(':');
        if(url_arr.length > 3){
            result.url = url_arr[0] + ':' + url_arr[1] + ':' + url_arr[2];
        }
        return result;
    }

    /**
     * @name 获取当前语言
     * @returns {string}
     * @example get_language()
     */
    get_language(){
        let lang = this.cache_get('language');
        if(lang) return lang;
        lang =  this.C('language');
        if(!lang){
            // 获取系统语言
            try{
                let lang_full = Intl.DateTimeFormat().resolvedOptions().locale;
                lang = lang_full.split('-')[0];
            }catch(e){
                lang = 'en';
            }
        }

        // 缓存
        this.cache_set('language',lang,3600);

        return lang;
    }

    /**
     * @name 获取当前语言和支持的语言列表
     * @returns {Object} 返回结果
     */
    get_languages() {
        // 判断缓存
        let data = this.cache_get('languages');
        if(data) return data;

        let filename = path.resolve(this.get_language_path(), 'settings.json');
        let body = this.read_file(filename)
        if(!body){
            body = `{
                "name": "zh",
                "google": "zh-cn",
                "title": "简体中文",
                "cn": "简体中文"
            },
            {
                "name": "en",
                "google": "en",
                "title": "English",
                "cn": "英语"
            }`
        }
        let current = this.get_language();
        data = {
            languages: JSON.parse(body),
            current: current
        };

        // 缓存
        this.cache_set('languages',data,3600);
        return data;
    }
    /**
     * @name 获取客户端语言包
     * @returns {Object} 返回结果
     */
    get_client_language() {
        // 判断缓存
        let client_lang = this.cache_get('client_lang');
        if(client_lang) return client_lang;

        let language = this.get_language();
        let language_path = this.get_language_path();
        let filename = path.resolve(language_path, language+'/client.json');
        if(!this.is_file(filename)){
            filename = path.resolve(language_path,'en/client.json');
        }
        let body = this.read_file(filename)
        if (!body) {
            body = '{}'
        }

        client_lang = JSON.parse(body);

        // 缓存
        this.cache_set('client_lang',client_lang,3600);

        return client_lang
    }

    /**
     * @name 多语言渲染
     * @param {string} content - 内容
     * @param {any[]} args - 参数
     * @returns {string}
     * @example lang('Hello {}', 'World')
     * @example lang('Hello {} {}', 'World', '!')
     * @example lang('Hello')
     */
    lang(content,...args){
        // 获取语言包
        let lang_data = this.cache_get('lang_data');
        if(!lang_data){
            let lang = this.get_language();
            let lang_file = path.resolve(this.get_language_path(), lang , 'server.json');
            lang_data = {};
            if(fs.existsSync(lang_file)) {
                lang_data = JSON.parse(this.read_file(lang_file));
            }
        }

        // 尝试从语言包中获取内容
        let lang_content = content;
        let hash = this.md5(content);
        if(lang_data[hash]){
            lang_content = lang_data[hash];
        }

        // 替换参数
        if(args.length > 0){
            lang_content = lang_content.replace(/{}/g, function() {
                return args.shift();
            });
        }

        // 返回内容
        return lang_content;
    }

    /**
     * @name 判断是否为开发模式
     * @returns {boolean}
     * @example is_dev()
     */
    is_dev(){
        return Ps.isDev();
    }

    /**
     * @name 判断是否为开发模式
     * @returns {boolean}
     * @example is_dev()
     */
    isDev(){
        return Ps.isDev();
    }

    /**
     * @name 判断是否为生产模式
     * @returns {boolean}
     * @example is_prod()
     * @example isProd()
     */
    is_prod(){
        return Ps.isProd();
    }
    
    /**
     * @name 判断是否为生产模式
     * @returns {boolean}
     * @example is_prod()
     * @example isProd()
     */
    isProd(){
        return Ps.isProd();
    }

    


    /**
     * @name 打印日志
     * @param  {...any} args 
     */
    log(...args){
        if(Ps.isDev()){
            console.log('[',this.get_date(),']',...args);
        }else{
            const Log = require('ee-core/log');
            Log.info(...args);
        }
    }

    /**
     * @name 打印调试日志 -- 只在开发模式下打印
     * @param  {...any} args
     * @returns {void}
     */
    debug(...args){
        if(!Ps.isPackaged() || Ps.isDev()){
            console.debug('[',this.get_date(),']',...args);
        }
    }

    /**
     * @name 判断是否为IPv4地址
     * @param {string} ip - IP地址
     * @returns {boolean}
     */
    isIPv4(ip){
        return net.isIPv4(ip);
    }

    /**
     * @name 判断是否为IPv6地址
     * @param {string} ip - IP地址
     * @returns {boolean}
     */
    isIPv6(ip){
        return net.isIPv6(ip);
    }

    /**
     * @name 检查IP地址是否合法
     * @param {string} ip - IP地址
     * @returns {boolean}
     */
    isIp(ip){
        if(this.isIPv4(ip) || this.isIPv6(ip)){
            return true;
        }
        return false;
    }


    // 获取后端服务端口
    get_golang_service_port(){
        let filename = this.get_root_path() + "/run/port.pl";
        let defaultPort = 61415;
        if (fs.existsSync(filename)) {
            let data = fs.readFileSync(filename);
            defaultPort = parseInt(data.toString());
        }
        return defaultPort;
    }

    /**
     * @name 获取缓存
     * @param {any} key 缓存键
     * @returns 
     */
    cache_get(key){
        return Cache.get(key);
    }

    /**
     * @name 设置缓存
     * @param {any} key 缓存键
     * @param {any} value 缓存值
     * @param {number} expire 过期时间
     * @returns 
     */
    cache_set(key,value,expire){
        if (!expire) expire = 0;
        return Cache.set(key,value,expire);
    }

    /**
     * @name 删除缓存
     * @param {any} key 缓存键
     * @returns 
     */
    cache_del(key){
        return Cache.del(key);
    }

    /**
     * @name 清空缓存
     * @returns 
     */
    cache_clear(){
        return Cache.flushAll();
    }

    /**
     * @name 判断缓存是否存在
     * @param {any} key 缓存键
     * @returns
     * @example cache_has('key')
     */
    cache_has(key){
        return Cache.has(key);
    }
    
}

const pub = new Public();
// 声明模块
module.exports = { pub };