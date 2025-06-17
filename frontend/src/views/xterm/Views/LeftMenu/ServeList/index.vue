<template>
	<div class="p-4 w-[22rem]">
		<el-button type="primary" @click="createHostInfo()" :icon="Plus">{{
			pub.lang('服务器')
		}}</el-button>

		<el-button @click="import_xterm(getHostList)">{{ pub.lang('导入') }}</el-button>
		<el-button @click="export_xterm">{{ pub.lang('导出') }}</el-button>
		<div class="flex justify-between mt-8 mb-4">
			<div>
				<bt-icon name="group" size="14"></bt-icon>
				<span class="ml-2">{{ pub.lang('全部分组') }}</span>
			</div>
			<div class="flex justify-between">
				<template v-if="!serverSort">
					<el-tooltip
						class="box-item"
						effect="dark"
						:content="pub.lang('添加分组')"
						placement="top">
						<el-icon class="cursor-pointer mr-2" size="16" @click="addGroup">
							<Plus />
						</el-icon>
					</el-tooltip>
					<el-tooltip
						class="box-item"
						effect="dark"
						:content="pub.lang('手动排序')"
						placement="top">
						<bt-icon
							name="sort"
							size="18"
							class="cursor-pointer"
							color="#939393"
							@click="serverSort = true"></bt-icon>
					</el-tooltip>
				</template>
				<template v-else>
						<el-button type="primary" text size="small" class="!h-[1.8rem]" @click="serverSort = false">
							<el-icon style="vertical-align: middle">
								<Operation />
							</el-icon>
							<span style="vertical-align: middle"> {{ pub.lang('退出排序') }} </span>
						</el-button>
				</template>
			</div>
		</div>
		<el-input
			v-model="searchValue"
			:placeholder="pub.lang('请输入服务器IP/名称')"
			:prefix-icon="Search"
			clearable
			:disabled="serverSort"
			size="small"
			class="mb-4 flex-1"
			@clear="getHostList"
			@input="getHostList" />
		<el-tree
			:data="sourceData"
			node-key="id"
			default-expand-all
			:expand-on-click-node="false"
			:props="defaultProps"
			:check-on-click-node="true"
			:draggable="serverSort"
			:allow-drop="allowDrop"
			:allow-drag="allowDrag"
			@node-drop="setDragSort"
			@node-click="toggleNode"
			@node-contextmenu="handleRightClick"
			class="select-none overflow-auto no-scrollbar"
			:style="{ height: mainHeight - 130 + 'px' }">
			<!-- 给节点添加图标 -->
			<template #default="{ node, data }">
				<div
					:title="data.children ? '' : `${data.host.host}:${data.host.port}`"
					class="w-[18.6rem] truncate">
					<!-- 排序图标 -->
					<bt-icon
						name="sort"
						size="14"
						class="cursor-pointer mr-2"
						color="#939393"
						v-if="serverSort && data.type != 1"></bt-icon>
					<bt-icon :name="data.icon" size="14" v-if="data.icon" />
					<span class="ml-2">{{ data.label }}</span>
				</div>
			</template>
		</el-tree>

		<!-- 添加分组 -->
		<addGroupDialog ref="addGroupRef" @refresh="getHostList" />
	</div>
</template>
<script setup lang="ts">
import { Plus, Search, Operation } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'

import { useSettingStore } from '@store/setting'
import { useXtermBase } from '@store/xterm'
import { useMessage } from '@utils/hooks/message'
import addGroupDialog from '@views/xterm/components/AddGroup/index.vue'
import { pub } from '@utils/tools'
import { common, routes } from '@api/http'
import {set_sort,import_xterm,export_xterm} from '@views/xterm/controller'

interface source {
	id: number
	label: string
	children: source[]
	type: number
}
interface Group {
	group_id: number
	group_name: string
}

interface hostProps {
	ssh_id: number
	os_type: string
	group_id: number
	title: string
	host: string
	auth_type: number
	port: number
	username: string
	password: string
	private_key: string
	is_recording: boolean
	isQuick: boolean
	proxy_id: number
	os_name: string
	mstsc_options: object
	sort: number
	addtime: number
}

interface TempGroup {
	id: number
	label: string
	children: any[]
	type: number
}

const useStore = useSettingStore()
const { mainHeight, serverRefresh } = storeToRefs(useStore)
const storeXterm = useXtermBase()
const { serverSort } = storeToRefs(storeXterm)

const Message = useMessage() // 消息提示
// 添加定时器引用
const refreshTimer = ref<number | null>(null)

const defaultProps = {
	children: 'children',
	label: 'label',
}
const sourceData = ref<source[]>([])
const searchValue = ref('')

const addGroupRef = ref()
// 添加分组
const addGroup = () => {
	addGroupRef.value.acceptParams({})
}

const handleRightClick = (e: MouseEvent, data: any) => {
	if (data.type === 1) {
		if (data.id === 0) return
		ContextMenu.showContextMenu({
			x: e.x,
			y: e.y,
			items: [
				{
					label: pub.lang('编辑'),
					onClick: () => {
						addGroupRef.value.acceptParams({
							group_id: data.id,
							group_name: data.label,
						})
					},
				},
				{
					label: pub.lang('删除'),
					onClick: () => {
						common.send(routes.term.remove_group.path, { group_id: data.id }, (res: any) => {
							if (res.status) {
								getHostList()
							}
							Message.request(res)
						})
					},
				},
			],
		})
	} else {
		ContextMenu.showContextMenu({
			x: e.x,
			y: e.y,
			items: [
				{
					label: pub.lang('连接'),
					onClick: () => {
						handleChangeRow(data.host)
					},
				},
				{
					label: pub.lang('编辑'),
					onClick: () => {
						createHostInfo(data.host)
					},
				},
				{
					label: pub.lang('删除'),
					onClick: () => {
						removeHostInfo(data.host)
					},
				},
			],
		})
	}
}
let treeClickCont = 0 // 点击次数
let timer: any = null
const toggleNode = (node: any, TreeNode: any) => {
	treeClickCont++
	// 是否主节点
	if (typeof node.host === 'undefined') {
		TreeNode.expanded = !TreeNode.expanded
		treeClickCont = 0
		return false
	}
	timer = setTimeout(() => {
		if (treeClickCont > 1) {
			if (serverSort.value) return
			handleChangeRow(node.host)
			clearTimeout(timer)
		}
		treeClickCont = 0
	}, 300)
}
const emits = defineEmits(['host-change', 'open-dialog'])

// 获取服务器列表
const getHostList = () => {
	common.send(routes.term.list.path, { limit: 9999, search: searchValue.value }, (res: any) => {
		// 处理常规分组数据（保持完整数据）
		const normalGroups = res.data.groups
			.filter((group: Group) => group.group_id != -1)
			.map((item: Group) => {
				return {
					id: item.group_id,
					label: item.group_name,
					children: res.data.data
						.filter((host: hostProps) => host.group_id === item.group_id)
						.map((host: hostProps) => ({
							id: host.ssh_id,
							label: renderTitle(host),
							icon: host.os_name.toLowerCase(),
							host: host,
							parentID: item.group_id,
							sort: host.sort == null ? 0 : host.sort
						})),
					type: 1,
				}
			})

		// 如果服务器总数超过20台，创建临时分组
		if (res.data.data.length > 20) {
			// 按添加时间排序（旧到新）
			const sortedHosts = res.data.data.sort((a: hostProps, b: hostProps) => a.addtime - b.addtime)
			
			// 获取第20条之后的主机
			const excessHosts = sortedHosts.slice(20)
			
			const tempGroup = createTempGroup(excessHosts)
			if (tempGroup.children.length > 0) {
				normalGroups.unshift(tempGroup)
			}
		}

		sourceData.value = normalGroups
	})
}

// 创建临时分组
const createTempGroup = (hosts: hostProps[]): TempGroup => {
	const now = new Date().getTime() / 1000 // 转换为秒级时间戳
	const oneDayMs = 24 * 60 * 60

	// 在超出的主机中筛选24小时内新增的
	const recentHosts = hosts.filter(host => {
		const addTime = new Date(host.addtime).getTime()
		return (now - addTime) <= oneDayMs
	})
	
	return {
		id: -999,
		label: pub.lang('临时分组（近24小时新增）'),
		children: recentHosts.map(host => ({
			id: host.ssh_id,
			label: renderTitle(host),
			icon: host.os_name.toLowerCase(),
			host: host,
			parentID: -999,
			sort: host.sort == null ? 0 : host.sort
		})),
		type: 1
	}
}

// 渲染标题
const renderTitle = (info: hostProps) => {
	const { title, host } = info
	if (title === host) {
		return title
	} else {
		return `${title} - ${host}`
	}
}
/**
 * dragNode 对应被拖拽的节点
 * dropNode 对应被放置的目标节点
 * type 对应 'prev'目标节点上方,'inner'作为目标节点子节点,'next'目标节点下方
 */
function allowDrop(dragNode: any, dropNode: any, type: string) {
	//不能作为目标节点的子节点，不能成为新的父节点，禁止夸父级拖拽
	return type != 'inner' && !dropNode.data.type && dragNode.data.parentID === dropNode.data.parentID
}
//dragNode对应被拖拽的节点
function allowDrag(dragNode: any) {
	return dragNode.level !== 1
}
//保存拖拽排序
function setDragSort(draggingNode: any,dropNode: any,type:string,event:any) {
	let params = {
		id: draggingNode.data.id,
		sort: 0
	}
	// 目标节点在结束节点之后-1,在结束节点之前+1
	params.sort = type === 'after' ?dropNode.data.sort - 1:dropNode.data.sort + 1
	set_sort(params)
}

// 创建、编辑服务器信息
const createHostInfo = (item?: any) => {
	const sourceDataRaw = toRaw(sourceData.value)
	const data: any = {
		sourceData: sourceDataRaw,
		isQuick: false,
		...item,
		is_recording: item?.is_recording?.toString() === '1',
	}
	emits('open-dialog', data)
}

/**
 * @description 删除服务器信息
 * @param {hostProps} item 服务器信息
 * @returns {Promise<void>}
 */
const removeHostInfo = (item: hostProps) => {
	ElMessageBox.confirm(
		`${pub.lang('是否将【{}】从列表中删除?', item.title)}`,
		pub.lang('删除服务器'),
		{
			confirmButtonText: pub.lang('确认'),
			cancelButtonText: pub.lang('取消'),
			type: 'warning',
		}
	).then(() => {
		common.send(routes.term.remove.path, { ssh_id: item.ssh_id }, (res: any) => {
			if (res.status) {
				getHostList()
			}
		})
	})
}
/**
 * @description 双击行事件
 */
const handleChangeRow = (item: hostProps) => {
	emits('host-change', item)
}
// 启动定时刷新
const startAutoRefresh = () => {
  // 每1小时刷新一次
  refreshTimer.value = window.setInterval(() => {
    getHostList()
  }, 3600 * 1000)
}

// 停止定时刷新
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}


// 添加 onDeactivated 钩子
onDeactivated(() => {
  stopAutoRefresh()
})

// 添加 onUnmounted 钩子
onUnmounted(() => {
  stopAutoRefresh()
})
onActivated(() => {
	getHostList()
  startAutoRefresh()
})
// 监听参数变化
watch(
	() => serverRefresh.value.status,
	val => {
		if (val) {
			const { ssh_id, is_recording } = serverRefresh.value.param as any
			// 匹配相同的ssh_id,替换is_recording
			sourceData.value.forEach((item: any) => {
				item.children.forEach((row: any) => {
					if (row.id === ssh_id) {
						row.host.is_recording = is_recording
					}
				})
			})
			serverRefresh.value.status = false
			serverRefresh.value.param = {}
		}
	}
)
defineExpose({
	getHostList,
})
</script>

<style lang="scss" scoped></style>

