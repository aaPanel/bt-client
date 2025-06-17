const { pub } = require('./public.js');

// 通过APP接口连接面板
class PanelApp {

    constructor(url, token, panel) {
        let token_data = pub.parse_token(token);
        this.URL = url;
        this.TOKEN = token_data.app_token;
        this.KEY = token_data.app_key;
        this.CLIENT_BRAND = 'PC-Client';
        this.CLIENT_MODEL = pub.get_os();
        this.REQUEST_TOKEN = token_data.request_token;
        this.panel = panel;
    }

    /**
     * @name 构造请求参数
     * @param {object} data
     * @returns {object}
     */
    get_param(data) {
        data.request_time = pub.time();
        data.request_token = pub.md5(data.request_time + pub.md5(this.REQUEST_TOKEN));
        let pdata = {
            client_bind_token: this.TOKEN,
            form_data: pub.aes_encrypt_ecb(JSON.stringify(data), this.KEY)
        }
        return pdata;
    }

    /**
     * @name 请求绑定面板
     * @param {*} callback 
     */
    bind(callback) {
        let pdata = {
            bind_token: this.TOKEN,
            client_brand: this.CLIENT_BRAND,
            client_model: this.CLIENT_MODEL
        }
        let url = this.URL + '/check_bind';
        pub.http_post(url, pdata, function (res, err) {
            if (err) {
                return callback(null, err);
            }
            callback(res.body, err);
        });
    }

    /**
     * @name 获取绑定状态
     * @param {*} callback 
     */
    get_bind_status(callback) {
        let pdata = {
            bind_token: this.TOKEN
        }

        let url = this.URL + '/get_app_bind_status';
        pub.http_post(url, pdata, function (res, err) {
            if (err) {
                return callback(null, err);
            }
            callback(res.body, err);
        });
    }

    /**
     * @name 获取服务器负载
     * @param {*} callback (res, error)
     */
    get_network(callback) {
        let that = this;
        let pdata = this.get_param({});
        let url = this.URL + '/system?action=GetNetWork';
        pub.httpPostProxy(url, pdata, this.panel.proxy_id, function (res, err) {
            if (err) {
                return callback(null, err);
            }

            if (res.body[0] == '{') {
                let res_body = JSON.parse(res.body);
                // pub.debug(res_body);
                err = new Error(res_body.msg);
                return callback(null, err);
            }

            let de_crypt_data = '';
            try {
                de_crypt_data = pub.aes_decrypt_ecb(res.body, that.KEY);
            } catch (e) {
                return callback(null, e);
            }
            let data = JSON.parse(de_crypt_data);
            if (data.status && data.data) data = data.data;
            callback(data, err);
        }, 6000);
    }


    /**
     * @name 获取server_id
     * @param {object} callback 回调函数 function(server_id){}
     */
    get_server_id(callback) {
        let that = this;
        let uri = this.URL + '/plugin?action=get_soft_list';
        let data = this.get_param({ p: 1, type: 8, force: 0, query: '', row: 1 });
        pub.httpPostProxy(uri, data, this.panel.proxy_id,function (res, err) {
            let server_id = '';
            if (err) {
                return callback(server_id);
            }
            
            if (res.body[0] == '{') {
                let res_body = JSON.parse(res.body);
                pub.debug(res_body);
                return callback(server_id);
            }

            let de_crypt_data = '';
            try {
                de_crypt_data = pub.aes_decrypt_ecb(res.body, that.KEY);
            } catch (e) {
                return callback(server_id);
            }
            let data = JSON.parse(de_crypt_data);
            
            
            if (data.serverid) {
                server_id = data.serverid;
            }
            callback(server_id);
        });
    }

    /**
     * @name 获取临时登录地址
     * @param {object} callback 回调函数 function(response, error){}
     */
    get_tmp_token(callback) {
        let that = this;
        let pdata = this.get_param({});
        let uri = this.URL + '/config?action=get_tmp_token';
        pub.httpPostProxy(uri, pdata, that.panel.proxy_id, function (res, err) {
            if (err) {
                return callback(null, err);
            }


            let data = JSON.parse(pub.aes_decrypt_ecb(res.body, that.KEY));
            if (data.status && data.msg) {
                data = that.URL + "/login?tmp_token=" + data.msg;
            }
            callback(data, err);
        }, 6000);
    }
}

module.exports = { PanelApp };