<template>
	<el-dialog
		v-model="dialogVisible"
		align-center
		class="bt-dialog"
		width="440"
		:show-close="false"
		draggable
		:close-on-click-modal="false">
		<template #header>
			<div>
				<span
					class="text-1.4rem leading-[1.8rem] text-grey-333 truncate"
					v-html="pub.lang('权限')"></span>
				<div
					@click="dialogVisible = false"
					class="absolute -top-1.5rem -right-1.5rem z-99999 w-[3rem] h-3rem rounded-1/2 cursor-pointer">
					<div class="absolute w-[3rem] h-3rem top-0 left-0 origin-center close-popup-btn"></div>
				</div>
			</div>
		</template>
		<div class="overflow-hidden p-[16px]">
			<div class="flex justify-around ml-[-1rem]">
				<fieldset class="p-4x">
					<legend>{{ pub.lang('所有者') }}</legend>
					<el-checkbox-group
						class="flex flex-col"
						style="gap: 4px"
						v-model="checkList.owner"
						@change="reversePermission">
						<el-checkbox class="ml-[1rem]" label="r"> {{ pub.lang('读取') }}</el-checkbox>
						<el-checkbox class="ml-[1rem]" label="w">{{ pub.lang('写入') }}</el-checkbox>
						<el-checkbox class="ml-[1rem]" label="x">{{ pub.lang('执行') }}</el-checkbox>
					</el-checkbox-group>
				</fieldset>
				<fieldset class="p-4x">
					<legend>{{ pub.lang('用户组') }}</legend>
					<el-checkbox-group
						class="flex flex-col"
						style="gap: 4px"
						v-model="checkList.group"
						@change="reversePermission">
						<el-checkbox class="ml-[1rem]" label="r">{{ pub.lang('读取') }}</el-checkbox>
						<el-checkbox class="ml-[1rem]" label="w">{{ pub.lang('写入') }}</el-checkbox>
						<el-checkbox class="ml-[1rem]" label="x">{{ pub.lang('执行') }}</el-checkbox>
					</el-checkbox-group>
				</fieldset>
				<fieldset class="p-4x">
					<legend>{{ pub.lang('公共') }}</legend>
					<el-checkbox-group
						class="flex flex-col"
						v-model="checkList.public"
						style="gap: 4px"
						@change="reversePermission">
						<el-checkbox class="ml-[1rem]" label="r">{{ pub.lang('读取') }}</el-checkbox>
						<el-checkbox class="ml-[1rem]" label="w">{{ pub.lang('写入') }}</el-checkbox>
						<el-checkbox class="ml-[1rem]" label="x">{{ pub.lang('执行') }}</el-checkbox>
					</el-checkbox-group>
				</fieldset>
			</div>
			<div class="flex items-center ml-[.4rem]">
				<el-input
					style="width: 100px"
					v-model="checkList.auth"
					@input="checkNumber"
					type="number"
					min="0"
					max="777"
					oninput="if(value){value=value.replace(/[^\d]/g,'')} if(value<=0){value=0} if(value>777){value=777}" />
				<div class="mx-[1rem]">{{ pub.lang('权限，所有者') }}</div>
				<el-select v-model="checkList.user" style="width: 10rem" :change="changeUser">
					<el-option
						v-for="item in ownerOptions"
						:key="item.key"
						:label="item.title"
						:value="item.key"></el-option>
				</el-select>
			</div>
			<!-- <el-checkbox class="ml-[1rem]" v-model="checkList.isDir">{{pub.lang('应用到子目录</el-checkbox> -->
		</div>
		<template #footer>
			<div class="dialog-footer">
				<el-button @click="dialogVisible = false">{{ pub.lang('取消') }}</el-button>
				<el-button type="primary" @click="setFileAuths">
					{{ pub.lang('保存') }}
				</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { useMessage } from '@utils/hooks/message'
import { common, routes } from '@/api/http'
import { pub } from '@/utils/tools'

const emit = defineEmits(['refresh'])

const Message = useMessage() // 消息提示
const dialogVisible = ref(false)
let data = {} as any

// 权限列表
const checkList = reactive({
	owner: [] as string[],
	group: [] as string[],
	public: [] as string[],
	auth: 0 as number | string,
	user: 'root',
	isDir: true,
	checkNumber: '',
})

/**
 * @description 判断权限
 * @param val 权限值
 */
const parsePermission = (permissionValue: number): void => {
	permissionValue = parseInt(permissionValue.toString(), 8)
	if (permissionValue & 0o400) {
		checkList.owner.push('r')
	} else {
		checkList.owner = checkList.owner.filter(item => item !== 'r')
	}
	if (permissionValue & 0o200) {
		checkList.owner.push('w')
	} else {
		checkList.owner = checkList.owner.filter(item => item !== 'w')
	}
	if (permissionValue & 0o100) {
		checkList.owner.push('x')
	} else {
		checkList.owner = checkList.owner.filter(item => item !== 'x')
	}
	if (permissionValue & 0o040) {
		checkList.group.push('r')
	} else {
		checkList.group = checkList.group.filter(item => item !== 'r')
	}
	if (permissionValue & 0o020) {
		checkList.group.push('w')
	} else {
		checkList.group = checkList.group.filter(item => item !== 'w')
	}
	if (permissionValue & 0o010) {
		checkList.group.push('x')
	} else {
		checkList.group = checkList.group.filter(item => item !== 'x')
	}
	if (permissionValue & 0o004) {
		checkList.public.push('r')
	} else {
		checkList.public = checkList.public.filter(item => item !== 'r')
	}
	if (permissionValue & 0o002) {
		checkList.public.push('w')
	} else {
		checkList.public = checkList.public.filter(item => item !== 'w')
	}
	if (permissionValue & 0o001) {
		checkList.public.push('x')
	} else {
		checkList.public = checkList.public.filter(item => item !== 'x')
	}
	// 去重
	checkList.owner = Array.from(new Set(checkList.owner))
	checkList.group = Array.from(new Set(checkList.group))
	checkList.public = Array.from(new Set(checkList.public))
}

// 权限选项
const reversePermission = (): void => {
	let permissionValue = 0
	let auth: any = 0
	// Helper function to set permission based on array values
	const setPermission = (
		array: string[],
		readBit: number,
		writeBit: number,
		executeBit: number
	) => {
		if (array.includes(`r`)) {
			permissionValue |= readBit
		}
		if (array.includes(`w`)) {
			permissionValue |= writeBit
		}
		if (array.includes(`x`)) {
			permissionValue |= executeBit
		}
	}

	// Set owner permissions
	setPermission(checkList.owner, 0o400, 0o200, 0o100)

	// Set group permissions
	setPermission(checkList.group, 0o040, 0o020, 0o010)

	// Set public permissions
	setPermission(checkList.public, 0o004, 0o002, 0o001)

	checkList.auth = permissionValue.toString(8)
	while (checkList.auth.length < 3) {
		checkList.auth = '0' + checkList.auth
	}
}

//去除非数字输入
const checkNumber = (val: any) => {
	checkList.checkNumber = val
	const reVal = String(val).replace(/[^\d]/g, '').slice(0, 3)
	checkList.auth = reVal

	parsePermission(Number(checkList.auth))
}
interface OwnerOptions {
	key: string
	title: string
}

// 所有者选项
const ownerOptions = ref<OwnerOptions[]>([])
const onwerList = ref([])

/**
 * @description 用户改变
 * @param {string} val 用户名
 */
const changeUser = (val: string) => {
	checkList.user = val
}

// 设置文件权限
const setFileAuths = async (close?: any) => {
	let auth = checkList.auth.toString()
	// 验证权限输入
	if (auth.length > 3) {
		Message.error('请输入正确权限')
		return
	}
	// 判断是否有非数字
	if (checkList.checkNumber.match(/\D/g)) {
		Message.error('请输入正确权限')
		return
	}

	// 如果包含了非数字就提示
	if (auth.match(/\D/g)) {
		Message.error('请输入正确权限')
		return
	}

	// 如果不够3位数就在前面补0
	while (auth.length < 3) {
		auth = '0' + auth
	}
	const { ssh_id, path } = data
	const idFind: any = onwerList.value.find((item: any) => item.gid === checkList.user)
	common.send(
		routes.files.chmod.path,
		{ ssh_id, filename: path, mode: auth, uid: idFind.uid, gid: idFind.gid },
		(res: any) => {
			Message.success(res)
			if (res.status) {
				emit('refresh')
			}
		}
	)
}

// 获取用户组
const getUserGroup = () => {
	common.send(routes.files.get_user_group.path, { ssh_id: data.ssh_id }, (res: any) => {
		onwerList.value = res.data
		ownerOptions.value = res.data.map((item: any) => {
			return {
				key: item.uid,
				title: item.name,
			}
		})
	})
}
const acceptParams = (params: any) => {
	data = toRaw(params)
	checkList.auth = params.mode
	checkList.user = params.gid
	parsePermission(Number(params.mode))
	getUserGroup()
	dialogVisible.value = true
}

defineExpose({
	acceptParams,
})
</script>
<style lang="sass" scoped>
fieldset
	@apply ml-[1.5rem] mb-[1.5rem] border border-[#ccc] float-left pb-[1rem] rounded-[.3rem] w-[25%]
	legend
		@apply p-[.3rem] mx-[.6rem] text-[1.4rem]
</style>
