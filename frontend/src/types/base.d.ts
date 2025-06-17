declare module 'md5'
declare interface Window {
	languageObject: Record<string, string>
	languageList: {
		languages: Record<string, string>[]
		current: string
	}
}
declare type proxyOptions = {
	proxy_id: number
	proxy_name: string
	proxy_ip: string
}
declare type groupOptions = {
	group_id: number
	group_name: string
}
/**
 * @description 下拉框格式
 */
declare type SelectOptions = {
	value: string
	label: string
}

declare type TreeOptions = { label: string; id: string | number; children?: TreeOptions[] }

type rr_child = {
	list: Array
	page: {
		current_page: number
		end_line: number
		page: string
		page_size: number
		start_line: number
		total_line: number
		total_page: number
	}
}
/**
 * @description 接口返回格式
 */
declare type RequestReturn = {
	data: rr_child
	error_msg: string
	msg: string
	status: boolean
}

/**
 * @description 接口返回格式
 */
declare type RequestReturnArray = {
	data: Array
	error_msg: string
	msg: string
	status: boolean
}
