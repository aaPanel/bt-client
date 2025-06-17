const { Client } = require('ssh2')
const { pub } = require("./public.js");
const {SocksClient} = require('socks')
const { dialog } = require('electron');
const os = require('os');
const DOWNLOAD_ITEMS = {};
const UPLOAD_ITEMS = {};

class Sftp{
    constructor(){
        this.conn = null;
        this.host = null;
        this.port = 22;
        this.username = 'root';
        this.password = null;
        this.private_key = null;
        this.sftp = null;
        this.proxy_id = 0;
        this.ssh_id = 0;
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
        if (sshConfig.ssh_id) this.ssh_id = sshConfig.ssh_id;

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
    
            that.connect_src(ssh_config,callback);
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

        this.connect_src(connect_info,callback);
        
    }


    connect_src(connect_info,callback){
        // 连接SFTP
        this.conn = new Client();
        let that = this;
        that.conn.on('ready', () => {
            that.conn.sftp((err, sftp) => {
                if (err) {
                    // pub.debug('SFTP :: connect :: failed: ' + err);
                    callback(null,err);
                    return;
                }

                sftp.on('close', () => {
                    // pub.debug('SFTP :: close :: connection closed');
                    return that.disconnect();
                })

                that.sftp = sftp;
                // pub.debug('SFTP :: connect :: successify');

                // 心跳包
                that.heartbeat();
                callback(pub.lang('SFTP连接成功'),null);
            });
        }).on('error', (err) => {
            // 错误
            // pub.debug('Client :: error :: ' , err);
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
     * @name 心跳包
     * @returns {void}
     * @returns {void}
     */
    heartbeat(){
        if (!this.conn) return;
        let self = this;
        setTimeout(() => {
            if (!this.conn) return;
            self.sftp.stat("/proc/uptime");
            self.heartbeat();
        }, 1000*120);
    }


    /**
     * @name 断开连接
     * @returns {void}
     */
    disconnect(){
        if(this.conn){
            this.conn.end();
            this.conn = null;
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
        let filename = "";
        if(localPath.indexOf('/') > -1){
            filename = localPath.split('/').pop();
        }else{
            filename = localPath.split('\\').pop();
        }
        remotePath += '/' + filename;
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
        let speed = 0;
        let max_size = 1024*1024*10;

        // 使用fastPut上传文件
        this.sftp.fastPut(localPath, remotePath,{concurrency:64,chunkSize:32768,step:function(total_transfered,chunk,total){
            // 记录总字节数
            UPLOAD_ITEMS[key].total = total;

            // 记录已传输的字节数
            UPLOAD_ITEMS[key].transfered = total_transfered;

            // 当前时间
            let now_time = pub.time();
            let last_time = UPLOAD_ITEMS[key].last_time;

            // 计算速度
            if(now_time == UPLOAD_ITEMS[key].last_time){
                speed += chunk;
            }
            else{
                UPLOAD_ITEMS[key].speed = speed;
                speed = chunk;
                // 上一次时间
                UPLOAD_ITEMS[key].last_time = now_time;
            }


            if(total < max_size || last_time != now_time){
                // 计算进度
                UPLOAD_ITEMS[key].progress = ((total_transfered / total) * 100).toFixed(2);
                callback(UPLOAD_ITEMS[key],null);
            }
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
     * @param {*} callback
     * @returns {void}
     */
    async download(remotePath,callback){
        if(!this.sftp){
            return callback(null,pub.lang('SFTP连接已断开'));
        }
        let DX = '/';
        if(os.platform() == 'win32'){
            DX = '\\';
        }
        dialog.showSaveDialog({
            title: pub.lang('请选择保存位置'),
            defaultPath: remotePath.split('/').pop(),
        }).then((result) => {
            if(result.canceled) return;
            let localPath = result.filePath;
            let save_path = localPath.split(DX).slice(0,-1).join(DX);
            let filename = remotePath.split('/').pop();
            let time = pub.time();
            let key = pub.md5(remotePath + localPath + String(time));


            // `CREATE TABLE IF NOT EXISTS sftp_download (
            //     \`download_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID
            //     \`ssh_id\` INTEGER DEFAULT 0,              -- SSH ID
            //     \`src_filename\` TEXT DEFAULT "",          -- 远程文件全路径
            //     \`filename\` TEXT DEFAULT "",      -- 文件名
            //     \`file_size\` INTEGER DEFAULT 0,  -- 文件大小
            //     \`save_path\` TEXT DEFAULT "",     -- 保存路径
            //     \`start_time\` INTEGER DEFAULT 0,     -- 下载时间
            //     \`end_time\` INTEGER DEFAULT 0,     -- 完成时间
            //     \`update_time\` INTEGER DEFAULT 0,     -- 进度更新时间
            //     \`time_consuming\` INTEGER DEFAULT 0,     -- 耗时
            //     \`progress\` INTEGER DEFAULT 0,   -- 进度
            //     \`received_size\` INTEGER DEFAULT 0,   -- 已下载大小
            //     \`speed\` TEXT DEFAULT "",         -- 速度
            //     \`status\` INTEGER DEFAULT 0,     -- 状态 0=暂停 1=下载中 2=已完成 -1=下载失败
            //     \`error_msg\` TEXT DEFAULT ""      -- 错误信息
            // )`

            let table = 'sftp_download';
            let download_id = pub.M(table).insert({
                ssh_id: this.ssh_id,
                src_filename: remotePath,
                filename: filename,
                file_size: 0,
                save_path: save_path,
                start_time: time,
                end_time: 0,
                update_time: 0,
                time_consuming: 0,
                progress: 0,
                received_size: 0,
                speed: '',
                status: 1,
                error_msg: ''
            });


            DOWNLOAD_ITEMS[key] = {
                title: pub.lang('下载文件: ', remotePath), // 标题
                total: 0,       // 总字节数
                transfered: 0,  // 已传输的字节数
                speed: 0,       // 每秒传输的字节数
                start_time: time,   // 开始时间
                last_time: time,    // 上一次时间
                progress:0.00  // 进度，百分比
            }

            let speed = 0;
            let max_size = 1024*1024*10;
            // 使用fastGet下载文件
            this.sftp.fastGet(remotePath, localPath,{concurrency:64,chunkSize:32768,step:function(total_transfered,chunk,total){
                // 记录总字节数
                DOWNLOAD_ITEMS[key].total = total;

                // 记录已传输的字节数
                DOWNLOAD_ITEMS[key].transfered = total_transfered;

                // 当前时间
                let now_time = pub.time();
                let last_time = DOWNLOAD_ITEMS[key].last_time;

                // 计算速度
                if(now_time == DOWNLOAD_ITEMS[key].last_time){
                    speed += chunk;
                }else{
                    DOWNLOAD_ITEMS[key].speed = speed;
                    speed = chunk;
                    // 上一次时间
                    DOWNLOAD_ITEMS[key].last_time = now_time;
                }
                
                if(total < max_size || last_time != now_time){
                    // 计算进度
                    DOWNLOAD_ITEMS[key].progress = ((total_transfered / total) * 100).toFixed(2);


                    // 更新数据库
                    pub.M(table).where('download_id=?',download_id).update({
                        file_size: total,
                        update_time: now_time,
                        progress: DOWNLOAD_ITEMS[key].progress,
                        received_size: total_transfered,
                        speed: DOWNLOAD_ITEMS[key].speed
                    })

                    callback(DOWNLOAD_ITEMS[key],null);
                }
            }}, (err) => {

                // 删除队列
                if(DOWNLOAD_ITEMS[key]){
                    delete DOWNLOAD_ITEMS[key];
                }

                // 更新数据库
                let end_time = pub.time();
                let time_consuming = end_time - time;

                if (err) {
                    pub.M(table).where('download_id=?',download_id).update({
                        end_time: end_time,
                        time_consuming: time_consuming,
                        status: -1,
                        error_msg: err.message
                    });
                    return callback(null,pub.lang('下载文件失败: {}', err.message));
                }


                pub.M(table).where('download_id=?',download_id).update({
                    end_time: end_time,
                    time_consuming: time_consuming,
                    status: 2
                });

                callback('下载文件成功',null);
            });
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
                let uid = parseInt(user[2]);
                if(uid >0 && uid < 1000) continue;
                let gid = parseInt(user[3]);
                users.push({uid:uid,gid:gid,name:user[0]});
            }

            callback(users,null);

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


    async list_dir_src(remotePath,callback){

        this.sftp.readdir(remotePath, (err, list) => {
            if (err) {
                return callback(null,pub.lang('读取目录失败: {}', err.message));
            }

            for(let i=0;i<list.length;i++){
                // 内容示例：-rw-r--r-- 1 root root 0 2021-07-07 15:00:00 test.txt
                // 判断是否是目录
                list[i].is_dir = list[i].longname[0] == 'd';
                // 是否为link
                list[i].is_link = list[i].longname[0] == 'l';
                if(list[i].is_link){
                    if(!list[i].real_path) list[i].real_path = '';
                    if(list[i].real_path.indexOf('.') > -1){
                        list[i].is_dir = false;
                    }
                }else{
                    list[i].real_path = ''
                }
                // 获取用户名和用户组
                let longname_arr = list[i].longname.replace(/\s+/g,' ').split(' ');
                list[i].user = longname_arr[2];
                list[i].group = longname_arr[3];

                // 从attrs中获取权限
                list[i].attrs.mode = parseInt(list[i].attrs.mode.toString(8).slice(-3));
            }
            callback(list,null);
        });
    }

    /**
     * @name 读取目录
     * @param {string} remotePath - 远程目录路径
     * @param {*} callback
     * @returns {void}
     */
    async list_dir(remotePath,callback){
        let self = this;
        if(!this.sftp && this.host){
            this.connect({},function(res,err){
                if(err) return callback(null,pub.lang('SFTP连接已断开'));
                self.list_dir_src(remotePath,callback);

            });
        }else{
            this.list_dir_src(remotePath,callback);
        }
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
		/**
		 * @name 开启面板api接口
		 * @param {*} callback
		 */
	async start_panel_api(callback) { 
		this.sftp.readFile('/www/server/panel/config/api.json', 'utf8', (err, data) => { 
			if (typeof data === 'undefined') {
				data = '{}'
			}
			let apiData = JSON.parse(data);
			const apiInfo = pub.api_encrypt()
			apiData['open'] = true;
			apiData['token'] = apiInfo['token'];
			apiData['token_crypt'] = apiInfo['token_crypt'];
			apiData['limit_addr'] = ['*'];
			// 写入文件
			this.sftp.writeFile('/www/server/panel/config/api.json', JSON.stringify(apiData), (err) => {
				return callback(apiData['token_crypt'],null)
			});
		});
	}

}

module.exports = Sftp;