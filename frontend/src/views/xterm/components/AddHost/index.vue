<template>
	<div>
		<el-dialog
			v-model="dialogVisible"
			width="440"
			draggable
			align-center
			:close-on-click-modal="false"
			:before-close="handleClose">
			<template #header>
				<div>
					<span
						class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
						v-html="
							data.isQuick
								? pub.lang('快速连接')
								: data.ssh_id > 0
									? `${pub.lang('编辑')}【${data.title}】`
									: pub.lang('添加服务器')
						"></span>
				</div>
			</template>
			<el-form ref="ruleFormRef" :model="form" :rules="rules" class="p-[2rem]" label-width="4rem">
				<!-- 系统类型 -->
				<el-form-item :label="pub.lang('操作系统')">
					<el-radio-group v-model="form.os_type" :disabled="data.ssh_id > 0" @change="cutSystem">
						<el-radio-button label="Linux" value="Linux"></el-radio-button>
						<el-radio-button label="Windows" value="Windows"></el-radio-button>
					</el-radio-group>
				</el-form-item>
				<!-- 终端名称 -->
				<el-form-item :label="pub.lang('名称')" prop="title" v-if="!data.isQuick">
					<el-input v-model="form.title" :placeholder="pub.lang('请输入终端名称')" width="28rem" />
				</el-form-item>
				<div class="flex">
					<!-- ip -->
					<el-form-item :label="pub.lang('服务器IP')" prop="host">
						<el-input
							v-model="form.host"
							:placeholder="pub.lang('请输入服务器IP')"
							name="host"
							width="18rem"
							ref="hostRef"
							class="mr-[8px]" />
					</el-form-item>
					<!-- 端口 -->
					<el-form-item class="w-[10rem] !mt-0" id="portInfo" prop="port">
						<el-input type="number" :placeholder="pub.lang('端口')" v-model="form.port" />
					</el-form-item>
				</div>
				<!-- 用户名 -->
				<el-form-item :label="pub.lang('用户名')" prop="username">
					<el-input
						v-model="form.username"
						:placeholder="pub.lang('请输入SSH用户名')"
						width="28rem" />
				</el-form-item>
				<!-- 验证方式 -->
				<el-form-item :label="pub.lang('验证方式')" v-show="isNotWindows">
					<el-radio-group v-model="form.auth_type">
						<el-radio-button :label="pub.lang('密码验证')" :value="0"></el-radio-button>
						<el-radio-button :label="pub.lang('私钥验证')" :value="1"></el-radio-button>
					</el-radio-group>
				</el-form-item>
				<!-- 密码 -->
				<template v-if="form.auth_type === 0">
					<el-form-item :label="pub.lang('密码')" prop="password">
						<el-input
							v-model="form.password"
							name="password"
							:placeholder="pub.lang('请输入服务器密码')"
							type="password"
							show-password
							width="28rem" />
					</el-form-item>
				</template>
				<template v-else>
					<el-form-item :label="pub.lang('私钥')" prop="privateKey">
						<el-input
							type="textarea"
							name="privateKey"
							v-model="form.privateKey"
							:placeholder="pub.lang('请输入SSH私钥')"
							:autosize="{ minRows: 4, maxRows: 4 }"
							width="28rem" />
					</el-form-item>
				</template>
				<el-form-item :label="pub.lang('分组')" v-if="!data.isQuick">
					<el-select v-model="form.group_id">
						<el-option
							v-for="(item, index) in groupList"
							:key="index"
							:label="item.label"
							:value="item.id">
						</el-option>
					</el-select>
				</el-form-item>
				<el-form-item :label="pub.lang('代理')" v-show="isNotWindows">
					<div class="flex">
						<el-select
							v-model="form.proxy_id"
							:placeholder="pub.lang('IP代理')"
							style="width: 180px; margin-right: 10px">
							<el-option
								v-for="(item, index) in proxyList"
								:key="index"
								:label="`[${item.proxy_name}] ${item.proxy_ip}`"
								:value="item.proxy_id">
							</el-option>
						</el-select>
						<el-button type="default" @click="openProxy">{{ pub.lang('添加代理') }}</el-button>
					</div>
				</el-form-item>
				<el-form-item :label="pub.lang('自动录屏')" v-show="isNotWindows && !data.isQuick">
					<el-switch v-model="form.is_recording" />
				</el-form-item>
				<el-form-item :label="pub.lang('分辨率')" v-show="!isNotWindows && !data.isQuick">
					<div class="flex">
						<el-select v-model="winForm.area" style="width: 110px; margin-right: 10px">
							<el-option
								v-for="(item, index) in winArea"
								:key="index"
								:label="item.label"
								:value="item.value">
							</el-option>
						</el-select>
						<div class="flex">
							<span class="el-form-item__label">{{ pub.lang('启动映射驱动器') }}</span>
							<el-switch v-model="winForm.drive" />
						</div>
					</div>
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<div class="flex justify-between">
						<div>
							<el-button v-if="isNotWindows" @click="test_xterm_connection">{{
								pub.lang('测试连接')
							}}</el-button>
						</div>
						<div>
							<el-button @click="handleClose">{{ pub.lang('取消') }}</el-button>
							<el-button type="primary" @click="setHostInfo">{{
								data.isQuick
									? pub.lang('连接')
									: data.ssh_id > 0
										? pub.lang('保存')
										: pub.lang('添加')
							}}</el-button>
						</div>
					</div>
				</div>
			</template>
		</el-dialog>

		<!-- 添加代理 -->
		<addProxy ref="addProxyRef" @refresh="getProxyList" />
		<!-- 测试连接 -->
		<testConnection />
	</div>
</template>

<script lang="ts" setup>
import { useMessage } from '@utils/hooks/message'
import { common, routes } from '@api/http'
import { pub } from '@utils/tools'
import addProxy from '@/views/setting/components/addProxy.vue'
import testConnection from './testConnection.vue'
import { test_connection } from '../../controller'
interface RuleForm {
	ssh_id?: number
	os_type: string
	group_id: number
	title: string
	host: string
	port: number
	auth_type: number
	username: string
	password: string
	privateKey: string
	isQuick: boolean
	is_recording: boolean
	proxy_id?: number
	mstsc_options: object
}

const Message = useMessage() // 消息提示

const dialogVisible = ref(false)
const addProxyRef = ref()
const data = ref()
const form = reactive<RuleForm>({
	ssh_id: 0,
	title: '',
	os_type: 'Linux',
	group_id: 0,
	host: '',
	auth_type: 0,
	port: 22,
	username: 'root',
	password: '',
	privateKey: '',
	is_recording: false,
	isQuick: false,
	proxy_id: -1,
	mstsc_options: {},
})
const groupList = ref<
	{
		id: number
		label: string
		children: any[]
		type: number
	}[]
>([])

const rules = {
	host: [{ required: true, message: pub.lang('请输入服务器IP'), trigger: 'blur' }],
	port: [{ required: true, message: pub.lang('请输入端口'), trigger: 'blur' }],
	username: [{ required: true, message: pub.lang('请输入用户名'), trigger: 'blur' }],
	password: [{ required: true, message: pub.lang('请输入服务器密码'), trigger: 'blur' }],
	privateKey: [{ required: true, message: pub.lang('请输入SSH私钥'), trigger: 'blur' }],
}

const ruleFormRef = ref()
const emit = defineEmits(['close', 'refresh', 'host-change'])

let proxyList = ref()
// 添加代理
const openProxy = () => {
	addProxyRef.value.acceptParams({})
}

// 获取代理列表
const getProxyList = () => {
	common.send(routes.proxy.getProxyList.path, {}, (result: any) => {
		proxyList.value = [
			...[{ proxy_id: -1, proxy_name: pub.lang('不使用代理'), proxy_ip: '' }],
			...result.data,
		] as []
	})
}

// 不是windows
const isNotWindows = computed(() => form.os_type !== 'Windows')
// 系统切换
const cutSystem = () => {
	// 没有id时修改默认端口号
	if (form.ssh_id === 0) {
		form.port = form.os_type === 'Windows' ? 3389 : 22
		form.username = form.os_type === 'Windows' ? 'administrator' : 'root'
	}
}
const winForm = ref({
	area: 'full',
	drive: false,
})
const winArea = ref([
	{
		label: pub.lang('全屏'),
		value: 'full',
	},
	{
		label: pub.lang('自适应'),
		value: 'auto',
	},
	{
		label: '1920x1080',
		value: '1920x1080',
	},
	{
		label: '1600x900',
		value: '1600x900',
	},
	{
		label: '1366x768',
		value: '1366x768',
	},
	{
		label: '1280x800',
		value: '1280x800',
	},
	{
		label: '1024x768',
		value: '1024x768',
	},
	{
		label: '800x600',
		value: '800x600',
	},
])
// 渲染视图下拉数据
const renderMstscOptions = () => {
	if (Object.keys(form.mstsc_options).length) {
		const { fullscreen, enableDrives, width, height } = form.mstsc_options as any
		winForm.value.drive = enableDrives
		let area = ''
		// 自适应
		if (fullscreen) {
			area = 'full'
		} else if (width === 0 && height === 0) {
			area = 'auto'
		} else {
			area = `${width}x${height}`
		}
		winForm.value.area = area
	}
}
/*
 * 测试连接
 */
async function test_xterm_connection() {
	await ruleFormRef.value.validate()
	const { host, port, username, password, auth_type, privateKey } = form
	test_connection({
		host,
		port,
		username,
		password,
		auth_type,
		privateKey,
	})
}
// 表单验证
const setHostInfo = async () => {
	await ruleFormRef.value.validate()
	if (form.isQuick) {
		form.title = form.host
		delete form.ssh_id
		emit('host-change', { ...toRaw(form), ...windParam() })
		handleClose()
		return false
	}
	let api = routes.term.bind.path
	form.port = Number(form.port)
	if (form.ssh_id) {
		api = routes.term.modify.path
		form.ssh_id = form.ssh_id
	}
	let param = { ...toRaw(form), ...{ is_recording: form.is_recording ? '1' : '0' } }
	if (form.proxy_id == -1) {
		param.proxy_id = 0
	}
	// 名称为空
	if (!form.title) {
		param.title = form.host
	}
	// windows系统
	if (form.os_type === 'Windows') {
		param.mstsc_options = windParam()
	}
	common.send(api, param, (res: any) => {
		Message.request(res)
		if (res.status) {
			emit('refresh')
			handleClose()
		}
	})
}

const windParam = () => {
	if (form.os_type !== 'Windows') return {}
	return {
		fullscreen: winForm.value.area === 'full',
		enableDrives: winForm.value.drive,
		width: winForm.value.area === 'auto' ? 0 : Number(winForm.value.area.split('x')[0]),
		height: winForm.value.area === 'auto' ? 0 : Number(winForm.value.area.split('x')[1]),
	}
}

const handleClose = () => {
	form.auth_type = 0
	form.os_type = 'Linux'
	form.group_id = 0
	form.title = ''
	form.host = ''
	form.port = 22
	form.username = 'root'
	form.password = ''
	form.privateKey = ''
	form.is_recording = false
	form.isQuick = false
	form.proxy_id = -1
	form.mstsc_options = {}

	ruleFormRef.value.resetFields()
	dialogVisible.value = false
}
const acceptParams = (params: any) => {
	getProxyList() // 获取代理列表
	if (params.ssh_id > 0) {
		form.ssh_id = params.ssh_id
		form.auth_type = params.auth_type
		form.os_type = params.os_type
		form.group_id = params.group_id
		form.title = params.title
		form.host = params.host
		form.port = params.port
		form.username = params.username
		form.password = params.password
		form.privateKey = params.private_key
		form.is_recording = params.is_recording
		form.proxy_id = params.proxy_id || -1
		form.mstsc_options = params.mstsc_options
		// windows 渲染视图下拉数据
		if (params.os_type === 'Windows') renderMstscOptions()
	} else {
		form.ssh_id = 0
		form.auth_type = 0
		form.os_type = 'Linux'
		form.group_id = 0
		form.title = ''
		form.host = ''
		form.port = 22
		form.username = 'root'
		form.password = ''
		form.privateKey = ''
		form.is_recording = false
		form.proxy_id = -1
		form.mstsc_options = {}
	}

	data.value = params
	form.isQuick = params.isQuick
	// 没有传递分组且不是快速连接
	if (!params.sourceData && !params.isQuick) {
		common.send(routes.term.list.path, { limit: 9999 }, (res: any) => {
			groupList.value = res.data.groups.map((item: any) => {
				return {
					id: item.group_id,
					label: item.group_name,
				}
			})
		})
	} else {
		groupList.value = params.sourceData || []
	}
	dialogVisible.value = true
}
defineExpose({
	acceptParams,
})
</script>
