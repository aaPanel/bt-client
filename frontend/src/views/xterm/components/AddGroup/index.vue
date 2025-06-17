<template>
	<el-dialog
		v-model="dialogVisible"
		align-center
		class="bt-dialog"
		width="320"
		draggable
		:before-close="handleClose"
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="isEdit ? pub.lang('编辑分组') : pub.lang('添加分组')"></span>
			</div>
		</template>
		<el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="4rem" @submit.native.prevent>
			<!-- 名称 -->
			<el-form-item :label="pub.lang('分组名称')" prop="group_name">
				<el-input
					v-model="form.group_name"
					:placeholder="pub.lang('请输入分组名称')"
					width="28rem" />
			</el-form-item>
		</el-form>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="handleClose">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="setGroup">
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
	group_id?: number
	group_name: string
}

const ruleFormRef = ref()
const Message = useMessage() // 消息提示
const dialogVisible = ref(false)
const emit = defineEmits(['close', 'refresh'])
const isEdit = ref(false)

const form = reactive<RuleForm>({
	group_id: 0,
	group_name: '',
})
const rules = {
	group_name: [{ required: true, message: pub.lang('分组名称不能为空'), trigger: 'blur' }],
}
// 表单验证
const setGroup = async () => {
	await ruleFormRef.value.validate()

	let api = routes.term.add_group.path
	if (form.group_id) {
		api = routes.term.modify_group.path
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
	form.group_id = 0
	form.group_name = ''
	isEdit.value = false
	ruleFormRef.value.resetFields()
	dialogVisible.value = false
}

const acceptParams = (params: any) => {
	if (Object.keys(params).length > 0) {
		form.group_id = params.group_id
		form.group_name = params.group_name
		isEdit.value = true
	} else {
		form.group_id = 0
		form.group_name = ''
		isEdit.value = false
	}
	dialogVisible.value = true
}

defineExpose({
	acceptParams,
})
</script>
