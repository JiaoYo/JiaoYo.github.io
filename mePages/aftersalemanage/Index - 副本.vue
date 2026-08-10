<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { copyText } from '@/utils/copyText';
import { uploadFile } from '@/utils/uploadFile';
import { getSystemDate, hasPermission, validateExpressCode } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAftersaleCompDataList, fetchGetAftersaleCompInfo, fetchUpdateAftersaleCompInfo, fetchReviewAftersaleInfo, fetchDeleteAftersaleCompInfo, fetchGetAftersaleInfoByEncryptedId } from '@/service/index';
import type { UploadMethod, UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

// 查看设备的loading
const viewLoading = ref<boolean>(false);

// 修改的loading
const updateDeviceLoading = ref<boolean>(false);

// 添加的loading
const addAftersaleLoading = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const triggered = ref<boolean>(false);
// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

// 更多过滤条件是否显示
const moreFilterVisible = ref<boolean>(false);

// 类型选择
const selectCheckboxed = ref<any[]>([]);

// 状态选择
const statusColumns = ref<any[]>([
	{ label: '全部', value: -1 },
	{ label: '待客户寄回', value: 0 },
	{ label: '客户寄出', value: 1 },
	{ label: '已审核', value: 2 },
	{ label: '检测分析', value: 3 },
	{ label: '完成', value: 4 },
]);

// 备注
const updateNote = ref<string>('');

// 密码
const password = ref<string>('');

// 快递编号弹框
const receiptShow = ref<boolean>(false);
const receiptLoading = ref<boolean>(false);
const receiptForm = ref(null);
const receiptModel = ref<{
	selectedId: any;
	selectedIndex: number;
	receipt: string;
}>({
	selectedId: null,
	selectedIndex: 0,
	receipt: ''
});

// 上传图片弹框
const uploader = ref();
const uploadFileLoading = ref<boolean>(false);
const uploadFileVisibleShow = ref<boolean>(false);
const uploadFileList = ref<any[]>([]);
const uploadImageForm = ref<{
	selectedId: any;
	selectedType: number;
	selectedIndex: number;
}>({
	selectedId: null,
	selectedType: 0,
	selectedIndex: 0,
})

const receiptRules: FormRules = {
    receipt: [
        {
            required: true,
            message: '请输入客户寄出信息',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入客户寄出信息');
                }
            }
        },
    ]
};

// 收件时间
const receiveTimeLoading = ref<boolean>(false);
const receivingTimeShow = ref<boolean>(false);
const receivingTimeForm = ref(null);
const receivingTimeModel = ref<{
	selectedId: any;
	selectedIndex: number;
	redbtimeStramp: any;
}>({
	selectedId: null,
	selectedIndex: 0,
	redbtimeStramp: null
})

const receivingTimeRules: FormRules = {
    redbtimeStramp: [
        {
            required: true,
            message: '请输入收件时间',
            validator: (value: string) => {
                if (value) {
                    return Promise.resolve();
                } else {
                    return Promise.reject('请输入收件时间');
                }
            }
        },
    ]
};

const showDetailInfo = ref<boolean>(false);
const showAfterSalesInfoShow = ref<boolean>(false);
const dataForm = reactive({
	id: null,
	comp: '',
	contact: '',
	contactinfo: '',
	project: '',
	dock: '',
	receipt: '',
	rcontact: '',
	rcontactinfo: '',
	raddress: '',
	status: 0,
	dbtime: '',
	redbtime: '',
	ckdbtime: '',
	afterMarketPojoList: []
})

const model = reactive<{
    page: number;
	limit: number;
    total: number;
    cname: string;
	pname: string;
	sn: string;
	status: number;
}>({
    page: 1,
	limit: 10,
    total: 0,
    cname: '',
	pname: '',
	sn: '',
	status: -1
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 点击更多过滤条件
function handleMoreFilterChange() {
	moreFilterVisible.value = !moreFilterVisible.value;
	nextTick(() => {
		recalcTopFixedHeight();
	})
}

// 搜索
function handleSearchChange() {
    model.page = 1;
    getDataList();
}

// 清除
function handleClearChange() {
    model.page = 1;
    getDataList();
}

// 返回地址
function getRAddress(text: string) {
	try {
		let textJson = JSON.parse(text);
		return textJson.pN + textJson.cN + textJson.dN + textJson.raddress;
	} catch (error) {
		return text;
	}
}

// 获取售后列表信息
async function getDataList() {
    if (!hasPermission('aftermarket:select:permission.do')) {
        uni.showToast({
            icon: 'none',
            title: '暂无售后查询权限，请联系管理员',
            duration: 1500
        })
        return false
    }
    try {
        if (model.page === 1) {
            dataList.value = [];
        }
        let queryParams: any = { page: model.page, limit: model.limit };
        if (model.cname) {
            queryParams['cname'] = model.cname;
        }
		if (model.pname) {
		    queryParams['pname'] = model.pname;
		}
		if (model.sn) {
		    queryParams['sn'] = model.sn;
		}
		if (model.status !== -1) {
		    queryParams['status'] = model.status;
		}
		if (selectCheckboxed.value.length > 0) {
		    if (selectCheckboxed.value.length === 1) {
				if (selectCheckboxed.value[0] === 0) {
					queryParams['uid'] = userId.value;
				} else {
					queryParams['dbtime'] = getSystemDate(0);
				}
			} else {
				queryParams['uid'] = userId.value;
				queryParams['dbtime'] = getSystemDate(0);
			}
		}
        const data = await fetchGetAftersaleCompDataList(queryParams);
        dataList.value = dataList.value.concat(data.list.map((item: any) => {
			return {
				...item,
				raddress: getRAddress(item.raddress),
				statusName: getStatusBigText(item.status),
				statusColor: getStatusBigTagColor(item.status),
				redbtimeStramp: item.redbtime ? getSystemDate(5, item.redbtime) : getSystemDate(5),
				sendFileList: [item.re1, item.re2, item.re3].filter(src => src).map(imageItem => {
					return {
						url: imageItem
					}
				}),
				receiveFileList: [item.re4, item.re5, item.re6].filter(src => src).map(imageItem => {
					return {
						url: imageItem
					}
				}),
				afterMarketPojoList: item.hasOwnProperty('afterMarketPojoList') ? item.afterMarketPojoList.map(afterMarketItem => {
					return {
						...afterMarketItem,
						aftersaleReason: afterMarketItem.hasOwnProperty('list') ? formatReNames(afterMarketItem.list) : ''
					}
				}) : []
			}
		}));
        model.total = Number(data.total);
        if (dataList.value.length < model.total) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取售后列表失败', err);
        state.value = 'error';
    }
}

// 格式化售后原因
function formatReNames(list: any) {
	let renames: string = '';
	if (list.length === 0) {
		return renames
	}
	list.forEach((item: any) => {
		renames+=item.rs + ','
	});
	return renames.substring(0, renames.length - 1)
}

// 格式化客户信息当前状态Tag颜色
function getStatusBigTagColor(status: number) {
	return status === 0 ? 'default' : status === 1 ? 'default' : status === 2 ? 'primary' : status === 3 ? 'warning' : status === 4 ? 'success' : 'default';
}

// 格式化状态
function getStatusBigText(status: number) {
	return status === 0 ? '待客户寄回' : status === 1 ? '客户寄出' : status === 2 ? '已审核' : status === 3 ? '检测分析' : status === 4 ? '完成' : '未知';
}

// 格式化状态
function getStatusText(status: number) {
	return status === 0 ? '质保维修返回' : status === 1 ? '整体置换返回' : status === 2 ? '报废' : status === 3 ? '付费维修返回' : status === 4 ? '原件返回' : status === 9 ? '其他' : '未知';
}

// 快递单号跳转
function handleReceiptChange(receipt: string) {
	if (!receipt) {
		return
	}
	if (!validateExpressCode(receipt)) {
		return
	}
	// #ifdef APP || APP-PLUS
	plus.runtime.openURL(`https://www.kuaidi100.com?nu=${encodeURIComponent(receipt)}`);
	// #endif
	
	// #ifdef H5
	window.open(`https://www.kuaidi100.com?nu=${encodeURIComponent(receipt)}`);
	// #endif
}

// 复制
async function handleCopyChange(val: string) {
    try {
        await copyText(val);
        uni.showToast({ title: '复制成功', icon: 'success' });
    } catch (err) {
        if (err instanceof Error) {
            uni.showToast({ title: err.message, icon: 'none' });
        }
    }
}

// 修改快递单号或者寄回快递单号
function handleUpdateReceiptOrRreceiptChange(item: any, index: number) {
	receiptModel.value.selectedId = item.id;
	receiptModel.value.receipt = item.receipt;
	receiptModel.value.selectedIndex = index;
	receiptShow.value = true;
}

// 取消
function handleCancelReceiptShowChange() {
	receiptShow.value = false;
	receiptModel.value.selectedId = null;
	receiptModel.value.receipt = null;
	receiptModel.value.selectedIndex = 0;
}

// 修改收件时间
async function handleUpdateRedbtimeChange(item: any, index: number) {
	receivingTimeModel.value.selectedId = item.id;
	receivingTimeModel.value.selectedIndex = index;
	receivingTimeModel.value.redbtimeStramp = item.hasOwnProperty('redbtime') ? getSystemDate(5, item.redbtime) : getSystemDate(5);
	receivingTimeShow.value = true;
	// try {
	// 	if (!hasPermission('aftermarket:update:permission.do')) {
	// 		return
	// 	}
	// 	let queryParams = [{
	// 		id: item.id,
	// 		redbtime: getSystemDate(0, e.value)
	// 	}];
	// 	const data = await fetchUpdateAftersaleCompInfo(queryParams);
	// 	uni.showToast({
	// 		title: '修改成功',
	// 		icon: 'none',
	// 		duration: 1500,
	// 		complete: async () => {
	// 			const data1 = await fetchGetAftersaleCompInfo(item.id);
	// 			dataList.value[index].redbtime = data1.redbtime;
	// 			dataList.value[index].redbtimeStramp = data1.redbtime ? getSystemDate(5, data1.redbtime) : getSystemDate(5);
	// 		}
	// 	});
	// } catch (err) {
	//     receiptLoading.value = false;
	// 	console.error('修改失败', err);
	// }
}

// 取消修改时间
function handleCancelReceiveTimeChange() {
	receivingTimeShow.value = false;
	receivingTimeModel.value.selectedId = null;
	receivingTimeModel.value.selectedIndex = 0;
	receivingTimeModel.value.redbtimeStramp = dataList.value[receivingTimeModel.value.selectedIndex].redbtime ? getSystemDate(5, dataList.value[receivingTimeModel.value.selectedIndex].redbtime) : getSystemDate(5);
}

// 确定修改时间
async function handleSubmitReceiveTimeChange() {
	try {
		if (!hasPermission('aftermarket:update:permission.do')) {
			return
		}
		receiveTimeLoading.value = true;
		let queryParams = [{
			id: receivingTimeModel.value.selectedId,
			redbtime: getSystemDate(0, receivingTimeModel.value.redbtimeStramp)
		}];
		const data = await fetchUpdateAftersaleCompInfo(queryParams);
		uni.showToast({
			title: '修改成功',
			icon: 'none',
			duration: 1500,
			complete: async () => {
				const data1 = await fetchGetAftersaleCompInfo(receivingTimeModel.value.selectedId);
				dataList.value[receivingTimeModel.value.selectedIndex].redbtime = data1.redbtime;
				dataList.value[receivingTimeModel.value.selectedIndex].redbtimeStramp = data1.redbtime ? getSystemDate(5, data1.redbtime) : getSystemDate(5);
				receivingTimeShow.value = false;
				receiveTimeLoading.value = false;
				receivingTimeModel.value.selectedId = null;
				receivingTimeModel.value.selectedIndex = 0;
				receivingTimeModel.value.redbtimeStramp = getSystemDate(5, data1.redbtime);
			}
		});
	} catch (err) {
	    receiveTimeLoading.value = false;
		console.error('修改失败', err);
	}
}

// 提交
function handleSubmitReceiptShowChange() {
	receiptForm.value
	    .validate()
	    .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
	        console.log(valid);
	        console.log(errors);
	        if (valid) {
	            receiptLoading.value = true;
	            try {
					if (!hasPermission('aftermarket:update:permission.do')) {
						receiptLoading.value = false;
						return
					}
					let queryParams = [{
						id: receiptModel.value.selectedId,
						receipt: receiptModel.value.receipt
					}];
					const data = await fetchUpdateAftersaleCompInfo(queryParams);
					uni.showToast({
						title: '修改成功',
						icon: 'none',
						duration: 1500,
						complete: async () => {
							receiptShow.value = false;
							const data1 = await fetchGetAftersaleCompInfo(receiptModel.value.selectedId);
							dataList.value[receiptModel.value.selectedIndex].receipt = data1.receipt;
							dataList.value[receiptModel.value.selectedIndex].redbtime = data1.redbtime;
							dataList.value[receiptModel.value.selectedIndex].redbtimeStramp = data1.redbtime ? getSystemDate(5, data1.redbtime) : getSystemDate(5);
							receiptModel.value.selectedId = null;
							receiptModel.value.receipt = null;
							receiptLoading.value = false;
							receiptModel.value.selectedIndex = 0;
						}
					});
	            } catch (err) {
	                receiptLoading.value = false;
					console.error('修改失败', err);
	            }
	        }
	    })
	    .catch((error: any) => {
	        console.log(error, 'error');
	    });
}

// 填写备注
function handleUpdateNotesChange(item: any, index: number) {
	try {
		updateNote.value = item.notes;
		message
		    .prompt({
				title: '请输入备注',
				inputPlaceholder: '请输入备注',
				inputValue: updateNote.value,
				inputValidate(value) {
				    if (!value || !value.trim()) {
				      return false;
				    }
				    return true;
				},
				inputError: '备注不能为空'
		    })
		    .then(async (resp: any) => {
				const data = await fetchUpdateAftersaleCompInfo([{ id: item.id, notes: resp.value }]);
				const data1 = await fetchGetAftersaleCompInfo(item.id);
				dataList.value[index].notes = data1.notes;
				updateNote.value = "";
		    })
		    .catch((error) => {
		      console.log(error)
		    })
	} catch (error) {
		console.log('填写备注失败', error);
	}
}

// 上传图片
function handleUpdatePictureShowChange(item: any, type: number, index: number) {
	uploadImageForm.value.selectedId = item.id;
	uploadImageForm.value.selectedType = type;
	uploadImageForm.value.selectedIndex = index;
	uploadFileList.value = type === 0 ? item.sendFileList : item.receiveFileList;
	uploadFileVisibleShow.value = true;
}

const handleCustomUploadChange: UploadMethod = (file: any, formData: any, options: any) => {
	options.onSuccess(file.url, file, formData);
}

const handleRemoveFileChange = (e: any) => {
	console.log('e', e);
}

// 取消文件上传
function handleCloseUploadFileShowChange() {
	uploadFileVisibleShow.value = false;
	uploadFileLoading.value = false;
	uploadImageForm.value.selectedId = null;
	uploadImageForm.value.selectedType = 0;
	uploadImageForm.value.selectedIndex = 0;
	uploadFileList.value = [];
}

// 文件上传确定
async function handleUploadfileSubmitChange() {
	// if (uploadFileList.value.length === 0) {
	// 	uni.showToast({
	// 		icon: 'none',
	// 		title: '请选择文件再进行上传',
	// 		duration: 2000
	// 	})
	// 	return false
	// }
	uploadFileLoading.value = true;
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
	
	try {
		await Promise.all(uploadPromises);
		let queryParams: any = uploadImageForm.value.selectedType === 0 ? [
			{
				id: uploadImageForm.value.selectedId,
				re1: '',
				re2: '',
				re3: ''
			}
		] : [
			{
				id: uploadImageForm.value.selectedId,
				re4: '',
				re5: '',
				re6: ''
			}
		];
		if (uploadImageForm.value.selectedType === 0) {
			if (uploadFileList.value.length == 1) {
				queryParams[0].re1 = uploadFileList.value[0].url;
				queryParams[0].re2 = "";
				queryParams[0].re3 = "";
			}
			if (uploadFileList.value.length == 2) {
				queryParams[0].re1 = uploadFileList.value[0].url;
				queryParams[0].re2 = uploadFileList.value[1].url;
				queryParams[0].re3 = "";
			}
			if (uploadFileList.value.length == 3) {
				queryParams[0].re1 = uploadFileList.value[0].url;
				queryParams[0].re2 = uploadFileList.value[1].url;
				queryParams[0].re3 = uploadFileList.value[2].url;
			}
		} else {
			if (uploadFileList.value.length == 1) {
				queryParams[0].re4 = uploadFileList.value[0].url;
				queryParams[0].re5 = "";
				queryParams[0].re6 = "";
			}
			if (uploadFileList.value.length == 2) {
				queryParams[0].re4 = uploadFileList.value[0].url;
				queryParams[0].re5 = uploadFileList.value[1].url;
				queryParams[0].re6 = "";
			}
			if (uploadFileList.value.length == 3) {
				queryParams[0].re4 = uploadFileList.value[0].url;
				queryParams[0].re5 = uploadFileList.value[1].url;
				queryParams[0].re6 = uploadFileList.value[2].url;
			}
		}
		const data = await fetchUpdateAftersaleCompInfo(queryParams);
		const data1 = await fetchGetAftersaleCompInfo(uploadImageForm.value.selectedId);
		if (uploadImageForm.value.selectedType === 0) {
			dataList.value[uploadImageForm.value.selectedIndex].sendFileList = [data1.re1, data1.re2, data1.re3].filter(src => src).map(imageItem => {
				return {
					url: imageItem
				}
			});
		} else {
			dataList.value[uploadImageForm.value.selectedIndex].receiveFileList = [data1.re4, data1.re5, data1.re6].filter(src => src).map(imageItem => {
				return {
					url: imageItem
				}
			});
		}
		uploadFileLoading.value = false;
		uploadFileVisibleShow.value = false;
	} catch (err) {
		console.error('批量上传出错', err);
		// 可选：提示部分失败
		uploadFileLoading.value = false;
	}
}

// 审核
function handleReviewAftersaleChange(id: number, index: number) {
	try {
		message
			.confirm({
				msg: '确定要审核吗？',
				title: '提示',
				// confirmButtonText: '审核通过',
				// cancelButtonText: '审核拒绝',
				confirmButtonProps: {
					type: 'success',
				},
				cancelButtonProps: {
					type: 'error'
				}
			})
			.then(async () => {
				const data = await fetchReviewAftersaleInfo({ id, status: 2 });
				const data1 = await fetchGetAftersaleCompInfo(id);
				dataList.value[index].status = data1.status;
				uni.showToast({
					icon: "none",
					title: "审核通过成功"
				})
			})
			.catch(async() => {
				console.log('点击了取消按钮');
				// const data = await fetchReviewAftersaleInfo({ id, status: 1 });
				// const data1 = await fetchGetAftersaleCompInfo(id);
				// dataList.value[index].status = data1.status;
				// uni.showToast({
				// 	icon: "none",
				// 	title: "审核拒绝成功"
				// })
			});
	} catch (err) {
		console.error('审核失败', err);
	};
}

// 撤回已审核
function handleWithdrawReviewAftersaleChange(id: number, index: number) {
	try {
		message
			.confirm({
				msg: '确定要撤回已审核吗？',
				title: '提示',
				confirmButtonProps: {
					type: 'success',
				},
				cancelButtonProps: {
					type: 'error'
				}
			})
			.then(async () => {
				const data = await fetchReviewAftersaleInfo({ id, status: 1 });
				const data1 = await fetchGetAftersaleCompInfo(id);
				dataList.value[index].status = data1.status;
				uni.showToast({
					icon: "none",
					title: "撤回成功"
				})
			})
			.catch(async() => {
				console.log('点击了取消按钮');
			});
	} catch (err) {
		console.error('撤回失败', err);
	};
}

// 删除售后
async function handleDeleteAftersaleInfoChange(id: any) {
    if (!hasPermission('aftermarket:delete:permission.do')) {
		uni.showToast({
			icon: 'none',
			title: '暂无删除权限，请联系管理员',
			duration: 1500
		})
        return false
    }
    try {
        message
        .confirm({
            msg: '确定要删除售后信息吗?',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(() => {
			message
			    .prompt({
					title: '请输入密码',
					inputType: 'password' as any,
					inputPlaceholder: '请输入密码',
					inputValue: password.value,
					inputPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{}|;:,.<>\/?]).{6,18}$/,
					inputError: '密码必须为6-18位，包含大小写字母、数字和特殊字符'
			    })
			    .then(async (resp: any) => {
					const data = await fetchDeleteAftersaleCompInfo(id, resp.value);
					model.page  = 1;
					getDataList();
					password.value = "";
			    })
			    .catch((error) => {
			      console.log(error)
			    })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除售后信息失败', err);
    }
}

// 页面跳转
function handleJumpPageChange(url: string) {
	if (url.includes('/mePages/aftersaledevice/Index') || url.includes('/mePages/aftersalesninfo/Index')) {
		viewLoading.value = true;
		uni.navigateTo({
			url,
			complete: () => {
				viewLoading.value = false;
			}
		})
	} else if (url.includes('/mePages/updatecompinfo/Index')) {
		updateDeviceLoading.value = true;
		uni.navigateTo({
			url,
			complete: () => {
				updateDeviceLoading.value = false;
			}
		})
	} else if (url.includes('/mePages/addaftersalesinfo/Index')) {
		addAftersaleLoading.value = true;
		uni.navigateTo({
		    url,
			complete: () => {
				addAftersaleLoading.value = false;
			}
		})
	}
}

// 扫码
async function handleScanQrcodeChange() {
	try {
		uni.scanCode({
			autoDecodeCharset: true,
			success: async function(res) {
				console.log('条码类型：' + res.scanType);
				console.log('条码内容：' + res.result);
				const url = new URL(res.result);
				const params = new URLSearchParams(url.search);
				const code = params.get('code'); 
				const data = await fetchGetAftersaleInfoByEncryptedId({ encryptedId: code });
				if (data.hasOwnProperty('dock')) {
					showDetailInfo.value = true;
					dataForm.id = data.id;
					dataForm.comp = data.comp;
					dataForm.contact = data.contact;
					dataForm.contactinfo = data.contactinfo;
					dataForm.project = data.project;
					dataForm.dock = data.dock;
					dataForm.status = data.status;
					dataForm.receipt = data.receipt;
					dataForm.redbtime = data.redbtime;
					dataForm.rcontact = data.rcontact;
					dataForm.rcontactinfo = data.rcontactinfo;
					dataForm.raddress = getRAddress(data.raddress);
					dataForm.dbtime = data.dbtime;
					dataForm.afterMarketPojoList = data.afterMarketPojoList.map((item: any) => {
						return {
							...item,
							qrcodeList: [item.qrcode].filter(src => src).map(imageItem => { return { url: imageItem } }),
							siteFileList: [item.devre1, item.devre2, item.devre3].filter(src => src).map(imageItem => { return { url: imageItem } }),
							videoFileList: [item.devre4].filter(src => src).map(imageItem => { return { url: imageItem } }),
							analyzeFileList: [item.devre5, item.devre6, item.devre7].filter(src => src).map(imageItem => { return { url: imageItem } }),
						}
					});
				} else {
					showDetailInfo.value = false;
					dataForm.comp = data.comp;
					dataForm.rcontact = data.rcontact;
					dataForm.rcontactinfo = data.rcontactinfo;
					dataForm.project = data.project;
					dataForm.status = data.status;
					dataForm.ckdbtime = data.ckdbtime;
				}
			},
			fail: (error) => {
				console.log('error', error);
			}
		})
	} catch (error) {
		//TODO handle the exception
		console.log('error', error);
	}
}

// 根据加密码获取基本信息
async function handleSimpleEnergyId() {
	let code = "04a51810da9fa7484fa649c8c1e1ec205aa3e5e797165f7adfccd6579d5646a901e423f135a60c8552e6618d54ae3ac2bd16094b61099abe3df29a77ad6bf7f84f1c2f2e6c320607f57c4452ba3b87cc24e494f259a01eda119c34e4819cd89cfa04b0e6";
	const data = await fetchGetAftersaleInfoByEncryptedId({ encryptedId: code });
	if (data.hasOwnProperty('dock')) {
		showDetailInfo.value = true;
		dataForm.id = data.id;
		dataForm.comp = data.comp;
		dataForm.contact = data.contact;
		dataForm.contactinfo = data.contactinfo;
		dataForm.project = data.project;
		dataForm.dock = data.dock;
		dataForm.status = data.status;
		dataForm.receipt = data.receipt;
		dataForm.redbtime = data.redbtime;
		dataForm.rcontact = data.rcontact;
		dataForm.rcontactinfo = data.rcontactinfo;
		dataForm.raddress = getRAddress(data.raddress);
		dataForm.dbtime = data.dbtime;
		dataForm.ckdbtime = data.ckdbtime;
		dataForm.afterMarketPojoList = data.afterMarketPojoList.map((item: any) => {
			return {
				...item,
				qrcodeList: [item.qrcode].filter(src => src).map(imageItem => { return { url: imageItem } }),
				siteFileList: [item.devre1, item.devre2, item.devre3].filter(src => src).map(imageItem => { return { url: imageItem } }),
				videoFileList: [item.devre4].filter(src => src).map(imageItem => { return { url: imageItem } }),
				analyzeFileList: [item.devre5, item.devre6, item.devre7].filter(src => src).map(imageItem => { return { url: imageItem } }),
			}
		});
	} else {
		showDetailInfo.value = false;
		dataForm.rcontact = data.rcontact;
		dataForm.rcontactinfo = data.rcontactinfo;
		dataForm.project = data.project;
		dataForm.status = data.status;
		dataForm.afterMarketPojoList = data.afterMarketPojoList;
	}
	showAfterSalesInfoShow.value = true;
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    // use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
    try {
        uni.createSelectorQuery()
            .select('.topFixedWrap')
            .boundingClientRect((rect: any) => {
                if (rect && rect.height !== undefined) {
                    topFixedHeight.value = rect.height;
                }
            })
            .exec();
    } catch (err) {
        // 兜底：如果失败，给个默认高度（例如 250rpx -> px 约换，保守值）
        topFixedHeight.value = 200;
        console.warn('recalcTopFixedHeight fail', err);
    }
}

onLoad((options) => {
	if (JSON.stringify(options) !== '{}') {
		model.cname = options.comp;
	}
    getDataList();
	// handleSimpleEnergyId();
    uni.$on('refreshListAftersale', getDataList); // 监听刷新事件
});

onReady(() => {
    recalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListAftersale', getDataList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    model.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (dataList.value.length < model.total) {
        model.page++;
        getDataList();
    } else if (dataList.value.length === model.total) {
        state.value = 'finished';
    }
});

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 80);
    });
    // 可监听窗口尺寸变更（H5 情况），小屏旋转/resize 时重新计算
    try {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', recalcTopFixedHeight);
        }
    } catch (e) { /* ignore */ }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
		
        <!-- 占位：顶部固定区域高度（动态计算） -->
        <view :style="{ height: topFixedHeight + 'px' }"></view>

        <view class="topFixedWrap">
            <wd-navbar left-arrow title="售后列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
				<template #right>
					<!-- #ifdef APP-PLUS -->
					<wd-icon name="scan" size="22px" @click="handleScanQrcodeChange"></wd-icon>
					<!-- #endif -->
				</template>
			</wd-navbar>
            <wd-search v-model="model.cname" placeholder="请输入客户名称" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
			<view @click="handleMoreFilterChange" :style="{ background: isDark ? '#323232' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0 10rpx', padding: '20rpx' }">
				<view :style="{ background: isDark ? '#323232' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0 10rpx' }">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">更多过滤条件</view>
					<wd-icon :name="moreFilterVisible ? 'arrow-up' : 'arrow-down'" size="20px"></wd-icon>
				</view>
			</view>
			<view v-if="moreFilterVisible" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', boxShadow: '0 8rpx 20rpx rgba(0, 0, 0, 0.08)' }">
				<wd-search hide-cancel v-model="model.pname" placeholder="请输入项目名称" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
				<!-- <wd-search hide-cancel v-model="model.sn" placeholder="请输入设备编号" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->
				<view style="display: flex; align-items: center; gap: 0 10rpx; padding: 20rpx 0 0 20rpx;">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">快速查询</view>
				</view>
				<view style="padding: 20rpx 20rpx; width: calc(100vw - 40rpx);">
					<wd-checkbox-group v-model="selectCheckboxed" shape="button" custom-class="headerRadioWrap" @change="handleSearchChange">
						<!-- <wd-checkbox :modelValue="0">与我相关</wd-checkbox> -->
						<wd-checkbox :modelValue="1">近7日待处理</wd-checkbox>
					</wd-checkbox-group>
				</view>
				
				<view style="display: flex; align-items: center; gap: 0 10rpx; padding: 20rpx 0 0 20rpx;">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">状态</view>
				</view>
				
				<scroll-view scroll-x style="background-color: #FFFFFF;">
					<wd-radio-group v-model="model.status" shape="button" cell inline style="display: flex; align-items: center; flex-wrap: nowrap;" @change="handleSearchChange">
						<wd-radio :value="-1">全部</wd-radio>
						<wd-radio :value="0">待客户寄回</wd-radio>
						<wd-radio :value="1">客户寄出</wd-radio>
						<wd-radio :value="2">已审核</wd-radio>
						<wd-radio :value="3">检测分析</wd-radio>
						<wd-radio :value="4">完成</wd-radio>
					</wd-radio-group>
				</scroll-view>

				<!-- <wd-picker :columns="statusColumns" label="状态" label-width="100rpx" align-right v-model="model.status" @confirm="handleSearchChange" /> -->
			</view>
			
			<wd-notice-bar custom-class="noticeBarWrap" :scrollable="false" :text="'共 ' + model.total + '条售后数据'" prefix="check-outline" type="warning" />
        </view>

        <view v-if="dataList.length > 0">
			<scroll-view scroll-y>
				<view v-for="(item, index) in dataList" :key="index" style="background-color: #FFFFFF; border-radius: 20px; margin: 10px; overflow: hidden;">
					<wd-cell title="创建时间" title-width="220rpx" :value="item.dbtime"></wd-cell>
					<wd-cell title="创建人" title-width="220rpx" :value="item.hasOwnProperty('username') ? item.username : '客户'"></wd-cell>
					<wd-cell title="售后设备信息" title-width="180rpx" v-if="item.sncount > 0">
						<view style="display: flex; align-items: center; gap: 0 20rpx;">
							<view style="display: flex; justify-content: space-between; flex-direction: column;">
								<view style="font-weight: bolder; display: flex; justify-content: flex-start; gap: 0 20rpx; align-items: center;">
									<view>{{ '总数量: ' + item.sncount + '个' }}</view>
									<wd-button v-if="hasPermission('aftermarket:select:permission.do')" type="text" :loading="viewLoading" @click.stop="handleJumpPageChange('/mePages/aftersaledevice/Index?cid=' + item.id)">查看</wd-button>
								</view>
								<view class="flexLayout" v-for="(afterMarketItem, afterMarketIndex) in item.afterMarketPojoList" :key="afterMarketIndex">
									<view class="flexLayoutItem">
										<span v-if="afterMarketItem.sn">{{ afterMarketItem.model ? afterMarketItem.sn + ' (' + afterMarketItem.model + ')' : afterMarketItem.sn }}</span>
										<span v-if="afterMarketItem.aftersaleReason">{{ '售后原因: ' + afterMarketItem.aftersaleReason }}</span>
									</view>
									<wd-button :loading="viewLoading" type="text" @click="handleJumpPageChange('/mePages/aftersalesninfo/Index?detailinfo=' + afterMarketItem.id)">查看</wd-button>
								</view>
							</view>
						</view>
					</wd-cell>
				</view>
			</scroll-view>

            <wd-loadmore :state="state" @reload="getDataList" />

            <wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
            <wd-status-tip image="../../static/search.png" tip="暂无售后数据" />
        </view>

        <wd-fab :disabled="addAftersaleLoading" :draggable="true" position="right-bottom" :zIndex="2" :gap="{ bottom: 40 }" :expandable="false" @click="handleJumpPageChange('/mePages/addaftersalesinfo/Index')"></wd-fab>
    
		<!-- 收件信息 -->
		<wd-popup :z-index="99" v-model="receiptShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text text="填写收件信息" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			<wd-form ref="receiptForm" :model="receiptModel" :rules="receiptRules">
			    <wd-textarea label="收件信息" label-width="80px" prop="receipt" required clearable v-model="receiptModel.receipt" placeholder="请输入收件信息" />
			
			    <view class="footer" style="margin-top: 20rpx;">
					<wd-button hairline type="info" @click="handleCancelReceiptShowChange" block>取消</wd-button>
			        <wd-button hairline type="primary" :loading="receiptLoading" @click="handleSubmitReceiptShowChange" block>确认</wd-button>
			    </view>
			</wd-form>
		</wd-popup>
		
		<!-- 收件时间 -->
		<wd-popup :z-index="99" position="bottom" v-model="receivingTimeShow" custom-style="padding: 20rpx; height: 400rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text text="填写收件时间" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			
			<wd-form ref="receivingTimeForm" :model="receivingTimeModel" :rules="receivingTimeRules">
				<wd-datetime-picker label="收件时间" :clearable="false" label-width="80px" align-right type="date" v-model="receivingTimeModel.redbtimeStramp"></wd-datetime-picker>
			
			    <view class="footer" style="margin-top: 180rpx;">
					<wd-button hairline type="info" @click="handleCancelReceiveTimeChange" block>取消</wd-button>
			        <wd-button hairline type="primary" :loading="receiveTimeLoading" @click="handleSubmitReceiveTimeChange" block>确认</wd-button>
			    </view>
			</wd-form>
		</wd-popup>
		
		<!-- 照片上传 -->
		<wd-popup closable :safe-area-inset-bottom="true" :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="uploadFileVisibleShow" position="left" @close="handleCloseUploadFileShowChange">
		    <wd-gap height="70rpx" />
			
			<view style="padding: 20rpx;">
				<view style="margin-bottom: 40rpx;">
					<wd-text :text="uploadImageForm.selectedType === 0 ? '客户寄出照片' : '厂家寄出照片'" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</view>
				
				<wd-upload accept="image" :limit="3" multiple v-model:file-list="uploadFileList" image-mode="aspectFill" :upload-method="handleCustomUploadChange" @remove="handleRemoveFileChange"></wd-upload>
				
				<wd-button block type="primary" :loading="uploadFileLoading" @click="handleUploadfileSubmitChange">确定</wd-button>
			</view>
		</wd-popup>
		
		<wd-popup :z-index="99" closable v-model="showAfterSalesInfoShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx; max-height: 900rpx;">
			<wd-gap height="50rpx"></wd-gap>
			<wd-cell title="公司名称" title-width="220rpx" :value="dataForm.comp"></wd-cell>
			<wd-cell v-if="showDetailInfo" title="联系人" title-width="220rpx" :value="dataForm.contact"></wd-cell>
			<wd-cell v-if="showDetailInfo" title="联系方式" title-width="220rpx" :value="dataForm.contactinfo"></wd-cell>
			<wd-cell title="项目名称" title-width="220rpx" :value="dataForm.project"></wd-cell>
			<wd-cell v-if="showDetailInfo" title="创建时间" title-width="220rpx" :value="dataForm.dbtime"></wd-cell>
			<wd-cell v-if="showDetailInfo" title="对接工程师" title-width="220rpx" :value="dataForm.dock"></wd-cell>
			<wd-cell title="当前状态">
				<wd-tag :type="getStatusBigTagColor(dataForm.status)" plain round>{{ getStatusBigText(dataForm.status) }}</wd-tag>
			</wd-cell>
			<wd-cell v-if="showDetailInfo" title="收件信息" title-width="180rpx" :value="dataForm.receipt ? dataForm.receipt : ''"></wd-cell>
			<wd-cell v-if="showDetailInfo" title="收件时间" title-width="180rpx" :value="dataForm.redbtime ? dataForm.redbtime : ''"></wd-cell>
			<wd-cell title="寄回信息" title-width="220rpx">
				<view style="display: flex; justify-content: flex-end; align-items: center;">
					<view style="display: flex; flex-direction: column; justify-content: flex-start; text-align: left;">
						<view>{{ '联系人：' + dataForm.rcontact }}</view>
						<view>{{ '联系方式：' + dataForm.rcontactinfo }}</view>
						<view v-if="showDetailInfo">{{ '地址：' + dataForm.raddress }}</view>
					</view>
					
					<wd-icon v-if="dataForm.rcontact" name="file-copy" color="#909399" custom-style="margin-left: 20rpx;" @click="handleCopyChange('联系人：' + dataForm.rcontact + '\n' + '联系方式：' + dataForm.rcontactinfo + '\n' + '地址：' + dataForm.raddress)" />
				</view>
			</wd-cell>
			<wd-cell title="审核时间" title-width="180rpx" :value="dataForm.ckdbtime ? dataForm.ckdbtime : ''"></wd-cell>
			
			<view v-if="showDetailInfo" style="display: flex; justify-content: left; align-items: center; flex-wrap: nowrap; padding: 10px 0 10px 10px;">
			    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
			    <view style="margin-left: 10rpx; font-weight: bolder;">设备信息</view>
			</view>
			
			<view v-if="dataForm.afterMarketPojoList.length > 0 && showDetailInfo">
				<view v-for="(afterMarketItem, afterMarketIndex) in dataForm.afterMarketPojoList" :key="afterMarketIndex" class="responsiblePersonWrap">
					<wd-cell-group :border="false">
						<wd-cell title="设备编号" title-width="220rpx" :value="afterMarketItem.sn"></wd-cell>
						<wd-cell title="设备型号" title-width="220rpx" :value="afterMarketItem.model"></wd-cell>
						<wd-cell title="寄件类型" title-width="220rpx">
							<view>
								{{ afterMarketItem.details === 0 ? '仅裸机' : afterMarketItem.details === 1 ? '含配件' : '未知' }}
							</view>
						</wd-cell>
						<wd-cell v-if="afterMarketItem.details == 1" title="配件详情" title-width="220rpx" :value="afterMarketItem.accessory"></wd-cell>
						<wd-cell title="故障现象" title-width="220rpx" :value="afterMarketItem.fault"></wd-cell>
						<wd-cell title="诊断结论" title-width="160rpx" :value="afterMarketItem.diagnosis"></wd-cell>
						<wd-cell title="临时处理" title-width="160rpx" :value="afterMarketItem.tphand"></wd-cell>
						<wd-cell title="长期改善" title-width="160rpx" :value="afterMarketItem.impv"></wd-cell>
						<wd-cell title="处理结论">
							<wd-tag type="primary" plain round>
								{{ afterMarketItem.conc === 0 ? '质保维修返回' : afterMarketItem.conc === 1 ? '整体置换返回' : afterMarketItem.conc === 2 ? '报废' : afterMarketItem.conc === 3 ? '付费维修返回' : afterMarketItem.conc === 4 ? '原件返回' : afterMarketItem.conc === 9 ? '其他' : '未知' }}
							</wd-tag>
						</wd-cell>
						<wd-cell title="是否推送厂家">
							<wd-tag :type="afterMarketItem.manu === 1 ? 'success' : 'danger'" plain round>
								{{ afterMarketItem.manu === 1 ? '是' : '否' }}
							</wd-tag>
						</wd-cell>
						<wd-cell title="发货信息" title-width="160rpx" :value="afterMarketItem.hasOwnProperty('returnnum') ? afterMarketItem.returnnum : '--'"></wd-cell>
						<wd-cell title="发货时间" title-width="160rpx" :value="afterMarketItem.hasOwnProperty('rdbtime') ? afterMarketItem.rdbtime : '--'"></wd-cell>
						<wd-cell title="发货网关编号" title-width="220rpx" :value="afterMarketItem.hasOwnProperty('rsn') ? afterMarketItem.rsn : '--'"></wd-cell>
						<wd-cell title="发货网关型号" title-width="220rpx" :value="afterMarketItem.hasOwnProperty('rmodel') ? afterMarketItem.rmodel : '--'"></wd-cell>
						<wd-cell title="发货是否包含配件" title-width="220rpx">
							<view>{{ afterMarketItem.rdetails === 0 ? '仅裸机' : afterMarketItem.rdetails === 1 ? '含配件' : '未知' }}</view>
						</wd-cell>
						<wd-cell title="发货配件详情" title-width="220rpx" :value="afterMarketItem.hasOwnProperty('raccessory') ? afterMarketItem.raccessory : '--'"></wd-cell>
						<wd-cell title="备注" title-width="220rpx" :value="afterMarketItem.hasOwnProperty('devnotes') ? afterMarketItem.devnotes : '--'"></wd-cell>
						<wd-cell title="设备二维码照片" title-width="200rpx">
							<view v-if="afterMarketItem.qrcodeList.length > 0" style="display: flex; justify-content: flex-end;">
								<wd-upload :limit="1" :file-list="afterMarketItem.qrcodeList" image-mode="aspectFill" disabled></wd-upload>
							</view>
							<view v-else style="display: flex; justify-content: flex-end;">
								<wd-text text="无" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
							</view>
						</wd-cell>
						<wd-cell title="现场照片" title-width="160rpx">
							<view v-if="afterMarketItem.siteFileList.length > 0" style="display: flex; justify-content: flex-end;">
								<wd-upload :limit="afterMarketItem.siteFileList.length" :file-list="afterMarketItem.siteFileList"
									image-mode="aspectFill" disabled></wd-upload>
							</view>
							<view v-else style="display: flex; justify-content: flex-end;">
								<wd-text text="无" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
							</view>
						</wd-cell>
						<wd-cell title="现场视频" title-width="160rpx">
							<view v-if="afterMarketItem.videoFileList.length > 0" style="display: flex; justify-content: flex-end;">
								<wd-upload :limit="afterMarketItem.videoFileList.length" :file-list="afterMarketItem.videoFileList"
									image-mode="aspectFill" disabled></wd-upload>
							</view>
							<view v-else style="display: flex; justify-content: flex-end;">
								<wd-text text="无" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
							</view>	
						</wd-cell>
						<wd-cell title="分析照片" title-width="160rpx">
							<view v-if="afterMarketItem.analyzeFileList.length > 0" style="display: flex; justify-content: flex-end;">
								<wd-upload :limit="afterMarketItem.analyzeFileList.length" :file-list="afterMarketItem.analyzeFileList"
									image-mode="aspectFill" disabled></wd-upload>
							</view>
							<view v-else style="display: flex; justify-content: flex-end;">
								<wd-text text="无" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
							</view>		
						</wd-cell>
					
					</wd-cell-group>
				</view>
			</view>	
		</wd-popup>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 98;
    background-color: #FFFFFF;
    // 保证内联元素正确换行
    box-sizing: border-box;
    // 可选：微阴影让固定区更明显
    // box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

.footer {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 0 10rpx;
}

:deep(.uni-swipe:nth-child(1) .uni-swipe_button) {
    margin-top: 0 !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}

:deep(.wd-radio-group) {
	padding-top: 0 !important;
	padding-bottom: 20rpx !important;
	overflow: auto !important;
	
	.wd-radio {
		width: auto !important;
		padding-right: 0 !important;
	}
}

.noticeBarWrap {
	border-radius: 0 !important;
}

.wot-theme-dark {
	:deep(.wd-notice-bar) {
		color: #F0F0F0 !important;
		background: #332b1f !important;
	}
}

:deep(.wd-cell__value) {
	font-weight: bold;
}

.flexLayout {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0 20rpx;
	width: calc(100% - 20rpx);
}

.flexLayoutItem {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	text-align: left;
	gap: 10rpx 0;
	width: calc(100% - 60rpx);
}
</style>
