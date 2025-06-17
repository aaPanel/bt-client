<template>
	<el-dialog
		v-model="dialogVisible"
		align-center
		class="bt-dialog"
		width="360"
		draggable
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="pub.lang('重命名')"></span>
			</div>
		</template>
		<el-form :model="form" :rules="rules" @submit.native.prevent>
			<el-form-item :label="pub.lang('名称')" prop="name">
				<el-input v-model="form.name" @keyup.enter="handleSubmit" />
			</el-form-item>
		</el-form>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="dialogVisible = false">{{ pub.lang('取消') }}</el-button>
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
let data = {} as any
const form = reactive({
	name: '',
})
const rules = {
	name: [{ required: true, message: pub.lang('名称不能为空'), trigger: 'blur' }],
}

const handleSubmit = () => {
	const { ssh_id, path: oldPath, currentPath } = data

	common.send(
		routes.files.rename.path,
		{ ssh_id, oldPath, newPath: currentPath + form.name },
		(res: any) => {
			Message.success(res)
			if (res.status) {
				emit('refresh')
			}
		}
	)

	dialogVisible.value = false
}

const acceptParams = (params: any) => {
	form.name = params.filename
	data = toRaw(params)
	dialogVisible.value = true
}

defineExpose({
	acceptParams,
})
</script>
