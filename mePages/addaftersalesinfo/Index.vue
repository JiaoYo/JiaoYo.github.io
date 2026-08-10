<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { nextTick, reactive, ref, computed, watch } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetSnInfoBySn, fetchSaveAftersaleWithSnInfo } from '@/service/index';
import { onLoad, onReady } from '@dcloudio/uni-app';
import district from '@/json/china.json';
import { uploadFile } from '@/utils/uploadFile';
import { CodeToText, TextToCode } from 'element-china-area-data';
import type { UploadMethod, UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types'
import { copyText } from '../../utils/copyText';
import { BASE_URL } from '../../utils/request';
import downloadCloudUrl from '@/static/downloadcloud.png';
import logoUrl from '@/static/images/linkqi_108_108.png';
import drawQrcode from '@/utils/weapp-qrcode.js';

const form = ref();

const { themeVars, theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const activeTab = ref<number>(1);

const loading = ref<boolean>(false);

// 最大SN数量
const maxSnCount = ref<number>(100);

// 现场照片
const uploadFileList = ref<any[]>([]);

// 现场视频
const uploadVideoList = ref<any[]>([]);

// 客户寄出照片
const uploadSendFileList = ref<any[]>([]);

const cascaderVisible = ref<boolean>(true);

const regionProvinceCityAreaDataList = ref([district[0], district[district[0][0].value], district[district[district[0][0].value][0].value]]);

// 二维码弹框
const qrCodeShow = ref<boolean>(false);

// 二维码内容
const qrCodeData = ref<any>(null);

// 用户ID
const userId = ref<number>(Number(uni.getStorageSync('userId')));

const model = reactive<{
    // sns: string;
	comp: string;
	contact: string;
	contactinfo: string;
	project: string;
	dock: string;
	address: any;
	details: number;
	accessory: string;
	receipt: string;
	rcontact: string;
	rcontactinfo: string;
	raddress: string;
	regionValue: any;
	snDataList: any;
}>({
    // sns: '',
	comp: '',
	contact: '',
	contactinfo: '',
	project: '',
	dock: '',
	address: '收件人：吴越\n手机号：19032214987\n地址：浙江杭州市钱塘区6号路中自科技园 领祺科技 (13F幢)4楼',
	details: 0,
	accessory: '',
	receipt: '',
	rcontact: '',
	rcontactinfo: '',
	raddress: '',
	regionValue: [],
	snDataList: [
		{
			sn: '',
			details: 0,
			accessory: '',
			fault: '',
			qrcodeList: [],
			uploadFileList: [],
			uploadVideoList: []
		}
	]
});

const rules: FormRules = {
    comp: [
        {
            required: true,
            message: '请输入贵司名称',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入贵司名称');
                }
            }
        },
    ],
	contact: [
	    {
	        required: true,
	        message: '请输入联系人',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入联系人');
	            }
	        }
	    },
	],
	contactinfo: [
	    {
	        required: true,
	        message: '请输入联系方式',
	        validator: (value: string) => {
	            if (value) {
					if (!/^1[3-9]\d{9}$/.test(value)) {
						return Promise.reject('请输入正确的联系方式');
					}
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入联系方式');
	            }
	        }
	    },
	],
	project: [
	    {
	        required: true,
	        message: '请输入项目名称',
	        validator: (value: string) => {
	            if (value) {
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入项目名称');
	            }
	        }
	    },
	],
	dock: [
	    {
	        required: true,
	        message: '请输入对接工程师',
	        validator: (value: string) => {
	            if (value) {
					if (value.length > 1) {
						return Promise.resolve();
					} else {
						return Promise.reject('对接工程师至少输入2个字符');
					}
	            } else {
	                return Promise.reject('请输入对接工程师');
	            }
	        }
	    },
	],
	accessory: [
	    {
	        required: true,
	        message: '请输入配件详情',
	        validator: (value: string) => {
	            if (value) {
					return Promise.resolve();
	            } else {
	                return Promise.reject('请输入配件详情');
	            }
	        }
	    },
	],
	rcontact: [
	    {
	        required: true,
	        message: '请输入联系人',
	        validator: (value: string) => {
	            if (value) {
					return Promise.resolve();
	            } else {
	                return Promise.reject('请输入联系人');
	            }
	        }
	    },
	],
	rcontactinfo: [
	    {
	        required: true,
	        message: '请输入联系方式',
	        validator: (value: string) => {
	            if (value) {
					if (!/^1[3-9]\d{9}$/.test(value)) {
						return Promise.reject('请输入正确的联系方式');
					}
	                return Promise.resolve();
	            } else {
	                return Promise.reject('请输入联系方式');
	            }
	        }
	    },
	],
	regionValue: [
		{
			required: true,
			message: '请选择省市区',
			validator: (value: string) => {
			    if (value.length > 0) {
			        return Promise.resolve();
			    } else {
			        return Promise.reject('请选择省市区');
			    }
			}
		}
	],
	raddress: [
	    {
	        required: true,
	        message: '请输入收件地址',
	        validator: (value: string) => {
	            if (value) {
					return Promise.resolve();
	            } else {
	                return Promise.reject('请输入详细地址');
	            }
	        }
	    },
	],
};

// 返回上个页面
function handleClickLeft(hasNewData = false) {
    if (hasNewData) {
        uni.$emit('refreshListAftersale', model); // 通知列表页刷新
    }
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 实时同步收件联系人
function handleAutoFillRcontactChange({ value: value }: { value: string }) {
	console.log('value', value);
	if (!model.rcontact) {
		model.rcontact = value;
	}
}

// 实时同步收件联系方式
function handleAutoFillRcontactinfoChange({ value: value }: { value: string }) {
	console.log('value', value);
	if (!model.rcontactinfo) {
		model.rcontactinfo = value;
	}
}

// 实时规范化用户输入
function handleSnInput(e: any, index: number) {
    // 只允许：字母、数字
	model.snDataList[index].sn = e.value.replace(/[^a-zA-Z0-9]/g, '')
}
// function handleSnInput({ value: value }: { value: string }) {
// 	// 👉 关键：永远不禁用输入框！我们通过逻辑控制行为
// 	// 即使有100个SN，也允许编辑
// 	console.log('value', value);
// 	// 1. 规范化输入
// 	let normalized = value
// 		.replace(/，/g, ',')
// 		.replace(/、/g, ',')
// 		.replace(/　/g, ' ');

// 	// 2. 解析当前内容
// 	const currentItems = parseSnString(normalized);
// 	const lastChar = normalized[normalized.length - 1];

// 	// 3. 判断是否“试图新增”
// 	//   - 如果以逗号结尾，表示用户想开始输入新SN
// 	//   - 如果当前已有 maxSnCount 个SN，且用户加了逗号 → 阻止
// 	if (currentItems.length >= maxSnCount.value && lastChar === ',') {
// 		// 🔴 用户已有100个SN，又打了逗号 → 试图新增第101个 → 阻止
// 		nextTick(() => {
// 			// 去掉末尾的逗号
// 			model.sns = value.substring(0, value.length - 1);
// 		});
// 		return;
// 	}

// 	// 4. 如果数量超过 maxSnCount（比如粘贴了12个），截断
// 	if (currentItems.length > maxSnCount.value) {
// 		const truncated = currentItems.slice(0, maxSnCount.value).join(', ');
// 		nextTick(() => {
// 			model.sns = truncated;
// 		});
// 		return;
// 	}

// 	// 5. 正常情况：应用规范化
// 	if (normalized !== value) {
// 		nextTick(() => {
// 			model.sns = normalized;
// 		});
// 	}
// }
					
function parseSnString(str) {
	if (!str) return [];
	str = str.trim();
	if (str === '') return [];

	// 不要去末尾逗号！我们要知道用户是否打了逗号
	// if (str[str.length - 1] === ',') { ... }

	return str.split(',').map(item => item.trim().replace(/\u3000/g, '').trim()).filter(item => item !== '');
}
					
// 获取我司收件信息
function getReceiveAddressInfo() {
	let queryParams = {
		_t: new Date().getTime()
	};
	uni.request({
		url: 'https://pms.linkqi.cn:18443/companyReceiveaddress.json',
		method: 'GET',
		data: queryParams,
		success: (res) => {
			console.log('res', res);
			model.address = '收件人：' + res.data.username + '\n手机号：' + res.data.mobile + '\n地址：' + res.data.address;
		},
		fail: (error) => {
			console.log('error', error);
			model.address = '收件人：吴越\n手机号：19032214987\n地址：浙江杭州市钱塘区6号路中自科技园 领祺科技 (13F幢)4楼';
		}
	})
}

// 扫码
function handleScanCodeChange() {
	uni.scanCode({
		success: function(res) {
			console.log('条码类型：' + res.scanType);
			console.log('条码内容：' + res.result);
			model.sns = model.sns ? (model.sns.substr(-1) === ',' ? model.sns + res.result : model.sns + ',' + res.result) : res.result;
		}
	})
}

// 获取当前 SN 列表
function getSnList() {
	return model.sns ? model.sns.split(",").map(sn => sn.trim()).filter(sn => sn) : [];
}

// 检查设备是否存在
async function handleCheckSnExitChange(callback: any) {
	// 创建一个副本用于串行处理
	let snQueue = [...getSnList()];
	
	if (snQueue.length === 0) {
		return;
	}

	// 递归处理队列中的每一个 SN
	async function checkNext() {
		// 每次都重新获取当前剩余的 SN（防止下标错乱）
		const currentSn = snQueue.shift(); // 取出第一个

		if (!currentSn) {
			// 队列为空，全部检查完成
			callback();
			return;
		}

		// 注意：检查的是当前 sn，但用户可能已经删除了它，所以要确认它是否还在
		const currentSnList = getSnList();
		if (!currentSnList.includes(currentSn)) {
			// 说明这个 SN 已被用户或其他操作删除了，跳过
			checkNext();
			return;
		}
		
		// 查询当前SN
		uni.request({
			url: BASE_URL + '/aftermarket/selectBySn.do',
			method: 'GET',
			data: {
				sn: currentSn,
				_t: new Date().getTime()
			},
			success: (res) => {
				console.log('res', res);
				if (res.data.code == 0) {
					// 有记录，保留，继续下一个
					if (typeof res.data.data === 'string') {
						if (res.data.data === '该编号无任何记录') {
							// 无记录，弹窗确认是否保留
							uni.showModal({
								title: '提示',
								content: `编号 [${currentSn}] 没有任何记录，请您先删除再进行其余操作。`,
								confirmText: '删除',
								// cancelText: '删除',
								showCancel: false,
								success: function(modalRes) {
									if (modalRes.confirm) {
										// 删除 → 从 dataForm.sn 中移除
										const newSnList = currentSnList.filter(sn => sn !== currentSn);
										model.sns = newSnList.join(',');
										
										// 继续下一个
										checkNext();
									} else {
										// 删除 → 从 dataForm.sn 中移除
										const newSnList = currentSnList.filter(sn => sn !== currentSn);
										model.sns = newSnList.join(',');
										
										// 继续下一个
										checkNext();
									}
								},
								fail: function() {
									// 弹窗失败，默认删除
									const newSnList = currentSnList.filter(sn => sn !== currentSn);
									model.sns = newSnList.join(',');
									checkNext();
								}
							});
							// uni.showModal({
							// 	title: '提示',
							// 	content: `编号 [${currentSn}] 没有任何记录，是否继续？`,
							// 	confirmText: '继续',
							// 	cancelText: '删除',
							// 	success: function(modalRes) {
							// 		if (modalRes.confirm) {
							// 			// 保留 → 继续
							// 			checkNext();
							// 		} else {
							// 			// 删除 → 从 dataForm.sn 中移除
							// 			const newSnList = currentSnList.filter(sn => sn !== currentSn);
							// 			model.sns = newSnList.join(',');
										
							// 			// 继续下一个
							// 			checkNext();
							// 		}
							// 	},
							// 	fail: function() {
							// 		// 弹窗失败，默认删除
							// 		const newSnList = currentSnList.filter(sn => sn !== currentSn);
							// 		model.sns = newSnList.join(',');
							// 		checkNext();
							// 	}
							// });
						} else{
							_this.$showToast(`编号 [${currentSn}] ${res.data.data}`);
							checkNext(); // 继续下一个
						}
					} else {
						model.comp = res.data.data.username;
						model.project = res.data.data.company;
						checkNext(); // 继续下一个
					}
				} else {
					// 无记录，弹窗确认是否保留
					uni.showModal({
						title: '提示',
						content: `编号 [${currentSn}] ${res.data.data}，是否保留？`,
						confirmText: '保留',
						cancelText: '删除',
						success: function(modalRes) {
							if (modalRes.confirm) {
								// 保留 → 继续
								checkNext();
							} else {
								// 删除 → 从 dataForm.sn 中移除
								const newSnList = currentSnList.filter(sn => sn !== currentSn);
								model.sns = newSnList.join(',');
								
								// 继续下一个
								checkNext();
							}
						},
						fail: function() {
							// 弹窗失败，默认删除
							const newSnList = currentSnList.filter(sn => sn !== currentSn);
							model.sns = newSnList.join(',');
							checkNext();
						}
					});
				}
			},
			fail: (error) => {
				console.log('查询SN失败:', error);
				console.log('查询SN失败:', error);
				// 失败也当作无记录处理
				uni.showModal({
					title: '网络错误',
					content: `查询编号 [${currentSn}] 失败，是否保留？`,
					confirmText: '保留',
					cancelText: '删除',
					success: function(modalRes) {
						if (modalRes.confirm) {
							checkNext();
						} else {
							const newSnList = currentSnList.filter(sn => sn !== currentSn);
							model.sns = newSnList.join(',');
							checkNext();
						}
					},
					fail: function() {
						const newSnList = currentSnList.filter(sn => sn !== currentSn);
						model.sns = newSnList.join(',');
						checkNext();
					}
				});
			}
		})
	}

	// 开始检查
	checkNext();
}

// 复制地址
function handleCopyChange() {
	copyText(model.address);
}

const onChangeDistrict = (pickerView: any, value: any, columnIndex: any, resolve: any) => {
	const item = value[columnIndex];
	if (columnIndex === 0) {
		pickerView.setColumnData(1, district[item.value])
		pickerView.setColumnData(2, district[district[item.value][0].value])
	} else if (columnIndex === 1) {
		pickerView.setColumnData(2, district[item.value])
	}
	resolve()
}

// 确定省市区
function handleConfirmChange({ value }) {
	console.log('value', value);
	console.log(CodeToText[value[0]]);
} 

// 上传二维码图片
const handleCustomUploadQrcodeChange: UploadMethod = (file: any, formData: any, options: any) => {
	console.log('file', file);
	uploadFile(file, '', (response, f) => {
		f.url = response.data;
		options.onSuccess(response.data, file, formData)
	}, (error, f) => {
		console.error('上传失败:', error);
	});
}

// 删除二维码图片
const handleRemoveQrcodeChange = (e: any) => {
	console.log('e', e);
	// uploadFileList.value = uploadFileList.value.filter((item: any) => item.url !== e.file.url);
	// console.log('uploadFileList.value', uploadFileList.value);
}

// 上传现场图片
const handleCustomUploadChange: UploadMethod = (file: any, formData: any, options: any) => {
	console.log('file', file);
	uploadFile(file, '', (response, f) => {
		f.url = response.data;
		options.onSuccess(response.data, file, formData)
	}, (error, f) => {
		console.error('上传失败:', error);
	});
}

// 删除二维码图片
const handleRemoveFileChange = (e: any) => {
	console.log('e', e);
	// uploadFileList.value = uploadFileList.value.filter((item: any) => item.url !== e.file.url);
	// console.log('uploadFileList.value', uploadFileList.value);
}

// 上传现场视频
const handleCustomVideoUploadChange : UploadMethod = (file : any, formData : any, options : any) => {
	// file.status = "success";
	// uploadVideoList.value = [file];
	uploadFile(file, '', (response, f) => {
		f.url = response.data;
		options.onSuccess(response.data, file, formData)
	}, (error, f) => {
		console.error('上传失败:', error);
	});
}

// 删除现场视频
const handleRemoveVideoChange = (e : any) => {
	console.log('e', e);
	// uploadVideoList.value = [];
}

// 上传客户寄出照片
const handleCustomUploadSendFileChange: UploadMethod = (file: any, formData: any, options: any) => {
	// file.status = "success";
	// uploadSendFileList.value.push(file);
	uploadFile(file, '', (response, f) => {
		f.url = response.data;
		options.onSuccess(response.data, file, formData)
	}, (error, f) => {
		console.error('上传失败:', error);
	});
}

// 删除客户寄出照片
const handleRemoveSendFileChange = (e: any) => {
	uploadSendFileList.value = uploadSendFileList.value.filter((item: any) => item.uid !== e.file.uid);
}

// 上一步
function handlePreviousStepChange() {
	activeTab.value = 1;
}

// 存储草稿
function handleStoreDataChange() {
	let storageParams: any = {
		activeTab: activeTab.value,
		comp: model.comp,
		contact: model.contact,
		contactinfo: model.contactinfo,
		project: model.project,
		dock: model.dock,
		// uploadFileList: uploadFileList.value,
		// uploadVideoList: uploadVideoList.value,
		// details: model.details,
		uploadSendFileList: uploadSendFileList.value,
		receipt: model.receipt,
		rcontact: model.rcontact,
		rcontactinfo: model.rcontactinfo,
		raddress: model.raddress,
		regionValue: model.regionValue,
		snDataList: model.snDataList
	};
	uni.setStorageSync('storageParams', JSON.stringify(storageParams));
	uni.showToast({
		icon: 'success',
		title: '保存成功',
		duration: 2000
	})
}

// 下一步
function handleNextStepChange() {
	form.value
	    .validate()
	    .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
	        console.log(valid);
	        console.log(errors);
	        if (valid) {
				if (model.regionValue.length === 0) {
					uni.showToast({
						icon: "none",
						title: "请选择省市区",
						duration: 1500
					})
					return false
				}
				activeTab.value = 2;
				// handleCheckSnExitChange(() => {
				// 	// 创建一个副本用于串行处理
				// 	let snQueue = [...getSnList()];
				// 	if (snQueue.length === 0) {
				// 		return;
				// 	}
				// 	activeTab.value = 2;
				// })
			}
		})
}

// 复制、新增
function handleAddSnInfoChange(index: number, type: string) {
	if (type == 'copy') {
		model.snDataList.push(model.snDataList[index]);
	} else {
		model.snDataList.push({
			sn: '',
			details: 0,
			accessory: '',
			fault: '',
			qrcodeList: [],
			uploadFileList: [],
			uploadVideoList: []
		})
	}
}

function handleSubmit() {
	let flag: boolean = true, whoIsNull: string = "";
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
				if (model.details == 1 && uploadSendFileList.value.length == 0) {
					uni.showToast({
						icon: 'none',
						title: '客户寄出照片不能为空',
						duration: 2000
					})
					return false
				}
				
				if (model.details == 1 && uploadSendFileList.value.length == 0) {
					uni.showToast({
						icon: 'none',
						title: '客户寄出照片不能为空',
						duration: 2000
					})
					return false
				}
				
				if (model.snDataList.length === 0) {
					flag = false;
					uni.showToast({
						icon: "none",
						title: "设备信息为空",
						duration: 1500
					})
					return false
				} else {
					for (let snIndex = 0; snIndex < model.snDataList.length; snIndex++) {
						if (!model.snDataList[snIndex].sn) {
							whoIsNull = "sn";
							flag = false;
							break;
						}
						if (!model.snDataList[snIndex].fault) {
							whoIsNull = "fault";
							flag = false;
							break;
						}
						if (model.snDataList[snIndex].details === 1 && !model.snDataList[snIndex].accessory) {
							whoIsNull = "accessory";
							flag = false;
							break;
						}
					}
				}
				
				if (!flag) {
					uni.showToast({
						icon: "none",
						title: whoIsNull === 'sn' ? "设备编号不能为空" : whoIsNull === 'fault' ? '故障现象不能为空' : whoIsNull === 'accessory' ? "客户寄件配件详情不能为空" : "设备编号不能为空",
						duration: 1500
					})
					return false
				}
				// if (model.rdetails == 1 && model.receiveFileList.length == 0) {
				// 	uni.showToast({
				// 		icon: 'none',
				// 		title: '寄出照片不能为空',
				// 		duration: 2000
				// 	})
				// 	return false
				// }
				
				loading.value = true;
				if (!model.receipt) {
					message
						.confirm({
						  msg: '快递单号未填写，是否继续？',
						  title: '提示'
						})
						.then(async() => {
							const uploadPromises = uploadFileList.value.map(async(file: any) => {
								// 跳过无效文件
								if (!file) return Promise.resolve(file);
								
								// 如果已经是有效线上地址，直接通过
								if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
									return Promise.resolve(file);
								}
								
								return new Promise((resolve, reject) => {
									uploadFile(file, '', (response, f) => {
										f.url = response.data;
										resolve(f);
									}, (error, f) => {
										console.error('上传失败:', error);
										resolve(f); // 或根据需求决定是否继续
									});
								});
							});
							
							const uploadSendPromises = uploadSendFileList.value.map(async(file: any) => {
								// 跳过无效文件
								if (!file) return Promise.resolve(file);
								
								// 如果已经是有效线上地址，直接通过
								if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
									return Promise.resolve(file);
								}
								
								return new Promise((resolve, reject) => {
									uploadFile(file, '', (response, f) => {
										f.url = response.data;
										resolve(f);
									}, (error, f) => {
										console.error('上传失败:', error);
										resolve(f); // 或根据需求决定是否继续
									});
								});
							});
							
							try {
								await Promise.all(uploadPromises, uploadSendPromises);
								let regionValueJson = {
									pC: model.regionValue[0],
									pN: CodeToText[model.regionValue[0]],
									cC: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? model.regionValue[2] : model.regionValue[1],
									cN: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? CodeToText[model.regionValue[2]] : CodeToText[model.regionValue[1]],
									dC: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? '' : model.regionValue[2],
									dN: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? '' : CodeToText[model.regionValue[2]],
								};
								let queryParams = {
									comp: model.comp,
									contact: model.contact,
									contactinfo: model.contactinfo,
									dock: model.dock,
									project: model.project,
									raddress: JSON.stringify({...regionValueJson, raddress: model.raddress }),
									rcontact: model.rcontact,
									rcontactinfo: model.rcontactinfo,
									receipt: model.receipt,
									re1: uploadSendFileList.value.length > 0 ? uploadSendFileList.value[0].url : null,
									re2: uploadSendFileList.value.length > 1 ? uploadSendFileList.value[1].url : null,
									re3: uploadSendFileList.value.length > 2 ? uploadSendFileList.value[2].url : null,
									afterMarketPojoList: []
								};
								for (var i = 0; i < model.snDataList.length; i++) {
									queryParams['afterMarketPojoList'].push({
										sn: model.snDataList[i].sn,
										details: model.snDataList[i].details,
										accessory: model.snDataList[i].accessory,
										fault: model.snDataList[i].fault,
										qrcode: model.snDataList[i].qrcodeList.length > 0 ? model.snDataList[i].qrcodeList[0].url : null,
										devre1: model.snDataList[i].uploadFileList.length > 0 ? model.snDataList[i].uploadFileList[0].url : null,
										devre2: model.snDataList[i].uploadFileList.length > 1 ? model.snDataList[i].uploadFileList[1].url : null,
										devre3: model.snDataList[i].uploadFileList.length > 2 ? model.snDataList[i].uploadFileList[2].url : null,
										devre4: model.snDataList[i].uploadVideoList.length > 0 ? model.snDataList[i].uploadVideoList[0].url : null
									})
								}
								const data = await fetchSaveAftersaleWithSnInfo(queryParams);
								qrCodeData.value = JSON.parse(data).encrypt;
								console.log('qrCodeData.value', qrCodeData.value);
								uni.showToast({
									title: '新增售后信息成功',
									icon: 'none',
									duration: 1500,
									complete: async () => {
										loading.value = false;
										uni.removeStorageSync("storageParams");
										qrCodeShow.value = true;
										await nextTick();
										setTimeout(async() => {
											await QRcodeGeneration();
										}, 500)
									}
								});
							} catch (err) {
								loading.value = false;
								console.error('新增售后信息失败', err);
							}
						})
						.catch(() => {
							loading.value = false;
						})
				} else {
					const uploadPromises = uploadFileList.value.map(async(file: any) => {
						// 跳过无效文件
						if (!file) return Promise.resolve(file);
						
						// 如果已经是有效线上地址，直接通过
						if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
							return Promise.resolve(file);
						}
						
						return new Promise((resolve, reject) => {
							uploadFile(file, '', (response, f) => {
								f.url = response.data;
								resolve(f);
							}, (error, f) => {
								console.error('上传失败:', error);
								resolve(f); // 或根据需求决定是否继续
							});
						});
					});
					
					const uploadSendPromises = uploadSendFileList.value.map(async(file: any) => {
						// 跳过无效文件
						if (!file) return Promise.resolve(file);
						
						// 如果已经是有效线上地址，直接通过
						if (file.url && file.url.startsWith("https://pictures.linkqi.cn")) {
							return Promise.resolve(file);
						}
						
						return new Promise((resolve, reject) => {
							uploadFile(file, '', (response, f) => {
								f.url = response.data;
								resolve(f);
							}, (error, f) => {
								console.error('上传失败:', error);
								resolve(f); // 或根据需求决定是否继续
							});
						});
					});
					
					try {
						await Promise.all(uploadPromises, uploadSendPromises);
						let regionValueJson = {
							pC: model.regionValue[0],
							pN: CodeToText[model.regionValue[0]],
							cC: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? model.regionValue[2] : model.regionValue[1],
							cN: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? CodeToText[model.regionValue[2]] : CodeToText[model.regionValue[1]],
							dC: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? '' : model.regionValue[2],
							dN: model.regionValue[1] === '819999' || model.regionValue[1] === '829999' ? '' : CodeToText[model.regionValue[2]],
						};
						let queryParams = {
							comp: model.comp,
							contact: model.contact,
							contactinfo: model.contactinfo,
							dock: model.dock,
							project: model.project,
							raddress: JSON.stringify({...regionValueJson, raddress:model.raddress}),
							rcontact: model.rcontact,
							rcontactinfo: model.rcontactinfo,
							receipt: model.receipt,
							re1: uploadSendFileList.value.length > 0 ? uploadSendFileList.value[0].url : null,
							re2: uploadSendFileList.value.length > 1 ? uploadSendFileList.value[1].url : null,
							re3: uploadSendFileList.value.length > 2 ? uploadSendFileList.value[2].url : null,
							afterMarketPojoList: []
						};
						for (var i = 0; i < model.snDataList.length; i++) {
							queryParams['afterMarketPojoList'].push({
								sn: model.snDataList[i].sn,
								details: model.snDataList[i].details,
								accessory: model.snDataList[i].accessory,
								fault: model.snDataList[i].fault,
								qrcode: model.snDataList[i].qrcodeList.length > 0 ? model.snDataList[i].qrcodeList[0].url : null,
								devre1: model.snDataList[i].uploadFileList.length > 0 ? model.snDataList[i].uploadFileList[0].url : null,
								devre2: model.snDataList[i].uploadFileList.length > 1 ? model.snDataList[i].uploadFileList[1].url : null,
								devre3: model.snDataList[i].uploadFileList.length > 2 ? model.snDataList[i].uploadFileList[2].url : null,
								devre4: model.snDataList[i].uploadVideoList.length > 0 ? model.snDataList[i].uploadVideoList[0].url : null
							})
						}
						const data = await fetchSaveAftersaleWithSnInfo(queryParams);
						console.log('data', data);
						qrCodeData.value = JSON.parse(data).encrypt;
						console.log('qrCodeData.value', qrCodeData.value);
						uni.showToast({
							title: '新增售后信息成功',
							icon: 'none',
							duration: 1500,
							complete: async () => {
								loading.value = false;
								uni.removeStorageSync("storageParams");
								qrCodeShow.value = true;
								await nextTick();
								setTimeout(async() => {
									await QRcodeGeneration();
								}, 500)
							}
						});
					} catch (err) {
						loading.value = false;
						console.error('新增售后信息失败', err);
					}
				}
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

async function QRcodeGeneration() {
	return new Promise((resolve, reject) => {
		drawQrcode({
			text: 'https://dingiiot.com/open-wechat.html?_t=' + new Date().getTime() + '&code=' + qrCodeData.value,
			width: 265, //宽度
			height: 265, //高度
			// typeNumber: 7, //非必须，二维码的计算模式，默认值-1
			canvasId: 'myQrcode', //必须，绘制的canvasId
			correctLevel: 2, //非必须，二维码纠错级别，默认值为高级，取值：{ L: 1, M: 0, Q: 3, H: 2 }
			// image:{
			// 	imageResource: "../../../../static/images/linkqi_108_108.png",
			// 	dx: 125,
			// 	dy: 125,
			// 	dWidth: 80,
			// 	dHeight: 80
			// },
			callback: () => { //绘制完成回调 要加定时不然拿不到 暂不知道啥原因~
				setTimeout(() => { //更多配置请前往官方github地址文档查看
					uni.canvasToTempFilePath({
						canvasId: 'myQrcode',
						destWidth: 265,
						destHeight: 265,
						success: (res) => {
							resolve(res); //导出临时二维码图片路径
						},
					});
				}, 800);
			},
		});
	});
}

// 保存二维码
async function saveQrcode() {
	const { tempFilePath } = await QRcodeGeneration(); //获取二维码路径
	uni.getImageInfo({
		src: tempFilePath,//传入
		success: function (ret) {
			var path = ret.path;
			console.log('path', path);
			// #ifdef APP || APP-PLUS || MP-WEIXIN
			uni.saveImageToPhotosAlbum({
				filePath: path,
				success(result) {
					if (result.errMsg === 'saveImageToPhotosAlbum:ok') {
						uni.showToast({
							icon: 'success',
							title: '保存成功'
						})
					}
				},
			});
			// #endif
			
			// #ifdef H5
			downloadBase64(path);
			// #endif
		},
	});
}

// 下载方法
const downloadBase64 = (base64: any, filename?: string) => {
	if (!base64) {
		console.error('Base64数据为空')
		return
	}

	try {
		// 提取MIME类型
		const mimeMatch = base64.match(/^data:(.*?);base64,/)
		if (!mimeMatch) {
			console.error('无效的Base64格式')
			return
		}

		const mimeType = mimeMatch[1]
    
		// 将base64转为blob
		const byteString = atob(base64.split(',')[1])
		const ab = new ArrayBuffer(byteString.length)
		const ia = new Uint8Array(ab)
    
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i)
		}
		
		const blob = new Blob([ab], { type: mimeType })
		
		// 创建下载链接
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = filename || `download.${getExtension(mimeType)}`
		link.style.display = 'none'
		
		document.body.appendChild(link)
		link.click()
		
		// 清理
		setTimeout(() => {
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
		}, 100)
	} catch (error) {
		console.error('下载失败:', error)
	}
}

// 根据MIME类型获取文件扩展名
const getExtension = (mimeType: any) => {
	const extensions = {
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/gif': 'gif',
		'image/webp': 'webp',
		'application/pdf': 'pdf',
		'text/plain': 'txt',
		'application/json': 'json',
		'application/vnd.ms-excel': 'xls',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
		'application/msword': 'doc',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	}
	return extensions[mimeType] || 'file'
}

onLoad(async() => {
	let afterSalesJson = uni.getStorageSync("storageParams") ? JSON.parse(uni.getStorageSync("storageParams")) : {};
	if (JSON.stringify(afterSalesJson) !== '{}') {
		activeTab.value = afterSalesJson.activeTab;
		model.snDataList = afterSalesJson.snDataList;
		uploadSendFileList.value = afterSalesJson.uploadSendFileList || [];
		if (afterSalesJson.regionValue.length > 0) {
			let raddressInfo = afterSalesJson.regionValue;
			regionProvinceCityAreaDataList.value = [district[0], district[raddressInfo[0]], district[raddressInfo[1]]];
		}
		Object.assign(model, afterSalesJson);
	} else {
		activeTab.value = 1;
	}
})


watch(() => model.receipt, (newVal: string, oldVal: string) => {
	nextTick(() => {
		model.receipt = newVal.replace(/[\u4e00-\u9fa5]/g, '');
	})
}, { deep: true, immediate: true})
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <wd-navbar left-arrow title="售后申请" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft" />

        <view>
            <wd-form ref="form" :model="model" :rules="rules">
				<!-- <view :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 20rpx)', background: isDark ? '#1b1b1b' : '#ffffff', gap: '0 10rpx', paddingRight: '20rpx' }" v-if="activeTab === 1">
					<wd-textarea label="设备编号" label-width="100px" type="textarea" prop="sns" clearable v-model.trim="model.sns" placeholder="请输入设备编号" custom-class="snWrap" @input="handleSnInput" />
					<wd-button size="small" hairline type="primary" :disabled="getSnList().length < 100 ? false : true" @click="handleScanCodeChange" block>扫码</wd-button>
				</view> -->
                <wd-input label="贵司名称" label-width="100px" prop="comp" required clearable v-model="model.comp" placeholder="请输入贵司名称" v-if="activeTab === 1" />
				<wd-input label="联系人" label-width="100px" prop="contact" required clearable v-model="model.contact" placeholder="请输入联系人" v-if="activeTab === 1" @blur="handleAutoFillRcontactChange" />
				<wd-input label="联系方式" label-width="100px" prop="contactinfo" required clearable v-model="model.contactinfo" placeholder="请输入联系方式" v-if="activeTab === 1" @blur="handleAutoFillRcontactinfoChange" />
				<wd-input label="项目名称" label-width="100px" prop="project" required clearable v-model="model.project" placeholder="请输入项目名称" v-if="activeTab === 1" />
				<wd-input label="对接工程师" label-width="100px" prop="dock" required clearable v-model="model.dock" placeholder="请输入对接的厂家工程师, 例如林工" v-if="activeTab === 1" />
				<wd-input v-if="activeTab === 1" label="客户寄出信息" label-width="100px" prop="receipt" clearable v-model="model.receipt" placeholder="请输入客户寄出信息" />
				<view :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 20rpx)', background: isDark ? '#1b1b1b' : '#ffffff', gap: '0 10rpx', paddingRight: '20rpx' }" v-if="activeTab === 1">
					<wd-textarea label="我司收件信息" label-width="100px" type="textarea" prop="address" disabled v-model.trim="model.address" placeholder="请输入我司收件地址" custom-class="addressWrap" />
					<wd-icon v-if="model.address" name="file-copy" size="22px" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(model.address)" />
				</view>
				<wd-gap height="2rpx" v-if="activeTab === 1"></wd-gap>
				<view v-if="activeTab === 1" style="margin: 10rpx;">
					<wd-text bold text="* 您的收件信息(售后完成时的回寄地址)" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</view>
				<wd-input label="联系人" label-width="100px" prop="rcontact" required clearable v-model="model.rcontact" placeholder="请输入联系人" v-if="activeTab === 1" :rules="[{ required: true, message: '请输入联系人' }]" />
				<wd-input label="联系方式" label-width="100px" prop="rcontactinfo" required clearable v-model="model.rcontactinfo" placeholder="请输入联系方式" v-if="activeTab === 1" :rules="[{ required: true, message: '请输入联系方式' }]" />
				<wd-picker required :columns="regionProvinceCityAreaDataList" label="省市区" label-width="100px" v-model="model.regionValue" :column-change="onChangeDistrict" @confirm="handleConfirmChange" v-if="activeTab === 1" :rules="[{ required: true, message: '请选择省市区' }]" />
				<wd-textarea label="详细地址" label-width="100px" type="textarea" prop="raddress" clearable v-model="model.raddress" placeholder="请输入详细地址" v-if="activeTab === 1" :rules="[{ required: true, message: '请输入详细地址' }]" />
				<view v-if="activeTab === 1" style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">客户寄出照片</view>
				</view>
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '20rpx 0 0 20rpx' }" v-if="activeTab === 1">
				    <wd-upload accept="image" :limit="3" multiple
				    	v-model:file-list="uploadSendFileList" image-mode="aspectFill" :upload-method="handleCustomUploadSendFileChange"
				    	@remove="handleRemoveSendFileChange"></wd-upload>
				</view>
				
				<view v-if="activeTab === 2">
					<view v-for="(item, index) in model.snDataList" :key="index" :style="{ marginTop: index === 0 ? 0 : '20rpx' }">
						<!-- <view :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 20rpx)', background: isDark ? '#1b1b1b' : '#ffffff', gap: '0 10rpx', paddingRight: '20rpx' }">
							<wd-input label="设备编号" label-width="100px" type="textarea" prop="sn" clearable v-model.trim="item.sn" placeholder="请输入设备编号" />
							<wd-button size="small" hairline type="primary" :disabled="getSnList().length < 100 ? false : true" @click="handleScanCodeChange" block>扫码</wd-button>
						</view> -->
						<wd-input label="设备编号" label-width="100px" type="textarea" prop="sn" clearable v-model.trim="item.sn" placeholder="请输入设备编号" @input="handleSnInput($event, index)" />
						<wd-textarea label="故障现象" label-width="100px" type="textarea" prop="fault" clearable v-model="item.fault" placeholder="请输入故障现象" />
						<wd-cell title="客户寄件类型" v-if="activeTab === 2">
							<wd-radio-group v-model="item.details" inline shape="dot">
								<wd-radio :value="0">仅裸机</wd-radio>
								<wd-radio :value="1">含配件</wd-radio>
							</wd-radio-group>
						</wd-cell>
						<wd-input label="客户寄件配件详情" label-width="100px" required clearable v-model="item.accessory" placeholder="请输入客户寄件配件详情" v-if="activeTab === 2 && item.details == 1" />
						<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="activeTab === 2">
						    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
						    <view style="margin-left: 10rpx; font-weight: bolder;">二维码照片</view>
						</view>
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '20rpx 0 0 20rpx' }" v-if="activeTab === 2">
						    <wd-upload accept="image" :limit="1"
						    	v-model:file-list="item.qrcodeList" image-mode="aspectFill" :upload-method="handleCustomUploadQrcodeChange"
						    	@remove="handleRemoveQrcodeChange"></wd-upload>
						</view>
						<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="activeTab === 2">
						    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
						    <view style="margin-left: 10rpx; font-weight: bolder;">现场照片</view>
						</view>
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '20rpx 0 0 20rpx' }" v-if="activeTab === 2">
						    <wd-upload accept="image" :limit="3" multiple
						    	v-model:file-list="item.uploadFileList" image-mode="aspectFill" :upload-method="handleCustomUploadChange"
						    	@remove="handleRemoveFileChange"></wd-upload>
						</view>
						<view style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;" v-if="activeTab === 2">
						    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
						    <view style="margin-left: 10rpx; font-weight: bolder;">现场视频</view>
						</view>
						
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '20rpx 0 0 20rpx' }" v-if="activeTab === 2">
						    <wd-upload accept="video" :limit="1"
						    	v-model:file-list="item.uploadVideoList" image-mode="aspectFill" :upload-method="handleCustomVideoUploadChange"
						    	@remove="handleRemoveVideoChange"></wd-upload>
						</view>
						
						<view style="margin-top: 20rpx; display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx; padding-right: 10rpx;">
							<wd-button size="small" type="primary" @click.stop="handleAddSnInfoChange(index, 'copy')">复制</wd-button>
							<wd-button size="small" type="primary" @click.stop="handleAddSnInfoChange(index, '')">新增</wd-button>
							<wd-button v-if="model.snDataList.length > 1" size="small" type="error" @click.stop="model.snDataList.splice(index, 1);">删除</wd-button>
						</view>
					</view>
				</view>
				
				<view class="footer">
					<wd-button v-if="activeTab === 2" type="info" @click="handlePreviousStepChange" block>上一步</wd-button>
					<wd-button type="warning" @click="handleStoreDataChange" block>存为草稿</wd-button>
					<wd-button v-if="activeTab === 1" type="primary" @click="handleNextStepChange" block>下一步</wd-button>
                    <wd-button v-if="activeTab === 2" hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                </view>
            </wd-form>
        </view>
		
		<wd-popup :z-index="99" v-model="qrCodeShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx;" @close="qrCodeShow = false;">
		    <wd-notice-bar wrapable :scrollable="false" text="请务必保存此二维码, 若保存图片不生效请截图保存, 便于查询后期的售后进度" type="danger" />

			<view class="qrcode">
		    	<canvas style="width: 265px; height: 265px;" canvas-id="myQrcode" id="myQrcode"></canvas>
		    </view>
		    <view class="qrcode-btn" @click="saveQrcode">
		    	<image :src="downloadCloudUrl" mode="widthFix" class="qrcode-btn-img" />
		    	<view>保存图片</view>
		    </view>
		</wd-popup>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.snWrap {
	width: calc(100vw - 100rpx) !important;
}

.wot-theme-dark {
	.addressWrap {
		width: calc(100vw - 100rpx) !important;
		
		:deep(.uni-textarea-textarea) {
			color: #ffffff !important;
		}
	}
}

.wot-theme-light {
	.addressWrap {
		width: calc(100vw - 100rpx) !important;
		
		:deep(.uni-textarea-textarea) {
			color: #000000 !important;
		}
	}
}
	
.footer {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 0 10rpx;
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}

.qrcode {
	margin-top: 40rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

.qrcode-btn {
	margin-top: 40rpx;
	display: flex;
	border: 2rpx solid #fd8f4b;
	color: #fd8f4b;
	border-radius: 60rpx;
	justify-content: center;
	align-items: center;
	padding: 20rpx;
}

.qrcode-btn-img {
	width: 48rpx;
	margin-right: 12rpx;
}
</style>