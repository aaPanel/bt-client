const { pub } = require('./public.js');



function PanelApi (url,token,panel){
    this.panel_url = url;
    this.panel_token = token;
    this.http_timeout = 6000;
    this.panel = panel;
    // console.log('PanelApi:',this.panel_url,this.panel_token,this.panel);
    // if (!this.panel_url) throw new Error('Panel URL is required');
    // if (!this.panel_token) throw new Error('Panel Token is required');
}


// 设置URL和Token
PanelApi.prototype.set_panel = function(url,token){
    this.panel_url = url;
    this.panel_token = token;
}

// 获取签名
PanelApi.prototype.get_sign = function() {
    /**
     * api_sk = 接口密钥 (在面板设置页面 - API 接口中获取)
        request_time = 当前请求时间的 uinx 时间戳 ( php: time() / python: time.time() )
        request_token = md5(string(request_time) + md5(api_sk))
        PHP 示例： $request_token = md5($request_time . ‘’ . md5($api_sk))
     */
    
    let request_time = Math.round(new Date().getTime() / 1000);
    let request_token = pub.md5(request_time + "" + pub.md5(this.panel_token));
    let sign = {
        request_time: request_time,
        request_token: request_token
    }

    return sign;
}


/**
 * @name 请求到面板
 * @param {string} uri 面板URI，如：/system?action=GetNetWork
 * @param {object} data 请求参数,如：{name:'test'}
 * @param {object} callback 回调函数
 */
PanelApi.prototype.request_to_panel = function(uri, pdata,callback) {
    // 获取签名
    let sign = this.get_sign();

    // 拼接请求URL
    let request_url = this.panel_url + uri;

    // 请求数据处理
    pdata['request_time'] = sign.request_time;
    pdata['request_token'] = sign.request_token;
    pub.httpPostProxy(request_url,pdata,this.panel.proxy_id,function(response,error){
        callback(response,error);
    });

}

/**
 * @name 发起请求
 * @param {string} uri URL地址
 * @param {object} data 请求参数
 * @param {object} callback 回调函数
 */
PanelApi.prototype.request = function(uri,data,callback){
    this.request_to_panel(uri,data,function(response,error){
        if(error){
            return callback(null,error);
        }else if(response.statusCode != 200){
            return callback(response.body,response.statusMessage);
        }else{
            return callback(response.body,error);
        }
    });
}


/**
 * @name 获取负载监控信息
 * @param {object} callback 回调函数 function(response, error){}
 */
PanelApi.prototype.get_network = function(callback) {
    let uri = '/system?action=GetNetWork';
    let data = {};
    this.request(uri, data, callback);
}

/**
 * @name 获取server_id
 * @param {object} callback 回调函数 function(response, error){}
 */
PanelApi.prototype.get_server_id = function(callback) {
    let uri = '/plugin?action=get_soft_list';
    let data = {p:1,type:8,force:0,query:'',row:1};
    this.request(uri, data, function(res, error){
        if(typeof res == 'string'){
            res = JSON.parse(res);
        }
        let server_id = '';
        if(res.serverid){
            server_id = res.serverid;
        }
        callback(server_id);
    });
}


/**
 * @name 获取临时登录地址
 * @param {object} callback 回调函数 function(response, error){}
 */
PanelApi.prototype.get_tmp_token = function(callback) {
    let uri = '/config?action=get_tmp_token';
    let data = {};
    let that = this;
    this.request(uri, data, function(res, error){
        if(typeof res == 'string'){
            res = JSON.parse(res);
        }

        if(res && res.status && res.msg){
            res = that.panel_url + '/login?tmp_token='+res.msg;
        }
        callback(res, error);
    });
}


module.exports = { PanelApi };

/**
 * 使用示例
 * 
 * const { panel_api } = require('./class/panel_api.js')
 * let panel_url = 'https://xxx.com:8888';
 * let panel_token = 'xxxxx';
 * let panel = new PanelApi(panel_url, panel_token);
 * let res = panel.get_tmp_token();
 * console.log(res);
 * 
 * 
 */