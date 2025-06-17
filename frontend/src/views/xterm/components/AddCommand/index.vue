<template>
	<el-dialog
		v-model="dialogVisible"
		align-center
		class="bt-dialog"
		width="420"
		draggable
		:before-close="handleClose"
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="isEdit ? pub.lang('编辑命令') : pub.lang('添加命令')"></span>
			</div>
		</template>
		<el-form ref="ruleFormRef" :model="form" :rules="rules" class="p-[2rem]" label-width="4rem">
			<!-- 名称 -->
			<el-form-item :label="pub.lang('命令名称')" prop="title">
				<el-input v-model="form.title" :placeholder="pub.lang('请输入命令名称')" width="28rem" />
			</el-form-item>
			<el-form-item :label="pub.lang('命令内容')" prop="content">
				<el-input
					v-model="form.content"
					:placeholder="pub.lang('请输入命令内容')"
					:autosize="{ minRows: 4, maxRows: 4 }"
					type="textarea"
					width="28rem" />
			</el-form-item>
		</el-form>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="handleClose">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="setOperate">
					{{ isEdit ? pub.lang('保存') : pub.lang('添加') }}
				</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { useMessage } from '@utils/hooks/message'
import { common, routes } from '@api/http'
import { pub } from '@utils/tools'
interface RuleForm {
	shell_id?: number
	title: string
	content: string
}

const ruleFormRef = ref()
const Message = useMessage() // 消息提示
const dialogVisible = ref(false)
const emit = defineEmits(['close', 'refresh'])
const isEdit = ref(false)

const form = reactive<RuleForm>({
	shell_id: 0,
	title: '',
	content: '',
})
const rules = {
	title: [{ required: true, message: pub.lang('命令名称不能为空'), trigger: 'blur' }],
	content: [{ required: true, message: pub.lang('命令内容不能为空'), trigger: 'blur' }],
}
// 表单验证
const setOperate = async () => {
	await ruleFormRef.value.validate()

	let api = routes.term.add_command.path
	if (form.shell_id) {
		api = routes.term.modify_command.path
	}
	common.send(api, form, (res: any) => {
		Message.request(res)
		if (res.status) {
			emit('refresh')
			handleClose()
		}
	})
}
const handleClose = () => {
	form.shell_id = 0
	form.title = ''
	form.content = ''
	isEdit.value = false
	ruleFormRef.value.resetFields()
	dialogVisible.value = false
}

const acceptParams = (params: any) => {
	if (Object.keys(params).length > 0) {
		form.shell_id = params.shell_id
		form.title = params.title
		form.content = params.content
		isEdit.value = true
	} else {
		form.shell_id = 0
		form.title = ''
		form.content = ''
		isEdit.value = false
	}
	dialogVisible.value = true
}

defineExpose({
	acceptParams,
})
</script>
