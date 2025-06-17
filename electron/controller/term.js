'use strict';
const { Controller } = require('ee-core');
const Log = require('ee-core/log');
const { pub } = require('../class/public.js');
const { Terminal } = require('../class/terminal.js');
const System = require('../class/system.js');
const fs = require('fs');
const { dialog } = require('electron');
const Electron = require('ee-core/electron');
const Services = require('ee-core/services');
const Mstsc = require('../class/mstsc.js');
const os = require("os")

const TermItems = {};
global.active_ssh_id = 0;
global.TermActiveTime = 0;
/**
 * SSH终端
 * @class
 */
class TermController extends Controller {
	constructor(ctx) {
		super(ctx);
		global.TermActiveTime = pub.time();
	}

	async show_open_dialog(args, event) {
		let win = Electron.mainWindow;
		return dialog.showOpenDialogSync(win, args);
	}
	/**
	 * @name 设置排序
	 * @param {object} args
	 * @param {object} event
	 */
	async set_sort(args, event) { 
		pub.M('ssh_info').where('ssh_id=?', args.data.id).update({ sort: args.data.sort });
	}

	/**
	 * @name 导入SSH信息
	 * @param {object} args
	 * @param {object} event
	 * @returns {object}
	 */
	async import(args, event) {
		// 打开文件选择对话框
		dialog.showOpenDialog(Electron.mainWindow, {title: pub.lang('请选择导入的SSH备份文件'),filters: [{name: 'JSON', extensions: ['json']}],}).then(result => {
			if (result.canceled) return; // 取消
			let filename = result.filePaths;
			if (filename.length > 0) {
				
				let data = pub.read_file(filename[0])
				try{
					data = data.toString()

					if (data[0] != '['){
						data = pub.aes_default_decrypt(data)
					}
					let ssh_list = JSON.parse(data);
					if (ssh_list.length == 0) {
						return pub.send_error_msg(event, args.channel, pub.lang('导入数据为空'));
					}
					if(ssh_list[0].group === undefined || ssh_list[0].ssh_data === undefined){
						return pub.send_error_msg(event, args.channel, pub.lang('导入失败，数据格式错误'));
					}
					// 导入数据
					for (let i = 0; i < ssh_list.length; i++) {
						let group = ssh_list[i].group;
						let ssh_data = ssh_list[i].ssh_data;
						let group_id = group.group_id;

						// 导入分组
						if(group.group_id > 0){
							group_id = pub.M('ssh_group').where('group_name=?', group.group_name).getField('group_id');
							if (!group_id) {
								group_id = pub.M('ssh_group').insert({ group_name: group.group_name });
							}
						}

						for (let j = 0; j < ssh_data.length; j++) {
							if(pub.M('ssh_info').where('host=? and port=?', [ssh_data[j].host, ssh_data[j].port]).count()){
								// 已存在
								continue;
							}else{
								let ssh = ssh_data[j];
								delete ssh.ssh_id;
								ssh.group_id = group_id;
								ssh.addtime = pub.time();
								pub.M('ssh_info').insert(ssh);
							}
						}
					}
					pub.send_success_msg(event, args.channel, pub.lang('导入成功'));
				}catch(e){
					pub.send_error_msg(event, args.channel, pub.lang('导入失败，数据格式错误'));
				}
			}

		});
	}

	/**
	 * @name 导出SSH信息
	 * @param {object} args
	 * @param {object} event
	 */
	async export(args, event) {
		let group_list = pub.M('ssh_group').select();
		let ssh_list = pub.M('ssh_info').select();

		group_list.push({ group_id: 0, group_name: pub.lang('默认') });

		let export_data = [];
		for(let i=0;i<group_list.length;i++){
			let group = group_list[i];
			let ssh_data = [];
			for(let j=0;j<ssh_list.length;j++){
				let ssh = ssh_list[j];
				if(ssh.group_id == group.group_id){
					ssh_data.push(ssh);
				}
			}
			export_data.push({
				group:group,
				ssh_data:ssh_data
			});
		}

		let data = JSON.stringify(export_data);
		// 加密
		data = pub.aes_default_encrypt(data);

		// 打开保存对话框
		dialog.showSaveDialog(Electron.mainWindow, { title: pub.lang('请选择保存路径'),
			defaultPath: 'ssh_import.json',
			filters: [
				{ name: 'JSON', extensions: ['json'] }
			],

		 }).then(result => {
			if (result.canceled) return; // 取消
			let filename = result.filePath;
			if (filename) {
				fs.writeFileSync(filename, data);
				pub.send_success_msg(event, args.channel, pub.lang('导出成功'));
			}

		});
	}

	/**
	 * @name 获取SSH列表
	 * @param {object} args{
	 *      page: number, - 页码
	 *      limit: number - 每页显示数量
	 *      search: string - 搜索关键字
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async list(args, event) {
		let search = pub.trim(args.data.search);
		let where = '';
		let params = [];
		let group_id = args.data.group_id;
		if (search) {
			// 搜索条件
			where = '(title like ? or host like ?)';
			let param_value = '%' + search + '%';
			params = [param_value, param_value];
		}

		let result = {};

		// 获取分组
		result.groups = [
			{ group_id: -1, group_name: pub.lang('全部') },
			{ group_id: 0, group_name: pub.lang('默认') },
		];
		let groups = pub.M('ssh_group').select();
		if (groups.length > 0) {
			result.groups = result.groups.concat(groups);
		}

		// 检查分组是否存在
		if (group_id !== undefined && group_id != -1) {
			let group_exists = false;
			for (let i = 0; i < result.groups.length; i++) {
				if (result.groups[i].group_id == group_id) {
					group_exists = true;
					break;
				}
			}
			if (!group_exists) {
				group_id = -1;
			}
		}

		// 按分组获取
		if (group_id !== undefined && group_id != -1) {


			// -1为全部
			if (where) where += ' and ';
			where += 'group_id=?';
			params.push(group_id);
		}



		// 获取数据
		result.data = pub.M('ssh_info').where(where, params).order("sort DESC").select();

		for (let i = 0; i < result.data.length; i++) {
			// 处理mstsc_options
			result.data[i].mstsc_options = JSON.parse(result.data[i].mstsc_options);
			if(result.data[i].os_type == 'Windows'){
				result.data[i].os_name = 'Windows';
				if(result.data[i].mstsc_options.fullscreen === undefined){
					// 填充默认值
					result.data[i].mstsc_options.fullscreen = false;
					result.data[i].mstsc_options.width = 0;
					result.data[i].mstsc_options.height = 0;
					result.data[i].mstsc_options.enableDrives = false;
				}
			}else if(result.data[i].os_name == ''){
				result.data[i].os_name = 'Linux';
			}
		}

		return pub.send_success(event, args.channel, result);
	}

	/**
	 * @name 获取屏幕录像列表
	 * @param {object} args{
	 *     ssh_id: number - SSH ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async video_list(args, event) {
		let ssh_id = args.data.ssh_id;
		let data = pub.M('screen_recording').where('ssh_id=?', ssh_id).order('record_id DESC').limit(100).select();
		return pub.send_success(event, args.channel, data);
	}

	/**
	 * @name 删除屏幕录像
	 * @param {object} args{
	 *    record_id: number - 视频ID
	 * }
	 */
	async remove_video(args, event) {
		let record_id = args.data.record_id;

		let find = pub.M('screen_recording').where('record_id=?', record_id).find();
		let res = pub.M('screen_recording').where('record_id=?', record_id).delete();
		if (res) {
			// 删除录像文件
			if (fs.existsSync(find.filename)) {
				fs.unlinkSync(find.filename);
			}
			// 删除新的录像数据文件
			let data_file = find.filename+".list"
			if (fs.existsSync(data_file)){
				fs.unlinkSync(data_file);
			}

			return pub.send_success_msg(event, args.channel, pub.lang('删除屏幕录像成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('删除屏幕录像失败'));
	}

	/**
	 * @name 获取视频文件内容
	 * @param {object} args{
	 *   record_id: number - 视频ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async get_video(args, event) {
		let record_id = args.data.record_id;
		let data = pub.M('screen_recording').where('record_id=?', record_id).find();
		if (data) {
			let content = fs.readFileSync(data.filename, 'utf-8');
			if (content) {
				let result =  JSON.parse(content);
				// 从分离的数据文件中读取输出
				let data_file = data.filename+".list"
				if (fs.existsSync(data_file)){
					let data_body = fs.readFileSync(data_file, 'utf-8');
					let stdout = [];
					let lines = data_body.split("\n")
					for(let i=0;i<lines.length;i++){
						if(!lines[i].trim()) continue;
						stdout.push(JSON.parse(lines[i]));
					}
					result.stdout = stdout;
				}
				return result;
			}
		}
		return {};
	}

	/**
	 * @name 获取常用命令列表
	 * @param {object} args
	 * @param {object} event
	 * @returns {object}
	 */
	async command_list(args, event) {
		let data = pub.M('common_shell').select();
		let trzsz = false;
		let panel = false;
		if(data.length > 0){
			for(let i=0;i<data.length;i++){
				if(data[i].content.indexOf('trzsz.sh') > -1){
					trzsz = true;
				}
				if(data[i].content.indexOf('install_lts.sh bt-client') > -1){
					panel = true;
				}
			}
		}

		if(trzsz == false){
			data.push({
				title: pub.lang('安装Trzsz'),
				content: 'wget -O trzsz.sh http://download.bt.cn/trzsz/trzsz.sh && bash trzsz.sh && rm -f trzsz.sh && source ~/.bashrc',
				addtime: pub.time(),
			});
		}

		if(panel == false){
			data.push({
				title: pub.lang('安装宝塔面板9.0稳定版'),
				content: 'url=https://download.bt.cn/install/install_lts.sh;if [ -f /usr/bin/curl ];then curl -sSO $url;else wget -O install_lts.sh $url;fi;bash install_lts.sh bt-client',
				addtime: pub.time(),
			});
		}

		
		return pub.send_success(event, args.channel, data);
	}

	/**
	 * @name 添加常用命令
	 * @param {object} args{
	 *   title: string - 标题
	 *   content: string - 内容
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async add_command(args, event) {
		let title = args.data.title;
		let content = args.data.content;
		if (!title) {
			return pub.send_error_msg(event, args.channel, pub.lang('标题不能为空'));
		}
		if (!content) {
			return pub.send_error_msg(event, args.channel, pub.lang('内容不能为空'));
		}

		let pdata = {
			title: title,
			content: content,
			addtime: pub.time(),
		};

		let res = pub.M('common_shell').insert(pdata);
		if (res) {
			return pub.send_success_msg(event, args.channel, pub.lang('添加常用命令成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('添加常用命令失败'));
	}

	/**
	 * @name 修改常用命令
	 * @param {object} args{
	 *   shell_id: number - 命令ID
	 *   title: string - 标题
	 *   content: string - 内容
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async modify_command(args, event) {
		let shell_id = args.data.shell_id;
		let title = args.data.title;
		let content = args.data.content;
		if (!title) {
			return pub.send_error_msg(event, args.channel, pub.lang('标题不能为空'));
		}
		if (!content) {
			return pub.send_error_msg(event, args.channel, pub.lang('内容不能为空'));
		}

		let res = pub.M('common_shell').where('shell_id=?', shell_id).update({ title: title, content: content });
		if (res) {
			return pub.send_success_msg(event, args.channel, pub.lang('修改常用命令成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('修改常用命令失败'));
	}

	/**
	 * @name 删除常用命令
	 * @param {object} args{
	 *  shell_id: number - 命令ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async remove_command(args, event) {
		let shell_id = args.data.shell_id;
		let res = pub.M('common_shell').where('shell_id=?', shell_id).delete();
		if (res) {
			return pub.send_success_msg(event, args.channel, pub.lang('删除常用命令成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('删除常用命令失败'));
	}

	/**
	 * @name 添加SSH分组
	 * @param {object} args{
	 *     group_name: string - 分组名称
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async add_group(args, event) {
		let group_name = args.data.group_name;
		if (!group_name) {
			return pub.send_error_msg(event, args.channel, pub.lang('分组名称不能为空'));
		}
		if (group_name.length > 24) {
			return pub.send_error_msg(event, args.channel, pub.lang('分组名称不能超过24个字符'));
		}
		if (pub.M('ssh_group').where('group_name=?', group_name).count()) {
			return pub.send_error_msg(event, args.channel, pub.lang('分组名称已存在'));
		}
		let res = pub.M('ssh_group').insert({ group_name: group_name });
		if (res) {
			return pub.send_success_msg(event, args.channel, pub.lang('添加分组成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('添加分组失败'));
	}

	/**
	 * @name 修改SSH分组
	 * @param {object} args{
	 *    group_id: number - 分组ID
	 *    group_name: string - 分组名称
	 * }
	 */
	async modify_group(args, event) {
		let group_id = args.data.group_id;
		let group_name = args.data.group_name;
		if (!group_name) {
			return pub.send_error_msg(event, args.channel, pub.lang('分组名称不能为空'));
		}
		if (group_name.length > 24) {
			return pub.send_error_msg(event, args.channel, pub.lang('分组名称不能超过24个字符'));
		}
		if (pub.M('ssh_group').where('group_name=? and group_id!=?', [group_name, group_id]).count()) {
			return pub.send_error_msg(event, args.channel, pub.lang('分组名称已存在'));
		}
		let res = pub.M('ssh_group').where('group_id=?', group_id).update({ group_name: group_name });
		if (res) {
			return pub.send_success_msg(event, args.channel, pub.lang('修改分组成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('修改分组失败'));
	}

	/**
	 * @name 删除SSH分组
	 * @param {object} args{
	 *   group_id: number - 分组ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async remove_group(args, event) {
		let group_id = args.data.group_id;
		if (group_id == 0) {
			return pub.send_error_msg(event, args.channel, pub.lang('默认分组不能删除'));
		}

		let res = pub.M('ssh_group').where('group_id=?', group_id).delete();
		if (res) {
			pub.M('ssh_info').where('group_id=?', group_id).update({ group_id: 0 });
			return pub.send_success_msg(event, args.channel, pub.lang('删除分组成功'));
		}
		return pub.send_error_msg(event, args.channel, pub.lang('删除分组失败'));
	}

	/**
	 * @name 获取SSH归属地区
	 * @param {string} host_list [{
	 *    ssh_id:{number} - SSH-ID
	 *    ip:{string} - IP地址
	 * }] - 主机列表
	 * @return void
	 */
	async get_area(host_list) {
		let ip_list = [];
		for (let i = 0; i < host_list.length; i++) {
			let ip = host_list[i].ip;
			// 加入IP列表
			ip_list.push(ip);
		}

		// 请求接口获取地区
		pub.httpGet('https://www.bt.cn/api/panel/get_ip_info?ip=' + ip_list.join(','), function (res, err) {
			// 发生错误
			if (err) {
				pub.log(pub.lang('获取SSH主机地区失败: '), err.message);
				return;
			}
			// 正确响应
			if (res) {
				let data = res.body;
				if (typeof data == 'string') {
					data = JSON.parse(data);
				}
				// 更新地区
				for (let i = 0; i < host_list.length; i++) {
					let ip = host_list[i].url;
					let ssh_id = host_list[i].ssh_id;

					// 没有响应字段的情况
					if (!data[ip]) {
						data[ip] = {
							country: '',
							en_short_code: '',
						};
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
					pub.M('ssh_info').where('ssh_id=?', ssh_id).update({ area: data[ip].en_short_code });
				}
			}
		});
	}

	/**
	 * @name 获取指定SSH信息
	 * @param {object} args {
	 *      ssh_id: number - SSH ID
	 * }
	 * @param {object} event
	 */
	async find(args, event) {
		let ssh_id = args.data.ssh_id;
		let data = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
		if (data) {
			return pub.send_success(event, args.channel, data);
		}
		return pub.send_error(event, args.channel, {});
	}

	/**
	 * @name 绑定SSH信息
	 * @param {object} args{
	 *      title: string, - 标题/备注/名称
	 *      host: string, - 主机
	 *      port: number, - 端口
	 *      auth_type: number, - 认证类型，0：密码认证，1：私钥认证
	 *      username: string, - 用户名
	 *      password: string, - 密码
	 *      private_key: string - 私钥
	 * }
	 * @param {object} event
	 */
	async bind(args, event) {
		let ssh_info = {
			title: args.data.title,
			host: args.data.host,
			port: args.data.port,
			auth_type: args.data.auth_type,
			username: args.data.username,
			password: args.data.password,
			private_key: args.data.privateKey,
			group_id: 0,
			addtime: pub.time(),
		};

		// 使用代理
		if (args.data.proxy_id !== undefined) {
			ssh_info.proxy_id = args.data.proxy_id;
			if (ssh_info.proxy_id) {
				let proxy = pub.M('proxy_info').where('proxy_id=?', ssh_info.proxy_id).find();
				if (!proxy) {
					return pub.send_error_msg(event, args.channel, pub.lang('代理信息不存在'));
				}
				if (proxy.proxy_type != 2) {
					return pub.send_error_msg(event, args.channel, pub.lang('只能通过SOCKS5代理连接SSH'));
				}
			}
		}

		// 使用分组
		if (args.data.group_id !== undefined && args.data.group_id != -1) {
			ssh_info.group_id = args.data.group_id;
		}

		// 是否自动录屏
		if (args.data.is_recording !== undefined) {
			ssh_info.is_recording = args.data.is_recording;
		}

		// 操作系统类型
		ssh_info.os_type = 'Linux';
		if (args.data.os_type !== undefined) {
			ssh_info.os_type = args.data.os_type;
		}

		if(ssh_info.os_type == 'Windows'){
			ssh_info.os_name = 'Windows';
		}

		// mstsc_options处理
		if (args.data.mstsc_options !== undefined) {
			ssh_info.mstsc_options = JSON.stringify(args.data.mstsc_options);
		}

		let count = pub.M('ssh_info').where('host=? and port=?', [ssh_info.host, ssh_info.port]).count();

		if (count) {
			return pub.send_error_msg(event, args.channel, pub.lang('指定主机和端口已存在'));
		}
		let res = pub.M('ssh_info').insert(ssh_info);

		if (res) {
			global.socks.syncProxy(); // 同步代理池
			this.rm_delete(ssh_info.host, ssh_info.port);
			if(typeof args.data.msgInfo === 'undefined') return pub.send_success_msg(event, args.channel, pub.lang('绑定SSH信息成功'));
		}

		return pub.send_error_msg(event, args.channel, pub.lang('绑定SSH信息失败'));
	}

	/**
	 * @name 修改SSH信息
	 * @param {object} args{
	 *      ssh_id: number, - SSH ID
	 *      title: string, - 标题/备注/名称
	 *      host: string, - 主机
	 *      port: number, - 端口
	 *      auth_type: number, - 认证类型，0：密码认证，1：私钥认证
	 *      username: string, - 用户名
	 *      password: string, - 密码
	 *      privateKey: string - 私钥
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async modify(args, event) {
		let ssh_info = {
			title: args.data.title,
			host: args.data.host,
			port: args.data.port,
			auth_type: args.data.auth_type,
			username: args.data.username,
			password: args.data.password,
			private_key: args.data.privateKey,
		};

		// 使用代理
		if (args.data.proxy_id !== undefined) {
			ssh_info.proxy_id = args.data.proxy_id;
			if (ssh_info.proxy_id) {
				let proxy = pub.M('proxy_info').where('proxy_id=?', ssh_info.proxy_id).find();
				if (!proxy) {
					return pub.send_error_msg(event, args.channel, pub.lang('代理信息不存在'));
				}
				if (proxy.proxy_type != 2) {
					return pub.send_error_msg(event, args.channel, pub.lang('只能通过SOCKS5代理连接SSH'));
				}
			}
		}

		// 使用分组
		if (args.data.group_id !== undefined && args.data.group_id != -1) {
			ssh_info.group_id = args.data.group_id;
		}

		// 是否自动录屏
		if (args.data.is_recording !== undefined) {
			ssh_info.is_recording = args.data.is_recording;
		}

		// 操作系统类型
		ssh_info.os_type = 'linux';
		if (args.data.os_type !== undefined) {
			ssh_info.os_type = args.data.os_type;
		}

		// mstsc_options处理
		if (args.data.mstsc_options !== undefined) {
			ssh_info.mstsc_options = JSON.stringify(args.data.mstsc_options);
		}

		let res = pub.M('ssh_info').where('ssh_id=?', args.data.ssh_id).update(ssh_info);
		if (!res) {
			return pub.send_error_msg(event, args.channel, pub.lang('修改SSH信息失败'));
		}
		global.socks.syncProxy(); // 同步代理池
		pub.write_log(1, pub.lang('修改SSH信息[{}]成功', args.data.ssh_id));
		// 同步到云端
		Services.get('user').syncSshToCloud();
		return pub.send_success_msg(event, args.channel, pub.lang('修改SSH信息成功'));
	}

	/**
	 * @name 标记删除SSH信息
	 * @param {string} host - 主机
	 * @param {number} port - 端口
	 * @param {number} ssh_id - SSH ID  如果传了这个参数，就不需要传host和port
	 * @returns {boolean}
	 * @description 标记删除SSH信息
	 */
	async to_delete(host, port,ssh_id) {
		if(ssh_id){
			let find = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
			if(find){
				host = find.host;
				port = find.port;
			}else{
				return false;
			}
		}
		let host_hash = pub.md5(`${host}:${port}`);
		let res = pub.M('ssh_delete').where('host_hash=?', host_hash).find();
		if (res) {
			return false;
		}
		// 标记删除
		res = pub.M('ssh_delete').insert({ host_hash: host_hash,  delete_time: pub.time() });

		// 从云端删除
		Services.get('user').removeSshToCloud(host, port);

		return true;
	}

	/**
	 * @name 删除SSH删除标记信息
	 * @param {string} host - 主机
	 * @param {number} port - 端口
	 * @param {number} ssh_id - SSH ID  如果传了这个参数，就不需要传host和port
	 * @returns {boolean}
	 * @description 删除SSH删除标记信息
	 */ 
	async rm_delete(host, port,ssh_id) {
		if(ssh_id){
			let find = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
			if(find){
				host = find.host;
				port = find.port;
			}else{
				return false;
			}
		}
		let host_hash = pub.md5(`${host}:${port}`);
		pub.M('ssh_delete').where('host_hash=?', host_hash).delete();
		// 同步到云端
		Services.get('user').syncSshToCloud();
		return true;
	}

	/**
	 * @name 修改SSH代理
	 * @param {object} args{
	 *    ssh_id: number - SSH ID
	 *    proxy_id: number - 代理ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async modify_proxy(args, event) {
		let channel = args.channel;
		let ssh_id = args.data.ssh_id;
		let proxy_id = args.data.proxy_id;

		if (proxy_id) {
			let proxy = pub.M('proxy').where('proxy_id=?', proxy_id).find();
			if (!proxy) {
				return pub.send_error_msg(event, args.channel, pub.lang('代理信息不存在'));
			}
			if (proxy.proxy_type != 2) {
				return pub.send_error_msg(event, args.channel, pub.lang('只能通过SOCKS5代理连接SSH'));
			}
		}

		let res = pub.M('ssh_info').where('ssh_id=?', ssh_id).update({ proxy_id: proxy_id });
		if (!res) {
			return pub.send_error_msg(event, channel, pub.lang('修改SSH代理失败'));
		}
		return pub.send_success_msg(event, channel, pub.lang('修改SSH代理成功'));
	}

	/**
	 * @name 删除SSH信息
	 * @param {object} args{
	 *     ssh_id: number - SSH ID
	 * }
	 * @param {object} event
	 */
	async remove(args, event) {
		let ssh_id = args.data.ssh_id;
		let find = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
		if (!find) {
			return pub.send_error_msg(event, args.channel, pub.lang('SSH信息不存在'));
		}
		let res = pub.M('ssh_info').where('ssh_id=?', ssh_id).delete();
		if (!res) {
			return pub.send_error_msg(event, args.channel, pub.lang('删除SSH信息失败'));
		}
		pub.write_log(1, pub.lang('删除SSH信息[{}]成功', ssh_id));
		this.to_delete(find.host, find.port);
		return pub.send_success_msg(event, args.channel, pub.lang('删除SSH信息成功'));
	}

	/**
	 * @name 设置SSH为常用SSH
	 * @param {object} args{
	 *      ssh_ids: array - SSH ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async set_common_use(args, event) {
		let channel = args.channel;
		let ssh_ids = args.data.ssh_ids;

		let max_common_use = pub.C('max_common_use');
		if (!max_common_use) {
			max_common_use = 10;
		}
		if (ssh_ids.length >= max_common_use) {
			return pub.send_error_msg(event, channel, pub.lang('最多只能设置{}个常用SSH', max_common_use));
		}

		// 更新数据表
		let param = '(' + ssh_ids.join(',') + ')';
		pub.M('ssh_info').where('common_use=?', 1).update({ common_use: 0 });
		let res = pub
			.M('ssh_info')
			.where('ssh_id in ' + param, [])
			.update({ common_use: common_use });
		if (!res) {
			return pub.send_error_msg(event, channel, pub.lang('设置失败'));
		}

		// 设置成功
		return pub.send_success_msg(event, channel, pub.lang('设置成功'));
	}

	/**
	 * @name 发送负载数据
	 * @param {number} ssh_id - SSH ID
	 * @returns {void}
	 */
	send_load(ssh_id) {

		if (!global.SftpItems[ssh_id]) {
			return;
		}
		if(global.active_ssh_id != ssh_id){
			return;
		}

		let self = this;
		let channel = 'ssh_get_load';
		setTimeout(()=>{
			// 只有终端未释放、且当前终端在前台、且窗口未失焦、且最后一次活动时间小于600秒才发送数据
			let time = pub.time();
			let last_time = time - global.TermActiveTime;
			if(global.SftpItems[ssh_id] && global.active_ssh_id == ssh_id && Electron.mainWindow.isFocused() && last_time < 600){
				// 只有在终端页面才发送数据
				let url = Electron.mainWindow.webContents.getURL();
				if(url.split("#")[1] === '/xterm'){
					global.SftpItems[ssh_id].getAllNoConnect(function (data) {
						data.ssh_id = ssh_id; // 标记SSH ID
						Electron.mainWindow.webContents.send(channel, data);
					});
				}
				// 梯归
				if(global.active_ssh_id == ssh_id) self.send_load(ssh_id);
			}
		},3000);
	}


	/**
	 * @name 通过SSH获取服务器负载信息
	 * @param {object} args{
	 *    ssh_id: number - SSH ID
	 * }
	 * @param {object} event
	 * @returns {object}
	 */
	async get_load(args, event) {
		let ssh_id = args.data.ssh_id;
		if (!ssh_id) {
			return pub.send_error_msg(event, args.channel, pub.lang('SSH ID不能为空'));
		}
		let ssh_info = pub.M('ssh_info').where('ssh_id=?', ssh_id).find();
		if (!ssh_info) {
			return pub.send_error_msg(event, args.channel, pub.lang('SSH信息不存在'));
		}

		let self = this;
		global.active_ssh_id = ssh_id;
		if (!global.SftpItems[ssh_id]) {
			// 如果没有连接，实例化连接
			global.SftpItems[ssh_id] = new System();
			global.SftpItems[ssh_id].connect(ssh_info, function () {
				self.send_load(ssh_id);
			});
		}else{
			self.send_load(ssh_id);
		}
	}

	/**
	 * @name 连接终端
	 * @param {object} args {
	 * channel: string, - 通道标识
	 * data: {          - 连接信息
	 *      ssh_id: number, - SSH ID，如果传了这个参数，就不需要传下面的参数
	 *      host: string, - 主机
	 *      port: number, - 端口
	 *      auth_type: number, - 认证类型，1：密码认证，2：私钥认证
	 *      username: string, - 用户名
	 *      password: string, - 密码
	 *      private_key: string  - 私钥
	 *  }
	 * }
	 * @param {object} event - ipc通信时才有值。详情见：控制器文档
	 */
	async connect(args, event) {
		let channel = args.channel;
		if (args.data.ssh_id) {
			let data = pub.M('ssh_info').where('ssh_id=?', args.data.ssh_id).find();

			if (!data) {
				return pub.send_error_msg(event, channel, pub.lang('服务器信息不存在'));
			}

			if(data.os_type != 'Windows'){
				args.data = data;
				// 实例化终端服务
				TermItems[channel] = new Terminal();
				// 连接终端
				TermItems[channel].connect(args, event);
			}else{
				let platform = os.platform()
				if(platform != 'win32'){
					this.open_rdp(data, event);
					pub.send_success_msg(event, channel, pub.lang('连接成功'));
				}else{
					let rdp = new Mstsc();
					rdp.connect(data, function(res){
						pub.send_success_msg(event, channel, pub.lang('连接成功'));
					});
				}
			}
		} else {
			if (args.data.os_type != 'Windows') {
				// 实例化终端服务
				TermItems[channel] = new Terminal();
				// 连接终端
				TermItems[channel].connect(args, event);
			}else{
				let platform = os.platform()
				if(platform != 'win32'){
					this.open_rdp(args.data, event);
					pub.send_success_msg(event, channel, pub.lang('连接成功'));
				}else{
					let rdp = new Mstsc();
					rdp.connect(args.data, function(res){
						pub.send_success_msg(event, channel, pub.lang('连接成功'));
					});
				}
			}
		}

		// Log.info('connect:', channel);
	}


	// 打开内置RDP
	async open_rdp(server_config, event){
		const { BrowserWindow } = require('electron');
		// 创建新的窗口
		var winWidth = 1024;
		var winHeight = 768;
		let win = new BrowserWindow({
			width: winWidth,
			height: winHeight,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				// experimentalFeatures: true,
				// webSecurity:false,
			},
		});

		var host = `${server_config.host}:${server_config.port}`
		var user = server_config.username;
        var password = server_config.password;
		var width = winWidth - 16;
		var height = winHeight - 39;

		// 打开调试工具
		// win.webContents.openDevTools();

		// 加载页面
		win.loadURL("http://127.0.0.1:61414?host="+host+"&user="+user+"&password="+password+"&width="+width+"&height="+height);


		// 窗口大小改变事件
		var lastResize = 0;
		win.on('resize', () => {
			// 获取视图大小
			let nowTime = pub.time();
			if(nowTime - lastResize < 1){
				return;
			}
			lastResize = nowTime;
			setTimeout(() => {
				let size = win.getContentSize();
				width = size[0];
				height = size[1];

				// 调用JS关闭连接
				win.webContents.executeJavaScript('client.disconnect();');
				// 重新连接
				win.loadURL("http://127.0.0.1:61414?host="+host+"&user="+user+"&password="+password+"&width="+width+"&height="+height);
			},500);
		});


		// F11全屏
		win.webContents.on('before-input-event', (event, input) => {
			// F11 切换全屏
            if (input.type === 'keyDown' && input.key === 'F11') {
                win.setFullScreen(!win.isFullScreen());
            }
		});
	}

	/**
	 * @name 写入终端
	 * @param {object} args{
	 *  channel: string,  - 通道标识
	 *  data: string     - 写入的数据
	 * } - 前端传的参数
	 * @param {object} event - ipc通信时才有值。详情见：控制器文档
	 * @returns {void}
	 */
	async write(args, event) {
		let channel = args.channel;
		TermItems[channel].write(args.data);
	}

	/**
	 * @name 断开终端
	 * @param {object} args {
	 *  channel: string - 通道标识
	 * }
	 * @param {object} event - ipc通信时才有值。详情见：控制器文档
	 * @returns {object}
	 */
	async disconnect(args, event) {
		let channel = args.channel;
		if(TermItems[channel].ssh_id){
			if(global.SftpItems[TermItems[channel].ssh_id]){
				global.SftpItems[TermItems[channel].ssh_id].disconnect();
				delete global.SftpItems[TermItems[channel].ssh_id];
			}
		}
		TermItems[channel].disconnect();
		delete TermItems[channel];
		// Log.info('disconnect:', channel);
		return pub.send_success_msg(event, channel, pub.lang('断开终端成功'));
	}

	/**
	 * @name 调整终端大小
	 * @param {object} args {
	 *  channel: string, - 通道标识
	 *  data: {
	 *      rows: number, - 行数
	 *      cols: number  - 列数
	 *  }
	 * }
	 * @param {object} event - ipc通信时才有值。详情见：控制器文档
	 * @returns {object}
	 */
	async resize(args, event) {
		let channel = args.channel;
		if (TermItems[channel] && TermItems[channel].stream) {
			let rows = args.data.rows;
			let cols = args.data.cols;
			
			TermItems[channel].stream.setWindow(rows, cols);
			TermItems[channel].width = cols;
			TermItems[channel].height = rows;
		}
	}

	/**
	 * @name 获取连接的终端列表
	 * @returns {object}
	 */
	async connect_list(args, event) {
		return pub.success(Object.keys(TermItems));
	}
	/**
	 * @name 删除连接中的终端
	 * @param {object} args {
	 *  channel: string - 通道标识
	 *  data:{
	 * 		mode: string - 模式 all:全部, other:其他, self:自己
	 *    ssh_id: number - SSH ID [other/self模式下需要]
	 * }
	 * }
	 */
	async delete_connect(args, event) { 
		let channel = args.channel;
		if (args.data.mode == 'all') {
			for (let key in TermItems) {
				if (global.SftpItems[TermItems[key].ssh_id]) {
					global.SftpItems[TermItems[key].ssh_id].disconnect();
					delete global.SftpItems[TermItems[key].ssh_id];
				}
				TermItems[key].disconnect();
				delete TermItems[key];
			}
		}
		if (args.data.mode == 'other') {
			for (let key in TermItems) {
				if (key != args.data.ssh_id) {
					if (global.SftpItems[TermItems[key].ssh_id]) {
						global.SftpItems[TermItems[key].ssh_id].disconnect();
						delete global.SftpItems[TermItems[key].ssh_id];
					}
					TermItems[key].disconnect();
					delete TermItems[key];
				}
			}
		}
		if (args.data.mode == 'self') {
			for (let key in TermItems) {
				if (key === args.data.ssh_id) {
					if (global.SftpItems[TermItems[key].ssh_id]) {
						global.SftpItems[TermItems[key].ssh_id].disconnect();
						delete global.SftpItems[TermItems[key].ssh_id];
					}
					TermItems[key].disconnect();
					delete TermItems[key];
				}
			}
		}
		return pub.send_success_msg(event, channel, pub.lang('终端删除成功'));
	}
}

TermController.toString = () => '[class TermController]';
module.exports = TermController;
