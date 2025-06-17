<template>
	<div class="panel px-[3.6rem] pt-[2.4rem]">
		<template v-if="isShow">
			<div class="panel__header flex justify-between mb-[2.4rem]">
				<div class="btn flex items-center">
					<el-button type="primary" size="large" @click="addPanel">{{
						pub.lang('添加面板')
					}}</el-button>
					<el-button size="large" @click="importPanel">{{ pub.lang('导入') }}</el-button>
					<el-button size="large" @click="exportPanel">{{ pub.lang('导出') }}</el-button>
				</div>
				<div class="flex items-center">
					<el-switch
						v-model="isShowIP"
						size="large"
						inline-prompt
						:active-text="pub.lang('隐藏IP')"
						:inactive-text="pub.lang('显示IP')"
						:active-action-icon="Hide"
						:inactive-action-icon="View"
						@change="isShowIP = !!isShowIP" />
					<el-divider direction="vertical"></el-divider>
					<div class="flex">
						<el-radio-group :model-value="currentGroupID" @input="switchGroup" size="large">
							<el-radio-button
								v-for="item in groupList"
								:label="item.group_name"
								:value="item.group_id" />
						</el-radio-group>
						<el-tooltip
							class="box-item"
							effect="dark"
							:content="pub.lang('管理分组')"
							:enterable="false"
							placement="bottom"
							><el-button
								size="large"
								:icon="Setting"
								class="ml-[.4rem]"
								@click="groupManageVisible = true"
						/></el-tooltip>
					</div>
					<el-divider direction="vertical"></el-divider>
					<el-button
						size="large"
						:icon="Refresh"
						class="mr-[.4rem]"
						@click="getPanelList()"></el-button>
					<div :class="['panel-search', { 'panel-search--active': isActive }]">
						<el-icon :size="24" class="mr-[1.6rem]">
							<svg width="24" height="24" viewBox="0 0 24 24" focusable="false" class="NMm5M">
								<path
									d="M20.49 19l-5.73-5.73C15.53 12.2 16 10.91 16 9.5A6.5 6.5 0 1 0 9.5 16c1.41 0 2.7-.47 3.77-1.24L19 20.49 20.49 19zM5 9.5C5 7.01 7.01 5 9.5 5S14 7.01 14 9.5 11.99 14 9.5 14 5 11.99 5 9.5z"></path>
							</svg>
						</el-icon>
						<el-input
							v-model="searchServic"
							:placeholder="pub.lang('搜索服务器IP/名称')"
							@keydown.enter="getPanelList()"
							@focus="isActive = true"
							@blur="isActive = false" />
					</div>
				</div>
			</div>
			<div class="panel__content">
				<el-scrollbar :height="mainHeight - 100">
					<el-row class="cardList w-full" :gutter="10">
						<el-col
							v-for="(item, index) in showListArray"
							:key="index"
  						v-memo="[item.panel_id, item.panelInfo.isError, item.current_disk]"
							:xs="24"
							:sm="12"
							:md="8"
							:lg="6"
							:xl="4"
							class="mb-[1rem]"
							@click="openPanelView(item, $event)">
							<el-card
								class="card-panel-item "
								:class="{ isError: item.panelInfo.isError, isNoOpen: !item.is_open }">
								<template #header>
									<!-- <div class="card-panel-header flex justify-between items-center w-full"> -->
									<div class="flex flex-1 flex-col pl-[.75rem] py-[.75rem]">
										<template v-if="isShowIP">
											<div class="flex items-center">
												<span class="truncate max-w-[200px]">{{ item.title }}</span>
												<span
													class="ml-2 text-[.8rem] py-[.2rem] px-[.4rem] rounded-[4px] flex-shrink-0"
													:class="[authType[item.ov].text, authType[item.ov].bg]"
													>{{ authType[item.ov].name }}</span
												>
											</div>
											<div class="text-[.9rem] text-gray-500 tracking-1px">
												[{{ getUrlLink(item.url) }}]
											</div>
										</template>
										<template v-else>
											<!-- 兼容标题是IP的情况 -->
											<span v-show="!checkIp(item.title)" class="truncate max-w-[200px]">{{ item.title }}</span>
										</template>
									</div>
									<el-dropdown class="align-right cursor-pointer" trigger="click">
										<el-button :icon="Setting" size="small" class="card-btn-style text-primary" />
										<template #dropdown>
											<el-dropdown-menu>
												<el-dropdown-item
													v-if="item.is_open"
													:disabled="item.panelInfo.isError"
													@click="openPanelView(item)"
													>{{ pub.lang('打开') }}</el-dropdown-item
												>
												<el-dropdown-item @click="editPanelInfo(item)">{{
													pub.lang('编辑')
												}}</el-dropdown-item>
												<el-dropdown-item @click="removePanel(item)">{{
													pub.lang('删除')
												}}</el-dropdown-item>
											</el-dropdown-menu>
										</template>
									</el-dropdown>
									<!-- </div> -->
								</template>
								<template v-if="!item.panelInfo.isError">
									<div class="card-content">
										<div class="rows">
											<span class="label">{{ pub.lang('负载') }}：</span>
											<span class="value">{{ createLoadInfo(item.panelInfo.load) }}</span>
										</div>
										<div class="rows">
											<span class="label">{{ pub.lang('网络') }}：</span>
											<span class="value">
												<span class="mr-4">
													<el-icon color="#F7B851" :size="14"><Top /></el-icon>
													{{ getByteUnit(item.panelInfo.up) }}
												</span>
												<span>
													<el-icon color="#52A9FF" :size="14"><Bottom /></el-icon>
													{{ getByteUnit(item.panelInfo.down) }}
												</span>
											</span>
										</div>
										<div class="rows">
											<span class="label">CPU：</span>
											<span class="value"
												>{{ pub.lang('{}核', item.panelInfo.cpu[1]) }} ({{
													item.panelInfo.cpu[0]
												}}%)</span
											>
											<el-progress
												:percentage="Number(item.panelInfo.cpu[0])"
												:show-text="false"
												status="success" />
										</div>
										<div class="rows">
											<span class="label">{{ pub.lang('内存') }}：</span>
											<span class="value"
												>{{ item.panelInfo.mem.memRealUsed }} / {{ item.panelInfo.mem.memTotal }}MB
												({{ createMemoryInfo(item.panelInfo.mem) }}%)</span
											>
											<el-progress
												:percentage="createMemoryInfo(item.panelInfo.mem)"
												:show-text="false"
												status="success" />
										</div>
									</div>
									<div class="rows">
										<span class="label">
											<div class="flex">
												<span>{{ pub.lang('磁盘') }}：</span>
												<el-select
													v-model="item.current_disk"
													size="small"
													class="flex-1 disk-card-select"
													@click.native.stop
													@change="onChangeDiskPath($event, item)"
													placeholder=" ">
													<el-option
														v-for="(items, index) in item.panelInfo.disk"
														:key="index"
														:label="diskTitle(items)"
														:value="items.path"
														class="disk-card-option" />
												</el-select>
											</div>
										</span>
										<span class="value">
											<el-progress
												:percentage="diskProgress(item, item.current_disk)"
												:show-text="false"
												status="success" />
										</span>
									</div>
								</template>
								<template v-else>
									<div class="h-[14rem]">
										<span v-if="item.panelInfo.isError" class="text-red-500"
											>{{ pub.lang('[离线]') }} {{ item.panelInfo.errorMsg }}</span
										>
									</div>
								</template>
							</el-card>
						</el-col>
					</el-row>
				</el-scrollbar>
			</div>
		</template>
		<template v-else>
			<div class="welcome flex flex-col items-center justify-center" :style="{ height: '600px' }">
				<el-image :src="White" class="w-[20rem] h-[20rem]" />
				<span class="text-[1.6rem] my-4">{{ pub.lang('欢迎来到面板管理系统') }}</span>
				<div>
					<el-button type="primary" @click="addPanel">{{ pub.lang('点击添加面板') }}</el-button>
					<el-button @click="importPanel">{{ pub.lang('导入文件') }}</el-button>
				</div>
			</div>
		</template>

		<!-- 添加、编辑面板 -->
		<addPanelDialog @refresh="getPanelList" />
		<!-- 分组管理 -->
		<groupManageDialog @refresh="getPanelList" />
		<!-- 创建、编辑分组-->
		<AddGroup @refresh="getPanelList" />
		<!-- 安装并绑定-进度 -->
		<installLog @refresh="getPanelList" />
		<!-- 安装并绑定-结果 -->
		<installResults />
	</div>
</template>

<script setup lang="ts">
defineOptions({
	name: 'Home',
})
import { usePanelBase } from '@store/panel'
import { Setting, Refresh,Hide, View } from '@element-plus/icons-vue'
import { useSettingStore } from '@store/setting'
import { ElMessageBox } from 'element-plus'
import { useMessage } from '@utils/hooks/message'
import { useRouter } from 'vue-router'
import addPanelDialog from './components/AddPanel/index.vue'
import groupManageDialog from './components/GroupManage/index.vue'
import installLog from './components/AddPanel/installLog.vue'
import installResults from './components/AddPanel/installResults.vue'
import AddGroup from '@views/panel/components/AddGroup/index.vue'
import White from '@/assets/images/logo-white.svg'
import { pub, getByteUnit } from '@utils/tools'
import { record_disk, type Panel_Params } from './controller'
import { checkIp } from '@utils/is'

import { common, routes, ipc } from '@api/http'

const router = useRouter()
const Message = useMessage() // 消息提示

const useStore = useSettingStore()
const { mainHeight } = storeToRefs(useStore)

const {
	isShowIP,
	groupList,
	groupManageVisible,
	currentGroupID,
	addPanelVisible,
	isEdit,
	panelParams,
} = storeToRefs(usePanelBase())

const isActive = ref(false)
const searchServic = ref('')
const firstLoad = ref(true)
const allPanelList = ref([]) as any

const authType = [
	{ name: pub.lang('免费版'), bg: 'bg-[#e7e7e7]', text: 'text-[#909399]' },
	{ name: pub.lang('专业版'), bg: 'bg-[#fbe239]', text: 'text-[#b68115]' },
	{ name: pub.lang('企业版'), bg: 'bg-[#474745]', text: 'text-[#d1ad68]' },
	{ name: pub.lang('获取中'), bg: 'bg-[#e7e7e7]', text: 'text-[#909399]' },
]
const diskTitle = computed(() => (item: any) => {
	return `[${item.path}] ${item.size[1]} / ${item.size[0]} (${item.size[3]})`
})
const diskProgress = (item: any, path: string) => {
	if (item.isError || typeof item.panelInfo.disk === 'undefined') return 0
	let diskSize = item.panelInfo.disk.find((items: any) => items.path === path)
	if (typeof diskSize === 'undefined') return 0
	return Number(diskSize.size[3].replace('%', ''))
}

const isShow = computed(() => {
	let status = true
	if (allPanelList.value.length > 0 || searchServic.value !== '') {
		status = true
	} else if (allPanelList.value.length === 0 && currentGroupID.value === -1 && isRquest.value) {
		status = false
	}
	return status
})

// Computed property for showListArray
const showListArray = computed(() => {
	if (searchServic.value !== '') {
		return allPanelList.value.filter(
			(item: any) =>
				item.title.includes(searchServic.value) || item.url.includes(searchServic.value)
		)
	}
	return allPanelList.value
})

// 获取链接
const getUrlLink = (url: string) => {
	if (!url) return ''
	// 过滤https/ http,返回剩余部分
	const reg = /(http|https):\/\/([\w.]+\/?)\S*/
	return url.replace(reg, '$2')
}
// 设置磁盘路径
const onChangeDiskPath = (val: any, item: any) => {
	record_disk({ panel_id: item.panel_id, disk_path: val })
}

// 添加面板
const addPanel = () => {
	isEdit.value = false
	addPanelVisible.value = true
}

// 编辑面板
const editPanelInfo = (item: Panel_Params) => {
	panelParams.value = Object.assign({},{
		title: item.title,
		panel_id: item.panel_id,
		auth_type: item.auth_type,
		url: item.url,
		group_id: item.group_id,
		proxy_id: item.proxy_id || -1,
		api_token:''
	},{
		token: item.auth_type !== 1 ? item.api_token : '',
	})
	isEdit.value = true
	addPanelVisible.value = true
}
// 打开面板
const openPanelView = (item: any, ev?: any) => {
	if (ev) {
		const targetName = ev.target.localName
		const isButtonOrIcon = targetName === 'button' || targetName === 'path' || targetName === 'svg'

		if (!item.is_open || item.panelInfo.isError) {
			if (!isButtonOrIcon) {
				if (item.panelInfo.isError) {
					Message.error(pub.lang('无法连接到面板，请检查网络或服务状态'))
				}
			}
			return
		}

		if (isButtonOrIcon) {
			return
		}
	}
	router.push({
		name: 'details',
		params: { id: item.panel_id,key:new Date().getTime() },
	})
}
// 删除面板
const removePanel = (item: any) => {
	ElMessageBox.confirm(pub.lang('是否将【{}】从列表中删除?', item.title), pub.lang('删除面板'), {
		confirmButtonText: pub.lang('确认'),
		cancelButtonText: pub.lang('取消'),
		type: 'warning',
	}).then(() => {
		common.send(routes.panel.remove.path, { panel_id: item.panel_id }, (res: any) => {
			if (res.status) {
				getPanelList()
			}
		})
	})
}
const isRquest = ref(false)
const getPanelList = async (Gid?: number) => {
	isRquest.value = false
	try {
		if (Gid === currentGroupID.value) currentGroupID.value = -1 //当前分组被删除恢复至全部
		const res: any = await common.sendAsync({
			route: routes.panel.list.path,
			data: { limit: 9999, group_id: currentGroupID.value },
		})
		allPanelList.value = res.data.data.map((item: any) => {
			// Initialize with default panelInfo structure
			let defaultPanelInfo = {
				load: { one: 0, five: 0, fifteen: 0 },
				cpu: [0, 0, 0, 0, 0, 0],
				mem: { memRealUsed: 0, memTotal: 0 },
				up: 0,
				down: 0,
				isError: false,
				errorMsg: '',
			};

			// If status is 1, it means connection error, so set isError to true and add error message
			if (item.status === 1) {
				item.panelInfo = { ...defaultPanelInfo, isError: true, errorMsg: pub.lang('连接失败：') };
			} else {
				// Try to preserve existing live panelInfo if available and not in an error state
				const existingPanel = allPanelList.value.find((panel: any) => panel.panel_id === item.panel_id);
				if (existingPanel && !existingPanel.panelInfo.isError) {
					item.panelInfo = existingPanel.panelInfo;
				} else {
					// Otherwise, initialize with default values
					item.panelInfo = defaultPanelInfo;
				}
			}

			item.ov = cutAuthStatus(item.ov)
			return item
		})
		groupList.value = res.data.groups
		if (firstLoad.value) {
			firstLoad.value = false
		}
	} finally {
		isRquest.value = true
	}
}
// 授权状态异常处理
const cutAuthStatus = (val: any) => {
	// 数字类型
	if (typeof val === 'number') {
		if (val === -1) return 3
		return val
	} else {
		if(val === null) getPanelList()  //检测到存在null，刷新当前列表
		return 3
	}
}
// 切换分组
const switchGroup = (val: any) => {
	currentGroupID.value = val.target._value
	getPanelList()
}
// 负载状态
const updateBuffer = new Map(); // 用于暂存面板更新的 Map
let updateTimer: ReturnType<typeof setTimeout> | null = null; // 去抖动计时器
const UPDATE_DEBOUNCE_TIME = 100; // 去抖动时间，单位毫秒

// 新增用于分批处理的队列和标志
const processingQueue: Array<any> = []; // 用于分批处理的队列
let animationFrameRequested = false; // 标记是否已请求下一帧动画
const BATCH_SIZE = 10; // 每次处理的面板数量

const processUpdatesInBatches = () => {
    if (processingQueue.length === 0) {
        animationFrameRequested = false; // 没有更多更新需要处理，重置标志
        return;
    }

    // 每次处理一小批更新
    const updatesToProcess = processingQueue.splice(0, BATCH_SIZE);

    updatesToProcess.forEach((bufferedResult) => {
        // 找到对应的面板并更新其信息
        const item = allPanelList.value.find((panel: any) => panel.panel_id === bufferedResult.panel_id);
        if (item) {
            item.panelInfo = bufferedResult.data.msg
                ? Object.assign({}, { isError: true, errorMsg: bufferedResult.data.msg })
                : bufferedResult.data;
            item.is_open = bufferedResult.is_open;
            if (item.current_disk === '' && typeof bufferedResult.data.msg === 'undefined') {
                item.current_disk = bufferedResult.data.disk[0].path;
            }
            if (bufferedResult.ov === -1 && typeof bufferedResult.data.msg === 'undefined') {
                item.ov = 0; // 获取授权异常且数据库中没有授权状态
            } else {
                item.ov = cutAuthStatus(bufferedResult.ov);
            }
            // 如果服务器名等于url则更新列表信息(ps:后端接口已处理)
            const urlMatch = item.url.match(/\/\/(.*?):/);
            if (urlMatch && urlMatch[1] && item.title === urlMatch[1] && typeof item.panelInfo.isError === 'undefined') {
                item.title = bufferedResult.data.title;
            }
            if (item.ov > 0) item.is_open = true;
        }
    });

    // 如果队列中还有剩余项，请求下一帧动画继续处理
    if (processingQueue.length > 0) {
        requestAnimationFrame(processUpdatesInBatches);
    } else {
        animationFrameRequested = false; // 所有更新处理完毕
    }
};

const loadStatusSync = () => {
	const any_channel = 'panel_loads_recv'
	ipc.on(any_channel, (event: any, result: any) => {
		// console.log(111); // 移除调试日志
		// 存储最新的结果到缓冲区，如果同一 panel_id 有多个更新，只保留最新的
		updateBuffer.set(result.panel_id, result);

		// 清除任何现有的计时器
		if (updateTimer) {
			clearTimeout(updateTimer);
		}

		// 设置一个新的计时器，在短时间延迟后处理更新
		updateTimer = setTimeout(() => {
			// 将所有缓冲的更新移动到处理队列
			updateBuffer.forEach((bufferedResult) => {
				processingQueue.push(bufferedResult);
			});
			updateBuffer.clear(); // 处理完成后清空缓冲区

			// 如果尚未请求动画帧，则请求一个并开始分批处理
			if (!animationFrameRequested) {
				animationFrameRequested = true;
				requestAnimationFrame(processUpdatesInBatches);
			}
			updateTimer = null; // 重置计时器
		}, UPDATE_DEBOUNCE_TIME);
	});
	let pdata = { any_channel: any_channel }
	common.send(routes.panel.start_load.path, pdata, (result: any) => {})
}
/**
 * @description 生成负载加载参数
 * @param  load 负载数据
 * @returns void
 */
const createLoadInfo = (load: any) => {
	const { one, five, fifteen } = load
	return `${one.toFixed(2)} / ${five.toFixed(2)} / ${fifteen.toFixed(2)}`
}

/**
 * @description 生成内存参数
 * @returns void
 */
const createMemoryInfo = (memory: any) => {
	const { memRealUsed, memTotal } = memory
	if (memTotal === 0) return 0
	return Math.round((memRealUsed / memTotal) * 1000) / 10
}

// 导出面板
const exportPanel = () => {
	common.send(routes.panel.export.path, {}, (res: any) => {
		Message.request(res)
	})
}
// 导入面板
const importPanel = () => {
	common.send(routes.panel.import.path, {}, (res: any) => {
		Message.request(res)
		if (res.status) {
			getPanelList()
		}
	})
}

// 初始化
onMounted(() => {
	getPanelList()
	// 监听请求负载状态
	loadStatusSync()
})
onUnmounted(() => {
	// 关闭负载状态
	common.send(routes.panel.stop_load.path, {}, (result: any) => {})
	// 关闭事件
	ipc.removeAllListeners('panel_loads_recv')
})
</script>
<style lang="scss" scoped>
:deep(.el-card) {
	cursor: pointer;
	border-radius: 10px;
	.el-card__header {
		background-color: #fcfcfd;
		// font-weight: 500;
		color: #000;
		border-top-left-radius: 10px;
		border-top-right-radius: 10px;
	}
	.el-card__body {
		padding: 0.5rem 1.2rem 1.2rem;
		.rows {
			line-height: 2;
		}
	}
}
:deep(.el-progress.is-success) {
	.el-progress-bar__inner {
		background-color: #20a53a !important;
	}
}
.welcome {
	text-align: center;
	color: #bdbdbd;
}
.panel-search {
	background-color: #f2f2f2;
	border-radius: 8px;
	display: flex;
	align-items: center;
	padding-left: 1rem;
	:deep(.el-input) {
		width: 31.8rem;
		height: 4.4rem;
		.el-input__wrapper {
			background-color: #f2f2f2;
			padding-left: 0;
			padding-right: 0;
			box-shadow: 0 0 0 0px var(--el-input-border-color, var(--el-border-color)) inset;
			input {
				font-size: 1.6rem;
				&::placeholder {
					color: #000;
					font-weight: 500;
				}
			}
		}
	}
	&--active {
		background-color: white;
		box-shadow:
			rgba(65, 69, 73, 0.3) 0 1px 1px 0,
			rgba(65, 69, 73, 0.15) 0 1px 3px 1px;
		:deep(.el-input) {
			.el-input__wrapper {
				background-color: white;
			}
		}
	}
}
.panel__content {
	.el-scrollbar {
		:deep(.el-scrollbar__wrap) {
			overflow-x: hidden;
		}
	}
	.el-row {
		padding: 5px;
	}
}
.card-panel-item {
	box-shadow: rgba(0, 0, 0, 0.08) 0px 2px 12px;
	// transition: all 0.3s ease;
	// &:hover {
	// 	transform: translateY(-5px);
	// 	box-shadow: rgba(0, 0, 0, 0.12) 0px 8px 24px;
	// }
	&.isNoOpen {
		opacity: 0.5;
	}
	&.isError {
		background: #fcf1ef;
		cursor: not-allowed !important;
		box-shadow:
			rgba(252, 241, 239, 0.3) 0 1px 2px 0,
			rgba(252, 241, 239, 0.15) 0 2px 6px 2px;
		:deep(.el-card__header) {
			background-color: #fcf1ef;
		}
		:deep(.el-progress-bar__outer) {
			background-color: #fde8e8;
		}
	}
	:deep(.disk-card-select) {
		.el-select__wrapper {
			padding: 0;
			height: 1rem;
			font-size: 1.2rem;
			box-shadow: none;
			.el-input__inner {
				padding: 0;
			}
		}
	}
	.card-btn-style{
		font-size: 1.6rem;
	}
}
.disk-card-option {
	height: 2rem;
	line-height: 2rem;
	font-size: 1.2rem;
	padding: 0 10px 0 10px;
}
</style>
