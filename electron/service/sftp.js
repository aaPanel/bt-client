const { Client } = require('ssh2')
const { Service } = require('ee-core');
const { pub } = require("../class/public.js");
const {SocksClient} = require('socks')
const DOWNLOAD_ITEMS = {};
const UPLOAD_ITEMS = {};

class SftpService extends Service {
    constructor(ctx){
        super(ctx);
        this.conn = null;
        this.host = null;
        this.port = 22;
        this.username = 'root';
        this.password = null;
        this.private_key = null;
        this.sftp = null;
        this.proxy_id = 0;
    }

    /**
     * @name 连接
     * @param {*} sshConfig 
     * @param {*} callback 
     */
    async connect(sshConfig, callback) {
        if (sshConfig.host) this.host = sshConfig.host;
        if (sshConfig.port) this.port = sshConfig.port;
        if (sshConfig.username) this.username = sshConfig.username;
        if (sshConfig.password) this.password = sshConfig.password;
        if (sshConfig.privateKey) this.private_key = sshConfig.privateKey;
        if (sshConfig.private_key) this.private_key = sshConfig.private_key;
        if (sshConfig.proxy_id) this.proxy_id = sshConfig.proxy_id;

        if(!this.host) throw new Error('Host is required');
        if(!this.password && !this.private_key) throw new Error('Only one of password and privateKey is required');
        if(this.proxy_id){
            return this.connect_proxy(callback);
        }else{
            return this.connect_sftp(callback);
        }
    }



    connect_proxy(callback){
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
                return callback(null,err);
            }

            let ssh_config = {
                sock: info.socket,
                username: that.username
            }
    
            if(that.auth_type == 0 || !that.private_key){
                ssh_config.password = that.password;
            }else{
                ssh_config.privateKey = that.private_key;
                if(that.key_password){
                    ssh_config.passphrase = that.key_password;
                }
            }
    
            that.conn = new Client();

            that.conn.on('ready', () => {
                that.conn.sftp((err, sftp) => {
                    if (err) {
                        console.log('SFTP :: connect :: SFTP连接失败: ' + err);
                        callback(null,err);
                        return;
                    }
    
                    sftp.on('close', () => {
                        console.log('SFTP :: close :: SFTP连接关闭');
                        return that.disconnect();
                    })
    
                    that.sftp = sftp;
                    console.log('SFTP :: connect :: SFTP连接成功');
                    callback(pub.lang('SFTP连接成功'),null);
                });
            }).on('error', (err) => {
                // 错误
                console.log('Client :: error :: ' , err);
                let error_msg = '';
                if(err.level == 'client-authentication'){
                    // 密码错误
                    error_msg = pub.lang('认证失败，帐号或密码错误: {}', err.message);
                }else if(err.level == 'client-socket'){
                    // 连接失败
                    error_msg = pub.lang('连接失败: {}', err.message);
                }else if(err.level == 'client-timeout'){
                    // 连接超时
                    error_msg = pub.lang('连接超时: {}', err.message);
                }else if(err.level == 'client-sftp'){
                    // SSH连接失败
                    error_msg = pub.lang('SFTP连接失败: {}', err.message);
                }else{
                    error_msg = err.message;
                }
                callback(null,error_msg);
            }).connect(ssh_config);
        });

    }

    /**
     * @name 连接SFTP
     * @param {*} callback
     * @returns {void}
     */
    connect_sftp(callback){

        let connect_info = {
            // SSH连接信息
            host: this.host,
            port: this.port,
            username: this.username,
            tryKeyboard: true,
            // debug: (debug) => { console.log(debug); },
        }
        

        if(this.auth_type == 0 || !this.private_key){
            connect_info.password = this.password;
        }else{
            connect_info.privateKey = this.private_key;
            if(this.key_password){
                connect_info.passphrase = this.key_password;
            }
        }

        // 连接SFTP
        this.conn = new Client();
        let that = this;
        that.conn.on('ready', () => {
            that.conn.sftp((err, sftp) => {
                if (err) {
                    console.log('SFTP :: connect :: SFTP连接失败: ' + err);
                    callback(null,err);
                    return;
                }

                sftp.on('close', () => {
                    console.log('SFTP :: close :: SFTP连接关闭');
                    return that.disconnect();
                })

                that.sftp = sftp;
                console.log('SFTP :: connect :: SFTP连接成功');
                callback(pub.lang('SFTP连接成功'),null);
            });
        }).on('error', (err) => {
            // 错误
            console.log('Client :: error :: ' , err);
            let error_msg = '';
            if(err.level == 'client-authentication'){
                // 密码错误
                error_msg = pub.lang('认证失败，帐号或密码错误: {}', err.message);
            }else if(err.level == 'client-socket'){
                // 连接失败
                error_msg = pub.lang('连接失败: {}', err.message);
            }else if(err.level == 'client-timeout'){
                // 连接超时
                error_msg = pub.lang('连接超时: {}', err.message);
            }else if(err.level == 'client-sftp'){
                // SSH连接失败
                error_msg = pub.lang('SFTP连接失败: {}', err.message);
            }else{
                error_msg = err.message;
            }
            callback(null,error_msg);
        }).connect(connect_info);
    }

    /**
     * @name 断开连接
     * @returns {void}
     */
    disconnect(){
        if(this.conn){
            this.conn.end();
        }
    }

    /**
     * @name 上传文件
     * @param {string} localPath - 本地文件路径
     * @param {string} remotePath - 远程文件路径
     * @param {*} callback
     * @returns {void}
     */
    async upload(localPath, remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }
        let time = pub.time();
        let key = pub.md5(localPath + remotePath + String(time));
        
        UPLOAD_ITEMS[key] = {
            title: '上传文件: '+ localPath, // 标题
            total: 0,       // 总字节数
            transfered: 0,  // 已传输的字节数
            speed: 0,       // 每秒传输的字节数
            start_time: time,   // 开始时间
            last_time: time,    // 上一次时间
            progress:0.00  // 进度，百分比
        }
        // 使用fastPut上传文件
        this.sftp.fastPut(localPath, remotePath,{concurrency:64,chunkSize:32768,step:function(total_transfered,chunk,total){
            console.log('total_transfered:',total_transfered,'chunk:',chunk,'total:',total);
            // 记录总字节数
            UPLOAD_ITEMS[key].total = total;

            // 记录已传输的字节数
            UPLOAD_ITEMS[key].transfered = total_transfered;

            // 当前时间
            let now_time = pub.time();

            // 计算速度
            if(now_time == UPLOAD_ITEMS[key].last_time){
                UPLOAD_ITEMS[key].speed += chunk;
            }
            else{
                UPLOAD_ITEMS[key].speed = chunk;
            }

            // 上一次时间
            UPLOAD_ITEMS[key].last_time = now_time;

            // 计算进度
            UPLOAD_ITEMS[key].progress = ((total_transfered / total) * 100).toFixed(2);

            callback(UPLOAD_ITEMS[key],null);
        },mode:0o755}, (err) => {
            // 删除队列
            if(UPLOAD_ITEMS[key]){
                delete UPLOAD_ITEMS[key];
            }

            if (err) {
                return callback(null,pub.lang('上传文件失败: {}', err.message));
            }
            callback(pub.lang('上传文件成功'),null);
        });
    }


    /**
     * @name 下载文件
     * @param {string} remotePath - 远程文件路径
     * @param {string} localPath - 本地文件路径
     * @param {*} callback
     * @returns {void}
     */
    async download(remotePath, localPath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }
        let time = pub.time();
        let key = pub.md5(remotePath + localPath + String(time));


        DOWNLOAD_ITEMS[key] = {
            title: pub.lang('下载文件: ', remotePath), // 标题
            total: 0,       // 总字节数
            transfered: 0,  // 已传输的字节数
            speed: 0,       // 每秒传输的字节数
            start_time: time,   // 开始时间
            last_time: time,    // 上一次时间
            progress:0.00  // 进度，百分比
            
        }
        // 使用fastGet下载文件
        this.sftp.fastGet(remotePath, localPath,{concurrency:64,chunkSize:32768,step:function(total_transfered,chunk,total){
            console.log('total_transfered:',total_transfered,'chunk:',chunk,'total:',total);
            // 记录总字节数
            DOWNLOAD_ITEMS[key].total = total;

            // 记录已传输的字节数
            DOWNLOAD_ITEMS[key].transfered = total_transfered;

            // 当前时间
            let now_time = pub.time();

            // 计算速度
            if(now_time == DOWNLOAD_ITEMS[key].last_time){
                DOWNLOAD_ITEMS[key].speed += chunk;
            }else{
                DOWNLOAD_ITEMS[key].speed = chunk;
            }

            // 上一次时间
            DOWNLOAD_ITEMS[key].last_time = now_time;

            // 计算进度
            DOWNLOAD_ITEMS[key].progress = ((total_transfered / total) * 100).toFixed(2);

            callback(DOWNLOAD_ITEMS[key],null);
        }}, (err) => {

            // 删除队列
            if(DOWNLOAD_ITEMS[key]){
                delete DOWNLOAD_ITEMS[key];
            }

            if (err) {
                return callback(null,pub.lang('下载文件失败: {}', err.message));
            }
            callback('下载文件成功',null);
        });
    }

    /**
     * @name 创建文件
     * @param {string} remotePath - 远程文件路径
     * @param {*} callback
     * @returns {void}
     */
    async touch(remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.open(remotePath, 'w', (err, handle) => {
            if (err) {
                return callback(null,pub.lang('创建文件失败: {}', err.message));
            }
            this.sftp.close(handle, (err) => {
                if (err) {
                    return callback(null,pub.lang('创建文件失败: {}', err.message));
                }
                callback(pub.lang('创建文件成功'),null);
            });
        });
    }

    /**
     * @name 修改文件权限 
     * @param {string} remotePath - 远程文件路径
     * @param {number} mode - 权限 例如：0o755
     * @param {*} callback 回调函数
     */
    async chmod(remotePath,mode,callback){
        if(!this.sftp){
            return callback(null,'SFTP连接已断开');
        }

        this.sftp.chmod(remotePath,mode, (err) => {
            if (err) {
                return callback(null,pub.lang('修改文件权限失败: {}', err.message));
            }
            callback(pub.lang('修改文件权限成功'),null);
        });
    }

    /**
     * @name 修改文件所有者
     * @param {string} remotePath - 远程文件路径
     * @param {number} uid - 用户ID
     * @param {number} gid - 组ID
     * @param {*} callback
     * @returns {void}
     */
    async chown(remotePath,uid,gid,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.chown(remotePath,uid,gid, (err) => {
            if (err) {
                return callback(null,pub.lang('修改文件所有者失败: {}', err.message));
            }
            callback(pub.lang('修改文件所有者成功'),null);
        });
    }

    /**
     * @name 获取用户和组列表
     * @param {*} callback
     */
    async get_user_group(callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.readFile('/etc/passwd', 'utf8', (err, data) => {
            if (err) {
                return callback(null,pub.lang('获取用户列表失败: {}', err.message));
            }
            let user_list = data.split('\n');
            let users = [];
            for(let i=0;i<user_list.length;i++){
                let user = user_list[i].split(':');
                if(user.length < 3) continue;
                users.push(user[0]);
            }

            this.sftp.readFile('/etc/group', 'utf8', (err, data) => {
                if (err) {
                    return callback(null,pub.lang('获取组列表失败: ', err.message));
                }
                let group_list = data.split('\n');
                let groups = [];
                for(let i=0;i<group_list.length;i++){
                    let group = group_list[i].split(':');
                    if(group.length < 3) continue;
                    groups.push(group[0]);
                }
                callback({users:users,groups:groups},null);
            });
        });
    }

    /**
     * @name 删除文件
     * @param {string} remotePath - 远程文件路径
     * @param {*} callback
     * @returns {void}
     */
    async remove(remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.unlink(remotePath, (err) => {
            if (err) {
                return callback(null,pub.lang('删除文件失败: {}', err.message));
            }
            callback(pub.lang('删除文件成功'),null);
        });
    }

    /**
     * @name 创建目录
     * @param {string} remotePath - 远程目录路径
     * @param {*} callback
     * @returns {void}
     */
    async mkdir(remotePath,callback){
        if(!this.sftp){
            return callback(null,'SFTP连接已断开');
        }

        this.sftp.mkdir(remotePath, (err) => {
            if (err) {
                return callback(null,pub.lang('创建目录失败: {}', err.message));
            }
            callback(pub.lang('创建目录成功'),null);
        });
    }

    /**
     * @name 删除目录
     * @param {string} remotePath - 远程目录路径
     * @param {*} callback
     * @returns {void}
     */
    async rmdir(remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.rmdir(remotePath, (err) => {
            if (err) {
                return callback(null,pub.lang('删除目录失败: {}', err.message));
            }
            callback(pub.lang('删除目录成功'),null);
        });
    }

    /**
     * @name 读取目录
     * @param {string} remotePath - 远程目录路径
     * @param {*} callback
     * @returns {void}
     */
    async list_dir(remotePath,callback){
        if(!this.sftp){
            console.log("this.sftp",this.sftp);
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.readdir(remotePath, (err, list) => {
            if (err) {
                return callback(null,pub.lang('读取目录失败: {}', err.message));
            }
            callback(list,null);
        });
    }

    /**
     * @name 读取文件
     * @param {string} remotePath - 远程文件路径
     * @returns {void}
     */
    async read_file(remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.readFile(remotePath, 'utf8', (err, data) => {
            if (err) {
                return callback(null,pub.lang('读取文件失败: ', err.message));
            }
            callback(data,null);
        });
    }

    /**
     * @name 写入文件
     * @param {string} remotePath - 远程文件路径
     * @param {string} data - 写入的数据
     * @param {*} callback
     * @returns {void}
     */
    async write_file(remotePath, data,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.writeFile(remotePath, data, (err) => {
            if (err) {
                return callback(null,pub.lang('写入文件失败: {}', err.message));
            }
            callback(pub.lang('写入文件成功'),null);
        });
    }

    /**
     * @name 重命名文件
     * @param {string} oldPath - 旧文件路径
     * @param {string} newPath - 新文件路径
     * @param {*} callback
     * @returns {void}
     */
    async rename(oldPath, newPath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.rename(oldPath, newPath, (err) => {
            if (err) {
                return callback(null,pub.lang('重命名文件失败: {}', err.message));
            }
            callback(pub.lang('重命名文件成功'),null);
        });
    }

    /**
     * @name 获取文件属性
     * @param {string} remotePath - 远程文件路径
     * @param {*} callback
     * @returns {void}
     */
    async stat(remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }

        this.sftp.stat(remotePath, (err, stats) => {
            if (err) {
                return callback(null,pub.lang('获取文件属性失败: {}', err.message));
            }
            callback(stats,null);
        });
    }

    /**
     * @name 获取下载队列
     * @returns {object}
     * @returns {void}
     */
    async get_download_items(){
        return DOWNLOAD_ITEMS;
    }

    /**
     * @name 获取上传队列
     * @returns {object}
     * @returns {void}
     */
    async get_upload_items(){
        return UPLOAD_ITEMS;
    }
}

SftpService.toString = () => '[class SftpService]';
module.exports = SftpService;



