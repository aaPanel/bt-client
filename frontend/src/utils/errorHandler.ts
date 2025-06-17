/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 全局代码错误捕捉
 * 比如 null.length 就会被捕捉到
 */

export default (err: any, instance: globalThis.ComponentPublicInstance | null, info: string) => {
  // 处理错误，例如：报告给一个服务
  console.log('错误对象：', err)
  console.log('app实例：', instance)
  console.log('错误消息：', info)

  //过滤HTTP请求错误
  if (err.status || err.status == 0) {
    return false
  }

  const errorMap = {
    InternalError: 'Javascript引擎内部错误',
    ReferenceError: '未找到对象',
    TypeError: '使用了错误的类型或对象',
    RangeError: '使用内置对象时，参数超范围',
    SyntaxError: '语法错误',
    EvalError: '错误的使用了Eval',
    URIError: 'URI错误'
  }
  const errorName = errorMap[err.name] || '未知错误'

  console.warn(`[Maya error]: ${err},${errorName}`)
  console.error(err)
  //throw error;

  // vm.$nextTick(() => {
  // 	vm.$notify.error({
  // 		title: errorName,
  // 		message: error
  // 	});
  // })
}
