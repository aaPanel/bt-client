<template>
	<div class="flex" :style="{ height: mainHeight + 'px' }">
		<!-- 左侧公共组件 -->
		<left-menu
			ref="leftMenuView"
			:data="terminalList[hostActive]"
			@host-change="createTerminal"
			@open-dialog="openSelectDialog" />
		<div class="terminal-content">
			<div class="terminal-nav">
				<div class="terminal-nav-list">
					<div
						v-for="(item, index) in terminalList"
						:class="terminalViewStyle({ index, type: 'nav' })"
						@click="cutTerminalNav(index)"
						@click.right="e => OpenMenu(e, { item, ...{ index } })">
						<div class="flex items-center">
							<div class="flex items-center truncate">
								<div class="terminal-status" :class="'icon-' + item.status"></div>
								<div class="terminal-title" :title="item.hostInfo.host">
									{{ item.hostInfo.title }}
								</div>
							</div>
							<div
								class="close h-[1.8rem] mt-2px"
								:dataIndex="index"
								@click.stop="closeTerminal('self',index)"
								:title="pub.lang('关闭当前终端视图')">
								<i class="iconfont icon-x w-[1.8rem] text-[#ef0808] text-[1.8rem]"></i>
							</div>
						</div>
					</div>
				</div>

				<div
					class="terminal-nav-add"
					:title="pub.lang('创建临时连接')"
					@click="openSelectDialog({ isQuick: true })">
					<el-icon><Plus class="text-[1.6rem]" /></el-icon>
				</div>
			</div>
			<div class="terminal-view">
				<my-terminal
					v-for="(item, index) in terminalList"
					@refresh="refreshXtermStatus"
					:ref="(el: tremRef) => setRefTerminal(el, item.ssh_id)"
					:key="item.ssh_id"
					:ssh-id="item.ssh_id"
					:active="index === hostActive"
					:host-info="item.hostInfo"
					:class="terminalViewStyle({ index, type: 'view' })"></my-terminal>
				<div v-if="terminalList.length === 0">
					<div
						class="welcome flex flex-col items-center justify-center"
						:style="{ height: '600px' }">
						<el-image :src="White" class="w-[20rem] h-[20rem]" style="opacity: 0.1" />
						<span class="text-[1.6rem] my-4">{{ pub.lang('双击服务器打开终端') }}</span>
						<el-button type="primary" size="large" @click="openSelectDialog({ isQuick: false })">{{
							pub.lang('添加服务器')
						}}</el-button>
					</div>
				</div>
			</div>
		</div>
		<!-- 右边菜单 -->
		<right-menu :data="terminalList[hostActive]" @refresh="refreshItemData" />

		<!-- 添加终端 -->
		<addHostDialog ref="addHostRef" @host-change="createTerminal" @refresh="refreshServeList" />
	</div>
</template>

<script lang="ts" setup>
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import type { hostProps } from '@types/xterm'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@store/setting'
import LeftMenu from './Views/LeftMenu/index.vue'
import RightMenu from './Views/RightMenu/index.vue'
import addHostDialog from './components/AddHost/index.vue'
// import xtermSidebarList from './Views/index.vue'
import MyTerminal from './Views/Terminal/index.vue'
import { ipc, common, routes } from '@api/http'
import { createContext } from './hooks'
import White from '@/assets/images/logo-white.svg'
import {xterm_disconnect,delete_connect} from '@views/xterm/controller'

import { pub } from '@utils/tools'

import '@xterm/xterm/css/xterm.css' // 终端样式
// 终端信息
interface terminalInfoProps {
	ssh_id: string // 终端id
	hostInfo: hostProps // 服务器信息
	status: 'success' | 'warning' | 'danger' // 状态
	editParams: {
		content: string
	}
	fileManagementPath?: string
}

type tremRef = {
	init?: () => void
}

interface TerminalRefs {
	[key: `ssh_id_${string}`]: tremRef
}

defineOptions({
	name: 'Terminal',
})

const useStore = useSettingStore()
const { mainHeight } = storeToRefs(useStore)
const leftMenuView = ref()
const hostActive = ref(0) // 当前激活的服务器
const terminalList = ref<terminalInfoProps[]>([]) // 终端列表
const terminalRefs: TerminalRefs = {} // 终端实例
const addHostRef = ref()

// 右键菜单
const OpenMenu = (e: MouseEvent, row: any) => {
	e.preventDefault()
	ContextMenu.showContextMenu({
		x: e.x,
		y: e.y,
		items: [
			{
				label: pub.lang('关闭会话'),
				onClick: () => {
					closeTerminal('self',row.index)
				},
			},
			{
				label: pub.lang('关闭其他'),
				onClick: () => {
					closeTerminal('other',row.index)
				},
			},
			{
				label: pub.lang('全部关闭'),
				onClick: () => {
					closeTerminal('all',row.index)
				},
			},
			{
				label: pub.lang('复制会话'),
				onClick: () => {
					createTerminal(row.item.hostInfo)
				},
			},
			
		],
	})
}

/**
 * @description 添加、编辑服务器
 * @param {any} param 服务器信息
 */
const openSelectDialog = (param: any) => {
	addHostRef.value.acceptParams(Object.assign({}, param))
}
/**
 * @description 刷新服务器列表
 */
const refreshServeList = () => {
	leftMenuView.value.refresh()
}

/**
 * @description 终端Class，包括导航和视图
 * @param {number} data.index 终端下标
 * @param {string} data.type 类型
 * @returns {string} 终端Class
 */
const terminalViewStyle = ({ index, type }: { index: number; type: 'nav' | 'view' }): string => {
	return `terminal-${type}-item ${index === hostActive.value ? 'active' : ''}`
}

/**
 * @description 切换终端tab
 * @param {number} index 终端id
 */
const cutTerminalNav = async (index: number): Promise<void | boolean> => {
	if (typeof hostActive.value != 'number') return false
	hostActive.value = index
	nextTick(() => {
		const activeTerm = getRefTerminal(hostActive.value)
		const { ssh_id } = terminalList.value[index]
		// terminalRefs[ssh_id].terminal().fitTerminal()

		if (!activeTerm) return false
	})
}
/**
 * @description 刷新单个终端数据
 */
const refreshItemData = (obj: any) => {
	terminalList.value[hostActive.value].hostInfo = {
		...terminalList.value[hostActive.value].hostInfo,
		...obj,
	}
}
// 传递实例
createContext({
	executeCommand: (shell: string) => {
		const activeTerm = getRefTerminal(hostActive.value)
		if (!activeTerm) return false

		activeTerm.terminal().send_to_server(shell + '\r')
		activeTerm.terminal().focus()
	},
	pasteEditArea: (content: string) => {
		const activeTerm = getRefTerminal(hostActive.value)
		if (!activeTerm) return false
		activeTerm.setCommand(content)
	},
	refreshVeiwPosition: () => {
		const activeTerm = getRefTerminal(hostActive.value)
		if (!activeTerm) return false
		activeTerm.terminal().resizeTerminal()
	},
	fileManagementPath: (path: string) => {
		terminalList.value[hostActive.value].fileManagementPath = path
	},
})

/**
 * @description 获取终端实例
 * @param {number} index 终端id 默认当前激活的终端id
 */
const getRefTerminal = (index: number) => {
	const ssh_id: string = terminalList.value[index]?.ssh_id
	if (Object.keys(terminalRefs).length > 0) return terminalRefs[ssh_id]
	return false
}

/**
 * @description 设置终端实例
 * @param {string} ssh_id 终端id
 */
const setRefTerminal = (el: tremRef, ssh_id: string) => {
	terminalRefs[ssh_id] = el
	return ssh_id
}

/**
 * @description 创建终端
 * @param {hostProps} hostInfo
 * @returns {void}
 */
const createTerminal = (hostInfo: hostProps): void => {
	const ssh_id = 'ssh_id_' + new Date().getTime() // 随机id
	if (hostInfo.os_type === 'Windows') {
		ipc.send(routes.term.connect.path, {
			channel: ssh_id,
			data: toRaw(hostInfo),
		})
		return
	}
	terminalList.value.push({
		ssh_id,
		hostInfo,
		status: 'warning',
		fileManagementPath: '/', // 默认文件管理路径
		editParams: {
			content: '',
		},
	})
	nextTick(() => {
		const index = terminalList.value?.length - 1
		if (index > 0) {
			cutTerminalNav(index)
		}
	})
}
// 更新状态状态
const refreshXtermStatus = (status: 'success' | 'warning' | 'danger') => {
	terminalList.value[hostActive.value].status = status
}

/**
 * @description 关闭终端
 * @param {string} mode 关闭模式 self:关闭自己,all:关闭所有,other:关闭其他
 * @param {staring} index 终端id mode=self时必传
 * @returns {void}
 */
const closeTerminal = async (mode: string, index: number): Promise<void> => {
	delete_connect({mode:mode,ssh_id:terminalList.value[index].ssh_id})
	delete_connect_view(mode,index)
}
/**
 * @description 删除连接中的视图
 * @param {string} mode 关闭模式 self:关闭自己,all:关闭所有,other:关闭其他
 * @param {staring} index 终端id mode=self时必传
 */
const delete_connect_view = (mode:string,index: number) => {
	switch(mode){
		case 'self':
			let prevIndex = index - 1,
				nextIndex = index + 1
			if (hostActive.value === index) {
				if (nextIndex <= Number(terminalList.value?.length - 1)) {
					cutTerminalNav(nextIndex)
				} else if (prevIndex >= 0) {
					cutTerminalNav(prevIndex)
				}
			} else if (hostActive.value > index) hostActive.value--
			terminalList.value.splice(index, 1)
			break
		case 'all':
			terminalList.value = []
			hostActive.value = 0
			break
		case 'other':
			let currentSshId = terminalList.value[index].ssh_id
			terminalList.value = terminalList.value.filter((item) => item.ssh_id === currentSshId)
			hostActive.value = 0
			break
	}
}

</script>

<style lang="sass" scoped>
.terminal-nav
	@apply w-full flex relative
	.terminal-nav-list
		@apply flex overflow-x-auto overflow-y-hidden
		max-width: calc( 100% - 4rem )
		&::-webkit-scrollbar
			height: 4px
		&::-webkit-scrollbar-track
			box-shadow: inset 0 0 6px #EAEAEA
		&::-webkit-scrollbar-track-piece
			background-color: #cfcfcf
			box-shadow: inset 0 0 6px rgba(0,0,0,1)
		&::-webkit-scrollbar-thumb
			background: #515151
			box-shadow: inset 0 0 6px rgba(0,0,0,1)
		&::-webkit-scrollbar-thumb:hover
			background-color: rgba(0, 0, 0, 0.5)
	.terminal-nav-item
		@apply h-[2.8rem] leading-[2.8rem] text-left flex items-center justify-between text-[#666] cursor-pointer transition-all duration-300
		&:hover
			@apply bg-#ccc
			.close .el-icon-close
				@apply opacity-100
		&.active
			@apply bg-[#424242]
			.terminal-title
				@apply text-[#fff]
			.close
				.el-icon-close
					@apply opacity-90
				&:hover
					@apply bg-[#fff]
		.terminal-status
			@apply h-[1rem] w-[1rem] rounded-[1rem] inline-block ml-[8px] mr-[4px] transition-all duration-400
			&.icon-success
				@apply bg-[#20a53a]
			&.icon-warning
				@apply bg-warning
			&.icon-danger
				@apply bg-danger
		.terminal-title
			@apply text-medium truncate
		.close
			@apply flex items-center transition-all duration-300 rounded-[.2rem] mr-[8px]
			i.el-icon-close
				@apply text-[1.8rem] text-danger font-bold opacity-0 transition-all duration-300
			&:hover
				@apply bg-[#aaa]
	.terminal-nav-add
		@apply w-[2.8rem] h-[2.8rem] leading-[2.8rem] flex items-center cursor-pointer justify-center transition-all duration-300
		i
			@apply text-[1.8rem] text-primary font-[800]
		&:hover
			@apply bg-[#ccc]
	.terminal-nav-full
		@apply w-[2.8rem] h-[2.8rem] leading-[2.8rem] flex items-center cursor-pointer justify-center transition-all duration-300 absolute right-0
		i
			@apply text-[1.8rem] text-dark font-bold
		&:hover
			@apply bg-[#bababa]

.terminal-content
	@apply flex-1 px-2 pt-2 flex flex-col overflow-hidden relative

.terminal-view
	@apply bg-[#000] w-full h-full
	.terminal-view-item
		@apply bg-[#000] w-full h-full hidden
		&.active
			@apply block
		&.terminal-view-*
			@apply hidden

.terminal-contract-tool
	@apply bg-[#555555] w-[1rem] h-[4rem] rounded-bl-full rounded-tl-full flex items-center justify-center cursor-pointer absolute right-0 top-[50%] z-999
	&:after
		@apply content-[''] block absolute w-[0.6rem] h-[0.6rem] border-white transform rotate-45 border-[2px] border-solid
		border-left: 0
		border-bottom: 0
	&:hover
		@apply bg-[#888] transition-all duration-300

	&.is-avtive
		@apply bg-[#888] transition-all duration-300
		&:after
			@apply transform -rotate-135 left-1
.drawer
	display: none
.xterm .xterm-viewport
	overflow: auto !important
</style>
