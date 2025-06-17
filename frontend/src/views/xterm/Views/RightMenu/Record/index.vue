<template>
	<div class="px-4 py-2 w-[20rem]">
		<template v-if="isExistTerminal">
			<div class="flex justify-between mb-[.5rem]">
				<span class="text-[1.4rem] font-bold">{{ pub.lang('录像审计') }}</span>
				<el-button type="default" size="small" @click="getList"
					><el-icon><RefreshRight /></el-icon
				></el-button>
			</div>
			<div class="flex items-center">
				{{ pub.lang('录像开关') }}
				<el-switch
					v-model="status"
					inline-prompt
					:active-text="pub.lang('已开启')"
					:inactive-text="pub.lang('未开启')"
					class="ml-2"
					@change="hanelStatus" />
			</div>
			<el-table
				:data="list"
				:height="mainHeight - 70"
				class="table-style-one"
				:empty-text="pub.lang('暂无数据')">
				<el-table-column :label="pub.lang('日期')" prop="start_time">
					<template #default="{ row }"> {{ formatTime(row.start_time) }}</template></el-table-column
				>
				<el-table-column :label="pub.lang('操作')" align="right" prop="duration" width="70">
					<template #default="{ row }">
						<div>
							<el-tooltip :content="pub.lang('播放')" placement="top">
								<el-icon class="cursor-pointer" @click="hanelPlay(row)"><VideoPlay /></el-icon>
							</el-tooltip>
							<el-tooltip :content="pub.lang('删除')" placement="top">
								<el-icon color="red" class="ml-2 cursor-pointer" @click="hanelDelete(row)"
									><Delete
								/></el-icon>
							</el-tooltip>
						</div> </template
				></el-table-column>
			</el-table>
			<div
				v-show="playDialog"
				class="fixed top-0 left-0 w-full h-full items-center justify-center flex z-999">
				<div class="bg-black opacity-25 w-full h-full absolute" @click="playDialog = false"></div>
				<div class="relative w-[90rem] h-[70rem]">
					<div
						@click="playDialog = false"
						class="absolute -top-1.5rem -right-1.5rem z-99999 w-[3rem] h-3rem rounded-1/2 cursor-pointer">
						<div class="absolute w-[3rem] h-3rem top-0 left-0 origin-center close-popup-btn"></div>
					</div>
					<div
						id="video"
						class="border-white bg-black z-9999 border-[1.6rem] rounded-4x absolute leading-8 w-[90rem] h-[70rem]"></div>
				</div>
			</div>
		</template>
		<template v-else>
			<el-empty :image-size="80" :description="pub.lang('请先打开一个终端')" />
		</template>
	</div>
</template>
<script setup lang="ts">
import * as AsciinemaPlayer from 'asciinema-player'
import 'asciinema-player/dist/bundle/asciinema-player.css'
import { useSettingStore } from '@store/setting'
import { useMessage } from '@utils/hooks/message'
import { pub, formatTime } from '@utils/tools'
import { common, routes } from '@api/http'

const useStore = useSettingStore()
const emit = defineEmits(['refresh'])
const { mainHeight, serverRefresh } = storeToRefs(useStore)
const Message = useMessage() // 消息提示
const props = defineProps({
	data: {
		type: Object,
		default: () => ({}),
	},
})
const list = ref([])
const playDialog = ref(false)
const status = ref(false)
// 获取列表
const getList = () => {
	if (!props.data.hostInfo) return
	common.send(
		routes.term.video_list.path,
		{ ssh_id: props.data.hostInfo.ssh_id || undefined },
		(res: any) => {
			list.value = res.data
		}
	)
}
// 播放录屏
const hanelPlay = (row: any) => {
	common.send(routes.term.get_video.path, { record_id: row.record_id }, (res: any) => {
		playDialog.value = true
		const video = document.getElementById('video') as HTMLVideoElement
		if (video) video.innerHTML = ''
		AsciinemaPlayer.create({ data: res }, document.getElementById('video'), {
			autoPlay: true,
			theme: 'solarized-dark',
			terminalFontSize: 'small',
		})
	})
}
// 录屏开关
const hanelStatus = (val: any) => {
	const {
		auth_type,
		group_id,
		host,
		mstsc_options,
		os_type,
		password,
		port,
		privateKey,
		proxy_id,
		ssh_id,
		title,
		username,
	} = props.data.hostInfo
	const params = {
		...{
			auth_type,
			group_id,
			host,
			mstsc_options: toRaw(mstsc_options),
			os_type,
			password,
			port,
			privateKey,
			proxy_id,
			ssh_id,
			title,
			username,
			isQuick: false,
		},
		is_recording: val ? '1' : '0',
	}
	common.send(routes.term.modify.path, params, (res: any) => {
		if (!res.status) {
			status.value = !val
			Message.error(res.msg)
		} else {
			emit('refresh', { is_recording: params.is_recording })
			serverRefresh.value.status = true
			serverRefresh.value.param = { ssh_id, is_recording: params.is_recording }
		}
	})
}

// 删除录屏
const hanelDelete = (row: any) => {
	common.send(routes.term.remove_video.path, { record_id: row.record_id }, (res: any) => {
		if (res.status) {
			getList()
		}
		Message.success(res.msg)
	})
}

// 是否存在开启的终端
const isExistTerminal = ref(false)
// props.data不是空对象的时候获取列表
watch(
	() => props.data,
	(val: any) => {
		isExistTerminal.value = false
		if (Object.keys(val).length) {
			getList()
			status.value = val.hostInfo.is_recording?.toString() === '1'
			isExistTerminal.value = true
		} else {
			list.value = []
		}
	},
	{ immediate: true }
)
</script>
