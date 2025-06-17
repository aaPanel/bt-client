'use strict';
const { Service } = require('ee-core');
const { pub } = require("../class/public.js");
const CryptoJS = require('crypto-js');

class UserService extends Service {

    constructor(ctx) {
        super(ctx);
        this.sync_password = pub.C('sync_password');
    }

    /**
     * @name 获取客户端唯一标识 - client_id
     * @param {object} args 
     * @param {object} event 
     */
    get_client_id(args, event) {
        let client_id_file = pub.get_data_path() + '/user.json';
        let client_id = "";
        if (pub.is_file(client_id_file)) {
            let f_body = pub.read_file(client_id_file);
            let f_json = JSON.parse(f_body);
            if (f_json.client_id && f_json.client_id.length == 32) {
                return f_json.client_id;
            }
        }

        let pdata = {
            'mac': pub.get_mac(),
            'ip': pub.get_ip(),
            'time': pub.time()
        }

        client_id = pub.md5(JSON.stringify(pdata));
        pdata.client_id = client_id;
        pub.write_file(client_id_file, JSON.stringify(pdata));
        return client_id;
    }

    /**
     * @name 统计安装量
     * @returns {void}
     */
    total() {
        // 每天统计一次
        let self = this;
        let now_date = pub.get_date().split(' ')[0];
        if (global.total_date != now_date) {
            global.total_date = now_date;
            let os_name = pub.get_os()
            let pdata = {
                mac: pub.get_mac(),
                client_id: this.get_client_id(),
                version: pub.getVersion(),
                os_type: os_name.split(' ')[0],
                os_name: os_name
            }
            let url = 'https://dj.bt.cn/client/total'
            pub.httpPost(url, pdata, function (res) {
                // console.log(res.body);
            })
        }

        // 每小时执行一次
        setTimeout(() => {
            self.total();
        }, 1000*3600);
    }

    /**
     * @name 获取绑定信息
     * @returns {object}
     */
    get_bind_info() {
        let client_id_file = pub.get_data_path() + '/user.json';
        if (!pub.is_file(client_id_file)) {
            this.get_client_id();
        }
        let f_body = pub.read_file(client_id_file);
        let f_json = JSON.parse(f_body);
        return f_json;
    }


    /**
     * @name 解除绑定
     * @return {boolean}
     */
    unbind() {
        let bind_info = this.get_bind_info();
        if (bind_info.token) delete bind_info.token;
        if (bind_info.secret_key) delete bind_info.secret_key;
        if (bind_info.username) delete bind_info.username;
        if (bind_info.uid) delete bind_info.uid;
        if (bind_info.nickname) delete bind_info.nickname;
        if (bind_info.bind_time) delete bind_info.bind_time;
        if (bind_info.cid) delete bind_info.cid;
        let client_id_file = pub.get_data_path() + '/user.json';
        pub.write_file(client_id_file, JSON.stringify(bind_info));
        return true;
    }



    /**
     * @name 判断用户是否绑定
     * @return {boolean}
     */
    is_bind() {
        let bind_info = this.get_bind_info();
        if (bind_info.token && bind_info.secret_key) {
            return true;
        }
        return false;
    }

    /**
     * @name 获取AES加密key和iv
     * @param {string} secret_key 32位secret_key
     * @returns {object} {key:string, iv:string}
     */
    get_key_iv(secret_key) {
        let key = '';
        let iv = '';
        for (let i = 0; i < secret_key.length; i++) {
            if (i % 2 == 0) {
                key += secret_key[i];
            } else {
                iv += secret_key[i];
            }
        }
        return { key: key, iv: iv };
    }


    /**
     * @name 构造请求参数
     * @param {object} pdata 请求数据
     * @param {string} secret_key 32位secret_key
     * @param {string} token 32位token
     * @returns {object}
     */
    get_params(pdata, secret_key, token) {
        if (!token) return pdata;

        let key_iv = this.get_key_iv(secret_key);
        let key = key_iv.key;

        let data = {
            'data': pub.aes_encrypt_ecb(JSON.stringify(pdata), key),
            'token': token
        }
        return data
    }

    /**
     * @name 解密返回数据
     * @param {string} data 返回数据
     * @param {string} secret_key 32位secret_key
     * @returns {object} 解密后的JSON对象
     */
    decrypt_data(data, secret_key) {
        if (!secret_key) return data;

        let key_iv = this.get_key_iv(secret_key);
        let key = key_iv.key;
        let iv = key_iv.iv;
        let res = pub.aes_decrypt(data, key, iv);
        return JSON.parse(res);
    }


    /**
     * @name AES-128-ECB加密 ZeroPadding
     * @param {string} data 数据
     * @param {string} key 密钥
     * @returns {string} 加密后的数据Base64
     * @example aesEncrypt('123456','1234567890123456')
     */
    aesEncrypt(data, key) {
        if (!data) return
        if (key.length != 16) return

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
    aesDecrypt(data, key) {
        if (!data) return
        if (key.length != 16) return
        try {
            let sKey = CryptoJS.enc.Utf8.parse(key);
            let decrypt = CryptoJS.AES.decrypt(data, sKey, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.ZeroPadding
            });
            return CryptoJS.enc.Utf8.stringify(decrypt).toString();
        } catch (e) {
            return '';
        }
    }


    /**
     * @name 获取AES加密密钥
     * @returns {string} 返回密钥
     * @example getAesKey()
     */
    getAesKey() {
        if (!this.sync_password) return '';
        // 取偶数位
        let key = '';
        for (let i = 0; i < this.sync_password.length; i++) {
            if (i % 2 == 0) {
                key += this.sync_password[i];
            }
        }
        return key;
    }


    /**
     * @name 同步面板信息到云端
     * @return {boolean}
     */
    async syncPanelToCloud() {
        if (pub.C('sync_cloud') === false || !this.sync_password) return false;
        let bind_info = this.get_bind_info();
        if (!bind_info.token) {
            return false;
        }

        // 获取面板和分组信息
        let panel_list = pub.M('panel_info').select();
        if (!panel_list) return false;

        let group_list = pub.M('panel_group').select();
        let proxy_list = pub.M('proxy_info').select();


        // 将分组信息转换为对象
        let group_object = {};
        for (let i = 0; i < group_list.length; i++) {
            let group = group_list[i];
            group_object[group.group_id] = group.group_name;
        }

        group_object[0] = pub.lang('默认')

        // 将代理信息转换为对象
        let proxy_object = {};
        for (let i = 0; i < proxy_list.length; i++) {
            let proxy = proxy_list[i];
            proxy_object[proxy.proxy_id] = proxy;
        }

        proxy_object[0] = {};



        let aes_key = this.getAesKey();
        let url = 'https://dj.bt.cn/panel/add_panel';
        let data = [];

        for (let i = 0; i < panel_list.length; i++) {
            let panel = panel_list[i];
            delete panel.panel_id;

            panel.group_name = group_object[panel.group_id];
            panel.proxy_info = proxy_object[panel.proxy_id];

            let panel_info = this.aesEncrypt(JSON.stringify(panel), aes_key);
            if (!panel_info) continue;
            data.push({ panel_hash: pub.md5(panel.url), panel_info: panel_info });
        }

        // 面板信息列表
        let pdata = this.get_params(data, bind_info.secret_key, bind_info.token);

        // 发送数据
        pub.http_post(url, pdata, function (response, error) {
            if (error) {
                return false;
            }
            let data = response.body;
            // console.log(data);
            if (typeof data == 'string') {
                data = JSON.parse(data);
            }
            if (data.status == false) {
                return false;
            }
            return true;
        })
    }


    /**
     * @name 从云端同步面板信息
     * @return {boolean}
     */
    async syncPanelFromCloud() {
        if (pub.C('sync_cloud') === false || !this.sync_password) return false;
        let bind_info = this.get_bind_info();
        if (!bind_info.token) {
            return false;
        }
        let key_iv = this.get_key_iv(bind_info.secret_key);
        let aes_key = this.getAesKey();
        let url = 'https://dj.bt.cn/panel/get_panel_list';
        let pdata = this.get_params({}, bind_info.secret_key, bind_info.token);
        let self = this;
        // 发送数据
        pub.http_post(url, pdata, function (response, error) {
            if (error) {
                return false;
            }
            let data = response.body;
            if (typeof data == 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return false;
                }
            }
            if (data.status == false) {
                return false;
            }

            let panel_list = data.data;
            let encrypt_data = pub.aes_decrypt_ecb(panel_list, key_iv.key);
            encrypt_data = JSON.parse(encrypt_data);
            for (let i = 0; i < encrypt_data.length; i++) {
                let panel = encrypt_data[i];
                let panel_info = self.aesDecrypt(panel.panel_info, aes_key);
                if (!panel_info) continue;
                panel_info = JSON.parse(panel_info);

                if (pub.M('panel_delete').where('url_hash=?', panel.panel_hash).count() > 0) {
                    // 已删除的面板，不再同步回来
                    continue;
                }


                if (pub.M('panel_info').where('url=?', [panel_info.url]).count() > 0) {
                    // 面板已存在
                    continue;
                }

                // 处理分组信息
                let group_id = panel_info.group_id;
                let group_name = panel_info.group_name;
                if (group_id > 0) {
                    group_id = pub.M('panel_group').where('group_name=?', group_name).getField('group_id');
                    if (!group_id) {
                        group_id = pub.M('panel_group').insert({ group_name: group_name });
                    }
                }

                // 处理代理信息
                let proxy_id = panel_info.proxy_id;
                let proxy_info = panel_info.proxy_info;
                if (proxy_id > 0) {
                    proxy_id = pub.M('proxy_info').where('proxy_ip=? and proxy_port=?', [proxy_info.proxy_ip, proxy_info.proxy_port]).getField('proxy_id');
                    if (!proxy_id) {
                        proxy_id = pub.M('proxy_info').insert(proxy_info);
                    }
                }

                // 添加面板信息
                panel_info.group_id = group_id;
                panel_info.proxy_id = proxy_id;
                if (panel_info.group_name) delete panel_info.group_name;
                if (panel_info.panel_id) delete panel_info.panel_id;
                if (panel_info.proxy_info !== undefined) delete panel_info.proxy_info;
                pub.M('panel_info').insert(panel_info);
            }
            return true;
        });

    }


    /**
     * @name 从云端删除面板信息
     * @param {string} url 面板地址
     * @return {boolean}
     */
    async removePanelToCloud(url) {
        if (pub.C('sync_cloud') === false || !this.sync_password) return false;
        let bind_info = this.get_bind_info();
        if (!bind_info.token) {
            return false;
        }

        let panel_hash = pub.md5(url);
        console.log(panel_hash);
        let cloud_url = 'https://dj.bt.cn/panel/del_panel';
        let data = { panel_hash: panel_hash };
        let pdata = this.get_params(data, bind_info.secret_key, bind_info.token);

        // 发送数据
        pub.http_post(cloud_url, pdata, function (response, error) {
            if (error) {
                return false;
            }
            try {
                let data = response.body;
                if (typeof data == 'string') {
                    data = JSON.parse(data);
                }
                if (data.status == false) {
                    return false;
                }
                return true;
            } catch (e) {
                return false;
            }
        });

    }


    /**
     * @name 同步SSH信息到云端
     * @return {boolean}
     */
    async syncSshToCloud() {
        if (pub.C('sync_cloud') === false || !this.sync_password) return false;
        let bind_info = this.get_bind_info();
        if (!bind_info.token) {
            return false;
        }

        // 获取SSH信息
        let ssh_list = pub.M('ssh_info').select();
        if (!ssh_list) return false;

        let group_list = pub.M('ssh_group').select();
        let proxy_list = pub.M('proxy_info').select();

        // 将分组信息转换为对象
        let group_object = {};
        for (let i = 0; i < group_list.length; i++) {
            let group = group_list[i];
            group_object[group.group_id] = group.group_name;
        }

        group_object[0] = pub.lang('默认')

        // 将代理信息转换为对象
        let proxy_object = {};
        for (let i = 0; i < proxy_list.length; i++) {
            let proxy = proxy_list[i];
            proxy_object[proxy.proxy_id] = proxy;
        }

        proxy_object[0] = {};

        let aes_key = this.getAesKey();
        let url = 'https://dj.bt.cn/term/add_term';
        let data = [];

        for (let i = 0; i < ssh_list.length; i++) {
            let ssh = ssh_list[i];
            delete ssh.ssh_id;

            ssh.group_name = group_object[ssh.group_id];
            ssh.proxy_info = proxy_object[ssh.proxy_id];

            let ssh_info = this.aesEncrypt(JSON.stringify(ssh), aes_key);
            if (!ssh_info) continue;
            data.push({ ssh_hash: pub.md5(`${ssh.host}:${ssh.port}`), ssh_info: ssh_info });
        }

        // SSH信息列表
        let pdata = this.get_params(data, bind_info.secret_key, bind_info.token);

        // 发送数据
        pub.http_post(url, pdata, function (response, error) {
            if (error) {
                return false;
            }
            let data = response.body;
            if (typeof data == 'string') {
                data = JSON.parse(data);
            }
            if (data.status == false) {
                return false;
            }
            return true;
        });

    }


    /**
     * @name 从云端同步SSH信息
     * @return {boolean}
     */
    async syncSshFromCloud() {
        if (pub.C('sync_cloud') === false || !this.sync_password) return false;
        let bind_info = this.get_bind_info();
        if (!bind_info.token) {
            return false;
        }
        let key_iv = this.get_key_iv(bind_info.secret_key);
        let aes_key = this.getAesKey();
        let url = 'https://dj.bt.cn/term/get_term_list';
        let pdata = this.get_params({}, bind_info.secret_key, bind_info.token);
        let self = this;
        // 发送数据
        pub.http_post(url, pdata, function (response, error) {
            if (error) {
                return false;
            }
            let data = response.body;
            if (typeof data == 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return false;
                }

            }
            if (data.status == false) {
                return false;
            }

            let ssh_list = data.data;
            let encrypt_data = pub.aes_decrypt_ecb(ssh_list, key_iv.key);
            encrypt_data = JSON.parse(encrypt_data);
            for (let i = 0; i < encrypt_data.length; i++) {
                let ssh = encrypt_data[i];
                let ssh_info = self.aesDecrypt(ssh.ssh_info, aes_key);
                if (!ssh_info) continue;
                ssh_info = JSON.parse(ssh_info);

                if (pub.M('ssh_delete').where('host_hash=?', ssh.ssh_hash).count() > 0) {
                    // 已删除的SSH，不再同步回来
                    continue;
                }

                if (pub.M('ssh_info').where('host=? and port=?', [ssh_info.host, ssh_info.port]).count() > 0) {
                    // SSH已存在
                    continue;
                }

                // 处理分组信息
                let group_id = ssh_info.group_id;
                let group_name = ssh_info.group_name;
                if (group_id > 0) {
                    group_id = pub.M('ssh_group').where('group_name=?', group_name).getField('group_id');
                    if (!group_id) {
                        group_id = pub.M('ssh_group').insert({ group_name: group_name });
                    }
                }

                // 处理代理信息
                let proxy_id = ssh_info.proxy_id;
                let proxy_info = ssh_info.proxy_info;
                if (proxy_id > 0) {
                    proxy_id = pub.M('proxy_info').where('proxy_ip=? and proxy_port=?', [proxy_info.proxy_ip, proxy_info.proxy_port]).getField('proxy_id');
                    if (!proxy_id) {
                        proxy_id = pub.M('proxy_info').insert(proxy_info);
                    }
                }


                // 添加SSH信息
                ssh_info.group_id = group_id;
                ssh_info.proxy_id = proxy_id;
                if (ssh_info.group_name) delete ssh_info.group_name;
                if (ssh_info.ssh_id) delete ssh_info.ssh_id;
                if (ssh_info.proxy_info !== undefined) delete ssh_info.proxy_info;
                pub.M('ssh_info').insert(ssh_info);
            }
        });
    }


    /**
     * @name 从云端删除SSH信息
     * @param {string} host 主机
     * @param {string} port 端口
     * @return {boolean}
     */
    async removeSshToCloud(host, port) {
        if (pub.C('sync_cloud') === false || !this.sync_password) return false;
        let bind_info = this.get_bind_info();
        if (!bind_info.token) {
            return false;
        }

        let ssh_hash = pub.md5(`${host}:${port}`);
        let url = 'https://dj.bt.cn/term/del_term';
        let data = { ssh_hash: ssh_hash };
        let pdata = this.get_params(data, bind_info.secret_key, bind_info.token);

        // 发送数据
        pub.http_post(url, pdata, function (response, error) {
            if (error) {
                return false;
            }
            let data = response.body;
            if (typeof data == 'string') {
                data = JSON.parse(data);
            }
            if (data.status == false) {
                return false;
            }
            return true;
        });

    }


    /**
     * @name 获取面板付费信息
     * @return {object}
     */
    async getPanelOv() {
        let url = 'https://dj.bt.cn/index/get_panel_ov';


        // 获取server_id列表
        let panel_list = pub.M('panel_info').select();
        let server_id_list = [];
        for (let i = 0; i < panel_list.length; i++) {
            if (!panel_list[i].server_id) continue;
            server_id_list.push(panel_list[i].server_id);
        }

        let server_id_str = server_id_list.join(',');
        // 发送数据
        pub.http_post(url, { server_id_list: server_id_str }, function (response, error) {
            if (error) {
                return false;
            }
            let data = response.body;
            if (typeof data == 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    pub.log('getPanelOv-Error: ', e.message);
                    return false;
                }
            }

            if (data.status == false) {
                return false;
            }

            // 更新面板信息
            for (let i = 0; i < panel_list.length; i++) {
                if (!panel_list[i].server_id) continue;
                let server_id = panel_list[i].server_id;
                if (data.data[server_id] !== undefined) {
                    panel_list[i].ov = data.data[server_id];
                    pub.M('panel_info').where('panel_id=?', panel_list[i].panel_id).update({ ov: data.data[server_id] });
                }
            }
            return true;
        });

    }


    /**
     * @name 设置用户信息
     * @param {object} data 用户信息
     * @return bool
     */
    set_user_info(data) {
        let client_id_file = pub.get_data_path() + '/user.json';
        if (!pub.is_file(client_id_file)) {
            pub.log('user.json not found', client_id_file);
            return false;
        }
        let f_body = pub.read_file(client_id_file);
        let f_json = JSON.parse(f_body);

        let keys = Object.keys(data)
        for (let i = 0; i < keys.length; i++) {
            f_json[keys[i]] = data[keys[i]];
        }
        pub.write_file(client_id_file, JSON.stringify(f_json));
        return true;
    }

}

UserService.toString = () => '[class UserService]';
module.exports = UserService;

