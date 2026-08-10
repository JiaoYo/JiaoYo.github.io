# cjx-upload

## 说明

因为在uniapp生态上找不到同时适合H5端，微信小程序以及安卓，ios上传任意文件的插件，所以开发了兼容多端的上传插件。该插件是不占用页面位置的上传组件；

### 可以配合cjx-previewOffice插件 进行文件的本地预览

## 使用

Attributes

| 参数      | 说明 | 类型	 | 默认值 | 最低版本 |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| v-model  |  双向绑定值  | { name: string, file: File }[] | [] |  -  |
| multiple |  是否支持多选文件 |  boolean  |  false  |  1.0.4  |
|  accept  |  接受的文件类型(限制只能选择图片和pdf格式的文件 accept="image/*,.pdf") 具体请参考https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/ |  string  |  -  |   1.0.4  |
|  limit  |  最大允许上传个数 |  number  | 9 |  1.0.4  |



Events

| 事件名      | 说明 | 参数	 | 最低版本 |
| ----------- | ----------- | ----------- | ----------- |
| change | 选择文件后触发 | data: UploadUserFile[] |  -  |
| remove | 删除文件时触发 | event = { file } file: 移除的文件信息 |  1.0.4  |
| passMaximumChange | 选择文件大于limit时触发 | - |  1.0.4  |



UploadUserFile

| 参数      | 说明 |
| ----------- | ----------- |
| name | 文件名称 |
| file | File对象 |
| size| 选择的文件的大小 |
| type| - |
| tempFilePath| 文件临时路径 (app端上传需要 h5端为空) |
| fileType| 文件类型 |
| base64Url| 文件base64数据 （app端用来配合cjx-previewOffice插件 完成文件预览） |
| url| 预览路径可以用来在本地预览文件（h5用来配合cjx-previewOffice插件 完成文件预览） |


change data

```

'data' : [
    {
        "size": 176579, // 选择的文件的大小
        "name": "Kafka.pdf", // 选择的文件的名称（小程序端可能会没有）
        "type": "application/pdf",
		"file": File对象{} // h5端上传用的
        "tempFilePath": "blob:http://192.168.137.1:8080/4204e460-f185-4fc9-9f4d-1bc50ab06981", //  文件临时路径 (app端上传需要 h5端为空)
        "fileType": "file", // 文件类型[image, video, file]
		"base64Url": "data:application/octet-stream-xxxxxxxxxxxxxxxxx-base64", // base64数据
		"url": "blob:http://localhost:5173/d0a4262b-71b6-4709-bad6-5b4776dee37e" // 预览路径可以用来在本地预览文件
    }
]
```

### vue:
``` javascript
<view class="content">
	
	// 普通用法
	<cjx-upload v-model="value" @change="uploadChange" />
	
	// 默认插槽
	<cjx-upload v-model="defaultValue" @change="uploadChange">
		<template #default>
			<view class="default_btn">上传</view>
		</template>
	</cjx-upload>

	// file插槽
	<cjx-upload v-model="fileValue" @change="uploadChange">
		<template #file="{ file }">
			{{ file }}
		</template>
	</cjx-upload>
	
</view>

```

## 温馨提示
	
* 文件上传
1. 如说明表达还不够清楚，不清楚怎么使用可导入完整示例项目运行体验和查看	
2. 如果想使该组件支持表单验证的请留言并备注对应ui库的form组件（需要的人多了，会在后续版本支持）
3. 如果想使组件支持更多功能请留言
4. 欢迎加入QQ讨论群：
### 插件交流群：186582262

