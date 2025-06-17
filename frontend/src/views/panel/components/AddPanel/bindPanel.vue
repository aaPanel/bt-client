<template>
	<Form>
		<template #auth_type>
			<el-radio-group v-model="formValue.auth_type" :disabled="isEdit">
				<el-radio-button :value="3">
					<template #default>
						{{ pub.lang('APP插件')
						}}<span :class="formValue.panel_id > 0 ? 'text-[#a8abb2]' : 'text-[#dfdd0f]'"
							>[{{ pub.lang('推荐') }}]</span
						>
					</template>
				</el-radio-button>
				<el-radio-button label="API" :value="2"></el-radio-button>
			</el-radio-group>
		</template>
		<template #url>
			<el-input v-model="formValue.url" :placeholder="pub.lang('例：https://192.168.1.2:8888')" />
			<span class="text-red-500 text-[1rem] leading-[1rem] mt-1">
				{{ pub.lang('*请务必确保您已正确配置面板【IP白名单】，否则面板将无法直接接管') }}
			</span>
		</template>
		<template #group_id>
			<div class="flex">
				<el-select v-model="formValue.group_id" style="width: 212px; margin-right: 10px">
					<el-option
						v-for="(item, index) in groupList"
						:key="index"
						:label="item.group_name"
						:value="item.group_id">
					</el-option>
				</el-select>
				<el-button type="default" @click="addGroupVisible = true">{{
					pub.lang('添加分组')
				}}</el-button>
			</div>
		</template>
		<template #token>
			<el-input
				v-model="formValue.token"
				:placeholder="formValue.auth_type === 2 ? pub.lang('面板API接口密钥') : pub.lang('APP密钥')"
				type="textarea" />
		</template>
		<template #proxy_id>
			<div class="flex">
				<el-select
					v-model="formValue.proxy_id"
					:placeholder="pub.lang('IP代理')"
					style="width: 212px; margin-right: 10px">
					<el-option
						v-for="(item, index) in proxyList"
						:key="index"
						:label="`[${item.proxy_name}] ${item.proxy_ip}`"
						:value="item.proxy_id">
					</el-option>
				</el-select>
				<el-button type="default" @click="addProxy">{{ pub.lang('添加代理') }}</el-button>
			</div>
		</template>
	</Form>
	<ul class="mt-2rem list-disc text-[#777] text-[1.3rem]" v-if="formValue.auth_type === 3">
		<li>{{ pub.lang('第一步：在面板【软件商店】安装【堡塔APP】插件1.2以上版本') }}</li>
		<li>{{ pub.lang('第二步：点击【复制绑定密钥】按钮获取密钥') }}</li>
		<li>{{ pub.lang('第三步：粘贴到【密钥】输入框，并点击【绑定】按钮') }}</li>
		<li>{{ pub.lang('第四步：回到【堡塔APP】插件上点击【确认】按钮来完成绑定。') }}</li>
	</ul>
	<ul class="mt-2rem list-disc text-[#777] text-[1.3rem]" v-if="formValue.auth_type === 2">
		<li>{{ pub.lang('第一步：填写面板URL地址，示例：https://192.168.1.2:8888') }}</li>
		<li>
			{{ pub.lang('第二步：打开面板，转到【面板设置】页面，点击【API接口配置】开启API接口') }}
		</li>
		<li class="text-red-500">
			{{
				pub.lang(
					'第三步：配置【IP白名单】，输入您电脑的公网固定IP，如果没有固定IP，请直接填星号(*)'
				)
			}}
		</li>
		<li>{{ pub.lang('第三步：在【API接口配置】窗口中复制【接口密钥】') }}</li>
		<li>
			{{ pub.lang('第四步：回到多机管理窗口，粘贴到【密钥】输入框，并点击【确认】按钮') }}
		</li>
	</ul>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePanelBase } from '@store/panel'
import { pub, isRequired } from '@utils/tools'
import { useMessage } from '@utils/hooks/message'
import { useNormalForm, type FormItemOption } from '@/bt-hook/useFormMaker'
import { type Panel_Params } from '../../controller'
import { common, routes } from '@api/http'

const emit = defineEmits(['openProxy'])
const { isEdit, panelParams, groupList, proxyList, addGroupVisible, currentGroupID } =
	storeToRefs(usePanelBase())
const initValue = ref<Panel_Params>({
	title: '',
	panel_id: 0,
	auth_type: 3,
	url: '',
	token: '',
	group_id: currentGroupID.value,
	proxy_id: -1,
	api_token: null,
})

// 自定义URL验证器
const validateURL = (rule: any, value: string, callback: any) => {
	const urlPattern = /^(https?:\/\/).+(:\d{1,5})?$/
	if (!value) {
		callback(new Error(pub.lang('请输入面板URL')))
	} else if (!urlPattern.test(value)) {
		callback(new Error(pub.lang('URL格式不正确，例：https://192.168.1.2:8888')))
	} else {
		callback()
	}
}
// 创建表单
const formOptions = ref<FormItemOption[]>([
	{
		label: pub.lang('名称'),
		key: 'title',
		type: 'input',
		attrs: {
			placeholder: pub.lang('请输入标题名称'),
		},
	},
	{
		label: pub.lang('验证类型'),
		key: 'auth_type',
		type: 'custom-item',
	},
	{
		label: pub.lang('面板URL'),
		key: 'url',
		type: 'custom-item',
		attrs: {
			rules: [
				isRequired(pub.lang('请输入面板URL')),
				{
					validator: validateURL,
					trigger: 'blur',
				},
			],
		},
	},
	{
		label: pub.lang('密钥'),
		key: 'token',
		type: 'custom-item',
		attrs: {
			rules: [isRequired(pub.lang('请输入密钥'))],
		},
	},
	{
		label: pub.lang('分组'),
		key: 'group_id',
		type: 'custom-item',
	},
	{
		label: pub.lang('代理'),
		key: 'proxy_id',
		type: 'custom-item',
	},
])
const computed_form_options = computed(() => {
	if (formValue.value.auth_type === 3) {
		return formOptions.value.filter(item => item.key !== 'url')
	}
	return formOptions.value
})
const [Form, formValue, formRef] = useNormalForm(computed_form_options as any)

function addProxy() {
	emit('openProxy')
}
// 保存
const save = async (callback: any) => {
	await formRef.value.validate()
	let api = routes.panel.bind.path
	let status = 1
	if (isEdit.value) {
		api = routes.panel.modify.path
	}

	// 过滤端口号以后的所有内容
	formValue.value.url = formValue.value.url.replace(/(:\d{1,5}).*$/, '$1')
	let param = { ...toRaw(formValue.value) }
	if (param.proxy_id == -1) {
		param.proxy_id = 0
	}
	common.send(api, param, (res: any) => {
		useMessage().request(res)
		status = 2
		if (res.status) {
			callback()
		}
	})
	setTimeout(() => {
		if (param.auth_type === 3 && status === 1 && !isEdit.value) {
			useMessage().warn(pub.lang('请回到【堡塔APP】插件上点击【确认】按钮来完成绑定'))
		}
	}, 100)
}
function init() {
	if (isEdit.value) {
		formValue.value = { ...panelParams.value }
	} else {
		formValue.value = JSON.parse(JSON.stringify(initValue.value))
	}
}

defineExpose({ init, save })
</script>

<style scoped></style>
