<template>
	<div
		class="px-4 py-2 w-[20rem] overflow-auto no-scrollbar"
		:style="{ height: mainHeight + 'px' }">
		<template v-if="isExistTerminal">
			<div class="flex justify-between mb-[.8rem]">
				<span class="text-[1.4rem] font-bold">{{ pub.lang('监控') }}</span>
			</div>
			<div>
				<el-card>
					<div class="flex items-center">
						<bt-icon name="address" color="1f1f1f" size="14" />
						<span>{{ info.basics.ip }}</span>
						<el-icon size="12" color="#0B57D0" class="cursor-pointer ml-2" @click="copyIp"
							><CopyDocument
						/></el-icon>
					</div>
					<div>{{ info.basics.system }}</div>
					<span>{{ pub.lang('持续运行') }}：{{ pub.lang('{}天', info.basics.run) }}</span>
					<div>{{ pub.lang('负载') }}：{{ info.basics.load }}</div>
					<div class="flex items-center">
						{{ pub.lang('进程数') }}：{{ info.basics.processTotal }}<span class="w-4"></span
						>{{ pub.lang('活跃') }}：{{ info.basics.processRunning }}
					</div>
				</el-card>
				<el-card>
					<div class="flex items-center">
						<h3>CPU</h3>
						<span class="text-[1.4rem] ml-4">{{ pub.lang('{}核', info.cpu.core) }}</span>
					</div>
					<el-divider class="!mt-4 !mb-4" />
					<el-progress :percentage="info.cpu.progress" />
					<div>{{ info.cpu.model }}</div>
				</el-card>

				<el-card>
					<div class="flex items-center">
						<h3>{{ pub.lang('内存') }}</h3>
						<span class="text-[1.4rem] ml-4">{{ info.mem.used }}/{{ info.mem.total }}(MB)</span>
					</div>
					<el-divider class="!mt-4 !mb-4" />

					<el-progress :percentage="info.mem.progress" />
					<div>SWAP：{{ info.mem.swap }}</div>
				</el-card>
				<el-card>
					<div>
						<h3>{{ pub.lang('网络IO') }}</h3>
					</div>
					<el-divider class="!mt-4 !mb-4" />
					<table>
						<tr>
							<td width="10"></td>
							<td width="60">{{ pub.lang('速度') }}</td>
							<td>{{ pub.lang('已用流量') }}</td>
						</tr>
						<tr>
							<td>
								<el-icon color="#F7B851" :size="12"><Top /></el-icon>
							</td>

							<td>{{ byteUnit(info.net.sec_recv_bytes) }}</td>
							<td>{{ byteUnit(info.net.recv_bytes) }}</td>
						</tr>
						<tr>
							<td>
								<el-icon color="#52A9FF" :size="12"><Bottom /></el-icon>
							</td>
							<td>{{ byteUnit(info.net.sec_send_bytes) }}</td>
							<td>{{ byteUnit(info.net.send_bytes) }}</td>
						</tr>
					</table>
				</el-card>
				<el-card>
					<div>
						<h3>{{ pub.lang('磁盘IO') }}</h3>
					</div>
					<el-divider class="!mt-4 !mb-4" />
					<div class="flex">
						<div class="w-[9rem]">
							<div>{{ pub.lang('读') }}：{{ byteUnit(info.disk.sec_read_bytes) }}</div>
							<div>{{ pub.lang('写') }}：{{ byteUnit(info.disk.sec_write_bytes) }}</div>
						</div>
						<el-divider direction="vertical" class="!h-[5rem] !m-1 !mr-2" />
						<div class="flex">
							<div class="w-[4rem]">
								<div>{{ pub.lang('延迟') }}</div>
								<div>{{ info.disk.io_latency }}ms</div>
							</div>
							<div>
								<div>{{ pub.lang('iops') }}</div>
								<div>{{ info.disk.iops }}</div>
							</div>
						</div>
					</div>
				</el-card>
			</div>
		</template>
		<template v-else>
			<el-empty :image-size="80" :description="pub.lang('请先打开一个终端')" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { useSettingStore } from '@store/setting'
import { CopyDocument } from '@element-plus/icons-vue'
import { byteUnit, pub, copyText } from '@utils/tools'

import { common, routes, ipc } from '@api/http'

const useStore = useSettingStore()
const { mainHeight } = storeToRefs(useStore)
const props = defineProps({
	data: {
		type: Object,
		default: () => ({}),
	},
})
const info = reactive({
	basics: {
		ip: '',
		run: 0,
		system: '',
		load: '',
		processTotal: 0,
		processRunning: 0,
	},
	cpu: {
		core: 0,
		progress: 0,
		model: '',
	},
	mem: {
		total: '',
		used: '',
		progress: 0,
		swap: '',
	},
	net: {
		sec_send_bytes: 0,
		sec_recv_bytes: 0,
		send_bytes: 0,
		recv_bytes: 0,
	},
	disk: {
		sec_read_bytes: 0,
		sec_write_bytes: 0,
		io_latency: 0,
		iops: 0,
		cc: 0,
	},
})
const getXtermLoad = () => {
	common.send(
		routes.term.get_load.path,
		{ ssh_id: toRaw(props.data.hostInfo.ssh_id) },
		(res: any) => {
			renderData(res.data)
		}
	)
}
// 数据处理
const renderData = (data: any) => {
	const { cpu_ionfo, diskio, load_avg, meminfo, network, os_info } = data
	const { one, five, fifteen, process } = load_avg
	info.basics.ip = props.data.hostInfo.host
	info.basics.run = data.boot_time
	info.basics.system = os_info.release
	info.basics.load = `${one.toFixed(2)} / ${five.toFixed(2)} / ${fifteen.toFixed(2)}`
	info.basics.processTotal = process.total
	info.basics.processRunning = process.running
	info.cpu.core = cpu_ionfo.cores
	info.cpu.progress = Number(cpu_ionfo.percent)
	info.cpu.model = cpu_ionfo.model
	info.mem.total = byteUnit(meminfo.total, false, 0, 'MB')
	info.mem.used = byteUnit(meminfo.available.used, false, 0, 'MB')
	info.mem.progress = Number(meminfo.available.percent)
	info.mem.swap =
		byteUnit(meminfo.swap.swap_used, false, 0, 'MB') +
		' / ' +
		byteUnit(meminfo.swap.swap_total, false, 0, 'MB') +
		'(MB)'
	info.net.sec_send_bytes = network.sec_send_bytes
	info.net.sec_recv_bytes = network.sec_recv_bytes
	info.net.send_bytes = network.send_bytes
	info.net.recv_bytes = network.recv_bytes
	info.disk.sec_read_bytes = diskio.sec_read_bytes
	info.disk.sec_write_bytes = diskio.sec_write_bytes
	info.disk.io_latency = diskio.io_latency
	info.disk.iops = diskio.iops
}
const copyIp = () => {
	copyText({ value: info.basics.ip })
}
// 是否存在开启的终端
const isExistTerminal = ref(false)
// 监听激活状态
watch(
	() => props.data,
	val => {
		isExistTerminal.value = false
		if (Object.keys(val).length === 0) return
		isExistTerminal.value = true
		getXtermLoad()
	},
	{ immediate: true }
)
// 监控负载监听
watch(
	() => isExistTerminal.value,
	val => {
		if (val) {
			ipc.on('ssh_get_load', (event: any, result: any) => {
				renderData(result)
			})
		} else {
			ipc.removeAllListeners('ssh_get_load')
		}
	}
)
</script>

<style lang="scss" scoped>
:deep(.el-card) {
	margin-bottom: 1rem;
	box-shadow: rgba(0, 0, 0, 0.25) 1px 1px 4px 0;
	.el-card__body {
		padding: 0.6rem;
		line-height: 26px;
		.el-progress {
			.el-progress__text span {
				font-size: 1rem;
			}
		}
	}
}

h3 {
	font-size: 1.4rem;
	margin: 0;
}
.memEchart {
	margin-bottom: 1.2rem;
	div {
		height: 1.4rem;
		border-radius: 10px;
		&:nth-child(1) {
			background-color: #0b57d0;
			margin-right: 0.6rem;
		}
		&:nth-child(2) {
			background-color: #ffeb39;
		}
		&:nth-child(3) {
			background-color: #7fe47e;
			margin-left: 0.6rem;
		}
	}
}
.memDetails {
	span {
		width: 5.4rem;
		i {
			width: 0.6rem;
			height: 0.6rem;
			border-radius: 50%;
			display: inline-block;
			margin-right: 0.4rem;
		}
		&:nth-child(1) {
			i {
				background-color: #0b57d0;
			}
		}
		&:nth-child(2) {
			i {
				background-color: #ffeb39;
			}
		}
		&:nth-child(3) {
			i {
				background-color: #7fe47e;
			}
		}
	}
}
.text123 {
	color: var(--ceshi-color);
}
</style>
