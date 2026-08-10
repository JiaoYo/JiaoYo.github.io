# cjx-previewOffice

## 说明

因为在uniapp生态上找不到同时适合H5端，安卓，ios预览pdf-excel-word-txt文件的插件，所以开发了兼容多端的预览插件。该插件是纯前端开发；

### 可以配合cjx-upload插件 进行任意文件的选择

## 使用

Attributes

| 参数      | 说明 | 类型	 | 默认值 | 最低版本 |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| value  |  文件地址（支持网络地址和base64数据） |string | - |  -  |
| name |  文件名称 |  string  |  -  |  -  |
|  type  |  接受的文件类型 |  FileType( 'word' \| 'excel' \| 'pdf' \| 'txt')  | - | - |
| closeOnClickModal |  点击遮罩是否关闭 |  boolean  | true | - |



Exposes

| 事件名      | 说明 | 参数	 | 最低版本 |
| ----------- | ----------- | ----------- | ----------- |
| open | 打开预览弹窗 | - |  -  |
| close | 关闭预览弹窗 | - | - |



### vue:
``` javascript
<view class="content">
	<view class="list" style="display: flex;margin-top: 40rpx;">
		<view class="label">
			pdf
		</view>
		 <CjxUpload :multiple="true" accept="pdf/*,.pdf"  v-model="pdfValue" @change="uploadChange" >
			 <template #file="{ file }">
				 <cjx-previewOffice
					ref="previewOfficeRef"
					:value="file.url || file.base64Url"
					:name="file.name"
					type="pdf"
				>
				 	{{ file.name }}
				 </cjx-previewOffice>
			 </template>

		 </CjxUpload>
	</view>
	
	<view class="list" style="display: flex;margin-top: 40rpx;">
		<view class="label">
			excel
		</view>
		 <CjxUpload :multiple="true" accept="xlsl/*,.xls,.xlsl" v-model="excelValue" @change="uploadChange" >
			 <template #file="{ file }">
				 <cjx-previewOffice
					ref="previewOfficeRef"
					:value="file.url || file.base64Url"
					:name="file.name"
					type="excel"
				>
				 	{{ file.name }}
				 </cjx-previewOffice>
			 </template>
	
		 </CjxUpload>
	</view>
	
	<view class="list" style="display: flex;margin-top: 40rpx;">
		<view class="label">
			word
		</view>
		 <CjxUpload :multiple="true" accept="docx/*,.docx" v-model="wordValue" @change="uploadChange" >
			 <template #file="{ file }">
				 <cjx-previewOffice
					ref="previewOfficeRef"
					:value="file.url || file.base64Url"
					:name="file.name"
					type="word"
				>
				 	{{ file.name }}
				 </cjx-previewOffice>
			 </template>
	
		 </CjxUpload>
	</view>
	
	
	<view class="list" style="display: flex;margin-top: 40rpx;">
		<view class="label">
			txt
		</view>
		 <CjxUpload :multiple="true" accept="txt/*,.txt" v-model="txtValue" @change="uploadChange" >
			 <template #file="{ file }">
				 <cjx-previewOffice
					ref="previewOfficeRef"
					:value="file.url || file.base64Url"
					:name="file.name"
					type="txt"
				>
				 	{{ file.name }}
				 </cjx-previewOffice>
			 </template>
	
		 </CjxUpload>
	</view>
```

## 温馨提示
	
* 文件上传
1. 如说明表达还不够清楚，不清楚怎么使用可导入完整示例项目运行体验和查看	
2. 如果想使组件支持更多功能请留言
