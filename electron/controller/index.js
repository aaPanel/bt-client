'use strict';
const { Controller } = require('ee-core');
const { pub } = require("../class/public.js");
const path = require('path');
const Services = require('ee-core/services');
const { autoUpdater } = require("electron-updater");


class IndexController extends Controller {
    
    constructor(ctx) {
        super(ctx);
    }

    /**
     * @name 获取当前语言和支持的语言列表
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async get_languages(args,event) {
        let channel = args.channel;
        let filename = path.resolve(pub.get_language_path(), 'settings.json');
        let body = pub.read_file(filename)
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
        let current = pub.get_language();

        let data = {
            languages: JSON.parse(body),
            current: current
        };

        return pub.send_success(event,channel,data)
    }


    /**
     * @name 设置当前语言
     * @param {Object} args 参数
     * {
     *      language: string, // 语言
     * }
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async set_language(args,event) {
        let channel = args.channel;
        let language = args.data.language;
        pub.C('language',language)
        pub.write_log(pub.lang('设置语言为: {}',language))

        // 清除缓存
        pub.cache_del('language')
        pub.cache_del('languages')
        pub.cache_del('lang_data')
        pub.cache_del('client_lang')

        return pub.send_success_msg(event,channel,pub.lang('设置成功'))
    }

    /**
     * @name 获取客户端语言包
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async get_client_language(args,event) {
        let channel = args.channel;
        let language = pub.get_language();
        let filename = path.resolve(pub.get_language_path(), language+'/client.json');
        if(!pub.is_file(filename)){
            filename = path.resolve(pub.get_language_path(),'zh/client.json');
        }
        let body = pub.read_file(filename)
        if (!body) {
            body = '{}'
        }
        return pub.send_success(event,channel,JSON.parse(body))
    }

    /**
     * @name 获取服务端语言包
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async get_server_language(args,event) {
        let channel = args.channel;
        let language = pub.get_language();
        let filename = path.resolve(pub.get_language_path(), language+'/server.json');
        if(!pub.is_file(filename)){
            filename = path.resolve(pub.get_language_path(), 'zh/server.json');
        }
        let body = pub.read_file(filename)
        if(!body) body = '{}'
        return pub.send_success(event,channel,JSON.parse(body))
    }


    /**
     * @name 判断是否配置管理密码
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async has_password(args,event) {
        let channel = args.channel;
        let password = pub.C('password');
        if(password){
            return pub.send_success_msg(event,channel,pub.lang('已设置管理密码'))
        }else{

            args.data = {
                password: pub.random_string(16)
            }
            this.set_password(args)
            if (pub.C('password')){
                return pub.send_success_msg(event,channel,pub.lang('已设置管理密码'))
            }
            return pub.send_error_msg(event,channel,pub.lang('未设置管理密码'))
        }
    }

    /**
     * @name 设置管理密码
     * @param {Object} args 参数
     * {
     *      password: string, // 密码
     * }
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async set_password(args,event) {
        let channel = args.channel;
        let password = args.data.password;
        if(!password){
            return pub.send_error_msg(event,channel,pub.lang('密码不能为空'))
        }
        if(password.length < 8){
            return pub.send_error_msg(event,channel,pub.lang('密码长度不能小于8位'))
        }
        let salt = pub.C('password_salt')
        if(!salt){
            salt = pub.random_string(16)
            pub.C('password_salt',salt)
        }
        let password_hash = pub.md5(pub.md5(password)+salt)
        pub.C('password',password_hash)

        // 解密所有信息
        pub.M('panel_info').decryptAll();
        pub.M('ssh_info').decryptAll();
        pub.M('proxy_info').decryptAll();

        // 保存密码加密方式
        if(!pub.C('init_password') || pub.C('not_password') === true){
            pub.C('init_password',pub.aes_default_encrypt(password))
            pub.C('not_password',true);
            pub.C('password_hash',password_hash)
        }

        global.password_hash = password_hash;

        // 重新加密所有信息
        pub.M('panel_info').encryptAll();
        pub.M('ssh_info').encryptAll();
        pub.M('proxy_info').encryptAll();
        
        return pub.send_success_msg(event,channel,pub.lang('管理密码设置成功'))
    }


    /**
     * @name 设置免密码登录
     * @param {Object} args 参数
     * @param {Object} event 事件
     */
    async not_password(args,event) {
        let channel = args.channel;
        let password = args.data.password;
        let not_password = args.data.not_password


        if(!password){
            return pub.send_error_msg(event,channel,pub.lang('密码不能为空'))
        }
        // 验证密码
        let salt = pub.C('password_salt');
        let password_hash = pub.md5(pub.md5(password)+salt)
        let password_db = pub.C('password');
        if(password_hash != password_db){
            return pub.send_error_msg(event,channel,pub.lang('密码错误'))
        }

        if(!not_password){
            // 取消免密码登录
            pub.C('not_password',false);
            pub.C('password_hash','');
        }else{
            // 设置免密码登录
            pub.C('password_hash',password_hash);
            pub.C('not_password',true);
        }

        return pub.send_success_msg(event,channel,pub.lang('设置成功'))
    }

    /**
     * @name 设置同步密码
     * @param {Object} args 参数
     * {
     *     password: string, // 密码
     * }
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async set_sync_password(args,event) {
        let channel = args.channel;
        let password = args.data.password;
        if(!password){
            return pub.send_error_msg(event,channel,pub.lang('同步密码不能为空'))
        }
        let password_hash = pub.md5(pub.md5(password))
        pub.C('sync_password',password_hash)
        Services.get('user').syncPanelToCloud();
        Services.get('user').syncSshToCloud();
        return pub.send_success_msg(event,channel,pub.lang('设置成功'))
    }


    /**
     * @name 验证管理密码
     * @param {Object} args 参数
     * {
     *      password: string, // 密码
     * }
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async check_password(args,event) {
        let channel = args.channel;
        let password = args.data.password;
        if(!password){
            return pub.send_error_msg(event,channel,pub.lang('密码不能为空'))
        }

        let salt = pub.C('password_salt');
        let password_hash = pub.md5(pub.md5(password)+salt)
        let password_db = pub.C('password');
        if(password_hash != password_db){
            return pub.send_error_msg(event,channel,pub.lang('密码错误'))
        }

        global.password_hash = password_hash;
        global.socks.syncProxy(); // 同步代理池
        Services.get('user').getPanelOv(); // 同步面板信息

        // 从云端同步面板和SSH信息
        Services.get('user').syncPanelFromCloud();
        Services.get('user').syncSshFromCloud();

        return pub.send_success_msg(event,channel,pub.lang('密码正确'))
		}
		/**
		 * @name 手动同步
		 * @param {Object} args 参数
		 * @param {Object} event 事件
		 * @returns {Object} 返回结果
		 */
		async manual_sync(args, event) { 
			let channel = args.channel;
			Services.get('user').syncPanelToCloud();
			Services.get('user').syncSshToCloud();
			return pub.send_success_msg(event, channel, pub.lang('同步成功'));
		}

    /**
     * @name 获取配置信息
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async get_config(args,event) {
        let channel = args.channel;
        let data = pub.config_get();
        if (!data) {
            data = {
                max_common_use:10,
                language:"zh",
                sync_cloud:false,
                exit_action:"exit"
            }
        }

        if(data.exit_action == undefined){
            data.exit_action = "exit";
        }

        if(data.sync_cloud == undefined){
            data.sync_cloud = false;
        }

        if(data.not_password == undefined){
            data.not_password = false;
        }

        if(data.sync_password == undefined){
            data.sync_password = "";
        }

        data.version = pub.getVersion();

        return pub.send_success(event,channel,data)
    }

    /**
     * @name 设置配置信息
     * @param {Object} args 参数
     * {
     *     key: string, // 键
     *    value: string, // 值
     * }
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async set_config(args,event) {
        let channel = args.channel;
        let key = args.data.key;
        let value = args.data.value;
        pub.config_set(key,value);
        // 开启同步时，同步面板和SSH信息
        if(key == 'sync_cloud' && value == true){
            Services.get('user').syncPanelToCloud();
            Services.get('user').syncSshToCloud();
        }
        return pub.send_success_msg(event,channel,pub.lang('设置成功'))
    }


    /**
     * @name 检查更新
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回结果
     */
    async check_update(args,event) {
        let channel = args.channel;
        autoUpdater.checkForUpdates();

        const status = {
            error: -1,
            available: 1,
            noAvailable: 2,
            downloading: 3,
            downloaded: 4,
          }
        autoUpdater.on('update-available', (info) => {
            info.status = status.available;
            info.desc = pub.lang('有可用更新');
            pub.send_success(event,channel,info)
            
          })

        autoUpdater.on('update-not-available', (info) => {
            info.status = status.noAvailable;
            info.desc = pub.lang('没有可用更新');
            pub.send_success(event,channel,info)
        })

    }
}

IndexController.toString = () => '[class IndexController]';
module.exports = IndexController;  