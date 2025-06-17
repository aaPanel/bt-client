// 引用IPC通信库
import { ipc } from '@/utils/ipcRenderer';
// 引用后端路由
import routes from '../electron.route.js';

class common {
	time() {
		return Math.round(new Date().getTime() / 1000);
	}

	send(route, data, callback) {
		let channel = route;
		ipc.removeAllListeners(channel);
		ipc.on(channel, (event, result) => {
			if (result && callback) {
				callback(result);
			}
		});
		let pdata = {
			channel: channel,
			data: data,
		};

		ipc.send(channel, pdata);
	}



}

class termDemo extends common {

	// 导出SSH信息
	export() {
		let channel = routes.term.export.path;
		this.send(routes.term.export.path, {}, result => {
			console.log(channel, result);
		});
	}

	// 导入SSH信息
	import() {
		let channel = routes.term.import.path;
		this.send(routes.term.import.path, {}, result => {
			console.log(channel, result);
		});
	}


	/**
	 * @name 获取SSH列表
	 */
	list() {
		let channel = routes.term.list.path;
		this.send(routes.term.list.path, { group_id:-1 }, result => {
			console.log(channel, result);
		});
	}

	/**
	 * @name 获取指定SSH信息
	 */
	find() {
		let channel = routes.term.find.path;
		this.send(routes.term.find.path, { ssh_id: 1 }, result => {
			console.log(channel, result);
		});
	}

	/**
	 * @name 绑定SSH信息
	 */
	bind() {
		let ssh_info = {
			title: '测试SSH',
			host: '192.168.1.25',
			port: 22,
			auth_type: 1,
			username: 'root',
			password: 'www.bt.cn',
			privateKey: '',
		};
		let channel = routes.term.bind.path;
		this.send(routes.term.bind.path, ssh_info, result => {
			console.log(channel, result);
		});
	}

	/**
	 * @name 修改SSH信息
	 */
	modify() {
		let ssh_info = {
			ssh_id: 1,
			title: '测试SSH2222',
			host: '192.168.1.25',
			port: 22,
			auth_type: 1,
			username: 'root',
			password: 'www.bt.cn',
			privateKey: ''
		}
		let channel = routes.term.modify.path;
		this.send(routes.term.modify.path, ssh_info, result =>{
			console.log(channel, result);
		});
	}

	/**
	 * @name 删除SSH信息
	 */
	remove() {
		let channel = routes.term.remove.path;
		this.send(routes.term.remove.path, { ssh_id: 1 }, result => {
			console.log(channel, result);
		});
	}

	get_load() {
		let channel = routes.term.get_load.path;
		console.log(channel);
		this.send(routes.term.get_load.path, { ssh_id: 2 }, result => {
			console.log(channel, result);
		});
	}

	// 添加分组
	add_group(){
		let channel = routes.term.add_group.path;
		this.send(routes.term.add_group.path,{group_name:'测试分组'},function(result){
			console.log(channel,result);
		})
	}

	// 删除分组
	remove_group(){
		let channel = routes.term.remove_group.path;
		this.send(routes.term.remove_group.path,{group_id:1},function(result){
			console.log(channel,result);
		})
	}

	// 修改分组
	modify_group(){
		let channel = routes.term.modify_group.path;
		this.send(routes.term.modify_group.path,{group_id:1,group_name:'测试分组1'},function(result){
			console.log(channel,result);
		})
	}


	// 获取屏幕录像视频列表
	video_list(){
		let channel = routes.term.video_list.path;
		this.send(routes.term.video_list.path,{ssh_id:2},function(result){
			console.log(channel,result);
		})
	}


	// 删除屏幕录像视频
	remove_video(){
		let channel = routes.term.remove_video.path;
		this.send(routes.term.remove_video.path,{record_id:1},function(result){
			console.log(channel,result);
		})
	}


	// 获取屏幕录像视频
	get_video(){
		let channel = routes.term.get_video.path;
		this.send(routes.term.get_video.path,{record_id:5},function(result){
			console.log(channel,result);
		})
	}

	// 获取常用命令列表
	command_list(){
		let channel = routes.term.command_list.path;
		this.send(routes.term.command_list.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 添加常用命令
	add_command(){
		let channel = routes.term.add_command.path;
		let pdata = {
			title: '测试命令',
			content: 'ls -al',
		}
		this.send(routes.term.add_command.path,pdata,function(result){
			console.log(channel,result);
		})
	}

	// 删除常用命令
	remove_command(){
		let channel = routes.term.remove_command.path;
		this.send(routes.term.remove_command.path,{shell_id:1},function(result){
			console.log(channel,result);
		})
	}

	// 修改常用命令
	modify_command(){
		let channel = routes.term.modify_command.path;
		let pdata = {
			shell_id: 1,
			title: '测试命令',
			content: 'ls -al',
		}
		this.send(routes.term.modify_command.path,pdata,function(result){
			console.log(channel,result);
		})
	}

}

class panelDemo extends common {

	// 导出面板信息
	export() {
		let channel = routes.panel.export.path;
		this.send(routes.panel.export.path, {}, result => {
			console.log(channel, result);
		});
	}

	// 导入面板信息
	import() {
		let channel = routes.panel.import.path;
		this.send(routes.panel.import.path, {}, result => {
			console.log(channel, result);
		});
	}

	// 开始获取面板负载信息
	start_load(){
		let any_channel = 'panel_loads_recv'
		ipc.on(any_channel, (event, result) => {
			console.log(any_channel, result);
		});

		let pdata = {
			any_channel: any_channel,
		}
		let channel = routes.panel.start_load.path;
		this.send(routes.panel.start_load.path,pdata,function(result){
			console.log(channel,result);
		})
	}

	// 停止获取面板负载信息
	stop_load(){
		let channel = routes.panel.stop_load.path;
		this.send(routes.panel.stop_load.path,{panel_id:1},function(result){
			console.log(channel,result);
		})
	}

	/**
	 * @name 获取面板列表
	 */
	list() {
		let channel = routes.panel.list.path;
		this.send(routes.panel.list.path, { page: 1, limit: 10, search: '' }, result => {
			console.log(channel, result);
		});
	}

	bind(){
		let pdata = {
			title: '测试面板1',
			url: 'http://www.bt.cn11111111111',
			auth_type: 1,
			token: '',
			admin_path: '/login',
			username: 'admin',
			password: 'admin'
		}

		let channel = routes.panel.bind.path;
		this.send(routes.panel.bind.path,pdata,function(result){
			console.log(channel,result);
		})
	}

	bind_app(){
		let pdata = {
			auth_type: 3,
			token: 'aHR0cHM6Ly8xOTIuMTY4LjEuMjU6Mzc2Njh8Sk1xYnNuRHJpcXNpQXFlbXN4Z2szZDg1N3VVSDJMSEV8RFN0N3E5M2I5eElnRDZLRXxnaklUeUhFVEdnZWlWWTlLdmQ='
		}

		let channel = routes.panel.bind_app.path;
		this.send(routes.panel.bind_app.path,pdata,function(result){
			console.log(channel,result);
		});
	}

	remove(){
		let channel = routes.panel.remove.path;
		this.send(routes.panel.remove.path,{panel_id:2},function(result){
			console.log(channel,result);
		})
	}

	find(){
		let channel = routes.panel.find.path;
		this.send(routes.panel.find.path,{panel_id:1},function(result){
			console.log(channel,result);
		})
	}

	modify(){
		let pdata = {
			panel_id:3,
			title: '测试面板',
			url: 'http://www.bt.cn12121245566',
			auth_type: 1,
			token: '121212',
			admin_path: '/login',
			username: 'admin',
			password: 'admin'
		}
		let channel = routes.panel.modify.path;
		this.send(routes.panel.modify.path,pdata,function(result){
			console.log(channel,result);
		})
	}


	get_load(){
		let channel = routes.panel.get_load.path;
		this.send(routes.panel.get_load.path,{panel_id:1},function(result){
			console.log(channel,result);
		})
	}

	get_tmp_token(){
		let channel = routes.panel.get_tmp_token.path;
		this.send(routes.panel.get_tmp_token.path,{panel_id:1},function(result){
			console.log(channel,result);
		})
	}

	set_common_use(){
		let channel = routes.panel.set_common_use.path;
		this.send(routes.panel.set_common_use.path,{panel_ids:[1]},function(result){
			console.log(channel,result);
		})
	}

	// 添加分组
	add_group(){
		let channel = routes.panel.add_group.path;
		this.send(routes.panel.add_group.path,{group_name:'测试分组'},function(result){
			console.log(channel,result);
		})
	}

	// 删除分组
	remove_group(){
		let channel = routes.panel.remove_group.path;
		this.send(routes.panel.remove_group.path,{group_id:1},function(result){
			console.log(channel,result);
		})
	}

	// 修改分组
	modify_group(){
		let channel = routes.term.modify_group.path;
		this.send(routes.term.modify_group.path,{group_id:1,group_name:'测试分组1'},function(result){
			console.log(channel,result);
		})
	}

}


class windowDemo extends common {

	// 取消下载任务
	cancel_download(){
		let channel = routes.window.cancel_download.path;
		this.send(routes.window.cancel_download.path,{download_id:1},function(result){
			console.log(channel,result);
		})
	}

	// 打开文件下载窗口
	open_download_window(){
		let channel = routes.window.open_download_window.path;
		this.send(routes.window.open_download_window.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 获取下载列表
	get_download_list(){
		let channel = routes.window.get_download_list.path;
		this.send(routes.window.get_download_list.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 删除下载任务 -- 仅限已完成或失败的任务
	remove_download(){
		let channel = routes.window.remove_download.path;
		this.send(routes.window.remove_download.path,{download_id:1},function(result){
			console.log(channel,result);
		})
	}

	create(){
		let pdata = {
			view_key: 'test',
			url: 'http://www.bt.cn',
			options: {},
			bounds: {
				x: 0,
				y: 0,
				width: 800,
				height: 600
			},
			auto_resize: {
				width: true,
				height: true,
				horizontal: true,
				vertical: true
			}
		}
		let channel = routes.window.create.path;
		this.send(routes.window.create.path,pdata,function(result){
			console.log(channel,result);
		})
	}

	destroy(){
		let channel = routes.window.destroy.path;
		this.send(routes.window.destroy.path,{view_key:'test'},function(result){
			console.log(channel,result);
		})
	}


	show(){
		let channel = routes.window.show.path;
		this.send(routes.window.show.path,{view_key:'test'},function(result){
			console.log(channel,result);
		})
	}

	hide(){
		let channel = routes.window.hide.path;
		this.send(routes.window.hide.path,{view_key:'test'},function(result){
			console.log(channel,result);
		})
	}

	set_bounds(){
		let channel = routes.window.set_bounds.path;
		this.send(routes.window.set_bounds.path,{view_key:'test',bounds:{x:0,y:0,width:400,height:200}},function(result){
			console.log(channel,result);
		})
	}

	set_auto_resize(){
		let channel = routes.window.set_auto_resize.path;
		this.send(routes.window.set_auto_resize.path,{view_key:'test',auto_resize:{width:true,height:true,horizontal:true,vertical:true}},function(result){
			console.log(channel,result);
		})
	}

	list(){
		let channel = routes.window.list.path;
		this.send(routes.window.list.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 最大化主窗口/恢复主窗口
	window_maximize(){
		let channel = routes.window.window_maximize.path;
		this.send(routes.window.window_maximize.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 最小化主窗口
	window_minimize(){
		let channel = routes.window.window_minimize.path;
		this.send(routes.window.window_minimize.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 关闭主窗口
	window_close(){
		let channel = routes.window.window_close.path;
		this.send(routes.window.window_close.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 重新加载主窗口
	app_reload(){
		let channel = routes.window.app_reload.path;
		this.send(routes.window.app_reload.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 全屏/退出全屏
	window_fullscreen(){
		let channel = routes.window.window_fullscreen.path;
		this.send(routes.window.window_fullscreen.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 置顶/取消置顶
	window_top(){
		let channel = routes.window.window_top.path;
		this.send(routes.window.window_top.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 退出应用
	app_quit(){
		let channel = routes.window.app_quit.path;
		this.send(routes.window.app_quit.path,{action:'close'},function(result){
			console.log(channel,result);
		})
	}

	// 主窗口是否最大化
	is_maximized(){
		let channel = routes.window.is_maximized.path;
		this.send(routes.window.is_maximized.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 主窗口是否全屏
	is_fullscreen(){
		let channel = routes.window.is_fullscreen.path;
		this.send(routes.window.is_fullscreen.path,{},function(result){
			console.log(channel,result);
		})
	}
}


class filesDemo extends common {

	// 在文件管理器中显示指定的文件
	os_open_folder(){
		let channel = routes.files.os_open_folder.path;
		this.send(routes.files.os_open_folder.path,{filename:'D:\\Users\\hwl\\Documents\\WeChat Files\\kafeishoushou\\FileStorage\\File\\2024-09\\bt-client-mac-1.0.5-arm64(1).dmg'},function(result){
			console.log(channel,result);
		})
	}

	// 以默认方式打开指定的文件
	os_open_file(){
		let channel = routes.files.os_open_file.path;
		this.send(routes.files.os_open_file.path,{filename:'D:\\Users\\hwl\\Documents\\WeChat Files\\kafeishoushou\\FileStorage\\File\\2024-09\\wordpress.zip'},function(result){
			console.log(channel,result);
		})
	}


	// 获取SFTP连接列表
	get_sftp_items(){
		let channel = routes.files.get_sftp_items.path;
		this.send(routes.files.get_sftp_items.path,{},function(result){
			console.log(channel,result);
		})
	}


	// 连接
	connect(){
		let channel = routes.files.connect.path;
		let pdata = {
			ssh_id: 10
		}
		this.send(routes.files.connect.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 断开连接
	disconnect(){
		let channel = routes.files.disconnect.path;
		let pdata = {
			ssh_id: 1
		}
		this.send(routes.files.disconnect.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 获取文件列表
	list_dir(){
		let channel = routes.files.list_dir.path;
		let pdata = {
			ssh_id: 10,
			path: '/'
		}
		this.send(routes.files.list_dir.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 获取下载列表
	get_download_items(){
		let channel = routes.files.get_download_items.path;
		this.send(routes.files.get_download_items.path,{ssh_id:1},function(result){
			console.log(channel,result);
		})
	}

	// 获取上传列表
	get_upload_items(){
		let channel = routes.files.get_upload_items.path;
		this.send(routes.files.get_upload_items.path,{ssh_id:1},function(result){
			console.log(channel,result);
		})
	}

	// 下载文件
	download(){
		let channel = routes.files.download.path;
		let pdata = {
			ssh_id: 1,
			remotePath: '/www/wwwroot/1.txt',
			localPath: 'D:/1.txt'
		}
		this.send(routes.files.download.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 上传文件
	upload(){
		let channel = routes.files.upload.path;
		let pdata = {
			ssh_id: 1,
			remotePath: '/www/wwwroot/1.txt',
			localPath: 'D:/1.txt'
		}
		this.send(routes.files.upload.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 删除文件
	remove(){
		let channel = routes.files.remove.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/1.txt'
		}
		this.send(routes.files.remove.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 创建文件
	touch(){
		let channel = routes.files.touch.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/1.txt'
		}
		this.send(routes.files.touch.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 创建目录
	mkdir(){
		let channel = routes.files.mkdir.path;
		let pdata = {
			ssh_id: 1,
			path: '/www/wwwroot/test'
		}
		this.send(routes.files.mkdir.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 删除目录
	rmdir(){
		let channel = routes.files.rmdir.path;
		let pdata = {
			ssh_id: 1,
			path: '/www/wwwroot/test'
		}
		this.send(routes.files.rmdir.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 重命名
	rename(){
		let channel = routes.files.rename.path;
		let pdata = {
			ssh_id: 1,
			oldPath: '/www/wwwroot/test',
			newPath: '/www/wwwroot/test2'
		}
		this.send(routes.files.rename.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 获取文件信息
	stat(){
		let channel = routes.files.stat.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/test2'
		}
		this.send(routes.files.stat.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 读取文件
	read_file(){
		let channel = routes.files.read_file.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/test2'
		}
		this.send(routes.files.read_file.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 写入文件
	write_file(){
		let channel = routes.files.write_file.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/test2',
			data: 'test'
		}
		this.send(routes.files.write_file.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 获取用户和组列表
	get_user_group(){
		let channel = routes.files.get_user_group.path;
		let pdata = {
			ssh_id: 1
		}
		this.send(routes.files.get_user_group.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 修改文件所有者
	chown(){
		let channel = routes.files.chown.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/test2',
			uid: 0,
			gid: 0
		}
		this.send(routes.files.chown.path,pdata,function(result){
			console.log(channel,result);
		})
	}
	// 修改文件权限
	chmod(){
		let channel = routes.files.chmod.path;
		let pdata = {
			ssh_id: 1,
			filename: '/www/wwwroot/test2',
			mode: 0o777
		}
		this.send(routes.files.chmod.path,pdata,function(result){
			console.log(channel,result);
		})
	}
}

class indexDemo extends common {
	// 免密登录
	not_password(){
		let channel = routes.index.not_password.path;
		this.send(routes.index.not_password.path,{password:'showpy.com',not_password:true},function(result){
			console.log(channel,result);
		})
	}

	// 获取当前语言和支持的语言列表
	get_languages(){
		let channel = routes.index.get_languages.path;
		this.send(routes.index.get_languages.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 设置当前语言
	set_language(){
		let channel = routes.index.set_language.path;
		this.send(routes.index.set_language.path,{language:'en'},function(result){
			console.log(channel,result);
		})
	}

	// 获取客户端语言包
	get_client_language(){
		let channel = routes.index.get_client_language.path;
		this.send(routes.index.get_client_language.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 获取服务端语言包
	get_server_language(){
		let channel = routes.index.get_server_language.path;
		this.send(routes.index.get_server_language.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 判断是否设置管理密码
	has_password(){
		let channel = routes.index.has_password.path;
		this.send(routes.index.has_password.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 设置管理密码
	set_password(){
		let channel = routes.index.set_password.path;
		this.send(routes.index.set_password.path,{password:'12345678'},function(result){
			console.log(channel,result);
		})
	}

	// 检查管理密码是否正确
	check_password(){
		let channel = routes.index.check_password.path;
		this.send(routes.index.check_password.path,{password:'12345678'},function(result){
			console.log(channel,result);
		})
	}

	// 获取配置信息
	get_config(){
		let channel = routes.index.get_config.path;
		this.send(routes.index.get_config.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 设置配置信息
	set_config(){
		let channel = routes.index.set_config.path;
		this.send(routes.index.set_config.path,{key:'sync_cloud',value:true},function(result){
			console.log(channel,result);
		})
	}
}


class userDemo extends common {

	// 获取用户信息
	get_user_info(){
		let channel = routes.user.get_user_info.path;
		this.send(routes.user.get_user_info.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 绑定用户
	bind(){
		let channel = routes.user.bind.path;
		this.send(routes.user.bind.path,{username:'13713212811',password:'111111111'},function(result){
			console.log(channel,result);
		})
	}

	// 解除绑定
	unbind(){
		let channel = routes.user.unbind.path;
		this.send(routes.user.unbind.path,{},function(result){
			console.log(channel,result);
		})
	}


}


class proxyDemo extends common {

	// 获取代理列表
	getProxyList(){
		let channel = routes.proxy.getProxyList.path;
		this.send(routes.proxy.getProxyList.path,{},function(result){
			console.log(channel,result);
		})
	}

	// 添加代理
	addProxy(){
		let channel = routes.proxy.addProxy.path;
		let pdata = {
			proxy_name: '测试Socks代理',
			proxy_ip: '127.0.0.1',
			proxy_port: 10808,
			proxy_type: 2,
			proxy_username: '',
			proxy_password: ''
		}
		this.send(routes.proxy.addProxy.path,pdata,function(result){
			console.log(channel,result);
		})
	}

	// 删除代理
	delProxy(){
		let channel = routes.proxy.delProxy.path;
		this.send(routes.proxy.delProxy.path,{proxy_id:6},function(result){
			console.log(channel,result);
		})
	}


	// 修改代理
	modifyProxy(){
		let channel = routes.proxy.modifyProxy.path;
		let pdata = {
			proxy_id: 5,
			proxy_name: '测试代理',
			proxy_ip: 'localhost',
			proxy_port: 10809,
			proxy_type: 0,
			proxy_username: '',
			proxy_password: ''
		}
		this.send(routes.proxy.modifyProxy.path,pdata,function(result){
			console.log(channel,result);
		})
	}


}


class batchDemo extends common {
	// 获取脚本列表
	get_script_list() {
		let channel = routes.batch.get_script_list.path;
		let pdata = {
			page: 1,
			limit: 10,
			search: '',
			type_id: 0
		};
		this.send(routes.batch.get_script_list.path, pdata, function(result) {
			console.log(channel, result);
		});
	}
	// 获取脚本信息
	get_script_info() {
		let channel = routes.batch.get_script_info.path;
		let pdata = {
			script_id: 1
		};
		this.send(routes.batch.get_script_info.path, pdata, function(result) {
			console.log(channel, result);
		});
	}
	// 创建脚本
	create_script() {
		let channel = routes.batch.create_script.path;
		let pdata = {
			script_name: '测试脚本',
			content: 'echo 123',
			type_id: 1,
			script_type: "shell",
			remark: "备注"
		};
		this.send(routes.batch.create_script.path, pdata, function(result) {
			console.log(channel, result);
		});
	}
	// 修改脚本
	modify_script() {
		let channel = routes.batch.modify_script.path;
		let pdata = {
			script_id: 1,
			content: 'echo 123',
			type_id: 1,
			remark: "备注"
		};
		this.send(routes.batch.modify_script.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 删除脚本
	remove_script() {
		let channel = routes.batch.remove_script.path;
		let pdata = {
			script_id: 1
		};
		this.send(routes.batch.remove_script.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 执行脚本
	execute_script() {
		let channel = routes.batch.execute_script.path;
		let pdata = {
			script_id: 1,
		};
		this.send(routes.batch.execute_script.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 获取脚本记录
	get_script_record() {
		let channel = routes.batch.get_script_record.path;
		let pdata = {
			p: 1,
			rows: 10,
			script_id: 1
		};
		this.send(routes.batch.get_script_record.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 获取脚本执行队列
	get_script_exec_queue() {
		let channel = routes.batch.get_script_exec_queue.path;
		let pdata = {
			p: 1,
			rows: 10,
			script_id: 1
		}
		this.send(routes.batch.get_script_exec_queue.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 获取脚本分类列表
	get_script_type_list() {
		let channel = routes.batch.get_script_type_list.path;
		this.send(routes.batch.get_script_type_list.path, {}, function(result) {
			console.log(channel, result);
		});
	}

	// 创建脚本分类
	create_script_type() {
		let channel = routes.batch.create_script_type.path;
		let pdata = {
			type_name: '测试分类'
		};
		this.send(routes.batch.create_script_type.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 修改脚本分类
	modify_script_type() {
		let channel = routes.batch.modify_script_type.path;
		let pdata = {
			type_id: 1,
			type_name: '测试分类1'
		};
		this.send(routes.batch.modify_script_type.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 删除脚本分类
	remove_script_type() {
		let channel = routes.batch.remove_script_type.path;
		let pdata = {
			type_id: 1
		};
		this.send(routes.batch.remove_script_type.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 获取服务器列表
	get_server_list() {
		let channel = routes.batch.get_server_list.path;
		this.send(routes.batch.get_server_list.path, {}, function(result) {
			console.log(channel, result);
		});
	}

	// 获取定时任务列表
	get_crontab_list() {
		let channel = routes.batch.get_crontab_list.path;
		let pdata = {
			p: 1,
			rows: 10,
			search: ''
		}
		this.send(routes.batch.get_crontab_list.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 创建定时任务
	create_crontab() {
		// create_crontab: {
		// 	title: '创建定时任务',
		// 	method: 'ipc',
		// 	path: 'controller.batch.create_crontab',
		// 	args: {
		// 		channel: {
		// 			type: 'string',
		// 			required: true,
		// 			description: '通道标识',
		// 		},
		// 		data: {
		// 			task_name: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '任务名称',
		// 			},
		// 			script_id: {
		// 				type: 'number',
		// 				required: true,
		// 				description: '脚本ID',
		// 			},
		// 			ssh_type_id_list: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '服务器类型ID列表',
		// 			},
		// 			ssh_id_list: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '服务器ID列表',
		// 			},
		// 			task_type: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '任务类型',
		// 			},
		// 			// MONTH: 每月，如：每月1日15:00执行（cycle=MONTH,day=1,hour=15,minute=0）
		// 			// WEEK: 每周，如：每周三15:30执行（cycle=WEEK,day=3,hour=15,minute=30）
		// 			// DAY：每天，如：每天23:59执行（cycle=DAY,day=0,hour=23,minute=59）
		// 			// N-DAY: 每隔N天，如：每隔3天12小时30分执行（cycle=N-DAY,day=3,hour=12,minute=30）
		// 			// HOUR：每小时，如：每小时第40分钟执行（cycle=HOUR,day=0,hour=0,minute=40）
		// 			// N-HOUR: 每隔N小时，如：每隔2小时20分钟执行（cycle=N-HOUR,day=0,hour=2,minute=20）
		// 			// N-MINUTE: 每隔N分钟，如：每隔10分钟执行（cycle=N-MINUTE,day=0,hour=0,minute=10）
		// 			// N-SECOND: 每隔N秒钟，如：每隔30秒钟执行（cycle=N-SECOND,day=0,hour=0,minute=0,second=30）
		// 			cycle: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '周期',
		// 			},
		// 			day: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '天',
		// 			},
		// 			hour: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '小时',
		// 			},
		// 			minute: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '分钟',
		// 			},
		// 			second: {
		// 				type: 'string',
		// 				required: true,
		// 				description: '秒',
		// 			},
		// 			remark: {
		// 				type: 'string',
		// 				required: false,
		// 				description: '备注',
		// 			},
		// 		}
		// 	},
		// 	result: {
		// 		type: 'object',
		// 		format: {
		// 			status: 'boolean',
		// 			msg: 'string',
		// 		},
		// 	}
		// },
		let channel = routes.batch.create_crontab.path;
		let pdata = {
			task_name: '测试任务',
			script_id: 1,
			ssh_type_id_list: '1',
			ssh_id_list: '1',
			task_type: 'cycle',
			cycle: 'MONTH',
			day: 1,
			hour: 15,
			minute: 0,
			second: 0,
			remark: '备注'
		}
		this.send(routes.batch.create_crontab.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 修改定时任务
	modify_crontab() {
		let channel = routes.batch.modify_crontab.path;
		let pdata = {
			task_id: 1,
			script_id: 1,
			ssh_type_id_list: '1',
			ssh_id_list: '1',
			cycle: 'MONTH',
			day: 1,
			hour: 15,
			minute: 0,
			second: 0,
			status: 1,
			remark: '备注'
		}
		this.send(routes.batch.modify_crontab.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 删除定时任务
	remove_crontab() {
		let channel = routes.batch.remove_crontab.path;
		let pdata = {
			task_id: 1
		}
		this.send(routes.batch.remove_crontab.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 获取定时任务执行记录
	get_crontab_record() {
		let channel = routes.batch.get_crontab_record.path;
		let pdata = {
			p: 1,
			rows: 10,
			task_id: 1
		}
		this.send(routes.batch.get_crontab_record.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

	// 立即执行定时任务
	execute_crontab() {
		let channel = routes.batch.execute_crontab.path;
		let pdata = {
			task_id: 1
		}
		this.send(routes.batch.execute_crontab.path, pdata, function(result) {
			console.log(channel, result);
		});
	}

}

export { termDemo,panelDemo,windowDemo,filesDemo,indexDemo,userDemo,proxyDemo,batchDemo };

// 面板
let p = new panelDemo();
// p.list();
// p.bind();
// p.remove();
// p.find();
// p.modify();
// p.get_load();
// p.get_tmp_token();
// p.set_common_use();
// p.bind_app();
// p.get_load();
// p.start_load();
// p.stop_load();
// p.add_group();
// p.modify_group();
// p.remove_group();


// 终端
let t = new termDemo();
// t.bind();
// t.list();

// t.find();
// t.modify();
// t.remove();
// t.get_load();
// p.set_common_use();
// t.add_group();
// t.modify_group();
// t.remove_group();
// t.video_list();
// t.remove_video();
// t.get_video();
// t.command_list();
// t.add_command();
// t.modify_command();
// t.remove_command();
// t.export()
// t.import()


// 窗口
let w = new windowDemo();
// w.create();
// w.hide();
// w.show();
// w.set_bounds();
// w.set_auto_resize();
// w.list();
// w.destroy();
// w.app_reload()
// w.window_maximize();
// w.window_minimize();
// w.window_close();
// w.window_fullscreen();
// w.window_top();
// w.app_quit();
// w.is_fullscreen()
// w.is_maximized()
// w.get_download_list();
// w.remove_download();
// w.open_download_window();
// w.cancel_download();


// 文件
let f = new filesDemo();
// f.connect();
// f.list_dir();
// f.get_download_items();
// f.get_upload_items();
// f.download();
// f.upload();
// f.remove();
// f.touch();
// f.mkdir();
// f.rmdir();
// f.rename();
// f.stat();
// f.read_file();
// f.write_file();
// f.get_user_group();
// f.chown();
// f.chmod();
// f.get_sftp_items();
// f.os_open_folder();
// f.os_open_file();
// f.disconnect();

let i = new indexDemo();
// i.get_languages();
// i.get_client_language();
// i.get_server_language();
// i.set_language();
// i.has_password();
// i.set_password();
// i.check_password();
// i.has_password();
// i.set_config();
// i.get_config();
// i.not_password();


let u = new userDemo();

// u.bind();
// u.get_user_info();
// u.unbind();



let px = new proxyDemo();
// px.getProxyList();
// px.addProxy();
// px.delProxy();
// px.modifyProxy();

let b = new batchDemo();
// b.get_script_list();


