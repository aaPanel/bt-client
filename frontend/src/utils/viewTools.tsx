import { ElText, ElDivider, ElTooltip } from 'element-plus'

/**
 * @description 根据数组生成一个链接按钮列表,用于表格定制化渲染
 */
export function btButtonGroup(arr: Array<Record<string, any>>) {
	return arr.map((item, index) => {
		return (
			<>
				<ElText type="primary" {...item[1]} style={'user-select: auto;cursor:pointer '}>
					{item[0]}
				</ElText>
				{index !== arr.length - 1 && <ElDivider direction={'vertical'} />}
			</>
		)
	})
}

/**
 * @description 根据数组生成对应颜色的文本
 */
export function btColorText(arr: string[]) {
	return (
		<>
			<ElText type={arr[1]} style={'user-select: auto;'}>
				{arr[0]}
			</ElText>
		</>
	)
}

/**
 * @description 省略文本
 */
export function btEllipsisText(text: string, arttr?: any) {
	return (
		<ElTooltip effect="dark" content={text} placement="top">
			<ElText class={'vertical-bottom'} {...arttr} truncated>
				{text}
			</ElText>
		</ElTooltip>
	)
}


/**
 * @description 成功/失败文本
 */
export function btSuccessFailText(sTotal: number, fTotal: number) { 
	return (
		<>
			<ElText type="success" style={'user-select: auto;'}>{sTotal}</ElText>
			/
			<ElText type="danger" style={'user-select: auto;'}>{fTotal}</ElText>
		</>
	)
}