<template>
	<el-tabs tab-position="right" class="menu-vertical" v-model="activeName" @tab-click="handleClick">
		<el-tab-pane :label="pub.lang('监控')" name="monitor"><monitor :data="data" /></el-tab-pane>
		<el-tab-pane :label="pub.lang('录像审计')" name="record"
			><record :data="data" @refresh="refresh" v-if="activeName === 'record'"
		/></el-tab-pane>
		<el-tab-pane :label="pub.lang('文件管理')" name="file"
			><file :data="data" v-if="activeName === 'file'"
		/></el-tab-pane>
	</el-tabs>
</template>

<script lang="ts" setup>
import type { TabsPaneContext } from 'element-plus'
import monitor from './monitor/index.vue'
import Record from './Record/index.vue'
import File from './File/index.vue'
import { useContext } from '@views/xterm/hooks'
import { pub } from '@utils/tools'

const { refreshVeiwPosition } = useContext()
const emit = defineEmits(['refresh'])
const activeName = ref('')
const handleClick = (tab: TabsPaneContext, event: Event) => {
	if (tab.props.name === activeName.value) {
		activeName.value = ''
	}
	refreshVeiwPosition()
}
const props = defineProps({
	data: {
		type: Object,
		default: () => ({}),
	},
})

const refresh = (obj: any) => {
	emit('refresh', obj)
}
</script>
