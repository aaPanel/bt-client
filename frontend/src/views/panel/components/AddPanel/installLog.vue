<template>
	<el-dialog
		v-model="installLogVisible"
		align-center
		width="600"
		draggable
		class="installLog"
		:show-close="false"
		:close-on-click-modal="false">
		<template #header></template>
		<div class="flex absolute w-[58rem] h-[45rem] z-2" ref="terminalShowDom"></div>
		<div class="flex relative w-[57rem] h-[45rem] opacity-0 z-3"></div>
		<!-- 用于隐藏终端 -->
		<template #footer>
			<div class="dialog-footer">
				<el-button v-if="connectedStatus" @click="onChangeCancel">{{
					pub.lang('取消安装 ')
				}}</el-button>
				<el-button v-else @click="closeTerminal()">{{ pub.lang('关闭') }}</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { logXterm } from './logXterm'
import { ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { usePanelBase } from '@store/panel'
import { pub } from '@utils/tools'
import { checkIp6 } from '@utils/is'
import { useMessage } from '@utils/hooks/message'
import { xterm_disconnect, bind, start_panel_api } from '@views/xterm/controller'
import { new_panel } from '@views/panel/controller'
import '@xterm/xterm/css/xterm.css' // 终端样式

const {
	installLogVisible,
	installParams,
	resultsVisible,
	resultsParams,
	addPanelVisible,
	innerIP,
} = storeToRefs(usePanelBase())

const emit = defineEmits(['refresh'])
let loginSuccess = false
let installError = false
let fisrt = true
let showXterm: logXterm | null = null // 用于展示
let timer: ReturnType<typeof setTimeout> | null = null
const terminalShowDom = ref()
const connectedStatus = ref(false)
const FisrtSSHID = ref('')
const hostInfo = ref()

/**
 * @description 获取当前的参数
 * @returns {object}
 */
function getCurrentParams() {
	const { host, port, username, password, auth_type, privateKey } = installParams.value || {}
	return {
		title: host,
		host,
		port,
		username,
		auth_type,
		password,
		privateKey,
	}
}
/**
 * @description 添加面板所需参数
 * @param {string} text 匹配到的面板信息
 * @param {object} token 面板api token
 * @returns {object}
 */
function addPanelParams(token: string) {
	const { group_id, proxy_id } = installParams.value || {}

	const addressList = resultsParams.value.content.match(/https?:\/\/[^\s]+/g)
	const filterSafe = addressList.map((item: any) => item.split('/').slice(0, 3).join('/')) // 截取域名(去除后面安全入口)
	return {
		title: '宝塔Linux面板',
		auth_type: 2,
		token,
		url: queryAddress(filterSafe),
		group_id,
		proxy_id,
	}
}
/**
 * @description 查找列表中的地址并返回
 * @param {array} list 地址列表
 * @returns {object}
 */
function queryAddress(list: any) {
	const { host } = installParams.value || {}

	// 内网地址直接返回最后一个
	if (innerIP.value) {
		return list[list.length - 1]
	}
	// 切割数组第一个检查是否为ipv6
	const address = list[0].split('/')
	const isChar = address[2].indexOf('[') > -1 // 是否包含[
	// 如：['http:', '', '1:1:1:1:1:1:1:1:8888']
	const lastColonIndex = address[2].lastIndexOf(':')
	const addressTxt = isChar
		? address[2].split(']')
		: [address[2].substring(0, lastColonIndex), address[2].substring(lastColonIndex + 1)]
	// 如：['1:1:1:1:1:1:1:1', '8888'],新版这里需要去除第一个的[
	addressTxt[0] = isChar ? addressTxt[0].slice(1) : addressTxt[0]
	if (checkIp6(addressTxt[0])) {
		// 如过列表长度等于3则返回第二个
		if (list.length === 3) {
			return list[1]
		} else {
			// 拼接ipv4地址返回
			return `${address[0]}//${host}:${addressTxt[1]}`
		}
	} else {
		// 返回第一个
		return list[0]
	}
}
/**
 * @description 创建终端
 * @param {string} id 终端id
 * @param {function} fun 回调函数
 * @returns {logXterm}
 */
function createLogTerminal(id: string, dom: any, fun: (cBack: any) => void) {
	return new logXterm(dom, id, toRaw(hostInfo.value), callback => {
		fun(callback)
	})
}
/**
 * @description 递归查询服务状态
 */
function querySeverStatus() {
	if (timer !== null) {
		clearInterval(timer)
	}
	timer = setInterval(() => {
		if (showXterm) {
			// 安装成功
			if (
				!showXterm.examineAttr.firstXterm.status &&
				showXterm.examineAttr.firstXterm.isSuccess &&
				!loginSuccess
			) {
				loginSuccess = true
				const regex = /外网[\s\S]*?(?=浏)/
				const match = showXterm.examineAttr.loginInfo.text.match(regex)
				resultsParams.value = {
					status: true,
					content: match && match[0],
				}
				addPanelVisible.value = false
				resultsVisible.value = true
				if (timer !== null) {
					clearInterval(timer)
				}
				start_panel_api(
					{ ssh_id: FisrtSSHID.value, ssh_info: toRaw(hostInfo.value) },
					(res: any) => {
						// 添加至面板列表
						new_panel(addPanelParams(res), () => {
							closeTerminal()
							emit('refresh')
						})
					}
				)

				// 添加至终端列表
				if (installParams.value?.isSSH)
					bind(Object.assign({}, hostInfo.value, { msgInfo: true, proxy_id: 0 }))
			}
			// 安装失败
			if (
				!showXterm.examineAttr.firstXterm.status &&
				showXterm.examineAttr.firstXterm.isSuccess === -1 &&
				!installError
			) {
				installError = true
				resultsParams.value = {
					status: false,
					content: showXterm.examineAttr.logInfo,
				}
				closeTerminal()
			}
		}
	}, 2000)
}

const onChangeCancel = () => {
	ElMessageBox.confirm(
		pub.lang('现在取消安装可能导致安装残余进程和依赖，您确定要取消吗？'),
		pub.lang('取消安装'),
		{
			type: 'warning',
		}
	).then(() => {
		showXterm?.send_to_server('\x03')
		closeTerminal()
	})
}
/**
 * @description 关闭终端
 * @returns {void}
 */
const closeTerminal = () => {
	xterm_disconnect(FisrtSSHID.value)
	showXterm?.dispose()
	installLogVisible.value = false
}
/**
 * @description 重置数据
 */
function resetData() {
	fisrt = true
	showXterm = null
	connectedStatus.value = false
	FisrtSSHID.value = ''
	loginSuccess = false
	installError = false
}

// 监听安装日志显示
watch(installLogVisible, val => {
	if (val) {
		fisrt = true
		FisrtSSHID.value = 'ssh_id_' + new Date().getTime() // 随机id
		hostInfo.value = getCurrentParams() // 设置面板登录参数

		nextTick(() => {
			// 创建第一个终端
			showXterm = createLogTerminal(FisrtSSHID.value, terminalShowDom.value, callback => {
				if (showXterm) {
					// 连接成功并且是第一次连接
					if (callback.isConnected && fisrt) {
						fisrt = false
						showXterm.examineAttr.examineStatus = true
						showXterm.examineAttr.firstXterm.status = true
						setTimeout(() => {
							showXterm?.send_to_server('bt status\r')
						}, 500)
					}
					// 连接失败
					if (!callback.isConnected && callback.status === 'danger') {
						closeTerminal()
						useMessage().error(pub.lang('连接失败，请检查登录信息是否正确！'))
					}
					// 查询是否已存在面板，没有则开始安装
					if (!fisrt && !connectedStatus.value) {
						if (!showXterm.examineAttr.examineStatus && !showXterm.examineAttr.isPanelExists) {
							connectedStatus.value = true
							setTimeout(() => {
								showXterm?.send_to_server('clear\r')
								showXterm?.send_to_server(installParams.value?.version + ' -y\r') // 安装指定版本
							}, 500)
							// 递归查询安装结果
							querySeverStatus()
						} else if (showXterm.examineAttr.isPanelExists) {
							// 服务已存在，关闭弹窗并告警
							closeTerminal()
							useMessage().error(pub.lang('检查到存在宝塔服务，请切换【绑定已有面板】进行绑定！'))
						}
					}
				}
			})
		})
	} else {
		resetData()
	}
})
</script>

<style lang="sass"></style>
