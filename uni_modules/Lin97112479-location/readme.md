# Lin97112479-location
### 开发文档 参数使用说明（必看）百分百支持Android和ios
#### Android：定位权限需要开启始终定位，省电策略需要改为无限制。
#### ios：需要开启后台运行能力在manifest.json中App常用其他设置当中的后台运行能力填写location 即可 如填写后还是无效请打自定义基座后再调试 ios 经纬度变化时才会触发并不是跟安卓一样根据设置的间隔时间触发


### api列表
### 
|方法名|说明|
|:-----:|:-----|-----:|
|getLocations|开启监听位置：getLocations(),开启后会一直监听无法关闭|
|clearLocations|关闭监听位置：clearLocations(),关闭后需要重新开启监听定位|
|startServe|开启前台服务：startServe("前台运行中","点击返回软件"),仅支持Android-并且需要打自定义基座或者云打包才可使用否则无效(加高应用权重增加保活几率)|
|getGps|检测是否开启GPS：getGps(),支持Android、IOS|
|setGps|开启GPS方法：setGps(),支持Android、IOS|
|getLocation|获取是否开启定位：getLocation(),仅支持Android：-1永久拒绝，0临时拒绝，1允许获取|
|preciseLocation|获取是否开启始终定位：preciseLocation(),仅支持Android：-1永久拒绝，0临时拒绝，1允许获取|
|setTings|永久拒绝定位后手动设置定位方法：setTings(),支持Android、IOS|
|getBattery|检测是否开启电池优化白名单：getBattery(),仅支持Android：0未开启，1已开启|
|setBattery|设置开启电池优化白名单：setBattery(),仅支持Android：0未开启，1已开启|
## getLocations 方法参数

### 导入方法
```javascript
import { startServe } from "@/uni_modules/Lin97112479-location"
import { getLocations,clearLocations,getGps,setGps,getLocation,preciseLocation,setTings,getBattery,setBattery} from "@/uni_modules/Lin97112479-location/utssdk/index.js"
```

### 示例


```javascript
onReady() {
	let a = function(){
		console.log('发送请求');
		console.log(uni.getStorageSync('LIn97112479'));
	}
	let b = function(err){
    console.log('报错提醒',err);
	uni.showModal({
		title:'提示',
		content:JSON.stringify(err)
	})
}
	getLocations({provider:"amap",geocode:true,fun:a,err:b,time:10000}) 
},
```


|属性名|类型|默认值|说明|
|:-----:|:-----|-----:|
|sustain|Boolean|true|应用后台运行也会监听位置变化|
|geocode|Boolean|false|经纬度转换为详细地址|
|time|Number|1000|1秒|
|provider|String|system| 可取以下供应者： "system"：表示系统定位模块，支持wgs84坐标系； "baidu"：表示百度定位模块，支持gcj02/bd09/bd09ll坐标系； "amap"：表示高德定位模块，支持gcj02坐标系。 默认值按以下优先顺序获取（amap>baidu>system），若指定的provider不存在或无效则返回错误回调。 注意：百度/高德定位模块需要配置百度/高德地图相关参数才能正常使用。 |
|fun|function|null| 获取定位成功时方法名可传方法根据配置的time毫秒数调用 缓存地址key为LIn97112479 获取key示例：uni.getStorageSync('LIn97112479') |
|err|function|null| 获取定位失败时方法名可传方法根据配置的time毫秒数调用 缓存地址key为LIn97112479 |



