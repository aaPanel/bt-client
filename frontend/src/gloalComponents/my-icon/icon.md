#Icon 图标

**介绍**
基于阿里字体的图标集，可以通过 font-class,svg  方式使用，也可以在其他组件中通过 icon 属性引用。

**使用**

```
  <my-icon icon="icon-quanping" size="44" color="red"/>
  <my-icon icon="icon-quanping"  type="svg"/>
```

**Props**
| 参数 | 说明 | 类型 | 默认值 | 是否必填
| ----- | ----------------- | ------ | ------ |------ |
| icon | iconfont 图标名称 | string | '' | 是 |
| type | 图标类型 font-class,svg | string | 'font-class' | 否 |
| className |svg自定义类名 | string | '' | 是 |
| size | 字体大小 | string | '16px' | 否 |
| color | 字体颜色 | string | '#8a8a8a' | 否 |

**组件使用位置 and 使用次数：**
| 使用组件 | 使用次数 |
| ----- | ----------------- |
| Fullscreen | 1|
