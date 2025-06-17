'use strict';
const { Controller } = require('ee-core');
const Services = require('ee-core/services');
const { pub } = require("../class/public.js");

/**
 * example
 * @class
 */
class UserController extends Controller {

    constructor(ctx) {
        super(ctx);
    }

    /**
     * @name 绑定用户
     * @param {object} args 
     * @param {object} event 
     */
    bind(args, event) {
        let channel = args.channel;
        let username = pub.trim(args.data.username);
        let password = pub.trim(args.data.password);

        if(!username || !password){
            return pub.send_error(event,channel,'用户名或密码不能为空');
        }

        // 请求数据
        let pdata = {
            'username':username,
            'password':pub.md5(password),
            'client_id': Services.get('user').get_client_id(), // 32位唯一标识
            'mac':pub.get_mac()
        }

        let url = 'https://dj.bt.cn/client/bind';
        pub.http_post(url,pdata,function(response,error){
            if(error){
                return pub.send_error(event,channel,pub.lang('绑定失败: {}',error.message));
            }
            let data = response.body;
            if(typeof data == 'string'){
                data = JSON.parse(data);
            }
            if(data.status == false){
                return pub.send_error(event,channel,data.msg);
            }
            
            if(Services.get('user').set_user_info(data.data)){
                return pub.send_success(event,channel,pub.lang('绑定成功'));
            }

            return pub.send_error(event,channel,pub.lang('绑定失败，用户数据写入失败'));
        })
    }


    /**
     * @name 判断用户是否绑定
     * @param {object} args
     * @param {object} event
     */
    is_bind(args, event) {
        let channel = args.channel;
        if(Services.get('user').is_bind()){
            return pub.send_success(event,channel,pub.lang('用户已绑定'));
        }
        return pub.send_error(event,channel,pub.lang('用户未绑定'));
    }


    /**
     * @name 获取用户信息
     * @param {object} args
     * @param {object} event
     */
    get_user_info(args, event) {
        let channel = args.channel;
        let bind_info = Services.get('user').get_bind_info();
        if(bind_info.token && bind_info.secret_key){
            let user_info = {
                'username':bind_info.username,
                'uid':bind_info.uid,
                'nickname':bind_info.nickname,
                'bind_time':bind_info.bind_time
            }

            return pub.send_success(event,channel,user_info);
        }

        return pub.send_error(event,channel,{});
    }

    /**
     * @name 解绑用户
     * @param {object} args
     * @param {object} event
     */
    unbind(args, event) {
        let channel = args.channel;
        if(Services.get('user').unbind()){
            return pub.send_success(event,channel,pub.lang('解绑成功'));
        }
        return pub.send_error(event,channel,pub.lang('解绑失败'));
    }


    /**
     * @name 同步面板信息到云端
     * @param {object} args
     * @param {object} event
     */
    sync_panel_to_cloud(args, event) {
        let channel = args.channel;

        // 请求数据
        let pdata = {
            token: 'xxxxxxxx', // 32位token
            data: 'xxxxxx' // 加密后的JSON数据，加密算法：AES-128-CBC
            // key = secret_key 中的偶数位
            // iv = secret_key 中的奇数位
            // data = base64(en_aes_cbc(JSON.stringify(pdata), key, iv))

            // 加密前的数据格式
            // {
            //     "uid":1,
            //     "action":"add/modify/sync", // add:新增，modify:修改，sync:同步（先删空）
            //     "data":["加密数据，此数据无需解密，一行一条根据操作类型存入数据库即可"]
            // }
        }



        // 请求到云端
        // 要求返回数据格式
        // {
        //     "status":true,
        //     "msg":"操作成功",
        //     "data":"xxxx" // 加密后的返回数据，加密算法：AES-128-CBC，key和iv同上
        // }

        // let url = 'https://www.bt.cn/api/PcClient/sync_panel';
        // pub.http_post(url,pdata,function(response,error){
            
        // })

        return pdata

    }


    /**
     * @name 从云端获取面板信息
     * @param {object} args
     * @param {object} event
     */
    get_panel_from_cloud(args, event) {
        let channel = args.channel;

        // 请求数据
        let pdata = {
            token: 'xxxxxxxx', // 32位token
            data: 'xxxxxx' // 加密后的JSON数据，加密算法：AES-256-CBC
        }

        // 请求到云端
        // 要求返回数据格式
        // {
        //     "status":true,
        //     "msg":"操作成功",
        //     "data":"xxxx" // 加密后的返回数据，加密算法：AES-256-CBC，key和iv同上
        // }



    }




}

UserController.toString = () => '[class UserController]';
module.exports = UserController;  