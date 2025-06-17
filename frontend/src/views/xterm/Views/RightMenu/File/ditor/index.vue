<template>
	<el-dialog
		v-model="dialogVisible"
		align-center
		class="bt-dialog"
		width="860"
		:close-on-click-modal="false"
		draggable>
		<template #header>
			<div>
				<span class="text-1.4rem leading-[1.8rem] text-grey-333 truncate">{{
					pub.lang('在线编辑器[{}]', data.filename)
				}}</span>
			</div>
		</template>
		<div class="h-[60rem]">
			<bt-ditor :value="content" mode="json5" ref="editor" />
		</div>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="dialogVisible = false">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="saveFile">
					{{ pub.lang('保存') }}
				</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { useMessage } from '@utils/hooks/message'
import { common, routes } from '@/api/http'
import { pub } from '@/utils/tools'

const Message = useMessage() // 消息提示
const dialogVisible = ref(false)
let data = {} as any
const content = ref('')
const editor = ref()

// 获取文件内容
const getFileContent = async () => {
	const { ssh_id, path } = data
	content.value = ''
	let load = Message.load(pub.lang('获取文件内容...'))
	try {
		const res: any = await common.sendAsync({
			route: routes.files.read_file.path,
			data: { ssh_id, filename: path },
		})
		content.value = res.data
	} finally {
		load.close()
	}
}
// 保存文件
const saveFile = async () => {
	const { ssh_id, path } = data
	let load = Message.load(pub.lang('保存文件...'))
	const val = editor.value.$refs.aces.value
	try {
		await common.sendAsync({
			route: routes.files.write_file.path,
			data: { ssh_id, filename: path, data: val },
		})
		Message.success(pub.lang('保存成功'))
	} finally {
		load.close()
	}
}

const acceptParams = (params: any) => {
	data = toRaw(params)
	dialogVisible.value = true
	getFileContent()
}

defineExpose({
	acceptParams,
})
</script>
