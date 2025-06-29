// copy to vben-admin

const toString = Object.prototype.toString

/**
 * @description 获取类型
 * @param { unknown } val 参数
 * @returns { string }
 */
export const getType = <T = unknown>(val: T): string => {
	return toString.call(val).slice(8, -1).toLowerCase()
}
/**
 * @description 判断类型
 * @param { unknown } val 参数
 * @param { string } type 类型
 * @returns { boolean }
 */
export const isType = <T = unknown>(val: T, type: string): boolean => {
	return getType(val) === type.toLowerCase()
}
/**
 * 判断是否为undefined类型
 * @param { unknown } val 参数
 */
export const isUndefined = (val: unknown): val is undefined => {
	return isType(val, 'undefined')
}

export const is = (val: unknown, type: string) => {
	return toString.call(val) === `[object ${type}]`
}

export const isDef = <T = unknown>(val?: T): val is T => {
	return typeof val !== 'undefined'
}

export const isUnDef = <T = unknown>(val?: T): val is T => {
	return !isDef(val)
}

export const isObject = (val: any): val is Record<any, any> => {
	return val !== null && is(val, 'Object')
}

export const isEmpty = <T = unknown>(val: T): val is T => {
	if (val === null) {
		return true
	}
	if (isArray(val) || isString(val)) {
		return val.length === 0
	}

	if (val instanceof Map || val instanceof Set) {
		return val.size === 0
	}

	if (isObject(val)) {
		return Object.keys(val).length === 0
	}

	return false
}

export const isDate = (val: unknown): val is Date => {
	return is(val, 'Date')
}

export const isNull = (val: unknown): val is null => {
	return val === null
}

export const isNullAndUnDef = (val: unknown): val is null | undefined => {
	return isUnDef(val) && isNull(val)
}

export const isNullOrUnDef = (val: unknown): val is null | undefined => {
	return isUnDef(val) || isNull(val)
}

export const isNumber = (val: unknown): val is number => {
	return is(val, 'Number')
}

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
	return is(val, 'Promise') && isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export const isString = (val: unknown): val is string => {
	return is(val, 'String')
}

export const isFunction = (val: unknown): val is Function => {
	return typeof val === 'function'
}

export const isBoolean = (val: unknown): val is boolean => {
	return is(val, 'Boolean')
}

export const isRegExp = (val: unknown): val is RegExp => {
	return is(val, 'RegExp')
}

export const isArray = (val: any): val is Array<any> => {
	return val && Array.isArray(val)
}

export const isWindow = (val: any): val is Window => {
	return typeof window !== 'undefined' && is(val, 'Window')
}

export const isElement = (val: unknown): val is Element => {
	return isObject(val) && !!val.tagName
}

export const isMap = (val: unknown): val is Map<any, any> => {
	return is(val, 'Map')
}

export const isServer = typeof window === 'undefined'

export const isClient = !isServer

export const isUrl = (path: string): boolean => {
	const reg =
		/(((^https?:(?:\/\/)?)(?:[-:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&%@.\w_]*)#?(?:[\w]*))?)$/
	return reg.test(path)
}

export const isDark = (): boolean => {
	return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// 是否是图片链接
export const isImgPath = (path: string): boolean => {
	return /(https?:\/\/|data:image\/).*?\.(png|jpg|jpeg|gif|svg|webp|ico)/gi.test(path)
}

export const isEmptyVal = (val: any): boolean => {
	return val === '' || val === null || val === undefined
}
// 是否内网ip段
export const isInnerIp = (ip: string): boolean => {
	var regex =
		/^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/
	return regex.test(ip)
}
// 验证ip信息
export const checkIp = (ip: string): boolean => {
	var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
	return reg.test(ip)
}
// 是否ipv6
export const checkIp6 = (ip: string): boolean => {
	var regex = /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/
	return regex.test(ip)
}
