<template>
	<el-tabs
		tab-position="left"
		class="menu-vertical xterm-left-tabs"
		v-model="activeName"
		@tab-click="handleClick">
		<el-tab-pane :label="pub.lang('服务器列表')" name="serverList"
			><ServeList ref="serverRef" @host-change="createTerminal" @open-dialog="openSelectDialog"
		/></el-tab-pane>
		<el-tab-pane :label="pub.lang('常用命令')" name="command"
			><command v-if="activeName === 'command'"
		/></el-tab-pane>
	</el-tabs>
</template>

<script lang="ts" setup>
import type { TabsPaneContext } from 'element-plus'
import ServeList from './ServeList/index.vue'
import Command from './Command/index.vue'
import { useContext } from '@views/xterm/hooks'
import { pub } from '@utils/tools'

const emits = defineEmits(['host-change', 'open-dialog'])

const { refreshVeiwPosition } = useContext()
const serverRef = ref()

const createTerminal = (host: any) => {
	emits('host-change', host)
}
const activeName = ref('serverList')

const openSelectDialog = (param: any) => {
	emits('open-dialog', param)
}
const refresh = () => {
	serverRef.value.getHostList()
}

const handleClick = (tab: TabsPaneContext, event: Event) => {
	if (tab.props.name === activeName.value) {
		activeName.value = ''
	}
	refreshVeiwPosition()
}
defineExpose({
	refresh,
})
</script>

<style scoped></style>
