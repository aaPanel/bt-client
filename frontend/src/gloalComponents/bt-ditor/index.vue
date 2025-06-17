<template>
	<VAceEditor
		class="edit_box"
		v-model:value="editValue"
		v-bind="attr"
		:lang="lang"
		theme="monokai"
		:readonly="readonly"
		ref="aces"
		:class="{ border: hasBorder }"
		:options="{
			fontSize: 14,
			tabSize: 2,
			showPrintMargin: false,
			highlightActiveLine: highlightActiveLine,
			showLineNumbers: showLineNumbers,
			showGutter: showGutter,
		}" />
</template>
<script setup lang="ts">
import { ref, useAttrs, watch } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'
// 引入mode 和 theme 这里可以选择自己想要的主题和mode
import ace from 'ace-builds'
import modeJsonUrl from 'ace-builds/src-noconflict/mode-json5?url'
import modeProtobuf from 'ace-builds/src-noconflict/mode-protobuf?url'
import themeTomorrow from 'ace-builds/src-noconflict/theme-tomorrow?url'
ace.config.setModuleUrl('ace/mode/json5', modeJsonUrl)
ace.config.setModuleUrl('ace/mode/protobuf', modeProtobuf)
ace.config.setModuleUrl('ace/theme/tomorrow', themeTomorrow)

const props = defineProps({
	// mode 的类型 还有很多其他的类型，可自行去查看
	lang: {
		type: String,
		default: 'json5',
		validator(value: any) {
			// 这个值必须匹配下列字符串中的一个
			return ['json5', 'protobuf'].includes(value)
		},
	},
	// 是否只读
	readonly: {
		type: Boolean,
		default: false,
	},
	// 是否显示行数
	showLineNumbers: {
		type: Boolean,
		default: true,
	},
	// 是否显示左侧行数那列
	showGutter: {
		type: Boolean,
		default: true,
	},
	value: {
		type: String,
		default: '',
	},
	// 是否有外边框
	hasBorder: {
		type: Boolean,
		default: true,
	},
	// 是否高亮选中行
	highlightActiveLine: {
		type: Boolean,
		default: true,
	},
})
const emit = defineEmits(['update:value'])
const attr = useAttrs()

const editValue = ref(props.value)
watch(
	() => editValue.value,
	val => {
		if (!props.readonly) {
			emit('update:value', val)
		}
	}
)
watch(
	() => props.value,
	val => {
		if (val !== editValue.value) {
			editValue.value = val
		}
	}
)
</script>
<style scoped lang="scss">
.edit_box {
	width: 100%;
	height: 100%;
}

.border {
	border: 1px solid #c0c4cc;
}
</style>
