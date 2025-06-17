import type { MessageHandler } from 'element-plus'
import { VNode } from 'vue'

type MessageQueueItem = {
	vm: any
}

interface MessageProps {
	id: string
	type: string
	message: string | VNode
	customClass: string
	duration: number
	zIndex: number
	dangerouslyUseHTMLString: boolean
	onClose?: AnyFunction
}


export interface LoadingOptionsProps { 
	msg: string
	customClass: string
	background: string
}


export interface RequestProps {
	msg: string
	status: boolean
}

export interface MessageTypeProps {
	msg: MessageHandler
	success: MessageHandler
	warn: MessageHandler
	error: MessageHandler
	request: MessageHandler
	load: AnyObject
}

export const messageTypes = ['success', 'info', 'warning', 'error'] as const

export type MessageQueue = MessageQueueItem[]

export type MessageOptions = MessageProps
