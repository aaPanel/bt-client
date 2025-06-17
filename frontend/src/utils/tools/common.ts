import { useClipboard } from '@vueuse/core'
import { useMessage } from '@utils/hooks/message'
import md5 from 'md5'
import { isDate, isNumber, isString } from '../is'

const Message = useMessage() // 消息提示
/**
 * @description 字节转换，到指定单位结束【面板接口格式单位】
 * @param { number } bytes 字节数
 * @param { boolean } isUnit 是否显示单位
 * @param { number } fixed 小数点位置
 * @param { string } endUnit 结束单位
 * @returns { string }
 */
export const getByteUnit = (
	bytes: number = 0,
	isUnit: boolean = true,
	fixed: number = 2,
	endUnit: string = ''
): string => {
	let newBytes = bytes
	const c = 1024
	const units = [' KB', ' MB', ' GB', 'TB']
	for (let i = 0; i < units.length; i++) {
		const unit = units[i]
		const showValue = fixed === 0 ? Math.round(newBytes) : newBytes.toFixed(fixed)
		const result = i === 0 ? newBytes : showValue
		if (endUnit) {
			if (unit.trim() === endUnit.trim()) {
				return isUnit ? result + unit : `${result}`
			}
		} else if (newBytes < c) {
			return isUnit ? result + unit : `${result}`
		}
		newBytes /= c
	}
	return ''
}
/**
 * @description 字节转换，到指定单位结束【多级管理的格式单位】
 * @param { number } bytes 字节数
 * @param { boolean } isUnit 是否显示单位
 * @param { number } fixed 小数点位置
 * @param { string } endUnit 结束单位
 * @returns { string }
 */
export const byteUnit = (
	bytes: number = 0,
	isUnit: boolean = true,
	fixed: number = 2,
	endUnit: string = ''
): string => {
	let newBytes = bytes
	const c = 1024
	const units = [' B', ' KB', ' MB', ' GB', 'TB']
	for (let i = 0; i < units.length; i++) {
		const unit = units[i]
		const showValue = fixed === 0 ? Math.round(newBytes) : newBytes.toFixed(fixed)
		const result = i === 0 ? newBytes : showValue
		if (endUnit) {
			if (unit.trim() === endUnit.trim()) {
				return isUnit ? result + unit : `${result}`
			}
		} else if (newBytes < c) {
			return isUnit ? result + unit : `${result}`
		}
		newBytes /= c
	}
	return ''
}
// 语言包
export const pub = {
	lang: (content: string, ...args: any) => {
		let hash = md5(content)

		// 尝试从语言包中获取内容
		let lang_content = content
		if (window.languageObject[hash]) {
			lang_content = window.languageObject[hash]
		}

		// 替换参数
		if (args.length > 0) {
			lang_content = lang_content.replace(/{}/g, function () {
				return args.shift()
			})
		}

		// 返回内容
		return lang_content
	},
}
/**
 * @description 复制文本
 * @param {Element} data.el dom元素
 * @param {string} data.text 复制的文本
 * @param {string | AnyFunction} data.success 成功回调 或 成功提示
 * @param {string | AnyFunction} data.error 失败回调 或 失败提示
 */
export const copyText = async ({
	value,
	success = pub.lang('复制成功'),
	error = pub.lang('复制失败'),
}: {
	value: string
	success?: string
	error?: string
}) => {
	const { copy, isSupported } = useClipboard({ legacy: true })
	if (isSupported.value) {
		copy(value)
		Message.success(success)
	} else {
		Message.error(error)
	}
}

export type Time = Date | number | string

const getDefaultDate = (time?: Time) => {
	let date = new Date()
	if (isDate(time)) date = time
	if (isString(time)) return date
	if (isNumber(time)) {
		time = Math.round(time)
		const str = time.toString()
		if (str.length === 13) date = new Date(time)
		if (str.length === 10) date = new Date(time * 1000)
	}
	return date
}

/**
 * @description 格式化时间格式
 * @param { Time } time 时间戳 / 时间 Date / 时间字符串
 * @param { string } format 时间格式,可为空
 * @returns { string } 格式化后的时间
 */
export const formatTime = (
	time?: Time,
	format: string = 'yyyy-MM-dd HH:mm:ss',
	isHover24: boolean = false
): string => {
	// 获取默认参数
	const date = getDefaultDate(time)
	// 日期映射
	const map = new Map([
		['y', `${date.getFullYear()}`], // 年份
		['M', `${date.getMonth() + 1}`], // 月份
		['d', `${date.getDate()}`], // 日
		['H', `${date.getHours()}`], // 小时 24
		['m', `${date.getMinutes()}`], // 分
		['s', `${date.getSeconds()}`], // 秒
		['q', `${Math.floor((date.getMonth() + 3) / 3)}`], // 季度
		['f', `${date.getMilliseconds()}`], // 毫秒
	])
	if (!isHover24) {
		// 小时 12
		const hour = Number(map.get('H'))
		if (hour > 12) {
			map.set('h', `${hour - 12}`)
		} else {
			map.set('h', `${hour}`)
		}
	} else {
		map.set('h', map.get('H')!)
	}
	// 转换格式
	let all = ''
	let val = ''
	let fmt = format
	const reg = 'yMdHhmsqf'
	for (let i = 0, n = 0; i < reg.length; i++) {
		n = format.indexOf(reg[i])
		if (n < 0) continue
		all = ''
		for (; n < format.length; n++) {
			if (format[n] !== reg[i]) {
				break
			}
			all += reg[i]
		}
		if (all.length > 0) {
			const mapVal = map.get(reg[i]) || ''
			if (all.length === mapVal.length) {
				val = mapVal
			} else if (all.length > mapVal.length) {
				if (reg[i] === 'f') {
					val = mapVal + getRepeatChar('0', all.length - mapVal.length)
				} else {
					val = getRepeatChar('0', all.length - mapVal.length) + mapVal
				}
			} else {
				switch (reg[i]) {
					case 'y':
						val = mapVal.substring(mapVal.length - all.length)
						break
					case 'f':
						val = mapVal.substring(0, all.length)
						break
					default:
						val = mapVal
						break
				}
			}
			fmt = fmt.replace(all, val)
		}
	}
	return fmt
}

/**
 * 返回字符串 为n个char构成
 * @param {string} char 重复的字符
 * @param {number} count 次数
 * @return {string}
 */
export const getRepeatChar = (char: string, count: number): string => {
	let str: string = ''
	while (count--) {
		str += char
	}
	return str
}

/**
 * @description 快速构建非空校验规则
 */
export const isRequired = (msg: string, trigger: string[] | string = 'blur') => {
	return {
		validator(rule: any, value: any) {
			if (value) {
				return true
			} else {
				return new Error(msg)
			}
		},
		trigger,
	}
}
