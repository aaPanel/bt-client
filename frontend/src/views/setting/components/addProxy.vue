<template>
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
					v-html="form.proxy_id ? pub.lang('编辑【{}】', name) : pub.lang('添加代理')"></span>
			</div>
		</template>
		<el-form ref="ruleFormRef" :model="form" :rules="rules" class="p-[2rem]" label-width="4rem">
			<el-form-item :label="pub.lang('名称')" prop="proxy_name">
				<el-input v-model="form.proxy_name" :placeholder="pub.lang('请输入代理名称')" />
			</el-form-item>
			<div class="flex">
				<el-form-item label="IP" prop="proxy_ip" width="18rem" class="mr-[8px]">
					<el-input v-model="form.proxy_ip" :placeholder="pub.lang('请输入IP')" />
				</el-form-item>
				<el-form-item prop="proxy_port" class="w-[10rem] !mt-0">
					<el-input v-model="form.proxy_port" type="number" :placeholder="pub.lang('请输入端口')" />
				</el-form-item>
			</div>
			<el-form-item :label="pub.lang('协议')">
				<el-radio-group v-model="form.proxy_type" :disabled="form.proxy_id > 0">
					<el-radio-button label="HTTP" :value="0"></el-radio-button>
					<el-radio-button label="HTTPS" :value="1"></el-radio-button>
					<el-radio-button label="SOCKS5" :value="2"></el-radio-button>
				</el-radio-group>
			</el-form-item>
			<el-form-item :label="pub.lang('账号')" prop="proxy_username">
				<el-input v-model="form.proxy_username" :placeholder="pub.lang('无账号请留空')" />
			</el-form-item>
			<el-form-item :label="pub.lang('密码')" prop="proxy_password">
				<el-input v-model="form.proxy_password" :placeholder="pub.lang('无密码请留空')" />
			</el-form-item>
		</el-form>
		<template #footer>
			<div class="flex justify-end">
				<el-button @click="handleClose">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="setProxyInfo">{{
					form.proxy_id ? pub.lang('保存') : pub.lang('添加')
				}}</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script lang="ts" setup>
import { useMessage } from '@utils/hooks/message'
import { common, routes } from '@api/http'
import { pub } from '@utils/tools'

interface RuleForm {
	proxy_id: number
	proxy_name: string
	proxy_ip: string
	proxy_port: number | null
	proxy_type: number
	proxy_username: string
	proxy_password: string
}
const Message = useMessage() // 消息提示

const dialogVisible = ref(false)
const emit = defineEmits(['close', 'refresh'])
const ruleFormRef = ref()
let name = ''
const form = reactive({
	proxy_id: 0,
	proxy_name: '',
	proxy_ip: '',
	proxy_port: null,
	proxy_type: 0,
	proxy_username: '',
	proxy_password: '',
}) as RuleForm

// 表单验证
const rules = {
	proxy_name: [{ required: true, message: pub.lang('代理名称不能为空') }],
	proxy_ip: [{ required: true, message: pub.lang('请输入IP') }],
	proxy_port: [{ required: true, message: pub.lang('请输入端口') }],
}

// 提交表单
const setProxyInfo = async () => {
	await ruleFormRef.value.validate()
	let load = Message.load(pub.lang('正在设置代理信息...'))
	let route = routes.proxy.addProxy.path
	if (form.proxy_id) {
		route = routes.proxy.modifyProxy.path
	}
	try {
		let res: any = await common.sendAsync({ route, data: form })
		Message.request(res)
		if (res.status) {
			emit('refresh')
			handleClose()
		}
	} finally {
		load.close()
	}
}
const handleClose = () => {
	form.proxy_id = 0
	form.proxy_name = ''
	form.proxy_ip = ''
	form.proxy_port = null
	form.proxy_type = 0
	form.proxy_username = ''
	form.proxy_password = ''

	ruleFormRef.value.resetFields()
	dialogVisible.value = false
}
const acceptParams = (params: any) => {
	if (Object.keys(params).length > 0) {
		form.proxy_id = params.proxy_id
		form.proxy_name = params.proxy_name
		form.proxy_ip = params.proxy_ip
		form.proxy_port = params.proxy_port
		form.proxy_type = params.proxy_type
		form.proxy_username = params.proxy_username
		form.proxy_password = params.proxy_password
		name = params.proxy_name
	} else {
		form.proxy_id = 0
		form.proxy_name = ''
		form.proxy_ip = ''
		form.proxy_port = null
		form.proxy_type = 0
		form.proxy_username = ''
		form.proxy_password = ''
		name = ''
	}

	dialogVisible.value = true
}
defineExpose({
	acceptParams,
})
</script>
