import { defineComponent, ref, toValue, isRef } from 'vue'
import type { Component, DefineComponent, DefineSetupFnComponent, Ref, Slots } from 'vue'
import {
	ElForm,
	ElFormItem,
	ElInput,
	ElCheckbox,
	ElCheckboxGroup,
	ElSelect,
	ElOption,
	ElDatePicker,
	ElTimePicker,
	ElSwitch,
	ElRate,
	ElSlider,
	ElTreeSelect,
	type FormItemRule,
} from 'element-plus'

export type FormItemAttrOptions = Array<{
	label: string
	value: string | number | boolean
	attrs?: Record<string, any>
	[key: string]: any
}>

export type FormItemOption = {
	label: string | Ref<string>
	key: string | Ref<string>
	type:
		| 'button'
		| 'input'
		| 'radio'
		| 'radio-group'
		| 'checkbox'
		| 'checkbox-group'
		| 'select'
		| 'date-picker'
		| 'time-picker'
		| 'switch'
		| 'rate'
		| 'slider'
		| 'tree-select'
		| 'cascader'
		| 'custom-item'
	attrs?: {
		options?: FormItemAttrOptions | Ref<FormItemAttrOptions>
		rules?: FormItemRule[] | Ref<FormItemRule[]>
		[key: string]: any | Ref<any>
	}
	el?: {
		[key: string]: any | Ref<any>
	}
	render?: () => Component
}

/********** 工具方法 ***********/
/**
 * @description datePicker类型判断(兼容时间戳和格式化字符串方案)
 */
function datePickerSwitch(
	option: FormItemOption,
	formData: Ref<Record<string, any>>,
	key: string | Ref<string>
) {
	if (option.attrs?.valueFormat) {
		return <ElDatePicker {...option.el} v-model:formattedValue={formData.value[toValue(key)]} />
	} else {
		return <ElDatePicker {...option.el} v-model={formData.value[toValue(key)]} />
	}
}

/**
 * @description 判断使用render还是slots来实现渲染
 */
function customSlotAndRender(
	option: FormItemOption,
	formData: Ref<Record<string, any>>,
	key: string | Ref<string>,
	slots: Slots
) {
	if (option.render) {
		const RenderComponent = option.render()
		return <RenderComponent v-model={formData.value[toValue(key)]} />
	} else {
		return slots[toValue(key)]?.()
	}
}

/**
 * @description 定义表单设计器的hook
 */
export function useNormalForm(
	options: Ref<FormItemOption[]> | FormItemOption[]
): [DefineSetupFnComponent<any>, Ref<Record<string, any>>, Ref<Record<string, any>>] {
	// 要返回的三个数据值，model在组件声明外界依然可以驱动组件，因为最终函数的调用是在组件的setup内执行，所以model天生具有上下文
	const model = ref<Record<string, any>>({})
	const formRef = ref()
	const Form = defineComponent({
		setup(_, { slots, attrs }) {
			/**
			 * @description 构建formItem
			 */
			function cerateItems(item: FormItemOption) {
				return (
					<ElFormItem
						{...item.attrs}
						label={toValue(item.label)}
						prop={toValue(item.key)}
						rules={toValue(item.attrs?.rules)}>
						{formCmptSwitch(item, item.key, slots)}
					</ElFormItem>
				)
			}

			/**
			 * @description 判断数据类型（Object或Ref），并生成对应formItem
			 */
			function reduceFormItem() {
				if (isRef(options)) {
					return options.value.map(item => cerateItems(item))
				} else {
					return options.map(item => cerateItems(item))
				}
			}

			/**
			 * @description 分支判断生成对应表单成员组件
			 */
			function formCmptSwitch(item: FormItemOption, key: string | Ref<string>, slots: Slots) {
				switch (item.type) {
					case 'input':
						return (
							<ElInput v-model={model.value[toValue(key)]} {...(item?.el as any)} {...item.attrs} />
						)
					case 'checkbox':
						return (
							<ElCheckbox
								v-model:checked={model.value[toValue(key)]}
								{...item?.el}
								{...item.attrs}
							/>
						)
					case 'checkbox-group':
						return (
							<ElCheckboxGroup v-model={model.value[toValue(key)]} {...item.attrs} {...item?.el}>
								{item.attrs?.options &&
									toValue(item.attrs?.options).map((option: any) => (
										<ElCheckbox label={option.label} value={option.value} />
									))}
							</ElCheckboxGroup>
						)
					case 'select':
						return (
							<ElSelect
								{...item?.el}
								{...(item.attrs)}
								v-model={model.value[toValue(key)]}>
								{toValue(item.attrs?.options)?.map(option => {
									return <ElOption label={option.label} value={option.value}></ElOption>
								})}
							</ElSelect>
						)
					case 'date-picker':
						return datePickerSwitch(item, model, key)
					case 'time-picker':
						return (
							<ElTimePicker {...item?.el} {...item.attrs} v-model={model.value[toValue(key)]} />
						)
					case 'switch':
						return <ElSwitch {...item?.el} {...item.attrs} v-model={model.value[toValue(key)]} />
					case 'rate':
						return <ElRate {...item?.el} {...item.attrs} v-model={model.value[toValue(key)]} />
					case 'slider':
						return <ElSlider {...item?.el} {...item.attrs} v-model={model.value[toValue(key)]} />
					case 'tree-select':
						return (
							<ElTreeSelect {...item?.el} {...item.attrs} v-model={model.value[toValue(key)]} />
						)
					case 'custom-item':
						return customSlotAndRender(item, model, key, slots)
				}
			}

			/**
			 * @description 默认属性设置
			 */
			return () => (
				<ElForm model={model.value} ref={formRef} labelWidth={'80px'}>
					{reduceFormItem()}
				</ElForm>
			)
		},
	})

	return [Form, model, formRef]
}
