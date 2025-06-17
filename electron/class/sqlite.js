const sqlite3 = require('better-sqlite3')
const fs = require('fs')
const Ps = require('ee-core/ps');
const CryptoJS = require('crypto-js');

const IS_CHECK_TABLE = {status:false}

class Sqlite {
    constructor() {
        this.DB_PATH = Ps.getRootDir() + '/data'
        this.DB_FILE = ''
        this.DB_OBJ = null
        this.TABLE_NAME = ''
        this.WHERE_STR = ''
        this.WHERE_PARAMS = []
        this.FIELDS = '*'
        this.LIMIT = []
        this.ORDER = ''
        this.GROUP = ''
        this.HAVING = ''
        this.JOIN = ''
        this.UNION = ''
        this.DISTINCT = ''
        this.ENCRYPT_FIELDS = ['username','password','proxy_username','proxy_password','private_key','api_token','admin_path','server_id']
        this.NOT_CLONE = false


        if(!fs.existsSync(this.DB_PATH)){
            fs.mkdirSync(this.DB_PATH)
        }

        this.DB_FILE = this.DB_PATH + '/data.db'
        // 取绝对路径
        // this.DB_FILE = path.resolve(__dirname, this.DB_FILE)
        // console.log('dirname: ',__dirname)
        // console.log('数据库文件路径：' + this.DB_FILE)

        this.DB_OBJ = sqlite3(this.DB_FILE)


        // 判断文件是否存在
        if(!fs.existsSync(this.DB_FILE) || fs.statSync(this.DB_FILE).size == 0){
            this.create()
        }else{
            // 检查并添加不存在的字段
            if(!IS_CHECK_TABLE.status){
                this.checkField('panel_info', 'area', 'TEXT', '""')
                this.checkField('ssh_info', 'area', 'TEXT', '""')
                this.checkField('panel_info', 'proxy_id', 'INTEGER', '0')
                this.checkField('ssh_info', 'proxy_id', 'INTEGER', '0')
                this.checkField('panel_info', 'group_id', 'INTEGER', '0')
                this.checkField('ssh_info', 'group_id', 'INTEGER', '0')
                this.checkField('ssh_info', 'is_recording', 'INTEGER', '0')
                this.checkField('ssh_info', 'os_type', 'TEXT', '"Linux"')
                this.checkField('ssh_info', 'os_name', 'TEXT', '"Linux"')
                this.checkField('ssh_info', 'mstsc_options', 'TEXT', '"{}"')
                this.checkField('ssh_info', 'sort', 'INTEGER', '0')
                this.checkField('panel_info', 'ov', 'INTEGER', '-1')
                this.checkField('panel_info', 'server_id', 'TEXT', '""')
                this.checkField('panel_info', 'current_disk', 'TEXT', '""')
                this.create()
                IS_CHECK_TABLE.status = true
            }
        }
        
    }



    /**
     * @name AES-128-ECB加密 ZeroPadding
     * @param {string} data 数据
     * @param {string} key 密钥
     * @returns {string} 加密后的数据Base64
     * @example aesEncrypt('123456','1234567890123456')
     */
    aesEncrypt(data,key){
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
     * @example aesEncrypt(data,'1234567890123456')
     */
    aesDecrypt(data,key){
        if(!data) return
        if(key.length!=16) return

        try{
            let sKey = CryptoJS.enc.Utf8.parse(key);
            let decrypt = CryptoJS.AES.decrypt(data, sKey, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.ZeroPadding
            });
            return CryptoJS.enc.Utf8.stringify(decrypt).toString();
        }catch(e){
            return data
        }
    }

    /**
     * @name 获取AES加密密钥
     * @returns {string} 返回密钥
     * @example getAesKey()
     */
    getAesKey(){
        let password_hash = global.password_hash;
        if(!password_hash) return '';
        // 取偶数位
        let key = '';
        for(let i=0;i<password_hash.length;i++){
            if(i%2 == 0){
                key += password_hash[i];
            }
        }
        return key;
    }

    /**
     * @name 解密所有行并明文存入数据库
     * @returns {void}
     */
    decryptAll(){
        this.NOT_CLONE = true
        let table = this.TABLE_NAME;
        let _list = this.select()
        if(_list.length == 0) return
        let _id = Object.keys(_list[0])[0]
        for(let i=0;i<_list.length;i++){
            this.table(table).where(_id+'=?',_list[i][_id]).update(_list[i],null,true)
        }
        this.NOT_CLONE = false
        this.clear()
    }

    /**
     * @name 加密所有行并存入数据库
     * @returns {void}
     */
    encryptAll(){
        this.NOT_CLONE = true
        let table = this.TABLE_NAME;
        let _list = this.select()
        if(_list.length == 0) return
        let _id = Object.keys(_list[0])[0]
        for(let i=0;i<_list.length;i++){
            this.table(table).where(_id + '=?',_list[i][_id]).update(_list[i])
        }
        this.NOT_CLONE = false
        this.clear()
    }


    /**
     * @name 字段加密
     * @param {object} data 数据
     * @return {object} 返回加密后的数据
     */
    fieldEncrypt(data){
        let key = this.getAesKey();
        if(!key) return data;
        if(!data) return data;
        for(let i=0;i<this.ENCRYPT_FIELDS.length;i++){
            let field = this.ENCRYPT_FIELDS[i];
            if(data[field]){
                data[field] = "BTx:" + this.aesEncrypt(data[field],key);
            }
        }
        return data;
    }


    /**
     * @name 字段解密
     * @param {object} data 数据
     * @return {object} 返回解密后的数据
     * @example fieldDecrypt(data)
     */
    fieldDecrypt(data){
        if(!data) return data;
        let key = this.getAesKey(true);
        if(!key) return data;
        let keys = Object.keys(data);
        for(let i=0;i<keys.length;i++){
            let field = keys[i];
            if(typeof data[field] != 'string') continue;
            if(!data[field] || data[field].length < 5) continue;
            if(data[field].indexOf('BTx:') == 0){
                data[field] = this.aesDecrypt(data[field].replace('BTx:',''),key);
            }
        }
        return data;
    }

    /**
     * @name 检查并添加不存在的字段
     * @param {string} table_name 表名
     * @param {string} field_name 字段名
     * @param {string} field_type 字段类型
     * @param {string} default_value 默认值
     * @returns {void}
     */
    checkField(table_name, field_name, field_type, default_value){
        let sql = `PRAGMA table_info(${table_name})`
        let res = this.DB_OBJ.prepare(sql).all()
        let is_exist = false
        for(let i=0;i<res.length;i++){
            if(res[i].name == field_name){
                is_exist = true
                break
            }
        }

        if(!is_exist){
            sql = `ALTER TABLE ${table_name} ADD COLUMN ${field_name} ${field_type} DEFAULT ${default_value}`
            this.DB_OBJ.prepare(sql).run()
        }
    }


    /**
     * @name 创建表
     * @returns {null}
     */
    create(){
        let sql = `CREATE TABLE IF NOT EXISTS panel_info (
                    \`panel_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 面板ID
                    \`group_id\` INTEGER DEFAULT 0,              -- 分组ID
                    \`title\` TEXT DEFAULT "",           -- 面板名称
                    \`url\` TEXT DEFAULT "",           -- 面板地址
                    \`auth_type\` INTEGER DEFAULT 0,            -- 验证类型 0=无验证 1=API验证 2=账号验证 3=APP-Token验证
                    \`api_token\` TEXT DEFAULT "",     -- API Token 仅在auth_type=1/3时有效  加密
                    \`admin_path\` TEXT DEFAULT "",    -- 管理路径 仅在auth_type=2时有效  加密
                    \`username\` TEXT DEFAULT "",      -- 用户名 仅在auth_type=2时有效   加密
                    \`password\` TEXT DEFAULT "",      -- 密码 仅在auth_type=2时有效   加密
                    \`addtime\` INTEGER DEFAULT 0,               -- 添加时间
                    \`status\` INTEGER DEFAULT 0,              -- 状态 0=正常 1=异常
                    \`ov\` INTEGER DEFAULT -1,              -- 是否为付费版本 0=免费版 1=专业版 2=企业版
                    \`server_id\` TEXT DEFAULT "",          -- server_id
                    \`proxy_id\` INTEGER DEFAULT 0,              -- 代理ID
                    \`common_use\` INTEGER DEFAULT 0,           -- 常用显示状态 1=显示 0=隐藏
                    \`area\` TEXT DEFAULT ""            -- 服务器归属区域
                )`;

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[panel_info]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS panel_download (
                \`download_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID
                \`url\` TEXT DEFAULT "",          -- URL
                \`filename\` TEXT DEFAULT "",      -- 文件名
                \`file_size\` INTEGER DEFAULT 0,  -- 文件大小
                \`save_path\` TEXT DEFAULT "",     -- 保存路径
                \`start_time\` INTEGER DEFAULT 0,     -- 下载时间
                \`end_time\` INTEGER DEFAULT 0,     -- 完成时间
                \`update_time\` INTEGER DEFAULT 0,     -- 进度更新时间
                \`time_consuming\` INTEGER DEFAULT 0,     -- 耗时
                \`progress\` INTEGER DEFAULT 0,   -- 进度
                \`received_size\` INTEGER DEFAULT 0,   -- 已下载大小
                \`speed\` TEXT DEFAULT "",         -- 速度
                \`status\` INTEGER DEFAULT 0,     -- 状态 0=暂停 1=下载中 2=已完成 -1=下载失败
                \`error_msg\` TEXT DEFAULT ""      -- 错误信息
            )`

        if(this.DB_OBJ.prepare(sql).run()){
            console.log('创建[panel_download]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS panel_delete (
                \`delete_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID
                \`url_hash\` TEXT DEFAULT "",          -- URL哈希
                \`delete_time\` INTEGER DEFAULT 0     -- 删除时间
            )`

        if(this.DB_OBJ.prepare(sql).run()){
            console.log('创建[panel_delete]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS panel_group (
                \`group_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 分组ID
                \`group_name\` TEXT DEFAULT ""        -- 分组名称
            )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[panel_group]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS ssh_info (
            \`ssh_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- SSH ID
            \`group_id\` INTEGER DEFAULT 0,              -- 分组ID
            \`title\` TEXT DEFAULT "",           -- SSH名称
            \`host\` TEXT DEFAULT "",            -- 主机地址
            \`port\` INTEGER DEFAULT 22,                  -- 端口
            \`auth_type\` INTEGER DEFAULT 0,            -- 验证类型 0=密码验证 1=密钥验证
            \`username\` TEXT DEFAULT "",        -- 用户名 仅在auth_type=0时有效
            \`password\` TEXT DEFAULT "",        -- 密码 仅在auth_type=0时有效
            \`private_key\` TEXT DEFAULT "",     -- 私钥 仅在auth_type=1时有效
            \`addtime\` INTEGER DEFAULT 0,                 -- 添加时间
            \`status\` INTEGER DEFAULT 0,              -- 状态 0=正常 1=异常
            \`proxy_id\` INTEGER DEFAULT 0,              -- 代理ID
            \`common_use\` INTEGER DEFAULT 0,           -- 常用显示状态 1=显示 0=隐藏
            \`is_recording\` INTEGER DEFAULT 0,        -- 是否自动录屏 0=否 1=是
            \`os_type\` TEXT DEFAULT "",           -- 操作系统类型 Windows/Linux
            \`os_name\` TEXT DEFAULT "",           -- 操作系统名称 CentOS/Ubuntu/Windows/Debian
            \`mstsc_options\` TEXT DEFAULT "{}",     -- MSTSC配置
            \`area\` TEXT DEFAULT ""            -- 服务器归属区域
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[ssh_info]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS sftp_download (
            \`download_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID
            \`ssh_id\` INTEGER DEFAULT 0,              -- SSH ID
            \`src_filename\` TEXT DEFAULT "",          -- 远程文件全路径
            \`filename\` TEXT DEFAULT "",      -- 文件名
            \`file_size\` INTEGER DEFAULT 0,  -- 文件大小
            \`save_path\` TEXT DEFAULT "",     -- 保存路径
            \`start_time\` INTEGER DEFAULT 0,     -- 下载时间
            \`end_time\` INTEGER DEFAULT 0,     -- 完成时间
            \`update_time\` INTEGER DEFAULT 0,     -- 进度更新时间
            \`time_consuming\` INTEGER DEFAULT 0,     -- 耗时
            \`progress\` INTEGER DEFAULT 0,   -- 进度
            \`received_size\` INTEGER DEFAULT 0,   -- 已下载大小
            \`speed\` TEXT DEFAULT "",         -- 速度
            \`status\` INTEGER DEFAULT 0,     -- 状态 0=暂停 1=下载中 2=已完成 -1=下载失败
            \`error_msg\` TEXT DEFAULT ""      -- 错误信息
        )`

        if(this.DB_OBJ.prepare(sql).run()){
            console.log('创建[sftp_download]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS ssh_delete (
            \`delete_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID
            \`host_hash\` TEXT DEFAULT "",          -- URL哈希
            \`delete_time\` INTEGER DEFAULT 0     -- 删除时间
        )`

        if(this.DB_OBJ.prepare(sql).run()){
            console.log('创建[ssh_delete]表成功')
        }

        sql = `CREATE TABLE IF NOT EXISTS ssh_group (
            \`group_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 分组ID
            \`group_name\` TEXT DEFAULT ""        -- 分组名称
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[ssh_group]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS common_shell (
            \`shell_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 脚本ID
            \`title\` TEXT DEFAULT "",              -- 脚本名称
            \`content\` TEXT DEFAULT "",            -- 脚本内容
            \`total\` INTEGER DEFAULT 0,            -- 执行次数
            \`addtime\` INTEGER DEFAULT 0          -- 添加时间
        )`

        if(this.DB_OBJ.prepare(sql).run()){
            console.log('创建[common_shell]表成功')
        }

        sql = `CREATE TABLE IF NOT EXISTS screen_recording (
            \`record_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 录屏ID
            \`ssh_id\` INTEGER DEFAULT 0,                   -- SSH ID
            \`ssh_user\` TEXT DEFAULT "",                    -- SSH用户名
            \`start_time\` INTEGER DEFAULT 0,               -- 录屏时间
            \`end_time\` INTEGER DEFAULT 0,                 -- 结束时间
            \`filename\` TEXT DEFAULT ""                    -- 录屏文件名
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[screen_recording]表成功')
        }



        sql = `CREATE TABLE IF NOT EXISTS logs (
            \`log_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 日志ID
            \`log_state\` INTEGER DEFAULT 0,               -- 日志状态 0=正常 1=异常
            \`log_type\` INTEGER DEFAULT 0,               -- 日志类型 0=面板日志 1=SSH日志
            \`log_time\` INTEGER DEFAULT 0,               -- 日志时间
            \`log_content\` TEXT DEFAULT ""      -- 日志内容
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[logs]表成功')
        }

        sql = `CREATE TABLE IF NOT EXISTS ssh_logs (
            \`ssh_log_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- SSH日志ID
            \`ssh_id\` INTEGER DEFAULT 0,                   -- SSH ID
            \`log_time\` INTEGER DEFAULT 0,                 -- 日志时间
            \`log_content\` TEXT DEFAULT ""        -- 日志内容
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[ssh_logs]表成功')
        }


        sql = `CREATE TABLE IF NOT EXISTS panel_logs (
            \`panel_log_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 面板日志ID
            \`panel_id\` INTEGER DEFAULT 0,                   -- 面板 ID
            \`log_time\` INTEGER DEFAULT 0,                   -- 日志时间
            \`log_content\` TEXT DEFAULT ""          -- 日志内容
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[panel_logs]表成功')
        }

        // 创建面板负载状态表
        sql = `CREATE TABLE IF NOT EXISTS panel_load_average (
            \`load_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 负载ID
            \`panel_id\` INTEGER DEFAULT 0,                 -- 面板ID
            \`five_minute\` TEXT DEFAULT "",       -- 5分钟负载
            \`ten_minute\` TEXT DEFAULT "",        -- 10分钟负载
            \`fifteen_minute\` TEXT DEFAULT "",    -- 15分钟负载
            \`cpu_usage\` TEXT DEFAULT "",         -- CPU使用率
            \`memory_usage\` TEXT DEFAULT "",      -- 内存使用率
            \`network_up\` TEXT DEFAULT "",        -- 上行流量
            \`network_down\` TEXT DEFAULT "",       -- 下行流量
            \`status\` INTEGER DEFAULT 0,                   -- 状态 0=正常 1=异常
            \`update_time\` INTEGER DEFAULT 0                   -- 更新时间
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[panel_load_average]表成功')
        }

        // 创建SSH负载状态表
        sql = `CREATE TABLE IF NOT EXISTS ssh_load_average (
            \`load_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 负载ID
            \`ssh_id\` INTEGER DEFAULT 0,                   -- SSH ID
            \`five_minute\` TEXT DEFAULT "",       -- 5分钟负载
            \`ten_minute\` TEXT DEFAULT "",        -- 10分钟负载
            \`fifteen_minute\` TEXT DEFAULT "",    -- 15分钟负载
            \`cpu_usage\` TEXT DEFAULT "",         -- CPU使用率
            \`memory_usage\` TEXT DEFAULT "",      -- 内存使用率
            \`status\` INTEGER DEFAULT 0,                   -- 状态 0=正常 1=异常
            \`update_time\` INTEGER DEFAULT 0               -- 更新时间
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[ssh_load_average]表成功')
        }


        // 创建资产信息表
        sql = `CREATE TABLE IF NOT EXISTS assets_info (
            \`asset_id\` INTEGER PRIMARY KEY AUTOINCREMENT,  -- 资产ID
            \`asset_type\` INTEGER DEFAULT 0,               -- 资产类型 0=面板 1=SSH
            \`asset_name\` TEXT DEFAULT "",        -- 资产名称
            \`asset_ip\` TEXT DEFAULT "",          -- 资产IP
            \`asset_status\` INTEGER DEFAULT 0,             -- 资产状态 0=正常 1=异常
            \`use_to\` TEXT DEFAULT "",            -- 用途
            \`admin\` TEXT DEFAULT "",             -- 管理员姓名
            \`area\` TEXT DEFAULT "",              -- 区域
            \`renew_price\` TEXT DEFAULT "",       -- 续费价格
            \`price\` TEXT DEFAULT "",              -- 购买价格
            \`end_time\` INTEGER DEFAULT 0,                 -- 到期时间
            \`content\` TEXT DEFAULT "",           -- 备注信息 支持markdown格式
            \`addtime\` INTEGER DEFAULT 0,                   -- 添加时间
            \`update_time\` INTEGER DEFAULT 0               -- 更新时间
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[assets_info]表成功')
        }

        // 创建代理信息表
        sql = `CREATE TABLE IF NOT EXISTS proxy_info (
            \`proxy_id\` INTEGER PRIMARY KEY AUTOINCREMENT,     -- 代理ID
            \`proxy_name\` TEXT DEFAULT "",                     -- 代理名称
            \`proxy_ip\` TEXT DEFAULT "",                       -- 代理IP
            \`proxy_port\` INTEGER DEFAULT 0,               -- 代理端口
            \`proxy_status\` INTEGER DEFAULT 0,             -- 代理状态 0=正常 1=异常
            \`proxy_type\` INTEGER DEFAULT 0,               -- 代理类型 0=HTTP/HTTPS 1=Socks5
            \`proxy_username\` TEXT DEFAULT "",             -- 代理用户名
            \`proxy_password\` TEXT DEFAULT "",             -- 代理密码
            \`addtime\` INTEGER DEFAULT 0,                   -- 添加时间
            \`update_time\` INTEGER DEFAULT 0               -- 更新时间
        )`

        if (this.DB_OBJ.prepare(sql).run()){
            console.log('创建[proxy_info]表成功')
        }
    }



    /**
     * 设置表名
     * @param {*} table_name 
     * @returns {db_obj} 返回数据库对象
     */
    table(table_name) {
        this.TABLE_NAME = table_name
        return this
    }


    /**
     * 设置条件
     * @param {*} where_str 
     * @param {*} where_params 
     * @returns {db_obj} 返回数据库对象
     */
    where(where_str, where_params) {
        this.WHERE_STR = where_str
        
        if(where_params === undefined){
            where_params = []
        }else if(!Array.isArray(where_params)){
            where_params = [where_params]
        }

        this.WHERE_PARAMS = where_params
        return this
    }


    /**
     * @name 查询字段
     * @param {string} fields 要查询的字段
     * @returns {db_obj} 返回数据库对象
     */
    field(fields){
        this.FIELDS = fields
        return this
    }


    /**
     * @name 限制返回的记录数
     * @param {int} offset 偏移量
     * @param {int} limit 返回的记录数
     * @returns {db_obj} 返回数据库对象
     * @example limit(0,10)
     */
    limit(offset, limit){
        if(!limit){
            limit = offset
            offset = 0
        }
        if(offset == 0 && limit == 1){
            this.LIMIT = [1]
        }else{
            this.LIMIT = [offset, limit]
        }
        
        return this
    }

    /**
     * @name 排序
     * @param {string} order 排序条件
     * @returns {db_obj} 返回数据库对象
     * @example order('id DESC')
     */
    order(order){
        this.ORDER = order
        return this
    }

    /**
     * @name 分组
     * @param {string} group 分组条件
     * @returns {db_obj} 返回数据库对象
     * @example group('id')
    */
    group(group){
        this.GROUP = group
        return this
    }

    /**
     * @name 分组条件
     * @param {string} having 分组条件
     * @returns {db_obj} 返回数据库对象
     * @example having('id > 10')
     */
    having(having){
        this.HAVING = having
        return this
    }

    /**
     * @name 连接查询
     * @param {string} join_table 表名
     * @param {string} on 连接条件
     * @param {string} join_type 连接类型 INNER  LEFT  RIGHT  FULL
     * @returns {db_obj} 返回数据库对象
     * @example join('table2','table1.id=table2.id','INNER')
     */
    join(join_table, on, join_type){
        if(!join_type){
            join_type = 'INNER';
        }
        this.JOIN = join_type + ' JOIN ' + join_table + ' ON ' + on
        return this
    }

    /**
     * @name UNION查询
     * @param {string} union_table 表名
     * @param {string} union_type UNION  UNION ALL
     * @returns {db_obj} 返回数据库对象
     * @example union('table2','UNION')
     * @example union('table2','UNION ALL')
     */
    union(union_table, union_type){
        if(!union_type){
            union_type = 'UNION'
        }
        if(union_type != 'UNION' && union_type != 'UNION ALL'){
            union_type = 'UNION'
        }

        this.UNION = union_type + ' ' + union_table
        return this
    }

    /**
     * @name DISTINCT查询
     * @param {bool} distinct 是否去重
     * @returns {db_obj} 返回数据库对象
     * @example distinct(false)
     * @example distinct(true)
     */
    distinct(distinct){
        if(distinct){
            this.DISTINCT = 'DISTINCT'
        }else{
            this.DISTINCT = ''
        }
        return this
    }

    /**
     * @name 构造SQL语句
     * @return {string} 返回SQL语句
     */
    buildSql(){
        let sql = "SELECT"
        if(this.DISTINCT){
            sql += ' ' + this.DISTINCT
        }
        sql += ' ' + this.FIELDS + ' FROM ' + this.TABLE_NAME

        if(this.JOIN){
            sql += ' ' + this.JOIN
        }

        if(this.WHERE_STR){
            sql += ' WHERE ' + this.WHERE_STR
        }

        if(this.GROUP){
            sql += ' GROUP BY ' + this.GROUP
        }

        if(this.HAVING){
            sql += ' HAVING ' + this.HAVING
        }
        if(this.ORDER){
            sql += ' ORDER BY ' + this.ORDER
        }
        if(this.LIMIT.length > 0){
            sql += ' LIMIT ' + this.LIMIT.join(',')
        }
        if(this.UNION){
            sql += ' ' + this.UNION
        }

        return sql
    }

    /**
     * 查询数据
     * @param {function} callback(rows) 回调函数
     */
    select(callback){
        let that = this
        let sql = that.buildSql()
        let rows = that.DB_OBJ.prepare(sql).all(that.WHERE_PARAMS)
        // 清空查询条件
        that.clear();

        // 返回查询结果
        if(callback){
            return callback(rows);
        }

        // 解密字段
        for(let i=0;i<rows.length;i++){
            rows[i] = that.fieldDecrypt(rows[i])
        }

        // 直接返回
        return rows;
    }

    /**
     * 查询一条数据
     * @param {function} callback 回调函数
     */
    find(callback){
        let data = this.limit(1).select()
        let result = data[0] || null

        if(callback){
            return callback(result)
        }
        return result
    }

    /**
     * 查询总数
     * @param {function} callback 回调函数，不传则直接返回
     * @returns {int} 返回总数
     */
    count(callback){
        let that = this
        that.FIELDS = 'COUNT(*) AS count'
        let sql = that.buildSql()
        let res = that.DB_OBJ.prepare(sql).get(that.WHERE_PARAMS)
        // 清空查询条件
        that.clear()
        if(callback){
            return callback(res.count)
        }
        // 直接返回
        return res.count
    }


    /**
     * 查询最大值
     * @param {string} field 字段名
     * @param {function} callback 回调函数 , 不传则直接返回
     * @returns {int} 返回最大值
     */
    max(field,callback){
        let that = this
        this.FIELDS = 'MAX(`' + field + '`) AS max'
        let sql = that.buildSql()

        let res = that.DB_OBJ.prepare(sql).get(that.WHERE_PARAMS)

        // 清空查询条件
        that.clear()

        // 返回查询结果
        if(callback){
            return callback(res.max)
        }
        // 直接返回
        return res.max
    }

    /**
     * 查询最小值
     * @param {string} field 字段名
     * @param {function} callback 回调函数
     * @example min('id',function(err, min){})
     */
    min(field,callback){
        let that = this
        this.FIELDS = 'MIN(`' + field + '`) AS min'
        let sql = that.buildSql()

        let res = that.DB_OBJ.prepare(sql).get(that.WHERE_PARAMS)

        // 清空查询条件
        that.clear()

        // 返回查询结果
        if(callback){
            return callback(res.min)
        }

        // 直接返回
        return res.min
    }

    /**
     * 查询平均值
     * @param {string} field 字段名
     * @param {function} callback 回调函数
     * @example avg('id',function(err, avg){})
     * @example avg('price',function(err, avg){})
     */
    avg(field,callback){
        let that = this
        this.FIELDS = 'AVG(`' + field + '`) AS avg'
        let sql = that.buildSql()

        let res = that.DB_OBJ.prepare(sql).get(that.WHERE_PARAMS)

        // 清空查询条件
        that.clear()

        // 返回查询结果
        if(callback){
            return callback(res.avg)
        }

        // 直接返回
        return res.avg
    }

    /**
     * 查询总和
     * @param {string} field 字段名
     * @param {function} callback 回调函数
     * @example sum('id',function(err, sum){})
     * @example sum('price',function(err, sum){})
     */
    sum(field,callback){
        let that = this
        this.FIELDS = 'SUM(`' + field + '`) AS sum'
        let sql = that.buildSql()

        let res = that.DB_OBJ.prepare(sql).get(that.WHERE_PARAMS)

        // 清空查询条件
        that.clear()

        // 返回查询结果
        if(callback){
            return callback(res.sum)
        }

        // 直接返回
        return res.sum
    }

    /**
     * @name 指定字段自增
     * @param {string} field 字段名
     * @param {int} step 步长
     * @param {function} callback 回调函数
     * @example inc('id',1,function(err, row){})
     * @example inc('price',10,function(err, row){})
     */
    inc(field, step, callback){
        let that = this
        let sql = 'UPDATE ' + that.TABLE_NAME + ' SET ' + field + '=' + field + '+' + step + ' WHERE ' + that.WHERE_STR

        let res = that.DB_OBJ.prepare(sql).run(that.WHERE_PARAMS);

        that.clear()

        // 返回影响的行数
        if(callback){
            return callback(res.changes);
        }

        // 直接返回
        return res.changes
    }

    /**
     * @name 指定字段自减
     * @param {string} field 字段名
     * @param {int} step 步长
     * @param {function} callback 回调函数
     * @example dec('id',1,function(err, row){})
     * @example dec('price',10,function(err, row){})
     */
    dec(field, step, callback){
        let that = this
        let sql = 'UPDATE ' + that.TABLE_NAME + ' SET ' + field + '=' + field + '-' + step + ' WHERE ' + that.WHERE_STR

        let res = that.DB_OBJ.prepare(sql).run(that.WHERE_PARAMS)

        that.clear()

        // 通过回调函数返回影响的行数
        if(callback){
            return callback(res.changes);
        }

        // 直接返回
        return res.changes
    }

    /**
     * @name 执行SQL语句返回受影响的行数
     * @param {string} sql SQL语句
     * @param {array} params 参数
     * @param {function} callback 回调函数,不传则直接返回
     * @return {int} 返回受影响的行数
     * @example exec('SELECT * FROM table WHERE id=?',[1],function(err, rows){})
     * @example exec('UPDATE table SET name=? WHERE id=?',['test',1],function(err, rows){})
     * @example exec('DELETE FROM table WHERE id=?',[1],function(err, rows){})
     */
    exec(sql, params, callback){
        let res = this.DB_OBJ.prepare(sql).run(params)
        if(callback){
            return callback(res.changes);
        }

        return res.changes
    }

    /**
     * @name 执行SQL语句返回查询结果
     * @param {string} sql SQL语句
     * @param {array} params 参数
     * @param {function} callback 回调函数
     * @example query('SELECT * FROM table WHERE id=?',[1],function(err, rows){})
     * @example query('UPDATE table SET name=? WHERE id=?',['test',1],function(err, rows){})
     * @example query('DELETE FROM table WHERE id=?',[1],function(err, rows){})
     */
    query(sql, params, callback){
        let res = this.DB_OBJ.prepare(sql).all(params)
        if(callback){
            return callback(res);
        }

        return res
    }

    /**
     * @name 修改指定字段
     * @param {string} field 字段名
     * @param {string} value 值
     * @param {function} callback 回调函数
     * @example setField('name','test',function(err, row){})
     * @example setField('price',100,function(err, row){})
     * @example setField('status',1,function(err, row){})
     */
    setField(field, value, callback){
        let that = this
        let sql = 'UPDATE ' + that.TABLE_NAME + ' SET ' + field + '=? WHERE ' + that.WHERE_STR

        // 加密字段
        let pdata = {
            [field]: value
        }
        pdata = that.fieldEncrypt(pdata)
        value = pdata[field]

        let res = that.DB_OBJ.prepare(sql).run([value].concat(that.WHERE_PARAMS))

        // 清空查询条件
        that.clear()

        // 返回影响的行数
        if(callback){
            return callback(res.changes);
        }

        // 直接返回
        return res.changes
    }

    /**
     * @name 修改指定字段
     * @param {string} field 字段名
     * @param {string} value 值
     * @param {function} callback 回调函数
     * @example set('name','test',function(err, row){})
     * @example set('price',100,function(err, row){})
     */
    set(field, value, callback){
        return this.setField(field, value, callback)
    }


    /**
     * @name 获取指定字段值
     * @param {string} field 字段名
     * @param {function} callback 回调函数, 不传则直接返回
     * @example getField('name',function(err, value){})
     * @example getField('price',function(err, value){})
     */
    getField(field,callback){
        let that = this
        this.FIELDS = field
        let sql = that.buildSql()

        let res = that.DB_OBJ.prepare(sql).get(that.WHERE_PARAMS)

        // 解密字段
        res = that.fieldDecrypt(res)

        // 清空查询条件
        that.clear()
        if(!res){
            if(callback){
                return callback(null)
            }
            return null
        }
        let value = res[field] || null

        // 返回查询结果
        if(callback){
            return callback(value)
        }

        // 直接返回
        return value
    }

    /**
     * @name 获取指定字段值
     * @param {string} field 字段名
     * @param {function} callback 回调函数, 不传则直接返回
     * @example get('name',function(err, value){})
     * @example get('price',function(err, value){})
     */
    get(field,callback){
        return this.getField(field,callback)
    }

    /**
     * @name 获取指定字段值
     * @param {string} field 字段名
     * @param {function} callback 回调函数, 不传则直接返回
     * @return {mixed} 返回字段值
     * @example value('name',function(err, value){})
     * @example value('price',function(err, value){})
     */
    value(field,callback){
        return this.getField(field,callback)
    }



    /**
     * @name 插入数据
     * @param {array} data
     * @param {function} callback 回调函数
     * @return {int} 返回插入的ID
     */
    insert(data,callback){
        data = this.fieldEncrypt(data)
        let keys = Object.keys(data)
        let values = Object.values(data)
        // 构造SQL语句
        let sql = 'INSERT INTO ' + this.TABLE_NAME + ' (' + keys.join(',') + ') VALUES (' + keys.map(() => '?').join(',') + ')'

        // 执行SQL语句
        let res = this.DB_OBJ.prepare(sql).run( values)

        // 清空查询条件
        this.clear()

        // 返回插入的ID
        if(callback){
            return callback(res.lastInsertRowid);
        }

        // 直接返回
        return res.lastInsertRowid
    }

    /**
     * @name 插入数据
     * @param {array} data
     * @param {function} callback 回调函数, 不传则直接返回
     * @return {int} 返回插入的ID
     * @example add({name:'test',price:100},function(err, id){})
     * @example add({name:'test',price:100},function(err, id){})
     */
    add(data,callback){
        return this.insert(data,callback)
    }

    /**
     * @name 更新数据
     * @param {array} data
     * @param {function} callback 回调函数
     * @return {int} 返回影响的行数
     */
    update(data,callback,not_encrypt){
        let that = this
        if(!not_encrypt){
            data = that.fieldEncrypt(data)
        }
        let keys = Object.keys(data)
        let values = Object.values(data)
        // 构造SQL语句
        let sql = 'UPDATE ' + that.TABLE_NAME + ' SET ' + keys.map((key) => key + '=?').join(',') + ' WHERE ' + that.WHERE_STR

        // 执行SQL语句
        let res = that.DB_OBJ.prepare(sql).run(values.concat(that.WHERE_PARAMS))

        // 清空查询条件
        that.clear()

        // 返回影响的行数
        if(callback){
            return callback(res.changes);
        }

        // 直接返回
        return res.changes
    }

    /**
     * @name 更新数据
     * @param {array} data
     * @param {function} callback 回调函数, 不传则直接返回
     * @return {int} 返回影响的行数
     * @example save({name:'test',price:100},function(err, rows){})
     * @example save({name:'test',price:100},function(err, rows){})
     */
    save(data,callback){
        return this.update(data,callback)
    }


    /**
     * @name 删除数据
     * @param {function} callback 回调函数
     * @return {int} 返回影响的行数
     */
    delete(callback){
        let sql = 'DELETE FROM ' + this.TABLE_NAME + ' WHERE ' + this.WHERE_STR

        let res = this.DB_OBJ.prepare(sql).run(this.WHERE_PARAMS)

        // 清空查询条件
        this.clear()

        // 返回影响的行数
        if(callback){
            return callback(res.changes);
        }

        // 直接返回
        return res.changes

    }

    /**
     * @name 删除数据
     * @param {function} callback 回调函数
     * @return {int} 返回影响的行数
     * @example remove(function(err, rows){})
     * @example remove(function(err, rows){})
     */
    remove(callback){
        return this.delete(callback)
    }
    
    /**
     * @name 删除数据
     * @param {function} callback 回调函数
     * @return {int} 返回影响的行数
     * @example del(function(err, rows){})
     * @example del(function(err, rows){})
     */
    del(callback){
        return this.delete(callback)
    }

    /**
     * @name 关闭数据库
     */
    close(){
        if(this.DB_OBJ == null){
            return
        }
        // 不关闭数据库
        if(this.NOT_CLONE) return

        this.DB_OBJ.close()
        this.DB_OBJ = null
    }

    /**
     * @name 清空查询条件
     */
    clear(){
        this.WHERE_STR = ''
        this.WHERE_PARAMS = []
        this.close();
    }
}

module.exports = { Sqlite }