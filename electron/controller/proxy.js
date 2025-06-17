'use strict';
const { Controller } = require('ee-core');
const Services = require('ee-core/services');
const { pub } = require("../class/public.js");
const path = require('path');
const request = require('request');
const { SocksProxyAgent } = require("socks-proxy-agent");

const dns = require('dns');



// `CREATE TABLE IF NOT EXISTS proxy_info (
//             \`proxy_id\` INTEGER PRIMARY KEY AUTOINCREMENT,     -- 代理ID
//             \`proxy_name\` TEXT DEFAULT "",                     -- 代理名称
//             \`proxy_ip\` TEXT DEFAULT "",                       -- 代理IP
//             \`proxy_port\` INTEGER DEFAULT 0,               -- 代理端口
//             \`proxy_status\` INTEGER DEFAULT 0,             -- 代理状态 0=正常 1=异常
//             \`proxy_type\` INTEGER DEFAULT 0,               -- 代理类型 0=HTTP/HTTPS 1=Socks5
//             \`proxy_username\` TEXT DEFAULT "",             -- 代理用户名
//             \`proxy_password\` TEXT DEFAULT "",             -- 代理密码
//             \`addtime\` INTEGER DEFAULT 0,                   -- 添加时间
//             \`update_time\` INTEGER DEFAULT 0               -- 更新时间
//         )`


class ProxyController extends Controller {
    
    constructor(ctx) {
        super(ctx);
    }

    /**
     * @name 获取代理列表
     * @param {Object} args 参数
     * @param {Object} event 事件
     * @returns {Object} 返回代理列表
     */
    async getProxyList(args, event) {
        let channel = args.channel
        let proxy_list = pub.M('proxy_info').order('proxy_id DESC').select()
        return pub.send_success(event,channel, proxy_list)
    }


    /**
     * @name 验证代理服务器是否可用
     * @param {Object} proxy_info 代理信息
     * @param {Function} callback 回调函数
     * @returns {Boolean} 返回验证结果
     */
    checkProxy(proxy_info,callback) {
        let test_url = 'https://www.bt.cn/api/panel/get_ip_info'
        let headers = {
            'User-Agent':'BT-Panel/PcClient 1.0'
        }
        let timeout = 3000
        // 代理类型 0=HTTP 1=HTTPS 2=Socks5
        if(proxy_info.proxy_type in [0,1]) {
            let proxy = ''
            let protocol = proxy_info.proxy_type == 0 ? 'http' : 'https';
            if(proxy_info.proxy_username && proxy_info.proxy_password) {
                proxy = `${protocol}://${proxy_info.proxy_username}:${proxy_info.proxy_password}@${proxy_info.proxy_ip}:${proxy_info.proxy_port}`
            }else{
                proxy = `${protocol}://${proxy_info.proxy_ip}:${proxy_info.proxy_port}`
            }
            request.get(test_url,{proxy:proxy,headers:headers,timeout:timeout},(err,res,body)=>{
                if(err) {
                    callback(false,err)
                }else{
                    callback(pub.trim(body),null)
                }
            });
            
        }else{
            let proxy_id = -1;
            dns.resolve('www.bt.cn', (err, address) => {
                if(err) {
                    return callback(false,err);
                }

                // pub.debug(address)

                let match_addr = []
                if(typeof address === 'string'){
                    address = [address]
                }else{
                    address.forEach((addr)=>{
                        match_addr.push(addr);
                    });
                }

                global.socks.setProxy({
                    proxy_id: proxy_id,
                    proxy_host: proxy_info.proxy_ip,
                    proxy_port: proxy_info.proxy_port,
                    proxy_username: proxy_info.proxy_username,
                    proxy_password: proxy_info.proxy_password,
                    match_addr: match_addr
                });

                let proxy_url = `socks5://${global.socks.address}:${global.socks.port}`;
                let proxyAgent = new SocksProxyAgent(proxy_url);
                request.get({url:test_url,agent:proxyAgent,headers:headers,timeout:timeout},(err,res,body)=>{
                    global.socks.delProxy(proxy_id);
                    if(err) {
                        callback(null,err);
                    }else{
                        try{
                            let res = JSON.parse(body);
                            if(res){
                                let keys = Object.keys(res)
                                let ip_info = res[keys[0]]
                                ip_info.ip = keys[0]
                                callback(ip_info,null);
                            }else{
                                callback(null,new Error(pub.lang('验证失败')));
                            }
                        }catch(e){
                            callback(null,new Error(pub.lang('验证失败')));
                        }
                    }
                });
            })
        }
    }

    /**
     * @name 添加代理
     * @param {Object} args {
     *      {String} channel 通道
     *      {Object} data {
     *          {String} proxy_name 代理名称
     *          {String} proxy_ip 代理IP
     *          {Number} proxy_port 代理端口 
     *          {Number} proxy_type 代理类型 0=HTTP 1=HTTPS 2=Socks5
     *          {String} proxy_username 代理用户名 可为空
     *          {String} proxy_password 代理密码 可为空
     *      }
     * } 参数
     * @param {Object} event 事件
     * @returns {Object} 返回添加结果
     */
    async addProxy(args, event) {
        let channel = args.channel
        let proxy_name = pub.trim(args.data.proxy_name)
        let proxy_ip = pub.trim(args.data.proxy_ip)
        let proxy_port = args.data.proxy_port
        let proxy_type = args.data.proxy_type
        let proxy_username = pub.trim(args.data.proxy_username)
        let proxy_password = pub.trim(args.data.proxy_password)


        // 参数校验
        if(!proxy_name  || !proxy_ip || !proxy_port  || !proxy_type in [0,1,2]) {
            return pub.send_error_msg(event,channel, pub.lang('参数错误'))
        }

        // HTTP/HTTPS代理时，不支持认证
        if(proxy_type in [0,1] && (proxy_username || proxy_password)) {
            return pub.send_error_msg(event,channel, pub.lang('抱歉，暂不支持需要认证的HTTP代理'))
        }

        // 当填写了用户名时，必须填写密码
        if(proxy_username && !proxy_password) {
            return pub.send_error_msg(event,channel, pub.lang('密码不能为空'))
        }

        // 判断代理是否存在
        let proxy_info = pub.M('proxy_info').where('proxy_ip=? AND proxy_port=?',[proxy_ip,proxy_port]).find()
        if(proxy_info) {
            return pub.send_error_msg(event,channel, pub.lang('代理服务器已存在,请勿重复添加'))
        }
        
        
        let addtime = pub.time()
        let update_time = addtime
        let pdata = {
            proxy_name: proxy_name,
            proxy_ip: proxy_ip,
            proxy_port: Number(proxy_port),
            proxy_status: 1,
            proxy_type: proxy_type,
            proxy_username: proxy_username,
            proxy_password: proxy_password,
            addtime: addtime,
            update_time: update_time
        }

        
        // 验证代理服务器是否可用
        this.checkProxy(pdata,function(ip_info,err){
            if(err) {
                // 代理服务器连接失败
                pub.log(err)
                // return pub.send_error_msg(event,channel, pub.lang('代理服务器验证失败:{}',err.message))
            }

            let ip = proxy_ip;
            if(typeof ip_info === 'string') {
                ip_info = JSON.parse(ip_info);
            }

            if(ip_info && ip_info.ip) {
                ip = ip_info.ip;
                if(ip_info.country) {
                    let ip_area = [];
                    if(ip_info.country) ip_area.push(ip_info.country);
                    if(ip_info.region) ip_area.push(ip_info.region);
                    if(ip_info.city) ip_area.push(ip_info.city);
                    if(ip_info.carrier) ip_area.push(ip_info.carrier);
                    ip += '['+ip_area.join(' ') + ']';
                }
            }


            // 验证通过,插入数据
            if(pub.M('proxy_info').insert(pdata)){
                global.socks.syncProxy();
                if(!ip_info) {
                    return pub.send_success_msg(event,channel, pub.lang('添加成功,但测试代理服务器连接异常:{}',ip))
                }
                return pub.send_success_msg(event,channel, pub.lang('添加成功,代理服务器出口IP为:{}',ip))
            }else{
                return pub.send_error_msg(event,channel, pub.lang('添加失败：插入数据失败'))
            }
        })
    }

    /**
     * @name 修改代理
     * @param {Object} args {
     *      {String} channel 通道
     *      {Object} data {
     *          {Number} proxy_id 代理ID
     *          {String} proxy_name 代理名称
     *          {String} proxy_ip 代理IP
     *          {Number} proxy_port 代理端口
     *          {Number} proxy_type 代理类型 0=HTTP 1=HTTPS 2=Socks5
     *          {String} proxy_username 代理用户名 可为空
     *          {String} proxy_password 代理密码 可为空
     *   }
     * } 参数
     */
    async modifyProxy(args, event) {
        let channel = args.channel
        let proxy_id = args.data.proxy_id
        let proxy_name = pub.trim(args.data.proxy_name)
        let proxy_ip = pub.trim(args.data.proxy_ip)
        let proxy_port = args.data.proxy_port
        let proxy_type = args.data.proxy_type
        let proxy_username = pub.trim(args.data.proxy_username)
        let proxy_password = pub.trim(args.data.proxy_password)


        // 参数校验
        if(!proxy_id || !proxy_name || !proxy_ip || !proxy_port || !proxy_type in [0,1,2]) {
            return pub.send_error_msg(event,channel, pub.lang('参数错误'))
        }

        // HTTP/HTTPS代理时，不支持认证
        if(proxy_type in [0,1] && (proxy_username || proxy_password)) {
            return pub.send_error_msg(event,channel, pub.lang('抱歉，暂不支持需要认证的HTTP代理'))
        }

        // 当填写了用户名时，必须填写密码
        if(proxy_username && proxy_password == '') {
            return pub.send_error_msg(event,channel, pub.lang('密码不能为空'))
        }

        // 判断代理是否存在
        let proxy_info = pub.M('proxy_info').where('proxy_id=?',proxy_id).find()
        if(!proxy_info) {
            return pub.send_error_msg(event,channel, pub.lang('指定代理服务器配置不存在'))
        }

        let update_time = pub.time()
        let data = {
            proxy_name: proxy_name,
            proxy_ip: proxy_ip,
            proxy_port: proxy_port,
            proxy_type: proxy_type,
            proxy_username: proxy_username,
            proxy_password: proxy_password,
            update_time: update_time
        }

        // 验证代理服务器是否可用
        this.checkProxy(data,function(ip_info,err){
            if(err) {
                // 代理服务器连接失败
                pub.log(err)
                // return pub.send_error_msg(event,channel, pub.lang('代理服务器验证失败:{}',err.message))
            }


            let ip = proxy_ip;
            if(typeof ip_info === 'string') {
                ip_info = JSON.parse(ip_info);
            }
            if(ip_info && ip_info.ip) {
                ip = ip_info.ip;
                if(ip_info.country) {
                    let ip_area = [];
                    if(ip_info.country) ip_area.push(ip_info.country);
                    if(ip_info.region) ip_area.push(ip_info.region);
                    if(ip_info.city) ip_area.push(ip_info.city);
                    if(ip_info.carrier) ip_area.push(ip_info.carrier);
                    ip += '['+ip_area.join(' ') + ']';
                }
            }

            // 验证通过,更新数据
            if(pub.M('proxy_info').where('proxy_id=?',proxy_id).update(data)){
                global.socks.syncProxy();
                if(!ip_info) {
                    return pub.send_success_msg(event,channel, pub.lang('修改成功,但测试代理服务器连接异常:{}',ip))
                }
                return pub.send_success_msg(event,channel, pub.lang('修改成功，代理服务器出口IP为:{}',ip))
            }else{
                return pub.send_error_msg(event,channel, pub.lang('修改失败：更新数据失败'))
            }

        })

    }

    /**
     * @name 删除代理
     * @param {Object} args {
     *      {String} channel 通道
     *      {Object} data {
     *          {Number} proxy_id 代理ID
     *     }
     * } 参数
     */
    async delProxy(args, event) {
        let channel = args.channel
        let proxy_id = args.data.proxy_id
        // 判断代理是否存在
        let proxy_info = pub.M('proxy_info').where('proxy_id=?',proxy_id).find()
        if(!proxy_info) {
            return pub.send_error_msg(event,channel, pub.lang('指定代理服务器配置不存在'))
        }

        if(pub.M('proxy_info').where('proxy_id=?',proxy_id).delete()){
            // 重置使用该代理的对象
            pub.M('panel_info').where('proxy_id=?',[proxy_id]).update({proxy_id:0})
            pub.M('ssh_info').where('proxy_id=?',[proxy_id]).update({proxy_id:0})
            global.socks.syncProxy();
            return pub.send_success_msg(event,channel, pub.lang('删除成功'))
        }else{
            return pub.send_error_msg(event,channel, pub.lang('删除失败'))
        }
    }
}



ProxyController.toString = () => '[class ProxyController]';
module.exports = ProxyController;  