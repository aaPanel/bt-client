<template>
	<el-dialog
		v-model="addGroupVisible"
		width="360"
		draggable
		align-center
		:close-on-click-modal="false"
		:before-close="handleClose">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="isEditGroup ? pub.lang('编辑分组') : pub.lang('添加分组')"></span>
			</div>
		</template>
		<Form @submit.native.prevent />
		<template #footer>
			<el-button @click="handleClose">{{ pub.lang('取消') }}</el-button>
			<el-button type="primary" @click="save">{{
				isEditGroup ? pub.lang('保存') : pub.lang('添加')
			}}</el-button>
		</template>
	</el-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePanelBase } from '@store/panel'
import { useNormalForm, type FormItemOption } from '@/bt-hook/useFormMaker'
import { pub, isRequired } from '@utils/tools'
import { add_group, modify_group } from '../../controller'

const emit = defineEmits(['refresh'])
const { addGroupVisible, isEditGroup, editGroupParams } = storeToRefs(usePanelBase())

// 表单配置
const formOptions = ref<FormItemOption[]>([
	{
		type: 'input',
		label: pub.lang('分组名称'),
		key: 'group_name',
		attrs: {
			placeholder: pub.lang('请输入分组名称'),
			attrs: [isRequired(pub.lang('分组名称不能为空'))],
		},
	},
])

const [Form, formValue, formRef] = useNormalForm(formOptions)

// 保存
const save = () => {
	formRef.value.validate((valid: boolean) => {
		if (valid) {
			if (isEditGroup.value) {
				modify_group(
					{
						group_id: editGroupParams.value.group_id,
						group_name: formValue.value.group_name,
					},
					refreshList
				)
			} else {
				add_group(formValue.value.group_name, refreshList)
			}
		}
	})
}
//刷新列表
const refreshList = () => {
	emit('refresh')
	handleClose()
}

// 关闭弹窗
const handleClose = () => {
	addGroupVisible.value = false
	isEditGroup.value = false
}

watch(addGroupVisible, val => {
	if (val) {
		if (isEditGroup.value) {
			formValue.value.group_name = editGroupParams.value.group_name
		}
	}
})
</script>
