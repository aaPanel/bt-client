import { ref, defineComponent, type Ref, toValue, watch, type Component, computed } from 'vue'
import { ElTable, ElTableColumn, ElPagination, ElButton, ElInput, ElSelect } from 'element-plus'
import type { TableProps, PaginationProps } from 'element-plus'
import './hooks.scss'

export type RequestReturn = {
	data: Record<string, any>[]
	itemCount: number
}
// TODO:后续再增加element相关的配置能力
export type DataTableColumns = {
	title: string // 列标题
	type?: string // 列类型
	key: string // 列字段
	isSlot?: boolean // 是否插槽
	attrs?: Record<string, any> // 列属性
	render?: (row: Record<string, any>) => Component // 自定义渲染
}[]

// 表格工具栏属性
export type TableToolsProps = {
	selectOptions?: Array<{ label: string; value: string }>
	layout?: Array<string>
	onFilterChange?: (val: Array<string>) => void
	onRefresh?: () => void
	onSearch?: (key: string) => void
}

/**
 * @description 带有工具栏的表格
 *    - 支持分页
 *    - 支持tableTools工具栏
 *    - 布局方案
 *        - 返回OperationTable，将所有内容装配好，并保留左上角插槽
 *        - 返回所有配件组件，由用户自行规划布局
 *    - 布局方案性能解释：
 *        - 内部只负责返回，不负责调用渲染，结论：外界用则RAM，不用则回收
 *
 */
export function useOperationTable(
	data: Ref<RequestReturn> | RequestReturn,
	columns: DataTableColumns | Ref<DataTableColumns>,
	page?: Ref<number>,
	pageSize?: Ref<number>
): [Component, Component, Component, Component] {
	const page_index = page ? page : ref(1)
	const page_size = pageSize ? pageSize : ref(10)
	const page_index_cache = ref(toValue(page))
	const page_size_cache = ref(toValue(pageSize))
	const filterSelect = ref<string[]>([])
	// 计算渲染列
	const viewColumns = computed(() => {
		return toValue(columns).filter(item => {
			if (filterSelect.value.length) {
				return filterSelect.value.includes(item.key as string)
			} else {
				return item
			}
		})
	})

	// 计算筛选下拉成员
	const filterSelectOptions = computed(() => {
		return toValue(columns).map(item => ({
			label: item.title,
			value: item.key,
		}))
	})

	// 表格组件
	const Table = defineComponent({
		setup(_, { attrs, slots }) {
			return () => (
				<ElTable data={toValue(data).data} {...attrs}>
					{viewColumns.value.map(column => {
						if (column.isSlot) {
							return (
								<ElTableColumn label={column.title} {...column.attrs}>
									{{
										default: (data: Record<string, any>) => slots[column.key as string]?.(data.row),
									}}
								</ElTableColumn>
							)
						} else if (column.render) {
							return (
								<ElTableColumn label={column.title} {...column.attrs}>
									{{ default: (data: Record<string, any>) => column.render?.(data.row) }}
								</ElTableColumn>
							)
						} else {
							return <ElTableColumn label={column.title} prop={column.key} {...column.attrs}></ElTableColumn>
						}
					})}
				</ElTable>
			)
		},
	})

	// 分页组件
	const Pagination = defineComponent({
		setup() {
			return () => (
				<ElPagination
					size={'small'}
					v-model:current-page={page_index.value}
					total={toValue(data).itemCount}
					v-model:page-size={page_size.value}
					pageSizes={[10, 20, 50, 100]}
				/>
			)
		},
	})

	// 工具栏组件
	const [TableTools] = useTableTools()
	const Tools = defineComponent<TableToolsProps>({
		emits: ['search', 'filter-change', 'refresh'],
		setup(_, { attrs, emit }) {
			return () => (
				<TableTools
					{...attrs}
					selectOptions={filterSelectOptions.value as { label: string; value: string }[]}
					onFilterChange={val => {
						filterSelect.value = val
						emit('filter-change', val)
					}}
					onRefresh={() => emit('refresh')}
					onSearch={(key: string) => emit('search', key)}
				/>
			)
		},
	})

	// 整合表格
	const OperationTable = defineComponent<
		TableToolsProps & {
			toolsProperties?: Record<string, any>
			tableProperties?: TableProps<DataTableColumns>
			paginationProperties?: PaginationProps
			loading?: boolean
			layout: ['leftTools', 'rightTools', 'bootomLeft', 'bottomRight']
		}
	>({
		props: {
			toolsProperties: Object,
			tableProperties: Object,
			paginationProperties: Object,
			loading: Boolean,
			layout: {
				type: Array,
				default: () => ['bottomRight'],
			},
		},
		emits: ['search', 'filter-change', 'refresh'],
		setup(props, { slots, emit }) {
			return () => (
				<div class="bt-operation-table-wrapper">
					<div class="bt-operation-table-header">
						<div class="bt-operation-table-header-left">
							{props.layout.includes('leftTools') && slots.leftTools?.()}
						</div>
						{props.layout.includes('rightTools') && slots.rightTools?.()}
					</div>

					<div class="bt-operation-table">
						<Table {...props.tableProperties}>{slots}</Table>
					</div>

					<div class="bt-operation-table-footer">
						<div class="bt-operation-table-footer-left">
							{props.layout.includes('bootomLeft') && slots.bootomLeft?.()}
						</div>
						{props.layout.includes('bottomRight') && <Pagination {...props.paginationProperties} />}
					</div>
				</div>
			)
		},
	})

	return [OperationTable, Table, Pagination, Tools]
}

/**
 * @description 表格工具栏hooks
 */
const TableToolsPropsOptions = {
	selectOptions: {
		type: Array,
		default: () => [],
	},
	layout: {
		type: Array,
		default: ['search', 'filter', 'refresh'], // TODO: 后续此处可以考虑根据数组成员顺序来排列工具的顺序
	},
}
export function useTableTools() {
	const Tools = defineComponent<TableToolsProps>({
		props: TableToolsPropsOptions,
		emits: ['search', 'filter-change', 'refresh'],
		setup(props, { emit }) {
			const key = ref('')
			const filter = ref(props.selectOptions?.map(item => item.value))
			function doSearch() {
				emit('search', key.value)
			}
			function doFilter(val: Array<string | number>) {
				emit('filter-change', val)
			}
			function doRefresh() {
				key.value = ''
				emit('refresh')
			}

			return () => (
				<div class="bt-table-tools">
					{props.layout?.includes('search') && (
						<div>
							<ElInput
								v-model={key.value}
								style={'width: 250px'}
								onKeydown={e => (e as KeyboardEvent).code == 'Enter' && doSearch()}
							/>
							<ElButton type="primary" onClick={() => doSearch()}>
								搜索
							</ElButton>
						</div>
					)}
					{props.layout?.includes('refresh') && (
						<ElButton onClick={doRefresh}>
							<i class="i-carbon:rotate-360 fz-14"></i>
						</ElButton>
					)}
				</div>
			)
		},
	})

	return [Tools]
}
