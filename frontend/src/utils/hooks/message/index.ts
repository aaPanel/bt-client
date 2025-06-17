import type { MessageOptions } from 'element-plus'

import { ElMessage, ElLoading } from 'element-plus'
import { isString, isUndefined } from '@utils/is'
import type { RequestProps, LoadingOptionsProps } from './types'

export class Message {
	// 获取消息提示的配置项
	static getOptions(options: any = {}) {
		if (isString(options)) {
			options = {
				message: options,
			}
		}
		if (!isUndefined(options.msg)) {
			options.message = options.msg
			delete options.msg
		}
		if (!isUndefined(options.time)) {
			options.duration = options.time
			delete options.time
		}
		return options
	}

	// 消息提示
	static msg(options: MessageOptions) {
		return ElMessage(options)
	}

	// 成功类型的消息提示
	static success(options: MessageOptions | RequestProps | string) {
		const newOptions = Message.getOptions(options)
		return ElMessage({
			type: 'success',
			...newOptions,
		})
	}

	// 普通类型的消息提示
	static warn(options: MessageOptions | RequestProps | string) {
		const newOptions = Message.getOptions(options)
		return ElMessage({
			type: 'warning',
			...newOptions,
		})
	}

	// 错误类型的消息提示
	static error(options: MessageOptions | RequestProps | string) {
		const newOptions = Message.getOptions(options)
		return ElMessage({
			type: 'error',
			...newOptions,
		})
	}

	// 请求类型的消息提示，包含html格式
	static request(data: any, options?: MessageOptions) {
		return ElMessage({
			customClass: 'bt-message-error-html', // 请求类型的消息提示，包含html格式
			type: data.status ? 'success' : 'error',
			dangerouslyUseHTMLString: true,
			message: data.msg,
			...(options || {}),
		})
	}

	// 加载类型的消息提示
	static load(options: LoadingOptionsProps | string) {
		if (isString(options)) {
			options = {
				msg: options as string,
				customClass: '',
				background: 'rgba(0, 0, 0, 0.3)',
			}
		}
		const { msg, background, customClass } = options
		const load = ElLoading.service({
			text: (msg as string) || '加载中...',
			spinner: '',
			customClass: `bt-loading ${customClass || ''}`, // 自定义类名
			background: background || 'rgba(0, 0, 0, 0.3)',
		})
		nextTick(() => {
			const circular = load.$el.querySelector('.circular') as HTMLElement
			const newCircular = document.createElement('i')
			circular.parentNode?.insertBefore(newCircular, circular)
			circular.parentNode?.removeChild(circular)
			newCircular.className = 'circular'
		})
		return load
	}
}

/**
 * @description message方法，包含成功、普通、错误、请求、加载类型
 * @returns {MessageTypeProps} message方法
 * @example useMessage().success('成功提示')
 */
const useMessage = () => Message

/**
 * @description 过度加载
 * @param {LoadingOptionsProps | string} options - 加载提示
 * @returns {AnyObject} 加载提示
 */
const useLoading = (options: LoadingOptionsProps | string) => Message.load(options)

export { useMessage, useLoading }
