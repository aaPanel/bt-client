<template>
	<el-dialog
		v-model="groupManageVisible"
		align-center
		width="350"
		draggable
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="pub.lang('分组管理')"></span>
			</div>
		</template>
		<div>
			<el-input
				v-model="newGroupName"
				size="large"
				style="width: 215px; margin-right: 6px"
				:placeholder="pub.lang('请输入分组名称')" />
			<el-button size="large" @click="addNewGourp">{{ pub.lang('添加') }}</el-button>
		</div>
		<GroupTable :layout="['']" :tableProperties="{ 'max-height': 280 }" />
	</el-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePanelBase } from '@store/panel'
import { useOperationTable } from '@/bt-hook/useDataTable'
import { pub } from '@/utils/tools'
import { btButtonGroup } from '@/utils/viewTools'
import { useMessage } from '@utils/hooks/message'
import { add_group, remove_group } from '../../controller'

const emit = defineEmits(['refresh'])

const { groupList, addGroupVisible, isEditGroup, editGroupParams, groupManageVisible } =
	storeToRefs(usePanelBase())
const newGroupName = ref('')
const GroupList = ref({
	data: groupList.value,
	itemCount: 0,
})

const columns = ref([
	{
		key: 'group_name',
		title: pub.lang('名称'),
	},
	{
		title: '操作',
		key: 'operation',
		attrs: {
			align: 'right',
		},
		render: (row: any) =>
			btButtonGroup(
				row.group_id === -1 || row.group_id === 0
					? []
					: [
							[
								pub.lang('编辑'),
								{
									onClick: () => {
										addGroupVisible.value = true
										isEditGroup.value = true
										editGroupParams.value = { group_id: row.group_id, group_name: row.group_name }
									},
								},
							],
							[
								pub.lang('删除'),
								{
									onClick: () => {
										remove_group(row, refreshList)
									},
								},
							],
						]
			),
	},
])
const [GroupTable] = useOperationTable(GroupList, columns)
// 添加分组
const addNewGourp = () => {
	if (!newGroupName.value) return useMessage().error(pub.lang('请输入分组名称'))
	add_group(newGroupName.value, () => {
		newGroupName.value = ''
		refreshList()
	})
}

// 刷新列表
const refreshList = () => {
	emit('refresh')
}
// 更新列表
function updateList() {
	GroupList.value.data = groupList.value
}
watch(groupList, val => {
	GroupList.value.data = val
})
watch(groupManageVisible, val => {
	if (val) {
		updateList()
	}
})
</script>
