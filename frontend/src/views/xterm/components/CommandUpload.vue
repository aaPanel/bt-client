<template>
	<el-card class="xtermUpload">
		<template #header>
			<div class="flex">
				<span class="w-[16.8rem] truncate pr-10">{{ commadUpload.filename }}</span>
				<el-icon size="18" class="closeView" @click="closeUploadView"
					><CircleClose
				/></el-icon>
			</div>
		</template>
		<div class="relative xtermUploadContent flex">
			<el-progress
				class="flex-1 mr-4"
				:percentage="commadUpload.progress"
				status="success"
				:show-text="false" />
		</div>
	</el-card>
</template>

<script setup lang="ts">
import { useMessage } from '@utils/hooks/message'
import { CircleClose } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useXtermBase } from '@store/xterm'
import { pub } from '@/utils/tools/common';

const Message = useMessage() // 消息提示
const xtermStore = useXtermBase()
const { commadUpload } = storeToRefs(xtermStore)
function closeUploadView() {
	if (!commadUpload.value.status) {
		Message.success(pub.lang('已切换至后台运行'))
	}
	xtermStore.resetCommandUpload()
}
</script>

<style lang="scss" scoped>
.xtermUpload {
	position: absolute;
	width: 200px;
	right: 6px;
	bottom: 30px;
	z-index: 2;
}
.xtermUpload :deep(.el-card__body) {
	padding: 10px !important;
}
.closeView {
	&:hover {
		color: #f00;
		cursor: pointer;
	}
}
</style>
