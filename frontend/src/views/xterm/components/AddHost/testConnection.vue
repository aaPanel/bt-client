<template>
	<el-dialog
		v-model="testConnectionDialog"
		width="360"
		align-center
		:close-on-click-modal="false"
		:before-close="() => closeTest()">
		<template #header>
			<div>
				<span class="text-1.4rem leading-[1.8rem] text-grey-333"
					><span v-if="testCodeStatus === 0">{{ pub.lang('正在') }}</span
					>{{ title }}</span
				>
			</div>
		</template>
		<div>
			<el-progress
				v-show="testCodeStatus === 0"
				:percentage="100"
				:indeterminate="true"
				:duration="1"
				:show-text="false"
				color="#909399" />
			<div class="flex" v-show="testCodeStatus === 1 || testCodeStatus === 2">
				<div class="text-[2rem] mr-2">
					<template v-if="testCodeStatus === 1">
						<el-icon color="#1a73e8"><CircleCheckFilled /></el-icon>
					</template>
					<template v-else>
						<el-icon color="#ef0808"><CircleCloseFilled /></el-icon>
					</template>
				</div>
				<div class="flex-1">
					<template v-if="testCodeStatus === 1">
						<div class="text-[1.6rem] text-grey-333">{{ pub.lang('成功连接') }}</div>
					</template>
					<template v-else>
						<div class="text-[1.6rem] text-grey-333">
							{{ pub.lang('无法连接到远程主机') }}
						</div>
					</template>
				</div>
			</div>
		</div>
		<template #footer>
			<div>
				<el-button v-if="testCodeStatus === 0" @click="closeTest">{{ pub.lang('取消') }}</el-button>
				<el-button v-else @click="closeTest">{{ pub.lang('关闭') }}</el-button>
			</div>
		</template>
	</el-dialog>
</template>
<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useXtermBase } from '@store/xterm'
import { pub } from '@utils/tools'
import { routes, ipc } from '@api/http'
import {xterm_disconnect} from '@views/xterm/controller'

const { testConnectionDialog, testConnectionData, testCodeStatus } = storeToRefs(useXtermBase())
const title = computed(() => {
	return `${pub.lang('连接到')} ${testConnectionData.value?.username}@${testConnectionData.value?.host}:${testConnectionData.value?.port}`
})
const ssh_id = ref('')
/**
 * @description 创建监听
 */
const createXtermListener = () => {
	ipc.on(ssh_id.value, (event: any, data: any) => {
		if (typeof data === 'string') {
			let str: string = data
			if (str.indexOf('CHANNEL_SUCCESS (r:0)') > -1) {
				testCodeStatus.value = 1
				return
			}
			if (
				str.indexOf('CHANNEL_EOF') > -1 ||
				str.indexOf('CHANNEL_CLOSE') > -1 ||
				str.indexOf('exit-status') > -1 ||
				str.indexOf('CHANNEL_REQUEST') > -1 ||
				str.indexOf('Received IGNORE') > -1 ||
				str.indexOf('SSH连接已关闭') > -1 ||
				str.indexOf('连接失败') > -1 ||
				str.indexOf('Not connected') > -1 ||
				str.indexOf('No response') > -1 ||
				str.indexOf('连接超时') > -1 ||
				str.indexOf('认证失败') > -1
			) {
				testCodeStatus.value = 2
				return
			}
		}
	})
	// 发送连接信息
	ipc.send(routes.term.connect.path, {
		channel: ssh_id.value,
		data: toRaw(testConnectionData.value),
	})
}
/*
 * 关闭测试连接
 */
const closeTest = () => {
	testConnectionDialog.value = false
	xterm_disconnect(ssh_id.value)
	setTimeout(() => {
		testCodeStatus.value = 0
	}, 500)
}

/*
 * 检测取消按钮
 */
watch(
	() => testConnectionDialog.value,
	val => {
		if (val) {
			ssh_id.value = 'ssh_id_' + new Date().getTime() // 随机id
			createXtermListener()
		}
	}
)
</script>
