<template>
	<div class="flex relative" :style="{ height: mainHeight - 34 + 'px' }">
		<div
			ref="terminalDom"
			class="w-full p-[8px] pt-0 z-1"
			@dragenter.prevent
			@dragover.prevent="handleDragOff($event)"
			@dragleave.prevent="handleDragLeave"
			@drop.prevent="handleDragDrop"
			:style="{ height: mainHeight - 57 + 'px' }"></div>
		<CommandUpload v-if="commadUpload.visible"/>
		<div class="flex items-center bg-[#1F1F1F] px-2 py-[.2rem] xterm-send-box z-2 relative">
			<bt-icon name="xtremSend" size="14" />
			<input
				type="text"
				v-model="input"
				class="ml-2 bg-[#1F1F1F] border-none text-[#fff] flex-1"
				ref="editCommandRef"
				@keydown="handleKeyDown" />
			<span class="send-btn select-none" @click="sendInput">{{pub.lang('发送')}}(Ctrl+Enter)</span>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { useMessage } from '@utils/hooks/message'
import CommandUpload from '@views/xterm/components/CommandUpload.vue'
import { storeToRefs } from 'pinia'
import { useXtermBase } from '@store/xterm'
import { useSettingStore } from '@store/setting'
import { TerminalManager } from './TerminalManager'
import {upload_sftp_file,get_sftp_items,connect_sftp} from '@views/xterm/controller'
import { pub } from '@utils/tools'

interface Props {
	sshId: string
	active: boolean
	hostInfo: any
}

const useStore = useSettingStore()
const { mainHeight } = storeToRefs(useStore)
const storeXterm = useXtermBase()
const { commadUpload } = storeToRefs(storeXterm)
const Message = useMessage() // 消息提示
const props = withDefaults(defineProps<Props>(), {
	sshId: '',
	active: true, // 是否激活
	hostInfo: () => ({}),
})
const emit = defineEmits(['refresh'])
const terminalDom = ref()
let terminalManager: TerminalManager | null = null

const linksNumber = ref(0) // 链接数量
const input = ref('') // 输入内容
const editCommandRef = ref<HTMLInputElement>()
const remotePath = ref() // 上传路径
// 窗口大小改变时，重新调整终端大小
const handleResize = () => {
	if (terminalManager && props.active) {
		terminalManager.resizeTerminal()
	}
}
// 处理键盘按下事件
const handleKeyDown = (event: KeyboardEvent) => {
	if (event.ctrlKey && event.key === 'Enter') {
		sendInput()
	}
}

// 发送输入内容
const sendInput = () => {
	if (!input.value) return
	terminalManager?.send_to_server(input.value + '\r')
	// 在这里添加发送逻辑
	input.value = ''
}
// 监听激活状态
watch(
	() => props.active,
	val => {
		if (val && terminalManager) {
			terminalManager.resizeTerminal()
			setTimeout(() => {
				if(terminalManager) terminalManager.focus()
			}, 100)
		}
	}
)

// 设置输入内容
const setCommand = (val: string) => {
	input.value = val
	editCommandRef.value?.focus()
}
// 拖拽事件
const handleDragOff = (e: DragEvent) => {
	e.preventDefault()
}
// 拖拽离开范围
const handleDragLeave = (event: DragEvent) => {
	event.preventDefault()
}
// 拖拽结束
const handleDragDrop = async (event: DragEvent, rData?: any) => {
	const files = rData ? rData : event.dataTransfer?.files
	// if(commadUpload.value.progress != 0 && !commadUpload.value.status) {
	// 	Message.error('正在上传中，请勿重复操作')
	// 	return
	// }else if(commadUpload.value.visible && commadUpload.value.status) {
	// 	storeXterm.resetCommandUpload()
	// }
	storeXterm.resetCommandUpload()
	if (terminalManager){
		terminalManager.isPwd = true
		terminalManager.send_to_server('echo $(pwd)\r')
	}

	const sftpList = await get_sftp_items() as string[]

	// 检查终端是否已经获取到路径
	function checkPwdResult(num: number) {
		if (num > 30) {
			// 递归30次未获取到路径，提示错误
			Message.error(pub.lang('未检测到可上传路径'))
			return
		}

		setTimeout(()=>{
			if(remotePath.value === '') {
				return checkPwdResult(num + 1);
			}

			if (sftpList.includes(props.hostInfo.ssh_id)) {
				uploadFile()
			} else {
				connect_sftp({ssh_id:props.hostInfo.ssh_id},uploadFile)
			}
		},100);
	}


	function uploadFile() {
		// 限制文件数量仅一个、获取文件信息
		if (files && files.length === 1) {
			commadUpload.value.visible = true
			commadUpload.value.filename = files[0].name
			const file: any = files[0]
			upload_sftp_file({ssh_id: props.hostInfo.ssh_id, remotePath: remotePath.value, localPath:file.path})
		} else {
			Message.error(pub.lang('仅允许上传一个文件'))
		}
	}


	checkPwdResult(0)
}

onMounted(() => {
	nextTick(() => {
		linksNumber.value += 1
		// 创建终端
		if (terminalDom.value) {
			terminalManager = new TerminalManager(
				terminalDom.value,
				props.sshId,
				toRaw(props.hostInfo),
				callback => {
					remotePath.value = callback._allowPath || ''
					emit('refresh', callback.status)
				}
			)
		}

		window.addEventListener('resize', handleResize)
		document.addEventListener('fullscreenchange', handleResize)
	})
})
onBeforeUnmount(() => {
	// 销毁终端
	if (terminalManager) {
		terminalManager.dispose()
	}

	window.removeEventListener('resize', handleResize)
	document.removeEventListener('fullscreenchange', handleResize)
})
onActivated(() => {
	if (terminalManager) {
		terminalManager.focus()
		// 滚动至底部
		terminalManager.scrollToBottom()
	}
})

defineExpose({
	terminal: () => terminalManager,
	setCommand,
})
</script>
<style lang="sass">
.terminal-add-host
	@apply absolute flex-col top-0 w-full h-full flex justify-center items-center z-999 bg-[#3e3e3e78]
	.el-form
		@apply w-[50rem]
</style>

<style lang="sass">
.drawer
	@apply hidden

.xterm
	.xterm-rows
		span
			letter-spacing: 0 !important
	.xterm-viewport
		overflow: auto !important

	.xterm-viewport::-webkit-scrollbar
		@apply w-[8px] h-[6px] rounded-[4px]

	.xterm-viewport::-webkit-scrollbar-thumb
		@apply bg-[#666] rounded-[4px]
		box-shadow: inset 0 0 5px rgba($color: #181d28, $alpha: 0.4)
		transition: all 1s

	.xterm-viewport:hover::-webkit-scrollbar-thumb
		@apply bg-[#aaa]

	.xterm-viewport::-webkit-scrollbar-track
		@apply bg-[#333] rounded-[4px]
		box-shadow: inset 0 0 5px rgba($color: #181d28, $alpha: 0.4)
		transition: all 1s

	.xterm-viewport:hover::-webkit-scrollbar-track
		@apply bg-[#444]

.xterm-send-box
	.send-btn
		@apply cursor-pointer text-[#c1c1c1] transition-all duration-300 border border-solid border-[#c1c1c1] px-2 py-[.2rem] rounded-[.2rem] text-[1rem]
		&:hover
			@apply text-primary bg-[#333] border-[#333] transition-all duration-300
</style>
