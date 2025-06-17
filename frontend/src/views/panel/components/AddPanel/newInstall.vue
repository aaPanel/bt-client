<template>
	<Form>
		<template #host>
			<div class="flex">
				<!-- ip -->
				<el-form-item
					class="w-[22rem] !mt-0"
					prop="host"
					:rules="[isRequired(pub.lang('请输入服务器IP'))]">
					<el-input
						v-model="formValue.host"
						:placeholder="pub.lang('请输入服务器IP')"
						class="mr-[8px]" />
				</el-form-item>
				<!-- 端口 -->
				<el-form-item
					class="w-[10rem] !mt-0"
					prop="port"
					:rules="[isRequired(pub.lang('请输入端口'))]">
					<el-input type="number" :placeholder="pub.lang('端口')" v-model="formValue.port" />
				</el-form-item>
			</div>
		</template>
		<template #auth_type>
			<el-radio-group v-model="formValue.auth_type">
				<el-radio-button :label="pub.lang('密码')" :value="0" />
				<el-radio-button :label="pub.lang('私钥')" :value="1" />
			</el-radio-group>
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
		<template #isSSH>
			<div class="flex">
				<el-switch v-model="formValue.isSSH"></el-switch>
				<span class="ml-2 text-[1.1rem]">{{
					pub.lang('* 同时添加到终端列表，如果终端列表已存在，则跳过')
				}}</span>
			</div>
		</template>
	</Form>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNormalForm, type FormItemOption } from '@/bt-hook/useFormMaker'
import { usePanelBase } from '@store/panel'
import { pub, isRequired } from '@utils/tools'
import { get_panel_script_list, type NewPanel_Params } from '../../controller'
import { isInnerIp } from '@utils/is'

const emit = defineEmits(['openProxy'])
const {
	scriptList,
	addGroupVisible,
	groupList,
	proxyList,
	currentGroupID,
	installLogVisible,
	installParams,
	innerIP,
} = storeToRefs(usePanelBase())
const initValue = ref<NewPanel_Params>({
	version: '',
	host: '',
	username: 'root',
	port: 22,
	auth_type: 0,
	password: '',
	privateKey: '',
	group_id: currentGroupID.value,
	proxy_id: -1,
	isSSH: true,
})

// 创建表单
const formOptions = ref<FormItemOption[]>([
	{
		label: pub.lang('面板版本'),
		key: 'version',
		type: 'select',
		attrs: {
			options: scriptList,
		},
	},
	{
		label: pub.lang('服务器IP'),
		key: 'host',
		type: 'custom-item',
	},
	{
		label: pub.lang('用户名'),
		key: 'username',
		type: 'input',
		attrs: {
			rules: [isRequired(pub.lang('请输入服务器用户名'))],
			placeholder: pub.lang('请输入服务器用户名'),
		},
	},
	{
		label: pub.lang('验证方式'),
		key: 'auth_type',
		type: 'custom-item',
	},
	{
		label: pub.lang('密码'),
		key: 'password',
		type: 'input',
		attrs: {
			rules: [isRequired(pub.lang('请输入服务器密码'))],
			placeholder: pub.lang('请输入服务器密码'),
		},
	},
	{
		label: pub.lang('私钥'),
		key: 'privateKey',
		type: 'input',
		attrs: {
			type: 'textarea',
			rules: [isRequired(pub.lang('请输入SSH私钥'))],
			placeholder: pub.lang('请输入SSH私钥'),
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
	{
		label: pub.lang('添加终端'),
		key: 'isSSH',
		type: 'custom-item',
	},
])
const computed_form_options = computed(() => {
	formRef.value?.clearValidate()
	if (formValue.value.auth_type === 0) {
		return formOptions.value.filter(item => item.key !== 'privateKey')
	}
	return formOptions.value.filter(item => item.key !== 'password')
})

const [Form, formValue, formRef] = useNormalForm(computed_form_options as any)

function addProxy() {
	emit('openProxy')
}

// 安装并绑定
const save = async () => {
	await formRef.value.validate()
	formValue.value.installTitle = scriptList.value.find(
		item => item.value === formValue.value.version
	)?.label
	installLogVisible.value = true
	installParams.value = formValue.value as NewPanel_Params
	innerIP.value = isInnerIp(formValue.value.host)
}

async function init() {
	if (scriptList.value.length === 0) await get_panel_script_list()
	formValue.value = JSON.parse(JSON.stringify(initValue.value))
	formValue.value.version = scriptList.value[0].value
}
defineExpose({
	init,
	save,
})
</script>

<style scoped></style>
