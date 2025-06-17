<template>
	<el-dialog
		v-model="dialogVisible"
		width="360"
		draggable
		align-center
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="pub.lang('[{}] - {}属性', data.filename, data.is_dir ? '文件夹' : '文件')"></span>
			</div>
		</template>
		<el-descriptions :column="1" border>
			<el-descriptions-item :label="pub.lang('添加时间')">{{
				formatTime(attrData.atime)
			}}</el-descriptions-item>
			<el-descriptions-item :label="pub.lang('权限')">{{ attrData.mode }}</el-descriptions-item>
			<el-descriptions-item :label="pub.lang('修改时间')">{{
				formatTime(attrData.mtime)
			}}</el-descriptions-item>
			<el-descriptions-item :label="pub.lang('大小')">{{
				byteUnit(attrData.size)
			}}</el-descriptions-item>
			<el-descriptions-item :label="pub.lang('用户组')">{{ attrData.uid }}</el-descriptions-item>
		</el-descriptions>
	</el-dialog>
</template>

<script setup lang="ts">
import { pub, formatTime, byteUnit } from '@/utils/tools'

interface Attr {
	atime: number
	extended: undefined
	gid: number
	mode: number
	mtime: number
	size: number
	uid: number
}

const dialogVisible = ref(false)
let data = {} as any
const attrData = ref<Attr>({
	atime: 0,
	extended: undefined,
	gid: 0,
	mode: 0,
	mtime: 0,
	size: 0,
	uid: 0,
})

const acceptParams = (params: any) => {
	data = toRaw(params)
	attrData.value = params
	dialogVisible.value = true
}

defineExpose({
	acceptParams,
})
</script>
