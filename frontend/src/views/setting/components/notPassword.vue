<template>
	<el-dialog
		v-model="dialogVisible"
		align-center
		class="bt-dialog"
		width="360"
		@close="closeDialog"
		draggable
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span class="text-1.4rem leading-[1.8rem] text-grey-333 truncate">{{ title }}</span>
			</div>
		</template>
		<el-form :model="form" :rules="rules" @submit.native.prevent>
			<el-form-item :label="pub.lang('管理密码')" prop="name">
				<el-input
					v-model="form.password"
					type="password"
					show-password
					@keydown.enter.native="handleSubmit"
					:placeholder="pub.lang('请输入管理密码')" />
			</el-form-item>
		</el-form>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="closeDialog">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="handleSubmit">
					{{ pub.lang('确定') }}
				</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { useMessage } from '@utils/hooks/message'
import { common, routes } from '@/api/http'
import { pub } from '@/utils/tools'

const emit = defineEmits(['refresh', 'close'])

const Message = useMessage() // 消息提示
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
	password: '',
})
const rules = {
	password: [{ required: true, message: pub.lang('密码不能为空'), trigger: 'blur' }],
}

const title = computed(() => (isEdit.value ? pub.lang('修改管理密码') : pub.lang('确认管理密码')))

const handleSubmit = () => {
	let params: any = { password: form.password },
		api = routes.index.set_password.path
	if (!isEdit.value) {
		params.not_password = true
		api = routes.index.not_password.path
	}
	common.send(api, params, (res: any) => {
		Message.request(res)
		if (res.status) {
			emit('refresh')
			dialogVisible.value = false
		}
	})
}

const acceptParams = (params: any) => {
	dialogVisible.value = true
	isEdit.value = params.isEdit
	form.password = ''
}
const closeDialog = () => {
	if (!isEdit.value) emit('close')
	dialogVisible.value = false
}

defineExpose({
	acceptParams,
})
</script>
