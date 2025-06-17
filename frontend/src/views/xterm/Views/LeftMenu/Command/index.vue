<template>
	<div class="p-4 w-[22rem]">
		<el-button type="primary" @click="Create()">{{ pub.lang('添加命令') }}</el-button>
		<el-table
			:data="list"
			:height="mainHeight - 62"
			class="mt-8 table-style-one"
			@row-dblclick="copyCommand"
			:empty-text="pub.lang('暂无数据')">
			<el-table-column :label="pub.lang('命令')">
				<template #default="{ row }">
					<div @click.right="e => OpenMenu(e, { row })" class="cursor-pointer select-none">
						<div>{{ row.title }}</div>
						<div class="text-[#B4B4B4] leading-[1.6rem] line-clamp" :title="`双击复制命令：${row.content}`">{{ row.content }}</div>
					</div>
				</template>
			</el-table-column>
		</el-table>
		<!-- 添加命令 -->
		<AddCommand ref="commandRef" @refresh="getList" />
	</div>
</template>
<script setup lang="ts">
import ContextMenu from '@imengyu/vue3-context-menu'
import { useMessage } from '@utils/hooks/message'
import { useSettingStore } from '@store/setting'
import AddCommand from '@views/xterm/components/AddCommand/index.vue'
import { pub, copyText } from '@utils/tools'
import { common, routes } from '@api/http'
import { useContext } from '@views/xterm/hooks'

const useStore = useSettingStore()
const { mainHeight } = storeToRefs(useStore)
const Message = useMessage() // 消息提示

const { executeCommand, pasteEditArea } = useContext()

const list = ref([])
const commandRef = ref()
// 右键菜单
const OpenMenu = (e: MouseEvent, row: any) => {
	e.preventDefault()
	ContextMenu.showContextMenu({
		x: e.x,
		y: e.y,
		items: [
			{
				label: pub.lang('立即执行'),
				onClick: () => {
					executeCommand(row.row.content)
				},
			},
			{
				label: pub.lang('粘贴到编辑窗口'),
				onClick: () => {
					pasteEditArea(row.row.content)
				},
			},
			{
				label: pub.lang('编辑'),
				onClick: () => {
					commandRef.value.acceptParams(row.row)
				},
			},
			{
				label: pub.lang('删除'),
				onClick: () => {
					common.send(
						routes.term.remove_command.path,
						{ shell_id: row.row.shell_id },
						(res: any) => {
							Message.request(res)
							if (res.status) {
								getList()
							}
						}
					)
				},
			},
		],
	})
}

// 获取命令列表
const getList = () => {
	common.send(routes.term.command_list.path, {}, (res: any) => {
		list.value = res.data
	})
}
// 复制命令
const copyCommand = (row: any) => {
	copyText({ value: row.content })
}

const Create = () => {
	commandRef.value.acceptParams({})
}

onMounted(() => {
	getList()
})
</script>
<style scoped lang="scss">
.line-clamp {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	overflow: hidden;
}
</style>
