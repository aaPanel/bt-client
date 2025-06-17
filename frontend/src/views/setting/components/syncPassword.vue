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
				<span class="text-1.4rem leading-[1.8rem] text-grey-333 truncate">{{
					pub.lang('设置同步密码')
				}}</span>
			</div>
		</template>
		<el-form :model="form" :rules="rules" @submit.native.prevent>
			<el-form-item :label="pub.lang('同步密码')" prop="name">
				<el-input
					v-model="form.password"
					type="password"
					show-password
					@keydown.enter.native="handleSubmit"
					:placeholder="pub.lang('请输入同步密码')" />
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

const emit = defineEmits(['refresh'])

const Message = useMessage() // 消息提示
const dialogVisible = ref(false)
const form = reactive({
	password: '',
})
const rules = {
	password: [{ required: true, message: pub.lang('密码不能为空'), trigger: 'blur' }],
}

const handleSubmit = () => {
	common.send(routes.index.set_sync_password.path, { password: form.password }, async(res: any) => {
		Message.request(res)
		if (res.status) {
			dialogVisible.value = false
			await common.sendAsync({ route: routes.index.set_config.path, data: { key:'sync_cloud', value:true } })
			emit('refresh')
		}
	})
}

const acceptParams = () => {
	form.password = ''
	dialogVisible.value = true
}
const closeDialog = () => {
	dialogVisible.value = false
}

defineExpose({
	acceptParams,
})
</script>
