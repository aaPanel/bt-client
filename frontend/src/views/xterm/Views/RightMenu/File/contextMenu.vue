<template>
	<div>
		<context-menu v-model:show="show" :options="optionsComponent">
			<template v-if="data.rtype === 'file'">
				<context-menu-item
					:label="pub.lang('打开')"
					:disabled="!data.is_edit && !data.is_dir"
					@click="openFile" />
				<context-menu-item
					v-if="!data.is_dir && !data.is_link"
					:label="pub.lang('下载')"
					@click="download" />
				<context-menu-separator />
				<context-menu-item :label="pub.lang('重命名')" @click="openRename" />
				<context-menu-item :label="pub.lang('权限')" @click="editRole" />
				<context-menu-item :label="pub.lang('删除')" @click="remove" />
				<context-menu-separator />
				<context-menu-item :label="pub.lang('新建文件夹')" @click="create(true)" />
				<context-menu-item :label="pub.lang('新建文件')" @click="create()" />
				<context-menu-separator />
				<context-menu-item :label="pub.lang('复制路径')" @click="copyPath" />
				<context-menu-item :label="pub.lang('属性')" @click="openAttr" />
			</template>

			<template v-else>
				<context-menu-item :label="pub.lang('上传文件')" @click="upload()" />
				<context-menu-separator />
				<context-menu-item :label="pub.lang('新建文件夹')" @click="create(true)" />
				<context-menu-item :label="pub.lang('新建文件')" @click="create()" />
				<context-menu-separator />
				<context-menu-item :label="pub.lang('刷新')" @click="refreshList" />
			</template>
		</context-menu>
		<!-- 弹窗 -->

		<FileRename ref="renameRef" @refresh="refreshList" />
		<FileRole ref="roleRef" @refresh="refreshList" />
		<FileAttribute ref="attrRef" @refresh="refreshList" />
		<FileCreate ref="createRef" @refresh="refreshList" />
		<FileDitor ref="ditorRef" @refresh="refreshList" />

		<!-- 上传 -->
		<input
			type="file"
			ref="uploadFileInput"
			:webkitdirectory="false"
			@change="getUploadFiles"
			style="display: none" />
	</div>
</template>

<script lang="ts" setup>
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '@imengyu/vue3-context-menu'
import { useMessage } from '@utils/hooks/message'
import { ElMessageBox } from 'element-plus'
import { useSettingStore } from '@store/setting'

import FileRename from './rename/index.vue'
import FileRole from './role/index.vue'
import FileAttribute from './attribute/index.vue'
import FileCreate from './create/index.vue'
import FileDitor from './ditor/index.vue'

import { common, routes } from '@api/http'
import { pub, copyText } from '@utils/tools'

const emit = defineEmits(['open', 'refresh', 'upload'])

const useStore = useSettingStore()
const { downloadFile } = storeToRefs(useStore)
const Message = useMessage() // 消息提示

const renameRef = ref()
const roleRef = ref()
const attrRef = ref()
const createRef = ref()
const ditorRef = ref()
const uploadFileInput = ref()

const show = ref(false)
const data = ref()

const optionsComponent = ref({
	zIndex: 3,
	x: 500,
	y: 200,
	theme: 'default',
})

// 打开文件、文件夹
const openFile = (dbRow: any) => {
	//必须判断是否有filename属性，否则dbRow返回Event对象
	if (dbRow.hasOwnProperty('filename')) data.value = dbRow
	if (data.value.is_dir) {
		emit('open', data.value.path)
	} else {
		const { attrs } = data.value
		// 文件大小限制（3m）
		if (attrs.size > 3 * 1024 * 1024) {
			Message.error(pub.lang('文件大小超过3M，无法在线编辑！'))
			return
		}
		ditorRef.value.acceptParams(data.value)
	}
}
// 修改权限
const editRole = () => {
	roleRef.value.acceptParams(data.value)
}
// 下载文件
const download = () => {
	const { ssh_id, path, filename } = data.value
	downloadFile.value = { ssh_id, path, filename }
}
// 打开重命名
const openRename = () => {
	renameRef.value.acceptParams(data.value)
}
// 删除文件、文件夹
const remove = () => {
	const { is_dir, filename } = data.value
	const type = is_dir ? pub.lang('文件夹') : pub.lang('文件')
	ElMessageBox.confirm(
		pub.lang('风险操作，删除的【{}】{}将彻底删除，无法恢复，是否继续？', filename, type),
		pub.lang('删除【{}】', filename),
		{
			confirmButtonText: pub.lang('确认'),
			cancelButtonText: pub.lang('取消'),
			type: 'warning',
		}
	).then(() => {
		let params: any = {
			ssh_id: data.value.ssh_id,
		}
		params[data.value.is_dir ? 'path' : 'filename'] = data.value.path
		common.send(routes.files[data.value.is_dir ? 'rmdir' : 'remove'].path, params, (res: any) => {
			if (res.status) {
				emit('refresh')
			}
		})
	})
}
// 新建文件、文件夹
const create = (isDir: boolean = false) => {
	const { ssh_id, currentPath } = data.value
	createRef.value.acceptParams({ isDir, ...{ ssh_id, currentPath } })
}
// 复制路径
const copyPath = () => {
	copyText({ value: data.value.path })
}
// 上传文件
const upload = () => {
	uploadFileInput.value.click()
}
// 获取上传文件
const getUploadFiles = (e: any) => {
	const files = e.target.files
	emit('upload', e, files)
}

// 刷新列表
const refreshList = () => {
	emit('refresh')
}
// 打开属性
const openAttr = () => {
	attrRef.value.acceptParams({ ...data.value.attrs, filename: data.value.filename })
}

const handleContextRightClick = (e: MouseEvent, row: any) => {
	data.value = row
	optionsComponent.value.x = e.x
	optionsComponent.value.y = e.y
	show.value = true
}

defineExpose({
	handleContextRightClick,
	openFile,
})
</script>
