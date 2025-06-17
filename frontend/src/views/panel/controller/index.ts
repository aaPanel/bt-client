import { storeToRefs } from 'pinia'
import { usePanelBase } from '@/store/panel'
import { common, routes } from '@api/http'
import { useMessage } from '@utils/hooks/message'
import { pub } from '@/utils/tools'
import { ElMessageBox } from 'element-plus'

function getPanelState() {
	return storeToRefs(usePanelBase())
}
export type Panel_Params = {
	panel_id: number | null
	group_id: number
	title: string
	url: string
	auth_type: number
	token: string | null
	proxy_id: number | null
	api_token: string | null
}
export type Term_Params = {
	host: string
	port: number
	username: string
	password: string
	auth_type: 0 | 1
	group_id: number
	proxy_id: number
	privateKey: string | null
}
export interface NewPanel_Params extends Term_Params {
	version: string
	isSSH: boolean
	installTitle?: string
}

/**
 * @description 记录面板展示的磁盘信息
 * @param parent[panel_id] 面板ID
 * @param parent[disk_path] 磁盘路径
 */
export const record_disk = (parent: { panel_id: number; disk_path: string }) => {
	common.send(routes.panel.record_disk.path, parent)
}

/**
 * @description 获取面板安装脚本列表
 */
export async function get_panel_script_list() {
	const { scriptList } = getPanelState()
	const { data } = (await common.sendAsync({
		route: routes.panel.get_install_script.path,
		data: {},
	})) as RequestReturnArray
	scriptList.value = data.map((item: any) => { 
		return {
			value: item.script,
			label: item.title,
		}
	})
}
/**
 * @description 获取代理列表
 */
export async function get_proxy_list() {
	const { proxyList } = getPanelState()
	const { data } = (await common.sendAsync({
		route: routes.proxy.getProxyList.path,
		data: {},
	})) as RequestReturnArray
	proxyList.value = [
		...[{ proxy_id: -1, proxy_name: pub.lang('不使用代理'), proxy_ip: '' }],
		...data,
	]
}
/**
 * @description 添加分组
 * @param group_name 分组名称
 * @param refreshCallback 刷新回调
 */
export async function add_group(group_name: string, refreshCallback: () => void) {
	common.send(routes.panel.add_group.path, { group_name }, (res: any) => {
		useMessage().request(res)
		if (res.status) refreshCallback()
	})
}
/**
 * @description 编辑分组
 * @param param[group_id] 分组ID
 * @param param[group_name] 分组名称
 * @param refreshCallback 刷新回调
 */
export async function modify_group(
	parent: { group_id: number; group_name: string },
	refreshCallback: () => void
) {
	common.send(routes.panel.modify_group.path, parent, (res: any) => {
		useMessage().request(res)
		if (res.status) refreshCallback()
	})
}

/**
 * @description 删除分组
 * @group_id 分组ID
 * @refreshCallback 刷新回调
 */
export async function remove_group(
	parent: { group_id: number; group_name: string },
	refreshCallback: () => void
) {
	ElMessageBox.confirm(
		pub.lang('是否将【{}】从列表中删除?', parent.group_name),
		pub.lang('删除分组'),
		{
			type: 'warning',
		}
	).then(() => {
		common.send(routes.panel.remove_group.path, { group_id: parent.group_id }, (res: any) => {
			useMessage().request(res)
			if (res.status) refreshCallback()
		})
	})
}
/**
 * @description 保存面板信息至桌面
 * @param filename 文件名
 * @param content 文件内容
 */
export const save_panel = (filename: string, content: string) => {
	common.send(routes.panel.save_panel.path, { filename, content })
}

/**
 * @description 新装并绑定面板
 * @param param[title] 面板标题
 * @param param[url] 面板地址
 * @param param[auth_type] 验证类型
 * @param param[token] 面板token
 * @param param[proxy_id] 代理ID
 * @param param[token] 面板API Token
 * @param param[group_id] 分组ID
 */
export async function new_panel(
	parent: {
		title: string
		url: string
		auth_type: number
		token: string | null
		proxy_id: number | null
		group_id: number
	},
	callback: (param: any) => void
) {
	common.send(routes.panel.bind.path, parent, (res: any) => {
		callback(res)
	})
}
