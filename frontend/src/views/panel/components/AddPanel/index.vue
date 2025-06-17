<template>
	<el-dialog
		v-model="addPanelVisible"
		align-center
		width="460"
		draggable
		:close-on-click-modal="false"
		:before-close="handleClose">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="isEdit ? pub.lang('编辑{}', panelParams?.title) : pub.lang('添加面板')"></span>
			</div>
		</template>
		<div class="flex justify-center mt-2 mb-14" v-if="!isEdit">
			<el-radio-group v-model="addPanelMode" size="large" class="addPanelMode" @change="onChangeBindType">
				<el-radio-button :label="pub.lang('绑定已有面板')" value="bind" />
				<el-radio-button :label="pub.lang('新装并绑定')" value="new" />
			</el-radio-group>
		</div>
		<template v-if="addPanelMode === 'bind'">
			<bindPanel ref="BindPanelRef" @openProxy="openProxy" />
		</template>
		<template v-else>
			<newInstall ref="NewInstallRef" @openProxy="openProxy" />
		</template>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="handleClose">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="save">
					{{ addPanelMode ==='bind' ? (isEdit?pub.lang('保存') : pub.lang('绑定')):pub.lang('安装并绑定') }}
				</el-button>
			</div>
		</template>
	</el-dialog>

	<addProxy ref="addProxyRef" @refresh="get_proxy_list" />
</template>

<script setup lang="ts">
import bindPanel from './bindPanel.vue'
import newInstall from './newInstall.vue'
import addProxy from '@/views/setting/components/addProxy.vue'
import { storeToRefs } from 'pinia'
import { usePanelBase } from '@store/panel'
import { pub } from '@utils/tools'
import { get_proxy_list } from '../../controller'

const emit = defineEmits(['refresh'])
const { addPanelVisible, isEdit, panelParams, proxyList } = storeToRefs(usePanelBase())
const addPanelMode = ref('bind')
const BindPanelRef = ref()
const NewInstallRef = ref()
const addProxyRef = ref()
// 添加代理-[后期删除]
const openProxy = () => {
	addProxyRef.value.acceptParams({})
}
// 关闭弹窗
const handleClose = () => {
	addPanelVisible.value = false
	isEdit.value = false
}
//刷新列表
const refreshPanel = () => {
	handleClose()
	emit('refresh')
}

// 保存
const save = () => {
	if (addPanelMode.value === 'bind') {
		BindPanelRef.value.save(refreshPanel)
	} else {
		NewInstallRef.value.save()
	}
}
// 切换绑定方式
const onChangeBindType = (val: any) => {
	addPanelMode.value = val
	if (val === 'bind') {
		BindPanelRef.value.init()
	} else {
		NewInstallRef.value.init()
	}
}

watch(addPanelVisible, val => {
	if (val) {
		if (proxyList.value.length === 0) get_proxy_list()
		addPanelMode.value = 'bind'
		// 初始化表单
		nextTick(() => { 

			BindPanelRef.value.init()
		})
	}
})

</script>

<style scoped lang="scss">
.addPanelMode {
  width: 100%;
  flex-wrap: nowrap;
  .el-radio-button {
    flex: 1;

    :deep(.el-radio-button__inner) {
      width: 100% !important;
    }
  }
}
</style>
