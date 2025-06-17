import { common, ipc, routes } from '@api/http'
import { storeToRefs } from 'pinia'
import { useXtermBase } from '@store/xterm'
import { useMessage } from '@utils/hooks/message'
import { pub } from '@/utils/tools'

function getXtermState() {
	const xtermStore = useXtermBase()
	return storeToRefs(xtermStore)
}
/**
 * @description 绑定SSH
 * @param {object} params[title] 标题
 * @param {object} params[host] 主机
 * @param {object} params[port] 端口
 * @param {object} params[username] 用户名
 * @param {object} params[password] 密码
 * @param {object} params[auth_type] 认证类型
 * @param {object} params[group_id] 分组ID
 * @param {object} params[proxy_id] 代理ID
 * @param {object} params[privateKey] 私钥
 */
export function bind(params: {
	title: string
	host: string
	port: number
	username: string
	password: string
	auth_type: 0 | 1
	proxy_id: number
	privateKey: string | null
	msgInfo: boolean
}) {
	common.send(routes.term.bind.path, params)
}

/**
 * @description 启动面板api
 * @param param[ssh_id] ssh连接id
 * @param param[ssh_info] ssh连接信息
 */
export function start_panel_api(
	param: { ssh_id: string; ssh_info: any },
	callback: (param: any) => void
) {
	common.send(routes.files.start_panel_api.path, param, (res: any) => {
		callback(res.data)
	})
}
/**
 * @description 关闭指定终端
 * @param {string} id
 */
export function xterm_disconnect(id: string) {
	ipc.send(routes.term.disconnect.path, { channel: id })
}
/**
 * @description 设置排序
 * @param {number} id
 * @param {number} sort 排序值
 */
export function set_sort(params: { id: number; sort: number }) {
	common.send(routes.term.set_sort.path, params)
}

/**
 * @description 导出列表
 */
export function export_xterm() {
	common.send(routes.term.export.path, {}, (res: any) => {
		useMessage().request(res)
	})
}

/**
 * @description 导入列表
 * @param {Function} callback
 */
export function import_xterm(callback: () => void) {
	common.send(routes.term.import.path, {}, (res: any) => {
		useMessage().request(res)
		if (res.status) {
			callback()
		}
	})
}

/**
 * @description 获取sftp连接列表
 * @return 列表数组
 */
export async function get_sftp_items() {
	try {
		const res = (await common.sendAsync({
			route: routes.files.get_sftp_items.path,
			data: {},
		})) as any
		return res.data
	} catch (e) {
		console.log(e)
	}
}
/**
 * @description 连接sftp
 * @param {string} ssh_id ssh连接id
 * @param callback 回调函数
 */
export function connect_sftp(params: { ssh_id: string }, callback: () => void) {
	common.send(routes.files.connect.path, params, (res: any) => {
		callback()
	})
}

/**
 * @description 上传sftp文件
 * @param {string} ssh_id ssh连接id
 * @param {string} remotePath 远程路径
 * @param {string} localPath 本地路径
 */
export function upload_sftp_file(params: {
	ssh_id: string
	remotePath: string
	localPath: string
}) {
	const { commadUpload } = getXtermState()
	common.send(routes.files.upload.path, params, (res: any) => {
		if (typeof res.data === 'string') {
			commadUpload.value.status = true
			commadUpload.value.progress = 100
			useMessage().success(pub.lang('上传成功'))
		} else {
			if (res.data) {
				const { total, transfered, speed, progress } = res.data
				commadUpload.value.progress = Number(progress)
			} else {
			}
		}
	})
}
export type xterm_connection_params = {
	host: string
	port: number
	username: string
	password?: string
	auth_type: number
	privateKey?: string
}
/**
 * @description 测试终端连接
 */
export function test_connection(param: xterm_connection_params) {
	const { testConnectionDialog, testConnectionData } = getXtermState()
	testConnectionDialog.value = true
	testConnectionData.value = param
}

/**
 * @description 关闭连接中的终端
 * @param {string} ssh_id ssh_id,mode=self时必传
 * @param {string} mode 关闭模式,self:关闭自己,all:关闭所有,other:关闭其他
 */
export function delete_connect(param: { ssh_id: string; mode: string }) {
	common.send(routes.term.delete_connect.path, param)
}
