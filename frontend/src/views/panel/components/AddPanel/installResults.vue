<template>
	<el-dialog
		v-model="resultsVisible"
		align-center
		:width="resultsParams && resultsParams.status?560:860"
		draggable
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span class="text-1.4rem leading-[1.8rem] text-grey-333">{{ pub.lang('安装结果') }}</span>
			</div>
		</template>
		<div class="flex">
			<div class="text-[8rem] mr-6">
				<template v-if="resultsParams.status">
					<el-icon color="#1a73e8"><CircleCheckFilled /></el-icon>
				</template>
				<template v-else>
					<el-icon color="#ef0808"><CircleCloseFilled /></el-icon>
				</template>
			</div>
			<div class="flex-1">
				<template v-if="resultsParams.status">
					<div class="text-[1.6rem] mb-4 text-grey-333">
						{{ pub.lang('安装成功，以下是面板登录信息') }}
					</div>
					<el-card class="mb-4">
						<div class="break-all" v-html="formattedContent"></div>
					</el-card>
					<span class="text-[#ef0808]">{{
						pub.lang(
							'注意：如果您的机器是阿里云、腾讯云等有安全组的机器，请登录相关控制台放行以下端口：(18421,888,80,443,20,21)'
						)
					}}</span>
					<a href="https://www.bt.cn/bbs/forum.php?mod=viewthread&tid=109457" class="btlink" target="_blank">>{{ pub.lang('点击查看教程') }}</a>
				</template>
				<template v-else>
					<div class="text-1.4rem text-grey-333">
						{{ pub.lang('安装失败，请截图以下报错信息发帖至论坛www.bt.cn/bbs求助') }}
					</div>
					<div class="h-[58rem] w-[73rem]">
						<pre style="height: 100%" class="w-full flex items-start py-[1rem] px-4 overflow-y-auto bg-[#333] log-box">
							<code class="flex-1 w-full p-0 bg-none whitespace-pre-line text-i text-[#ececec]" v-html="resultsParams.content || ''"></code>
						</pre>
					</div>
				</template>
			</div>
		</div>
		<template #footer>
			<div class="dialog-footer">
				<template v-if="resultsParams.status">
					<el-button @click="cancel">{{ pub.lang('关闭') }}</el-button>
					<el-button type="primary" @click="save">{{ pub.lang('复制并保存') }}</el-button>
				</template>
				<template v-else>
					<div class="flex justify-between">
						<el-popover
							placement="top"
							trigger="click"
						>
							<template #reference>
								<el-button class="m-2">{{ pub.lang('联系客服') }}</el-button>
							</template>
							<div class="text-center">
								<el-image style="width:118px" :src="wechat" />
								<div>{{ pub.lang('微信扫码') }}</div>
							</div>
						</el-popover>
						<div>
							<el-button @click="cancel">{{ pub.lang('取消') }}</el-button>
							<el-button type="primary" @click="retry">{{ pub.lang('重试') }}</el-button>
						</div>
					</div>
				</template>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePanelBase } from '@store/panel'
import { pub, copyText } from '@utils/tools'
import { save_panel } from '@views/panel/controller'
import wechat from '@/assets/images/wechat-all.png'

const { installLogVisible,installParams, resultsVisible, resultsParams } = storeToRefs(usePanelBase())
const formattedContent = computed(() => {
	let content = JSON.stringify(resultsParams.value.content)
	// 删除最后一个\r\n
	const lastIndex = content.lastIndexOf('\\r\\n')
	if (lastIndex !== -1) {
		content = content.substring(0, lastIndex)
	}
	// 替换换行符、去除首尾引号
	return content.replace(/\\r\\n/g, '<br>').replace(/^"|"$/g, '')
})
// 复制并保存
function save() {
	copyText({value:resultsParams.value.content})
	if (installParams.value) {
		save_panel(installParams.value.host, resultsParams.value.content)
	}
}
// 重试
function retry() {
	resultsVisible.value = false
	installLogVisible.value = true
}
// 关闭
function cancel() {
	resultsVisible.value = false
}
</script>

<style lang="css" scoped>
/* 调整滚动条样式 */
.log-box::-webkit-scrollbar-thumb {
	background: #919191;
}
</style>
