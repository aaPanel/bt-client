#Overlay 遮罩层

**介绍**
创建一个遮罩层，用于强调特定的页面元素，并阻止用户进行其他操作。

**使用**

```
<script setup lang="ts" >
  import {ref} from 'vue'
  let show = ref(false)
</script>

<template>
	<my-overlay v-model:show="show" >
		<!-- <div>里面的内容</div> -->
	</my-overlay >
</template>
```

**Props**
| 参数 | 说明 | 类型 | 默认值 | 是否必填
| ----- | ----------------- | ------ | ------ |------ |
| background-color | 背景颜色 | string | '#ccc' | 否 |
| z-index | z-index 层级 | string,Number | 1 | 否 |
| show | 是否展示遮罩层 | boolean | false | 否 |
| tap-close | 点击是否关闭 | boolean | false | 否 |

**组件使用位置 and 使用次数：**

| 使用组件 | 使用次数 |
| ----- | ----------------- |
|  | |
