/**
 * @description 生成随机数
 * @param { number } len 长度
 * @param { string } type 类型 default 默认, password: 密码
 * @returns { string } 随机数
 */
export const getRandomChart = (len: number = 10, type: string = 'default'): string => {
	let result = ''
	const chartObj: { [key: string]: string } = {
		default: 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789',
		password: 'AaBbCcDdEeFfGHhiJjKkLMmNnPpRSrTsWtXwYxZyz2345678',
	}
	const str = chartObj[type]
	for (let i = 0; i < len; i++) {
		result += str.charAt(Math.floor(Math.random() * str.length))
	}
	return result
}

/**
 * @description 生成带前缀的随机数
 * @param { string } prefix 前缀或者长度
 * @param { number } len 长度
 * @param { string } conn 连接符
 * @returns { string } 随机数
 */
export const getRandomPrefix = (prefix: string, len?: number, conn: string = '-'): string => {
	const str = getRandomChart(len)
	return `${prefix}${conn}${str}`
}

/**
 * @description 生成随机数
 * @param { number } len 长度
 * @returns { string } 随机数
 */
export const getRandomPwd = (len: number = 16): string => {
	return getRandomChart(len, 'password')
}
