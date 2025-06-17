<template>
	<div class="flex h-full">
		<div class="h-full dragendBorder" @mousedown="onMouseDown"></div>
		<div
			class="p-4  min-w-[30rem] fileManagement"
			ref="fileManagement"
			@dragenter.prevent
			@dragover.prevent="handleDragOff($event)"
			@dragleave.prevent="handleDragLeave"
			@drop.prevent="handleDragDrop"
			:style="{ width: fileManagementWidth + 'px' }">
			<template v-if="isExistTerminal">
				<div class="flex mb-[2rem] input-with-select">
					<el-button @click="goBack"
						><el-icon size="14"><Back /></el-icon
					></el-button>
					<el-input
						v-model="activePath"
						size="small"
						@keydown.enter="getList"
						@blur="getList"
						class="">
					</el-input>
				</div>
				<div
					class="custom-loading !top-[4rem] !left-[1rem]"
					:class="{
						ta: !isRequest,
						'custom-loading--show': isRequest,
					}">
					<div class="custom-loading__mask"></div>
					<div class="custom-loading__content">
						<div class="custom-loading__icon"></div>
						<div class="custom-loading__title">{{pub.lang('正在获取列表...')}}</div>
					</div>
				</div>

				<el-table
					:data="list"
					highlight-current-row
					@row-contextmenu="onContextMenu"
					@row-dblclick="rowDBClick"
					@click.right.prevent="onContextMenu(null, null, $event)"
					class="select-none fm-table"
					:height="mainHeight - 64"
					:empty-text="pub.lang('暂无数据')">
					<el-table-column :label="pub.lang('文件名')" min-width="220">
						<template #default="{ row }">
							<div class="flex items-center cursor-pointer">
								<div class="w-[1.8rem]">
									<bt-icon
										:name="row.is_dir || row.is_link ? 'folderLogo' : 'fileLogo'"
										size="18" />
								</div>
								<div class="file-name">{{ row.filename }}</div>
							</div>
						</template>
					</el-table-column>
					<el-table-column prop="size" :label="pub.lang('大小')" width="100"></el-table-column>
					<el-table-column :label="pub.lang('权限/所有者')" width="160">
						<template #default="{ row }">
							<span>{{ row.attrs.mode }}/{{ row.group }}</span>
						</template>
					</el-table-column>
					<el-table-column
						prop="mtime"
						:label="pub.lang('最后修改日期')"
						width="150"></el-table-column>
				</el-table>
				<!-- 上传遮罩层 -->
				<div
					v-show="isUploadDrag"
					class="absolute top-0 right-0 shade flex items-center justify-center z-1 border-3 border-dashed border-gray-300 text-[26px]"
					:style="{ height: mainHeight + 'px', width: fileManagementWidth + 'px' }">
					{{ pub.lang('松开鼠标上传文件') }}
				</div>
				<!-- 下载遮罩层 -->
				<div
					v-show="download.show && !download.status"
					class="absolute top-0 shade z-1"
					:style="{ height: mainHeight + 'px', width: fileManagementWidth + 'px' }"></div>

				<!-- 上传、下载进度 -->
				<el-card
					v-if="download.show"
					shadow="always"
					class="absolute bottom-[2rem] w-[28rem] downloadView">
					<div class="flex justify-between items-center">
						<span class="text-[1.4rem]">{{ pub.lang(`${download.type}进度`) }}</span>
						<el-icon
							v-show="download.status"
							@click="download.show = false"
							size="20"
							class="closeView mr-4"
							><CircleClose
						/></el-icon>
					</div>
					<div class="mt-4">
						<template v-if="!download.status">
							<div class="flex justify-between">
								<span class="w-[17rem] truncate">{{ download.name }}</span>
								<span>{{ download.speed }}/s</span>
							</div>
							<el-progress
								:percentage="download.progress"
								:show-text="false"
								status="success"
								style="margin-top: 10px" />
							<div class="flex justify-between">
								<span>{{ download.down }}/{{ download.total }}</span>
							</div>
						</template>
						<template v-else>
							<div class="flex justify-between">
								<span class="w-[17rem] truncate">{{ download.name }}</span>
								<span class="text-primary">{{ pub.lang(`${download.type}完成`) }}</span>
							</div>
						</template>
					</div>
				</el-card>
				<contextMenu
					ref="contextMenuRef"
					@open="jumpPath"
					@refresh="getList"
					@upload="handleDragDrop" />
			</template>
			<template v-else>
				<el-empty :image-size="80" :description="pub.lang('请先打开一个终端')" />
			</template>
		</div>
	</div>
</template>
<script setup lang="ts">
import { useMessage } from '@utils/hooks/message'
import { useSettingStore } from '@store/setting'
import contextMenu from './contextMenu.vue'
import { pub, formatTime, byteUnit } from '@utils/tools'
import { useContext } from '@views/xterm/hooks'
import { fileMainType } from './data'
import { common, routes } from '@api/http'

const { refreshVeiwPosition, fileManagementPath } = useContext()
const props = defineProps({
	data: {
		type: Object,
		default: () => ({}),
	},
})
const Message = useMessage() // 消息提示
const useStore = useSettingStore()
const { mainHeight, mainWidth, fileManagementWidth, downloadFile } = storeToRefs(useStore)

// 是否存在开启的终端
const isExistTerminal = ref(false)
const activePath = ref('/') // 当前路径
const list = ref([]) // 列表数据
const contextMenuRef = ref() // 右键菜单
const download = reactive({
	show: false,
	status: false,
	type: '下载',
	name: '',
	speed: '',
	progress: 0,
	total: '',
	down: '',
})

// 右键菜单
const onContextMenu = (row: any, column: any, event: Event) => {
	event.preventDefault()
	event.stopPropagation()
	let row_a = Object.assign({}, row, { rtype: 'file' })
	if (!row) {
		row_a = {
			ssh_id: props.data.hostInfo.ssh_id,
			currentPath: currentPath(activePath.value),
			rtype: 'null',
		}
	}
	contextMenuRef.value.handleContextRightClick(event, row_a)
}

// 双击事件
const rowDBClick = (row: any) => {
	if (row.is_dir || row.is_link) {
		activePath.value = row.path
		getList()
	} else {
		if (row.is_edit) {
			contextMenuRef.value.openFile(row)
		}
	}
}
// 跳转路径
const jumpPath = (path: string) => {
	activePath.value = path
	getList()
}
const isRequest = ref(false) // 是否请求中
// 获取列表
const getList = async () => {
	if (!activePath.value) activePath.value = '/'
	isRequest.value = true
	fileManagementPath(activePath.value)
	try {
		const res: any = await common.sendAsync({
			route: routes.files.list_dir.path,
			data: { ssh_id: props.data.hostInfo.ssh_id, path: activePath.value },
		})
		if (!res.status) {
			Message.error(res.msg)
			res.data = []
		}
		routes.files.list_dir.path,
			(list.value = res.data
				.map((item: any) => {
					const { size, mtime, mode, gid } = item.attrs
					const { extLastName, isEdit } = getExtType(item.filename, item.is_dir) as {
						extLastName: string
						isEdit: boolean
					}
					return {
						filename: item.filename,
						ext: extLastName,
						is_edit: isEdit,
						size: byteUnit(size),
						is_dir: item.is_dir,
						is_link: item.is_link,
						user: item.user,
						group: item.group,
						mtime: formatTime(mtime),
						path: filePath(item.filename),
						currentPath: currentPath(activePath.value),
						ssh_id: props.data.hostInfo.ssh_id,
						mode: mode,
						gid: gid,
						attrs: item.attrs,
					}
				})
				.sort((a: any, b: any) => {
					// 文件夹、软连接优先
					if (a.is_dir && !b.is_dir) return -1
					if (!a.is_dir && b.is_dir) return 1
					if (a.is_link && !b.is_link) return -1
					return 0
				}))
	} finally {
		isRequest.value = false
	}
}
// 获取文件类型
const getExtType = (filename: string, isDir: boolean) => {
	if (isDir) return 'folder'
	const ext = filename.split('.')
	const extLastName = ext[ext.length - 1].toLocaleLowerCase()
	let isEdit = true
	// 检测是否允许编辑
	Object.entries(fileMainType).forEach((item: any) => {
		if (item[1].includes(extLastName)) {
			isEdit = false
		}
	})
	return { extLastName, isEdit }
}
// 文件路径
const filePath = (filename: string) => {
	if (activePath.value === '/') return activePath.value + filename
	return activePath.value + '/' + filename
}
// 当前路径
const currentPath = (path: string) => {
	if (path === '/') return path
	return path + '/'
}
// 返回上级目录
const goBack = () => {
	if (activePath.value === '/') return
	const path = activePath.value.split('/')
	path.pop()
	activePath.value = path.join('/')
	getList()
}
// 获取开始下载
const startDownload = (params: { ssh_id: number; remotePath: string; filename: string }) => {
	const { ssh_id, remotePath, filename } = params
	common.send(routes.files.download.path, { ssh_id, remotePath }, (res: any) => {
		download.status = false
		download.show = true
		download.name = filename
		download.type = '下载'
		if (typeof res.data === 'string') {
			download.status = true
		} else {
			const { total, transfered, speed, progress } = res.data
			download.total = byteUnit(total)
			download.down = byteUnit(transfered)
			download.speed = byteUnit(speed)
			download.progress = Number(progress)
		}
	})
}
const isUploadDrag = ref(false) // 是否拖拽上传
// 拖拽事件
const handleDragOff = (e: DragEvent) => {
	e.preventDefault()

	isUploadDrag.value = true
}
// 拖拽离开范围
const handleDragLeave = (event: DragEvent) => {
	event.preventDefault()
	if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) {
		isUploadDrag.value = false
	}
}
// 拖拽结束
const handleDragDrop = (event: DragEvent, rData?: any) => {
	isUploadDrag.value = false
	// 限制文件数量仅一个、获取文件信息
	const files = rData ? rData : event.dataTransfer?.files
	if (files && files.length === 1) {
		const file: any = files[0]
		common.send(
			routes.files.upload.path,
			{
				ssh_id: props.data.hostInfo.ssh_id,
				remotePath: activePath.value,
				localPath: file.path,
			},
			(res: any) => {
				if (res.status) {
					download.status = false
					download.show = true
					download.name = pub.lang('上传{}' , file.name)
					download.type = pub.lang('上传')
					if (typeof res.data === 'string') {
						download.status = true
						setTimeout(() => {
							getList()
						}, 200)
					} else {
						const { total, transfered, speed, progress } = res.data
						download.total = byteUnit(total)
						download.down = byteUnit(transfered)
						download.speed = byteUnit(speed)
						download.progress = Number(progress)
					}
				} else {
					Message.error(res.msg)
				}
			}
		)
	} else {
		Message.error(pub.lang('只能上传一个文件'))
	}
}
watch(
	() => downloadFile.value,
	(val: any) => {
		if (Object.keys(val).length === 0) return
		const { ssh_id, path, filename } = val
		startDownload({ ssh_id, remotePath: path, filename })
	}
)

// 初始化[创建SFTP连接]
const init = () => {
	common.send(routes.files.connect.path, { ssh_id: props.data.hostInfo.ssh_id }, (result: any) => {
		activePath.value = props.data.fileManagementPath
		getList()
	})
}

const fileManagement = ref<HTMLElement | null>(null)
const isDragging = ref(false) // 是否拖拽
const startX = ref(0) // 鼠标按下时的X坐标
const initialWidth = ref(0) // 初始宽度
const filterWidth = ref(0) // 过滤器宽度[左菜单宽度]

const onMouseDown = (event: MouseEvent) => {
	isDragging.value = true
	startX.value = event.clientX
	initialWidth.value = fileManagement.value?.offsetWidth || 0
	filterWidth.value = document.querySelector('.xterm-left-tabs')?.clientWidth ?? 0
	document.addEventListener('mousemove', onMouseMove)
	document.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (event: MouseEvent) => {
	if (isDragging.value) {
		const deltaX = event.clientX - startX.value
		const initiDeltaX = initialWidth.value - deltaX
		// 限制最大宽度,mainWidth - filterWidth
		if (mainWidth.value - initiDeltaX <= filterWidth.value + 34) return

		fileManagementWidth.value = initiDeltaX < 300 ? 300 : initiDeltaX
	}
}

const onMouseUp = () => {
	isDragging.value = false
	document.removeEventListener('mousemove', onMouseMove)
	document.removeEventListener('mouseup', onMouseUp)
	refreshVeiwPosition()
}

onMounted(() => {
	document.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
	document.removeEventListener('mouseup', onMouseUp)
})

// 监听激活状态
watch(
	() => props.data,
	val => {
		isExistTerminal.value = false
		if (Object.keys(val).length === 0) return
		isExistTerminal.value = true
		init()
	},
	{ immediate: true }
)
</script>
<style lang="scss" scoped>
.dragendBorder {
	background-color: transparent;
	width: 4px;
	cursor: col-resize;
	position: absolute;
	left: 0;
}
.el-table {
	&.fm-table {
		font-size: 1.2rem;
		:deep(.el-table__row) {
			td {
				border: none;
				&.el-table__cell {
					padding: 2px 0;
					.cell {
						padding: 0 2px;
						line-height: normal;
					}
				}
			}
		}
		:deep(.el-table__header) {
			th {
				&.el-table__cell {
					padding: 2px 0;
					.cell {
						padding: 0 2px;
						line-height: normal;
					}
				}
			}
		}
	}
}
.input-with-select {
	:deep(.el-button) {
		border-top-right-radius: 0px;
		border-bottom-right-radius: 0px;
		margin-right: -1px;
	}
	:deep(.el-input) {
		.el-input__wrapper {
			border-top-left-radius: 0px;
			border-bottom-left-radius: 0px;
		}
	}
}

:deep(.el-card) {
	&.downloadView {
		z-index: 2;
	}
	.el-card__body {
		padding: 10px !important;
	}
}
.closeView {
	&:hover {
		color: #f00;
		cursor: pointer;
	}
}
.shade {
	background-color: var(--el-mask-color-extra-light);
}
</style>
