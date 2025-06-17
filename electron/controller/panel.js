'use strict';

const { Controller } = require('ee-core');
const { pub } = require("../class/public.js");
const { PanelApi } = require("../class/panel_api.js");
const { PanelApp } = require("../class/panel_app.js");
const { dialog } = require('electron');
const Electron = require('ee-core/electron');
const Services = require('ee-core/services');
const os = require("os");
const { glob } = require('fs');
global.PanelLoadStatus = { status: false, last_time: 0 }; // 面板负载信息获取状态
global.PanelActionTime = 0; // 面板操作时间

/**
 * example
 * @class
 */
class PanelController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.TABLE = 'panel_info';
    global.PanelActionTime = pub.time();
  }


  /**
   * @name 标记删除面板信息
   * @param {string} url - 面板URL
   * @returns {boolean}
   * @description 标记删除面板信息
   */
  async to_delete(url) {
    let url_hash = pub.md5(url);
    let res = pub.M('panel_delete').where('url_hash=?', url_hash).find();
    if (res) {
      return false;
    }
    // 标记删除
    res = pub.M('panel_delete').insert({ url_hash: url_hash, delete_time: pub.time() });

    // 从云端删除
    Services.get('user').removePanelToCloud(url);

    return true;
  }

  /**
   * @name 删除面板删除标记信息
   * @param {string} url - 面板URL
   * @returns {boolean}
   * @description 删除SSH删除标记信息
   */
  async rm_delete(url) {
    let url_hash = pub.md5(url);
    pub.M('panel_delete').where('url_hash=?', url_hash).delete();
    // 同步到云端
    Services.get('user').syncPanelToCloud();
    return true;
  }

  /**
   * @name 导出面板信息
   * @param {object} args
   * @param {object} event
   * @returns {object}
   */
  async export(args, event) {
    let panel_group = pub.M('panel_group').select();
    let panel_info = pub.M('panel_info').select();

    panel_group.push({ group_id: 0, group_name: pub.lang('默认') });

    let export_data = [];


    for (let i = 0; i < panel_group.length; i++) {
      let group = panel_group[i];
      let data = {
        group: group,
        panel_list: []
      }
      for (let j = 0; j < panel_info.length; j++) {
        if (panel_info[j].group_id == group.group_id) {
          data.panel_list.push(panel_info[j]);
        }
      }
      export_data.push(data);

    }

    let data = JSON.stringify(export_data);
    // 加密
    data = pub.aes_default_encrypt(data);

    // 打开文件选择对话框
    dialog.showSaveDialog({
      title: pub.lang('请选择保存位置'),
      defaultPath: 'panel_import.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }).then(result => {
      if (result.canceled) return;
      let path = result.filePath;
      if (path) {
        pub.write_file(path, data);
        return pub.send_success(event, args.channel, pub.lang('导出成功'));
      } else {
        return pub.send_error(event, args.channel, pub.lang('导出失败'));
      }
    });

  }

  /**
   * @name 导入面板信息
   * @param {object} args
   * @param {object} event
   * @returns {object}
   */
  async import(args, event) {
    // 打开文件选择对话框
    dialog.showOpenDialog(Electron.mainWindow, {
      title: pub.lang('请选择导入面板备份文件'),
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }).then(result => {
      if (result.canceled) return; // 取消选择
      let path = result.filePaths[0];
      if (path) {
        let data = pub.read_file(path)
        if (data) {
          try {
            data = data.toString()
            if (data[0] != '['){
              // 解密
              data = pub.aes_default_decrypt(data);
            }
            data = JSON.parse(data);
            if (!data.length) return pub.send_error(event, args.channel, pub.lang('没有可导入的数据'));
            if (data[0].group === undefined || data[0].panel_list === undefined) return pub.send_error(event, args.channel, pub.lang('导入数据格式错误'));

            for (let i = 0; i < data.length; i++) {
              let group = data[i].group;
              let panel_list = data[i].panel_list;
              let group_id = group.group_id;
              if (group_id > 0) {
                group_id = pub.M('panel_group').where('group_id=?', group_id).getField('group_id');
                if (!group_id) {
                  // 添加分组
                  group_id = pub.M('panel_group').insert({ group_name: group.group_name });
                }
              }

              for (let j = 0; j < panel_list.length; j++) {
                if (pub.M('panel_info').where('url=?', panel_list[j].url).count() > 0) {
                  // 已经存在
                  continue;
                } else {
                  let panel = panel_list[j];
                  delete panel.panel_id;
                  panel.group_id = group_id;
                  panel.addtime = pub.time();
                  pub.M('panel_info').insert(panel);
                }
              }
            }
            Services.get('user').syncPanelToCloud();
            return pub.send_success(event, args.channel, pub.lang('导入成功'));

          } catch (e) {
            return pub.send_error(event, args.channel, pub.lang('导入失败'));
          }
        }
      }
    });
	}

	/**
	 * @name 保存面板信息至桌面
	 * @param {object} args
	 */
	async save_panel(args, event) { 
		const fileName = args.data.filename;
		const data = args.data.content;

		// 获取桌面路径
		const desktopPath = os.homedir() + '/Desktop';
		// 完整路径
		const filePath = `${desktopPath}/${fileName}面板信息.txt`;
		// 写入文件
		pub.write_file(filePath, data);
	}
  /**
   * @name 获取面板列表
   * @param {object} args {
   *   page: number, - 页码
   *   limit: number - 每页显示数量
   *   search: string - 搜索关键字
   * }
   * @param {object} event 
   * @returns {object}
   */
  async list(args, event) {
    let channel = args.channel;
    let search = pub.trim(args.data.search);
    let group_id = args.data.group_id;
    let where = '';
    let params = [];
    if (search) {
      where = '(title like ? or url like ?)';
      let param_value = '%' + search + '%';
      params = [param_value, param_value];
    }
    let result = {};

    // 获取分组
    result.groups = [{ group_id: -1, group_name: pub.lang('全部') }, { group_id: 0, group_name: pub.lang('默认') }];
    let groups = pub.M('panel_group').select();
    if (groups.length > 0) {
      result.groups = result.groups.concat(groups);
    }

    // 检查分组是否存在
    if (group_id !== undefined && group_id != -1){
      let is_group_exists = false;
      for(let i=0;i<result.groups.length;i++){
        if(result.groups[i].group_id == group_id){
          is_group_exists = true;
          break;
        }
      }

      // 如果分组不存在，设置为全部
      if(!is_group_exists){
        group_id = -1;
      }
    }

    // 按分组获取
    if (group_id !== undefined && group_id != -1) { // -1为全部
      if (where) where += ' and ';
      where += 'group_id=?';
      params.push(group_id);
    }
    
    // 获取面板列表
    result.data = pub.M(this.TABLE).where(where, params).order('panel_id DESC').select();
		global.PanelList = result.data;

    for (let i = 0; i < result.data.length; i++) {
      // 如果没有标题，使用URL代替
      if (!result.data[i].title) {
				result.data[i].title = result.data[i].url.replace(/(http|https):\/\/([^:/]+).*/, '$2');
      }


    }

    for(let i=result.data.length-1;i>=0;i--){
      result.data[i].is_open = true; // 是否允许打开面板
      
		}

    // this.get_area(url_list);

    return pub.send_success(event, channel, result);
  }
	/**
	 * @name 记录面板选中的磁盘
	 * @param {object} args {
	 *  panel_id: number - 面板ID
	 *  disk_path: string - 磁盘路径
	 * }
	 * @param {object} event
	 */
	async record_disk(args, event) { 
		let panel_id = args.data.panel_id;
		let disk_path = args.data.disk_path;
		pub.M(this.TABLE).where('panel_id=?', panel_id).update({current_disk: disk_path});
	}

  /**
   * @name 添加面板分组
   * @param {object} args {
   *   group_name: string - 分组名称
   * }
   * @param {object} event
   * @returns {object}
   */
  async add_group(args, event) {
    let channel = args.channel;
    let group_name = args.data.group_name;
    if (!group_name) return pub.send_error(event, channel, pub.lang('分组名称不能为空'));
    if (group_name.length > 24) return pub.send_error(event, channel, pub.lang('分组名称不能超过24个字符'));
    if (pub.M('panel_group').where('group_name=?', group_name).count() > 0) {
      return pub.send_error(event, channel, pub.lang('指定分组名称已经存在'));
    }

    let insert = pub.M('panel_group').insert({ group_name: group_name });
    if (insert) {
      return pub.send_success(event, channel, pub.lang('添加成功'));
    }
    return pub.send_error(event, channel, pub.lang('添加失败'));
  }


  /**
   * @name 修改面板分组
   * @param {object} args {
   *  group_id: number - 分组ID
   *  group_name: string - 分组名称
   * }
   * @param {object} event
   */
  async modify_group(args, event) {
    let channel = args.channel;
    let group_id = args.data.group_id;
    let group_name = args.data.group_name;
    if (!group_name) return pub.send_error(event, channel, pub.lang('分组名称不能为空'));
    if (group_name.length > 24) return pub.send_error(event, channel, pub.lang('分组名称不能超过24个字符'));
    if (pub.M('panel_group').where('group_name=? and group_id!=?', [group_name, group_id]).count() > 0) {
      return pub.send_error(event, channel, pub.lang('指定分组名称已经存在'));
    }

    let update = pub.M('panel_group').where('group_id=?', group_id).update({ group_name: group_name });
    if (update) {
      return pub.send_success(event, channel, pub.lang('修改成功'));
    }
    return pub.send_error(event, channel, pub.lang('修改失败'));
  }

  /**
   * @name 删除面板分组
   * @param {object} args {
   *  group_id: number - 分组ID
   * }
   * @param {object} event
   * @returns {object}
   */
  async remove_group(args, event) {
    let channel = args.channel;
    let group_id = args.data.group_id;

    let del = pub.M('panel_group').where('group_id=?', group_id).delete();
    if (del) {
      pub.M(this.TABLE).where('group_id=?', group_id).update({ group_id: 0 });
      return pub.send_success(event, channel, pub.lang('删除成功'));
    }
    return pub.send_error(event, channel, pub.lang('删除失败'));
  }

  /**
   * @name 获取面板归属地区
   * @param {string} url_list [{
   *    panel_id:{number} - 面板ID
   *    url:{string} - 面板URL
   * }] - url地址
   * @return void
   */
  async get_area(url_list) {
    let ip_list = [];
    for (let i = 0; i < url_list.length; i++) {
      // 提取IP
      let tmp_ip = url_list[i].url.replace(/(http|https):\/\//, '');
      tmp_ip = tmp_ip.replace(/\//, '');
      let ip = tmp_ip.split(':')[0];
      url_list[i].url = ip;

      // 加入IP列表
      ip_list.push(ip);
    }

    // 请求接口获取地区
    pub.httpGet('https://www.bt.cn/api/panel/get_ip_info?ip=' + ip_list.join(','), function (res, err) {
      // 发生错误
      if (err) {
        pub.log(pub.lang('获取面板地区失败: '), err.message);
        return;
      }
      // 正确响应
      if (res) {
        let data = res.body;
        if (typeof data == 'string') {
          data = JSON.parse(data);
        }
        // 更新面板地区
        for (let i = 0; i < url_list.length; i++) {
          let ip = url_list[i].url;
          let panel_id = url_list[i].panel_id;

          // 没有响应字段的情况
          if (!data[ip]) {
            data[ip] = {
              country: '',
              en_short_code: '',
            }
          }

          // 没获取到地区的情况
          if (!data[ip].en_short_code) {
            if (data[ip].country) {
              // 局域网
              data[ip].en_short_code = 'LAN';
            } else {
              // 未知
              data[ip].en_short_code = 'N/A';
            }
          }
          // 更新到数据库
          pub.M('panel_info').where('panel_id=?', panel_id).update({ area: data[ip].en_short_code });
        }
      }
    });
  }


  /**
   * @name 获取指定面板信息
   * @param {object} args {
   *   panel_id: number - 面板ID
   * }
   * @param {object} event
   * @returns {object}
   */
  async find(args, event) {
    let channel = args.channel;
    let panel_id = args.data.panel_id;
    let data = pub.M(this.TABLE).where('panel_id=?', panel_id).find();

    if (data) {
      pub.send_success(event, channel, data);
    } else {
      pub.send_error(event, channel, pub.lang('面板不存在'));
    }
  }

  /**
   * @name 通过APP接口绑定新面板
   * @param {object} args {
   *    auth_type: number, - 验证类型,必需为3
   *    token: string - App-Token 在堡塔APP获取的Token
   * }
   * @param {object} event
   * @returns {object}
   */
  async bind_app(args, event) {
    let channel = args.channel;
    let pdata = {
      title: args.data.title,
      url: '',
      auth_type: args.data.auth_type,
      api_token: pub.trim(args.data.token),
      admin_path: '',
      username: '',
      password: '',
      proxy_id: 0,
      group_id: 0
    }
    // 使用代理
    if (args.data.proxy_id) pdata.proxy_id = args.data.proxy_id;

    // 使用分组
    if (args.data.group_id !== undefined && args.data.group_id > -1) pdata.group_id = args.data.group_id;


    // 解析Token
    if (!pdata.api_token) return pub.send_error_msg(event, channel, pub.lang('Token不能为空'));
    let token_data = pub.parse_token(pdata.api_token);
    if (!token_data) return pub.send_error_msg(event, channel, pub.lang('Token解析失败'));
    pdata.url = token_data.url;

    // 检查是否已经绑定
    let count = pub.M(this.TABLE).where('url=?', pdata.url).count();
    if (count) return pub.send_error_msg(event, channel, pub.lang('此面板已经绑定过，请勿重复绑定'));

    // 绑定面板
    let app = new PanelApp(token_data.url, pdata.api_token, pdata);
    let that = this;
    app.bind(function (res, err) {
      res = that.parseResult(res,err,3);
      if (res && res.status === false){
        return send_error_msg(event,channel,res.msg);
      }

      if (err) {
        return pub.send_error_msg(event, channel, pub.lang('连接失败: {}', err));
      }
      if (res == '1') {
        // 获取绑定状态
        // 通过APP接口绑定，需要等待绑定成功
        function get_bind_status(num) {
          num++;
          if (num > 180) {
            return pub.send_error_msg(event, channel, pub.lang('绑定超时'));
          }
          setTimeout(function () {
            app.get_bind_status(function (res2, err2) {
              if (err2) {
                return pub.send_error_msg(event, channel, pub.lang('获取绑定状态失败: {}', err2));
              }
              if (res2 == '1') {
                // 添加到数据库
                pdata.addtime = pub.time();
                if (pub.M(that.TABLE).insert(pdata)) {
                  global.socks.syncProxy(); // 同步代理池
                  pub.write_log(0, pub.lang('绑定面板[{}]成功', pdata.url));
                  // 同步到云端
                  Services.get('user').syncPanelToCloud();
                  that.rm_delete(pdata.url);
                  return pub.send_success_msg(event, channel, pub.lang('绑定成功'));
                }
                // 添加到数据库失败
                pub.write_log(0, pub.lang('绑定面板[{}]失败', pdata.url), 1);
                return pub.send_error_msg(event, channel, pub.lang('绑定失败'));
              }
              return get_bind_status(num);
            });
          }, 1000);
        }

        // 获取绑定状态
        return get_bind_status(0);
      } else {
        if(res){
          // 中文编码转换
          try{
            res = JSON.parse(res);
            let msg = res;
            if (typeof res == 'object' && res.msg) {
              msg = res.msg;
            }

            if(msg.indexOf('过期') > -1 || msg.indexOf('expire') > -1){
              msg = pub.lang('绑定密钥已过期，请重新打开[堡塔APP]插件复制新的绑定密钥!');
            }
          }catch(e){
            return pub.send_error_msg(event, channel, pub.lang('绑定失败,{}', res));
          }

          return pub.send_error_msg(event, channel, pub.lang('绑定失败,{}', res));
        }
        return pub.send_error_msg(event, channel, pub.lang('绑定失败,无效的APP-Token'));
      }

    });
  }


  /**
   * @name 绑定新面板
   * @param {object} args {
   *    title: string, - 面板名称
   *    url: string, - 面板URL
   *    auth_type: number, - 验证类型，1：密码验证，2：Token验证，3：无验证
   *    token: string, - 面板Token
   *    admin_path: string, - 面板安全入口
   *    username: string, - 面板用户名
   *    password: string, - 面板密码
   * }
   * @param {object} event 
   */
  async bind(args, event) {
    let channel = args.channel;

    // 如果是通过APP接口绑定
    if (args.data.auth_type == 3) {
      return this.bind_app(args, event);
    }

    
    let pdata = {
      title: pub.trim(args.data.title),
      url: pub.trim_char(pub.trim(args.data.url), '/'),
      auth_type: args.data.auth_type,
      api_token: pub.trim(args.data.token),
      admin_path: pub.trim(args.data.admin_path),
      username: pub.trim(args.data.username),
      password: pub.trim(args.data.password),
      proxy_id: 0,
      group_id: 0
    }

    // 使用代理
    if (args.data.proxy_id) pdata.proxy_id = args.data.proxy_id;

    // 使用分组
    if (args.data.group_id !== undefined && args.data.group_id > -1) pdata.group_id = args.data.group_id;



    // 验证参数
    if (!pdata.auth_type) return pub.send_error_msg(event, channel, pub.lang('验证类型不能为空'));
    if (pdata.auth_type == 1) {
      if (!pdata.url) return pub.send_error_msg(event, channel, pub.lang('面板URL不能为空'));
      if (!pdata.username) return pub.send_error_msg(event, channel, pub.lang('用户名不能为空'));
      if (!pdata.password) return pub.send_error_msg(event, channel, pub.lang('密码不能为空'));
      if (!pdata.admin_path) return pub.send_error_msg(event, channel, pub.lang('安全入口不能为空'));
    } else if (pdata.auth_type == 2) {
      if (!pdata.url) return pub.send_error_msg(event, channel, pub.lang('面板URL不能为空'));
      if (!pdata.api_token) return pub.send_error_msg(event, channel, pub.lang('Token不能为空'));
    }

    // 通过正则表达式验证URL地址格式是否合法
    let reg = /^(http|https):\/\/[a-zA-Z0-9\.\-]+(:[0-9]+)?$/;
    if (!reg.test(pdata.url)) {
      return pub.send_error_msg(event, channel, pub.lang('URL地址格式不正确'));
    }


    // if(!pdata.title) pdata.title = pdata.url.replace(/(http|https):\/\//,'');

    // 检查是否已经绑定
    let count = pub.M(this.TABLE).where('url=?', pdata.url).count();
    if (count) return pub.send_error_msg(event, channel, pub.lang('此面板已经绑定过，请勿重复绑定'));
    // 添加到数据库
    pdata.addtime = pub.time();
    let panel_id = pub.M(this.TABLE).insert(pdata);
    if (panel_id) {
      pdata.panel_id = panel_id;
      let that = this;
      // this.sync_load(null, pdata, function (res, err) {
      //   if (err && err != "UNAUTHORIZED") {
      //     // 删除面板
      //     pub.M(that.TABLE).where('panel_id=?', panel_id).delete();

      //     let msg = pub.lang('绑定面板[{}]失败，无法连接到面板: {}', pdata.url, err.message);
      //     // 面板配置了BasicAuth认证，导致无法连接
      //     // console.log(err)
      //     if (err != "UNAUTHORIZED" || (err.message && err.message.indexOf('code 401') > -1)) {
      //       msg = pub.lang('绑定面板[{}]失败，因为该面板配置了BasicAuth认证: {}', pdata.url, err);
      //     }

      //     pub.write_log(0, msg, 1);
      //     return pub.send_error_msg(event, channel, msg);
      //   }

        // 绑定成功
        global.socks.syncProxy(); // 同步代理池
        pub.write_log(0, pub.lang('绑定面板[{}]成功', pdata.url));
        // 同步到云端
        Services.get('user').syncPanelToCloud();
        that.rm_delete(pdata.url);
        return pub.send_success_msg(event, channel, pub.lang('绑定成功'));

      // });

    } else {
      pub.write_log(0, pub.lang('绑定面板[{}]失败', pdata.url), 1);
      return pub.send_error_msg(event, channel, pub.lang('绑定失败'));
    }

  }


  /**
   * @name 修改面板绑定信息
   * @param {object} args {
   *    channel: string, - 事件频道
   *    data: {
   *      panel_id: number, - 面板ID
   *      title: string, - 面板名称
   *      token: string - App-Token 在堡塔APP获取的Token
   *    }
   */
  async modify_app(args, event) {
    let channel = args.channel;
    let panel_id = args.data.panel_id;
    let pdata = {
      title: args.data.title,
      api_token: pub.trim(args.data.token),

    }

    // 使用代理
    if (args.data.proxy_id !== undefined) pdata.proxy_id = args.data.proxy_id;

    // 使用分组
    if (args.data.group_id !== undefined && args.data.group_id > -1) pdata.group_id = args.data.group_id;

    // 解析Token
    if (!pdata.api_token) return pub.send_error_msg(event, channel, pub.lang('Token不能为空'));
    let token_data = pub.parse_token(pdata.api_token);
    if (!token_data) return pub.send_error_msg(event, channel, pub.lang('Token解析失败'));
    pdata.url = token_data.url;

    // 检查是否已经绑定
    let find = pub.M(this.TABLE).where('panel_id=?', panel_id).find();
    if (!find) return pub.send_error_msg(event, channel, pub.lang('此面板未绑定过，请先绑定'));

    // 是否有修改api_token
    if (find['api_token'] == pdata.api_token) {
      if (pub.M(this.TABLE).where('panel_id=?', panel_id).update(pdata)) {
        global.socks.syncProxy(); // 同步代理池
        Services.get('user').syncPanelToCloud();
        pub.write_log(0, pub.lang('修改面板绑定[{}]成功', pdata.url));
        return pub.send_success_msg(event, channel, pub.lang('修改成功'));
      } else {
        return pub.send_error_msg(event, channel, pub.lang('修改失败'));
      }
    }

    // 绑定面板
    let app = new PanelApp(token_data.url, pdata.api_token);
    let that = this;
    app.bind(function (res, err) {
      if (err) {
        return pub.send_error_msg(event, channel, pub.lang('连接失败: {}', err));
      }
      if (res == '1') {
        // 获取绑定状态
        // 通过APP接口绑定，需要等待绑定成功
        function get_bind_status(num) {
          num++;
          if (num > 180) {
            return pub.send_error_msg(event, channel, pub.lang('绑定超时'));
          }
          setTimeout(function () {
            app.get_bind_status(function (res2, err2) {
              if (err2) {
                return pub.send_error_msg(event, channel, pub.lang('获取绑定状态失败: {}', err2));
              }
              if (res2 == '1') {
                // 添加到数据库
                pdata.addtime = pub.time();
                if (pub.M(that.TABLE).where('panel_id=?', panel_id).update(pdata)) {
                  global.socks.syncProxy(); // 同步代理池
                  pub.write_log(0, pub.lang('修改面板绑定[{}]成功', pdata.url));
                  // 同步到云端
                  Services.get('user').syncPanelToCloud();
                  return pub.send_success_msg(event, channel, pub.lang('修改成功'));
                }
                // 添加到数据库失败
                pub.write_log(0, pub.lang('修改面板绑定[{}]失败', pdata.url), 1);
                return pub.send_error_msg(event, channel, pub.lang('修改失败'));
              }
              return get_bind_status(num);
            });
          }, 1000);
        }
        get_bind_status(0);
      } else {
        return pub.send_error_msg(event, channel, pub.lang('绑定失败,无效的APP-Token'));
      }
    });
  }

  /**
   * @name 修改面板信息
   * @param {object} args {
   *    panel_id: number, - 面板ID
   *    title: string, - 面板名称
   *    url: string, - 面板URL
   *    auth_type: number, - 验证类型，1：密码验证，2：Token验证，3：无验证
   *    token: string, - 面板Token
   *    admin_path: string, - 面板安全入口
   *    username: string, - 面板用户名
   *    password: string, - 面板密码
   * }
   * @param {object} event 
   */
  async modify(args, event) {
    // 如果是通过APP接口绑定
    if (args.data.auth_type == 3) {
      return this.modify_app(args, event);
    }


    let channel = args.channel;
    let panel_id = args.data.panel_id;
    let pdata = {
      title: pub.trim(args.data.title),
      url: pub.trim_char(pub.trim(args.data.url), '/'),
      auth_type: args.data.auth_type,
      api_token: pub.trim(args.data.token),
      admin_path: pub.trim(args.data.admin_path),
      username: pub.trim(args.data.username),
      password: pub.trim(args.data.password)
    }

    // 使用代理
    if (args.data.proxy_id !== undefined) pdata.proxy_id = args.data.proxy_id;

    // 使用分组
    if (args.data.group_id !== undefined && args.data.group_id > -1) pdata.group_id = args.data.group_id;

    // 验证参数    
    if (!pdata.auth_type) return pub.send_error_msg(event, channel, pub.lang('验证类型不能为空'));
    if (pdata.auth_type == 1) {
      if (!pdata.url) return pub.send_error_msg(event, channel, pub.lang('面板URL不能为空'));
      if (!pdata.username) return pub.send_error_msg(event, channel, pub.lang('用户名不能为空'));
      if (!pdata.password) return pub.send_error_msg(event, channel, pub.lang('密码不能为空'));
      if (!pdata.admin_path) return pub.send_error_msg(event, channel, pub.lang('安全入口不能为空'));
    }
    else if (pdata.auth_type == 2) {
      if (!pdata.url) return pub.send_error_msg(event, channel, pub.lang('面板URL不能为空'));
      if (!pdata.api_token) return pub.send_error_msg(event, channel, pub.lang('Token不能为空'));
    }

    // 检查是否已经绑定
    let find = pub.M(this.TABLE).where('panel_id=?', panel_id).find()
    // let old_proxy_id = find.proxy_id;
    if (!find) return pub.send_error_msg(event, channel, pub.lang('指定面板未绑定'));
    let keys = Object.keys(pdata);
    for (let i = 0; i < keys.length; i++) {
      find[keys[i]] = pdata[keys[i]];
    }
    let that = this;
    if (pdata.proxy_id !== undefined) {
      pub.M(that.TABLE).where('panel_id=?', panel_id).update({ proxy_id: pdata.proxy_id });
      global.socks.syncProxy(); // 同步代理池
    }
    // this.sync_load(event, channel, find,function(res,err){
    //   if(err) {
    //     // 恢复代理ID
    //     // if(pdata.proxy_id !== undefined){
    //     //   pub.M(that.TABLE).where('panel_id=?', panel_id).update({proxy_id:old_proxy_id});
    //     //   global.socks.syncProxy(); // 同步代理池
    //     // }
    //     // let msg = pub.lang('修改面板[{}]失败，无法连接到面板: {}', pdata.url,err.message);
    //     // 面板配置了BasicAuth认证，导致无法连接
    //     if(err.message.indexOf('code 401') > -1){
    //       msg = pub.lang('修改面板[{}]失败，因为该面板配置了BasicAuth认证: {}', pdata.url,err.message);
    //       pub.write_log(0, msg, 1);
    //       return pub.send_error_msg(event, channel, msg);
    //     }

    //   }
		pdata['status'] = 0; // 重置面板状态
    // 修改数据库
    let update = pub.M(that.TABLE).where('panel_id=?', panel_id).update(pdata)
    if (update) {
      pub.write_log(0, pub.lang('修改面板[{}][{}]成功', panel_id, pdata.title));
      // 同步到云端
      Services.get('user').syncPanelToCloud();
      return pub.send_success_msg(event, channel, pub.lang('修改成功'));
    }

    // 其它错误
    pub.write_log(0, pub.lang('修改面板[{}]失败', pdata.url));
    return pub.send_error_msg(event, channel, pub.lang('修改失败'));
    // });
  }

  /**
   * @name 删除面板
   * @param {object} args {
   *   panel_id: number - 面板ID
   * }
   * @param {object} event 
   * @returns {object}
   */
  async remove(args, event) {
    let channel = args.channel;
    let panel_id = args.data.panel_id;
    let data = pub.M(this.TABLE).where('panel_id=?', panel_id).find();
    if (data) {
      let del = pub.M(this.TABLE).where('panel_id=?', panel_id).delete();
      if (del) {
        pub.write_log(0, pub.lang('删除面板[{}][{}]成功', panel_id, data.title));
        this.to_delete(data.url);
        return pub.send_success_msg(event, channel, pub.lang('删除成功'));
      }

      pub.write_log(0, pub.lang('删除面板[{}][{}]失败', panel_id, data.title), 1);
      return pub.send_error_msg(event, channel, pub.lang('删除失败'));
    }
    return pub.send_error_msg(event, channel, pub.lang('面板不存在'));
  }

  /**
   * @name 设置面板为常用面板
   * @param {object} args {
   *    panel_ids: array - 面板ID列表
   * }
   * @param {object} event
   * @returns {object}
   */
  async set_common_use(args, event) {
    let channel = args.channel;
    let panel_ids = args.data.panel_ids;

    // 判断是否超过最大常用面板数量
    let max_common_use = pub.C('max_common_use');
    if (!max_common_use) {
      max_common_use = 10;
    }

    if (panel_ids.length > max_common_use) {
      return pub.send_error_msg(event, channel, pub.lang('最多只能设置{}个常用面板', max_common_use));
    }

    // 重置所有面板为非常用面板
    pub.M(this.TABLE).where('common_use=?', 1).update({ common_use: 0 });
    // 设置指定面板为常用面板
    let param = '(' + panel_ids.join(',') + ')';
    let update = pub.M(this.TABLE).where('panel_id in ' + param, []).update({ common_use: 1 });
    if (update) {
      return pub.send_success_msg(event, channel, pub.lang('设置成功'));
    }
    return pub.send_error_msg(event, channel, pub.lang('设置失败'));

  }

  /**
   * @name 通过面板获取负载信息
   * @param {object} args {
   *  panel_id: number - 面板ID
   * }
   * @param {object} event
   * @returns {object}
   */
  async get_load(args, event) {
    let channel = args.channel;
    let panel_id = args.data.panel_id;
    // 获取面板信息
    let panel = pub.M(this.TABLE).where('panel_id=?', panel_id).find()
    if (!panel) {
      return pub.send_error(event, channel, pub.lang('面板不存在'));
    }

    // 获取面板负载信息
    try {
      let p;
      if (panel.auth_type == 3) {
        p = new PanelApp(panel.url, panel.api_token, panel);
      } else {
        p = new PanelApi(panel.url, panel.api_token, panel);
      }
      let that = this;
      p.get_network(function (res, err) {
        if (typeof res == 'string') {
          res = JSON.parse(res);
        }
        if (err) {
          return pub.send_error(event, channel, pub.lang('获取负载信息失败: {}', err.message));
        }
        if (res) {
          // 更新面板标题
          if (res.title && !panel.title) pub.M(that.TABLE).where('panel_id=?', panel_id).update({ title: res.title });
          return pub.send_success(event, channel, pub.success_data(res));
        }
        return pub.send_error(event, channel, pub.lang('获取负载信息失败'));
      });
    } catch (err) {
      return pub.send_error(event, channel, pub.lang('面板API初始化失败: {}', err.message));
    }
  }


  /**
   * @name 获取临时登录地址
   * @param {object} args {
   *  panel_id: number - 面板ID
   * }
   * @param {object} event
   * @returns {object}
   */
  async get_tmp_token(args, event) {
    let that = this;
    let channel = args.channel;
    let panel_id = args.data.panel_id;
    let panel = pub.M(this.TABLE).where('panel_id=?', panel_id).find();
    if (!panel) {
      return pub.send_error(event, channel, pub.lang('面板不存在'));
    }
    try {
      let p;
      if (panel.auth_type == 3) {
        p = new PanelApp(panel.url, panel.api_token, panel);
      } else {
        p = new PanelApi(panel.url, panel.api_token, panel);
      }

      p.get_tmp_token(function (res, err) {
        res = that.parseResult(res,err,panel.auth_type);
        if (res && res.status === false){
           return pub.send_error(event, channel,res.msg);
        }

        if (err) {
          if(err.message.indexOf('error:100000f7:SSL') > -1){
            return pub.send_error(event, channel, pub.lang('登录失败: {}', pub.lang('面板地址不支持HTTPS，请修改面板URL地址协议为HTTP')));
          }
          return pub.send_error(event, channel, pub.lang('登录失败: {}', err.message));
        }
        if (res) {
          return pub.send_success(event, channel, res);
        }
        return pub.send_error(event, channel, pub.lang('登录失败'));
      });
    } catch (err) {
      return pub.send_error(event, channel, pub.lang('面板API初始化失败: {}', err.message));
    }
  }

  /**
   * @name 解析面板响应
   * @param {object} res - 面板响应
   * @returns {object}
   */
  parseResult(res,err,auth_type) {
      if (err && err.message) {
          let errorMsg = pub.lang('连接失败: {}', err.message);
          if (err.message.indexOf('error:100000f7:SSL') > -1) {
              errorMsg= pub.lang('面板地址不支持HTTPS，请修改面板URL地址协议为HTTP');
          }else if (err.message.indexOf('404 Not Found') > -1) {
              errorMsg = pub.lang('验证失败，请检查面板API配置是否正确');
              if (auth_type == 3) {
                  errorMsg = pub.lang('验证失败，请检查面板APP插件配置是否正确');
              }
          }else if(err.message.indexOf('read ECONNRESET') > -1){
              errorMsg = pub.lang('连接失败，若通过浏览器可以访问，请检查面板地址及访问协议是否正确');
          }

          return { status: false, msg: errorMsg };
      }

      if (typeof res == 'string') {
          try{
              res = JSON.parse(res);
          }catch(e){
              if (res.indexOf('404 Not Found') > -1) {
                  let errorMsg = pub.lang('验证失败，请检查面板API配置是否正确')
                  if (auth_type == 3) {
                      errorMsg = pub.lang('验证失败，请检查面板APP插件配置是否正确')
                  }
                  return {status:false,msg:errorMsg};
              }else if(res.indexOf("Forbidden") > -1){
                  return {status:false,msg:pub.lang('面板拒绝访问，请检查面板IP禁用和域名白名单配置')};
              }
        }finally{
            if (res.status === false){
                if (auth_type != 3 && res.msg.indexOf("IP校验失败") > -1) {
                    res.msg = pub.lang('IP校验失败，请检查面板API的IP白名单配置是否正确');
                }
              return res;
            }
            
        }
    }
    return res;
  }

  /**
   * @name 获取并同步面板负载信息到前端
   * @param {*} channel 
   * @param {*} panel 
   * @param {*} callback 回调函数，可不传
   */
  sync_load(channel, panel, callback) {
    let that = this;
    let p;
    if (!panel.api_token || !panel.url) return;
    if(!channel) channel = 'panel_loads_recv';
    // console.log(panel);
    if (panel.auth_type == 3) {
      p = new PanelApp(panel.url, panel.api_token, panel);
    } else {
      p = new PanelApi(panel.url, panel.api_token, panel);
    }
    
    p.get_network(function (res, err) {
			res = that.parseResult(res, err, panel.auth_type);
      if (res && res.status === false){
				// -2表示获取不到授权状态，如果获取不到服务器状态和授权状态，直接将其设置为免费版
				if(panel.ov === -1) pub.M(that.TABLE).where('panel_id=?', panel.panel_id).update({ ov: 0 })
				if(panel.status === 0) pub.M(that.TABLE).where('panel_id=?', panel.panel_id).update({ status: 1 })
        return Electron.mainWindow.webContents.send(channel, { panel_id: panel.panel_id,ov:panel.ov,is_open:true,status:1,data: res });
			}
			if (callback) return callback(res, err);
			// 重新获取面板信息
			if(panel.ov == -1){
				panel.ov = pub.M(that.TABLE).where('panel_id=?', panel.panel_id).getField('ov');
			}
      if (err) {
        return Electron.mainWindow.webContents.send(channel, { panel_id: panel.panel_id,ov:panel.ov, data: { status: false, msg: pub.lang('连接失败: ') + err.message } });
      }
      if (res) {
        // 更新面板标题
				if (res.title && panel.title == panel.url.match(/\/\/(.*?):/)[1]) pub.M(that.TABLE).where('panel_id=?', panel.panel_id).update({ title: res.title });
				// 更新面板状态
				if (panel.status === 1) {
					pub.M(that.TABLE).where('panel_id=?', panel.panel_id).update({ status: 0 });
					that.update_global_panel_param(panel.panel_id, { status: 0 }); // 更新全局面板状态
				}
        if(!panel.server_id || panel.ov == -1 || !panel.get_ov){
          // 获取server_id
          p.get_server_id(function(server_id,version,is_aaPanel){
            if(server_id){
              panel.server_id = server_id;
              let pdata = { server_id: server_id };
              if (version !== undefined){
                pdata.ov = version;
                panel.ov = version;
                // 更新全局面板列表
								that.update_global_panel_param(panel.panel_id, { ov: version, get_ov: true }); // 更新全局面板版本

                for(let i=global.PanelList.length-1;i>=0;i--){
                  global.PanelList[i].is_open = true; // 是否允许打开面板
                }
              } 
              pub.M(that.TABLE).where('panel_id=?', panel.panel_id).update(pdata);
              if(!is_aaPanel) Services.get('user').getPanelOv(); // 同步面板信息
            }
          });
        } 

        // 将最新的面板信息返回给前端
				// res.title = panel.title;
				
        // 发送负载信息到前端
        try {
          if (channel && Electron.mainWindow.isFocused()) return Electron.mainWindow.webContents.send(channel, { panel_id: panel.panel_id,ov:panel.ov,is_open:panel.is_open,status:0, data: res });
        } catch (err) {
          pub.log('sync load error:', err.message);
        }
      }
    });
  }
	/**
	 * @name 修改全局面板参数
	 * @param {string} panel_id - 面板ID
	 * @param {object} param - 参数数组 {键:值} 支持同时修改多个参数
	 */
	update_global_panel_param(panel_id,param) { 
		if(!panel_id || !param || !Array.isArray(param) || param.length == 0) return;
		// 遍历全局面板列表，修改参数
		for (let i = 0; i < global.PanelList.length; i++) {
			if (global.PanelList[i].panel_id == panel_id) {
				global.PanelList[i] = Object.assign(global.PanelList[i], param);
				break;
			}
		}
	}


  /**
    * 同步面板负载信息
    */
  get_loads() {
    let that = this;

    setTimeout(function () {
      let time = pub.time();
      if (global.PanelLoadStatus.status && time - global.PanelLoadStatus.last_time > 2) {
        // 设置活跃时间
        global.PanelLoadStatus.last_time = time;


        // 如果主窗口是活跃状态且10分钟内有操作，才获取负载信息
        let last_time = time - global.PanelActionTime;
        if (Electron.mainWindow.isFocused() && last_time < 600) {
          // 获取窗口当前URL，如果是首页，获取面板负载信息
          let url = Electron.mainWindow.webContents.getURL();
          if (url.split("#")[1] === '/home') {
            // 获取所有面板
            if (!global.PanelList) {
              let db_obj = pub.M(that.TABLE)
              global.PanelList = db_obj.select();
              db_obj.close();
              db_obj = undefined;
            }

            for (let i = 0; i < global.PanelList.length; i++) {
              // 同步面板负载信息，每个面板间隔0.1秒
              setTimeout(function () {
                that.sync_load('panel_loads_recv', global.PanelList[i]);
              }, i * 100);
            }
          }
        }

        // 递归获取
        if (global.PanelLoadStatus.status) {
            that.get_loads();
        }
        global.PanelLoadsCount++;
      }
    }, 3000);
  }

  /**
   * @name 开始获取负载信息
   * @param {object} args {
   *    any_channel: string - 用于接收负载信息的频道
   * }
   * @param {object} event
   */
  async start_load(args, event) {
    let channel = args.channel;
    let any_channel = args.data.any_channel;
    let time = pub.time();
    // 如果已经启动，且处在活跃状态，不再启动新的
    if (global.PanelLoadStatus.status == true && time - global.PanelLoadStatus.last_time < 60) {
      pub.log('start load exist');
      return pub.send_error(event, args.channel, pub.lang('负载信息获取已经启动'));
    }

    // let that = this;


    // 启动同步
    if (!global.PanelLoadStatus.status) {
      // 设置启动状态
      global.PanelLoadStatus.status = true;
      global.PanelLoadStatus.last_time = time;
      this.get_loads();
      pub.log('start load');
    }

    return pub.send_success(event, channel, pub.lang('负载信息同步已经启动'));
  }

  /**
   * @name 停止获取负载信息
   * @param {object} args
   * @param {object} event
   */
  async stop_load(args, event) {
    if (global.PanelLoadStatus.status == false) {
      return pub.send_error(event, args.channel, pub.lang('未启动负载信息获取'));
    }
    global.PanelLoadStatus.status = false;
    pub.log('stop load');
    return pub.send_success(event, args.channel, pub.lang('负载信息同步已经停止'));
  }
	/**
	 * @name 获取安装脚本列表
	 */
	async get_install_script(args, event) {
		let url = 'https://dj.bt.cn/index/get_install_scripts'
		pub.httpGet(url, function (res,err) {
			if (err) {
        pub.log(pub.lang('获取安装脚本列表失败: '), err.message);
        return;
			}
			// 正确响应
			if (res) {
				let data = res.body;
				if (typeof data == 'string') {
          data = JSON.parse(data);
				}
				pub.send_success(event, args.channel,data.data)
			}
		})
	}
}

PanelController.toString = () => '[class PanelController]';
module.exports = PanelController;  