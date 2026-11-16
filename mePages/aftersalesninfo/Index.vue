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
	import { fetchGetAftersaleCompDataList, fetchGetInterfaceDataList, fetchGetAftersaleSnAndDeviceDataList, fetchGetAftersaleSnInfo, fetchUpdateAftersaleSnInfo, fetchDeleteAftersaleSnInfo, fetchGetAftersaleCompInfo } from '@/service/index';
	import type { UploadMethod, UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types'

	const { t } = useI18n();

	const { themeVars, theme } = useTheme();

	const message = useMessage();

	const isDark = computed(() => theme.value === 'dark');

	const state = ref<any>('loading');
	const dataList = ref<any[]>([]);
	const scrollTop = ref<number>(0);
	const userId = ref<number>(uni.getStorageSync('userId'));
	const userType = ref<number>(uni.getStorageSync('usertype'));
	// 顶部固定区域高度（px）
	const topFixedHeight = ref<number>(0);

	// 备注
	const updateNote = ref<string>('');
	
	// 密码
	const password = ref<string>('');
	
	// 修改loading
	const updateLoading = ref<boolean>(false);

	// 物流信息弹框
	const receiptShow = ref<boolean>(false);
	const receiptLoading = ref<boolean>(false);
	const receiptForm = ref(null);
	const receiptModel = ref<{
		selectedId : any;
		receipt : string;
		rsn: string;
		rdetails : number;
		raccessory : string;
	}>({
		selectedId: null,
		receipt: '',
		rsn: '',
		rdetails: 0,
		raccessory: ''
	});

	// 上传图片弹框
	const uploadFileLoading = ref<boolean>(false);
	const uploadFileVisibleShow = ref<boolean>(false);
	const uploadFileList = ref<any[]>([]);
	const uploadImageForm = ref<{
		selectedId : any;
		selectedType : number;
	}>({
		selectedId: null,
		selectedType: 0,
	})

	const receiptRules : FormRules = {
		receipt: [
			{
				required: true,
				message: '请输入客户寄出信息',
				validator: (value : string) => {
					if (value) {
						return Promise.resolve();
					} else {
						return Promise.reject('请输入客户寄出信息');
					}
				}
			},
		],
		rsn: [
			{
				required: true,
				message: '请输入寄出设备编号',
				validator: (value : string) => {
					if (value) {
						return Promise.resolve();
					} else {
						return Promise.reject('请输入寄出设备编号');
					}
				}
			},
		]
	};
	
	// 诊断结论、临时处理、长期改善弹框
	const diagnosisCheckShow = ref<boolean>(false);
	const diagnosisCheckLoading = ref<boolean>(false);
	const diagnosisCheckForm = reactive<{
		selectedId: any;
		selectType: string;
		selectTypeName: string;
		diagnosisCheckValue: string;
	}>({
		selectedId: null,
		selectType: '',
		selectTypeName: '',
		diagnosisCheckValue: ''
	});
	
	const diagnosisCheckFormRules : FormRules = {
		diagnosisCheckValue: [
			{
				required: false,
				message: '请输入' + diagnosisCheckForm.selectTypeName,
				validator: (value : string) => {
					if (value) {
						return Promise.resolve();
					} else {
						return Promise.reject('请输入' + diagnosisCheckForm.selectTypeName);
					}
				}
			},
		]
	};
	
	// 是否推送厂家
	const pushManuShow = ref<boolean>(false);
	const pushManuLoading = ref<boolean>(false);
	const pushManuForm = reactive<{
		selectedId: any;
		selectManu: number;
	}>({
		selectedId: null,
		selectManu: 0
	});
	
	const pushManuList = ref([
		{
			name: '是',
			value: 1
		},
		{
			name: '否',
			value: 0
		}
	]);

	const model = reactive({
		id: null,
		cid: null,
		sn: '',
		model: '',
		details: -1,
		accessory: '',
		fault: '',
		qrcode: '',
		diagnosis: '',
		tphand: '',
		impv: '',
		conc: -1,
		returnnum: '',
		rdbtime: '',
		rcreater: null,
		rsn: '',
		rmodel: '',
		rdetails: -1,
		raccessory: '',
		devnotes: '',
		duration: '',
		devre1: '',
		devre2: '',
		devre3: '',
		devre4: '',
		devre5: '',
		devre6: '',
		devre7: '',
		devre8: '',
		devre9: '',
		devre10: '',
		devre11: '',
		devre12: '',
		qrcodeList: [],
		siteFileList: [],
		videoFileList: [],
		analyzeFileList: [],
		manu: -1,
		list: [],
		canUpdateSn: hasPermission('aftermarket:update:permission.do'),
		canDeleteSn: hasPermission('aftermarket:delete:permission.do'),
		canInsertMiddle: hasPermission('aftermarket:middle:insert'),
		canDeleteMiddle: hasPermission('aftermarket:middle:delete'),
		aftersalesReason: ''
	})

	function handleClickLeft() {
		// #ifdef H5
		history.go(-1);
		// #endif

		// #ifndef H5
		uni.navigateBack();
		// #endif
	}

	// 复制
	async function handleCopyChange(val : string) {
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
	function handleUpdateReceiptOrRreceiptChange(item : any) {
		receiptModel.value.selectedId = item.id;
		receiptModel.value.receipt = item.returnnum;
		receiptModel.value.rsn = item.hasOwnProperty('rsn') ? item.rsn : '';
		receiptModel.value.rdetails = item.hasOwnProperty('rdetails') ? Number(item.rdetails) || 0 : 0;
		receiptModel.value.raccessory = item.hasOwnProperty('raccessory') ? item.raccessory : '';
		receiptShow.value = true;
	}

	// 取消
	function handleCancelReceiptShowChange() {
		receiptShow.value = false;
		receiptModel.value.selectedId = null;
		receiptModel.value.receipt = null;
		receiptModel.value.rsn = "";
		receiptModel.value.rdetails = null;
		receiptModel.value.raccessory = null;
	}

	// 提交
	function handleSubmitReceiptShowChange() {
		receiptForm.value
			.validate()
			.then(async ({ valid, errors } : { valid : boolean; errors : any }) => {
				console.log(valid);
				console.log(errors);
				if (valid) {
					receiptLoading.value = true;
					try {
						if (!model.canUpdateSn) {
							receiptLoading.value = false;
							return
						}
						let queryParams = receiptModel.value.rdetails === 0 ? [{
							id: receiptModel.value.selectedId,
							returnnum: receiptModel.value.receipt,
							rsn: receiptModel.value.rsn,
							rdetails: receiptModel.value.rdetails
						}] : [{
							id: receiptModel.value.selectedId,
							returnnum: receiptModel.value.receipt,
							rsn: receiptModel.value.rsn,
							rdetails: receiptModel.value.rdetails,
							raccessory: receiptModel.value.raccessory
						}];
						const data = await fetchUpdateAftersaleSnInfo(queryParams);
						uni.showToast({
							title: '修改成功',
							icon: 'none',
							duration: 1500,
							complete: async () => {
								receiptShow.value = false;
								const data1 = await fetchGetAftersaleSnInfo(receiptModel.value.selectedId);
								model.returnnum = data1.returnnum;
								model.rdbtime = data1.rdbtime;
								model.rsn = data1.rsn;
								model.rmodel = data1.rmodel;
								model.rdetails = data1.rdetails;
								model.raccessory = data1.raccessory;
								receiptModel.value.selectedId = null;
								receiptModel.value.receipt = null;
								receiptModel.value.rsn = "";
								receiptModel.value.rdetails = null;
								receiptModel.value.raccessory = null;
								receiptLoading.value = false;
							}
						});
					} catch (err) {
						receiptLoading.value = false;
						console.error('修改失败', err);
					}
				}
			})
			.catch((error : any) => {
				console.log(error, 'error');
			});
	}

	// 填写备注
	function handleUpdateNotesChange(item: any) {
		try {
			updateNote.value = item.devnotes;
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
				.then(async (resp : any) => {
					const data = await fetchUpdateAftersaleSnInfo([{ id: item.id, devnotes: resp.value }]);
					const data1 = await fetchGetAftersaleSnInfo(item.id);
					model.devnotes = data1.devnotes;
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
	function handleUpdatePictureShowChange(item : any, type : number) {
		uploadImageForm.value.selectedId = item.id;
		uploadImageForm.value.selectedType = type;
		uploadFileList.value = type === 0 ? item.siteFileList : item.analyzeFileList;
		uploadFileVisibleShow.value = true;
	}

	// 上传分析图片
	const handleCustomUploadChange : UploadMethod = (file : any, formData : any, options : any) => {
		// file.status = "success";
		// uploadFileList.value.push(file);
		options.onSuccess(file.url, file, formData);
	}

	const handleRemoveFileChange = (e : any) => {
		console.log('e', e);
		// uploadFileList.value = uploadFileList.value.filter((item : any) => item.uid !== e.file.uid);
	}

	// 取消文件上传
	function handleCloseUploadFileShowChange() {
		uploadFileVisibleShow.value = false;
		uploadFileLoading.value = false;
		uploadImageForm.value.selectedId = null;
		uploadImageForm.value.selectedType = 0;
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
		const uploadPromises = uploadFileList.value.map(async (file : any) => {
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
			let queryParams : any = uploadImageForm.value.selectedType === 0 ? [
				{
					id: uploadImageForm.value.selectedId,
					devre1: '',
					devre2: '',
					devre3: ''
				}
			] : [
				{
					id: uploadImageForm.value.selectedId,
					devre5: '',
					devre6: '',
					devre7: ''
				}
			];
			if (uploadImageForm.value.selectedType === 0) {
				if (uploadFileList.value.length == 1) {
					queryParams[0].devre1 = uploadFileList.value[0].url;
					queryParams[0].devre2 = "";
					queryParams[0].devre3 = "";
				}
				if (uploadFileList.value.length == 2) {
					queryParams[0].devre1 = uploadFileList.value[0].url;
					queryParams[0].devre2 = uploadFileList.value[1].url;
					queryParams[0].devre3 = "";
				}
				if (uploadFileList.value.length == 3) {
					queryParams[0].devre1 = uploadFileList.value[0].url;
					queryParams[0].devre2 = uploadFileList.value[1].url;
					queryParams[0].devre3 = uploadFileList.value[2].url;
				}
			} else {
				if (uploadFileList.value.length == 1) {
					queryParams[0].devre5 = uploadFileList.value[0].url;
					queryParams[0].devre6 = "";
					queryParams[0].devre7 = "";
				}
				if (uploadFileList.value.length == 2) {
					queryParams[0].devre5 = uploadFileList.value[0].url;
					queryParams[0].devre6 = uploadFileList.value[1].url;
					queryParams[0].devre7 = "";
				}
				if (uploadFileList.value.length == 3) {
					queryParams[0].devre5 = uploadFileList.value[0].url;
					queryParams[0].devre6 = uploadFileList.value[1].url;
					queryParams[0].devre7 = uploadFileList.value[2].url;
				}
			}
			const data = await fetchUpdateAftersaleSnInfo(queryParams);
			const data1 = await fetchGetAftersaleSnInfo(uploadImageForm.value.selectedId);
			if (uploadImageForm.value.selectedType === 0) {
				model.siteFileList = [data1.devre1, data1.devre2, data1.devre3].filter(src => src).map(imageItem => {
					return {
						url: imageItem
					}
				});
			} else {
				model.analyzeFileList = [data1.devre5, data1.devre6, data1.devre7].filter(src => src).map(imageItem => {
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
	
	// 修改
	async function handleUpdateAftersaleSnChange(url: string) {
		updateLoading.value = true;
		uni.navigateTo({
			url,
			complete: () => {
				updateLoading.value = false;
			}
		})
	}

	// 删除售后
	async function handleDeleteAftersaleSnChange(id: any) {
		if (!model.canDeleteSn) {
			uni.showToast({
				icon: "none",
				title: "暂无删除售后设备权限，请联系管理员",
				duration: 2000
			})
			return false
		}
		try {
			message
				.confirm({
					msg: '确定要删除售后设备信息吗?',
					title: '提示',
					confirmButtonProps: {
						type: 'error',
					},
				})
				.then(async () => {
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
							const data = await fetchDeleteAftersaleSnInfo(id, resp.value);
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
	
	// 打开新的tab页
	function handleOpenNewTab(num: string) {
		if (!num) {
			return
		}
		if (!validateExpressCode(num)) {
			return
		}
		// #ifdef APP || APP-PLUS
		plus.runtime.openURL(`https://www.kuaidi100.com?nu=${encodeURIComponent(num)}`);
		// #endif
		
		// #ifdef H5
		window.open(`https://www.kuaidi100.com?nu=${encodeURIComponent(num)}`);
		// #endif
	}
	
	// 获取设备详情
	async function getDetailInfo() {
		const detailInfo = await fetchGetAftersaleSnInfo(model.id);
		if (detailInfo) {
			model.cid = detailInfo.hasOwnProperty('cid') ? detailInfo.cid : null;
			model.sn = detailInfo.hasOwnProperty('sn') ? detailInfo.sn : '';
			model.model = detailInfo.hasOwnProperty('model') ? detailInfo.model : '';
			model.details = detailInfo.hasOwnProperty('details') ? detailInfo.details : -1;
			model.accessory = detailInfo.hasOwnProperty('accessory') ? detailInfo.accessory : '';
			model.fault = detailInfo.hasOwnProperty('fault') ? detailInfo.fault : '';
			model.qrcode = detailInfo.hasOwnProperty('qrcode') ? detailInfo.qrcode : '';
			model.diagnosis = detailInfo.hasOwnProperty('diagnosis') ? detailInfo.diagnosis : '';
			model.tphand = detailInfo.hasOwnProperty('tphand') ? detailInfo.tphand : '';
			model.impv = detailInfo.hasOwnProperty('impv') ? detailInfo.impv : '';
			model.conc = detailInfo.hasOwnProperty('conc') ? detailInfo.conc : -1;
			model.returnnum = detailInfo.hasOwnProperty('returnnum') ? detailInfo.returnnum : '';
			model.rdbtime = detailInfo.hasOwnProperty('rdbtime') ? detailInfo.rdbtime : '';
			model.rcreater = detailInfo.hasOwnProperty('rcreater') ? detailInfo.rcreater : null;
			model.rsn = detailInfo.hasOwnProperty('rsn') ? detailInfo.rsn : '';
			model.rmodel = detailInfo.hasOwnProperty('rmodel') ? detailInfo.rmodel : '';
			model.rdetails = detailInfo.hasOwnProperty('rdetails') ? detailInfo.rdetails : -1;
			model.raccessory = detailInfo.hasOwnProperty('raccessory') ? detailInfo.raccessory : '';
			model.devnotes = detailInfo.hasOwnProperty('devnotes') ? detailInfo.devnotes : '';
			model.duration = detailInfo.hasOwnProperty('duration') ? detailInfo.duration : '';
			model.devre1 = detailInfo.hasOwnProperty('devre1') ? detailInfo.devre1 : '';
			model.devre2 = detailInfo.hasOwnProperty('devre2') ? detailInfo.devre2 : '';
			model.devre3 = detailInfo.hasOwnProperty('devre3') ? detailInfo.devre3 : '';
			model.devre4 = detailInfo.hasOwnProperty('devre4') ? detailInfo.devre4 : '';
			model.devre5 = detailInfo.hasOwnProperty('devre5') ? detailInfo.devre5 : '';
			model.devre6 = detailInfo.hasOwnProperty('devre6') ? detailInfo.devre6 : '';
			model.devre7 = detailInfo.hasOwnProperty('devre7') ? detailInfo.devre7 : '';
			model.devre8 = detailInfo.hasOwnProperty('devre8') ? detailInfo.devre8 : '';
			model.devre9 = detailInfo.hasOwnProperty('devre9') ? detailInfo.devre9 : '';
			model.devre10 = detailInfo.hasOwnProperty('devre10') ? detailInfo.devre10 : '';
			model.devre11 = detailInfo.hasOwnProperty('devre11') ? detailInfo.devre11 : '';
			model.devre12 = detailInfo.hasOwnProperty('devre12') ? detailInfo.devre12 : '';
			model.manu = detailInfo.hasOwnProperty('manu') ? detailInfo.manu : -1;
			model.list = detailInfo.hasOwnProperty('list') ? detailInfo.list : [];
			model.qrcodeList = [model.qrcode].filter(src => src).map(imageItem => {
				return {
					url: imageItem
				}
			});
			model.siteFileList = [model.devre1, model.devre2, model.devre3].filter(src => src).map(imageItem => {
				return {
					url: imageItem
				}
			});
			model.videoFileList = [model.devre4].filter(src => src).map(imageItem => {
				return {
					url: imageItem
				}
			});
			model.analyzeFileList = [model.devre5, model.devre6, model.devre7].filter(src => src).map(imageItem => {
				return {
					url: imageItem
				}
			});
			model.canUpdateSn = hasPermission('aftermarket:update:permission.do');
			model.canDeleteSn = hasPermission('aftermarket:delete:permission.do');
			model.canInsertMiddle = hasPermission('aftermarket:middle:insert');
			model.canDeleteMiddle = hasPermission('aftermarket:middle:delete');
			model.aftersalesReason = formatReNames(model.list);
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
	
	// 打开诊断结论、临时处理、长期改善弹框
	function handleUpdateCheckChange(item: any, name: string) {
		diagnosisCheckForm.selectedId = item.id;
		diagnosisCheckForm.selectType = name;
		diagnosisCheckForm.selectTypeName = name === 'diagnosis' ? '诊断结论' : name === 'tphand' ? '临时处理' : name === 'impv' ? '长期改善' : '诊断结论';
		diagnosisCheckForm.diagnosisCheckValue = item[name] || "";
		diagnosisCheckLoading.value = false;
		diagnosisCheckShow.value = true;
	}
	
	// 关闭诊断结论、临时处理、长期改善弹框
	function handleCancelDiagnosisCheckChange() {
		diagnosisCheckShow.value = false;
		diagnosisCheckLoading.value = false;
		diagnosisCheckForm.selectedId = null;
		diagnosisCheckForm.selectType = "";
		diagnosisCheckForm.selectTypeName = "";
		diagnosisCheckForm.diagnosisCheckValue = "";
	}
	
	async function handleSubmitDiagnosisCheckChange() {
		try {
			let queryParams = [{
				id: diagnosisCheckForm.selectedId,
				[diagnosisCheckForm.selectType]: diagnosisCheckForm.diagnosisCheckValue 
			}];
			diagnosisCheckLoading.value = true;
			const data = await fetchUpdateAftersaleSnInfo(queryParams);
			const data1 = await fetchGetAftersaleSnInfo(diagnosisCheckForm.selectedId);
			model[diagnosisCheckForm.selectType] = data1[diagnosisCheckForm.selectType];
			uni.showToast({
				icon: "none",
				title: "修改成功",
				duration: 1500,
				complete: () => {
					diagnosisCheckLoading.value = false;
					diagnosisCheckShow.value = false;
					diagnosisCheckForm.selectedId = null;
					diagnosisCheckForm.selectType = "";
					diagnosisCheckForm.selectTypeName = "";
					diagnosisCheckForm.diagnosisCheckValue = "";
				}
			})
		} catch (error) {
			console.log('error', error);
			diagnosisCheckLoading.value = false;
		}
	}
	
	// 修改是否推送厂家
	async function handleUpdatePushManuChange() {
		pushManuForm.selectedId = model.id;
		pushManuForm.selectManu = model.manu === -1 ? 0 : model.manu;
		pushManuLoading.value = false;
		pushManuShow.value = true;
	}
	
	// 取消推送厂家
	function handleCancelPushMenuChange() {
		pushManuShow.value = false;
		pushManuLoading.value = false;
		pushManuForm.selectedId = null;
		pushManuForm.selectManu = 0;
	}
	
	// 确认推送厂家
	async function handleSubmitPushMenuChange() {
		try {
			pushManuLoading.value = true;
			const data = await fetchUpdateAftersaleSnInfo([{ id: pushManuForm.selectedId, manu: pushManuForm.selectManu }]);
			const data1 = await fetchGetAftersaleSnInfo(pushManuForm.selectedId);
			model.manu = data1.manu;
			uni.showToast({
				icon: "none",
				title: "修改成功",
				duration: 1500,
				complete: () => {
					pushManuLoading.value = false;
					pushManuShow.value = false;
					pushManuForm.selectedId = null;
					pushManuForm.selectManu = 0;
				}
			})
		} catch (error) {
			//TODO handle the exception
			pushManuLoading.value = false;
		}
	}
	
	// 跳转
	function handleJumpPageChange(url: string) {
		uni.navigateTo({
			url
		})
	}

	// 重新计算 .topFixedWrap 的真实高度（像素）
	function recalcTopFixedHeight() {
		// use createSelectorQuery 获取真实高度（适配小程序/APP/H5）
		try {
			uni.createSelectorQuery()
				.select('.topFixedWrap')
				.boundingClientRect((rect : any) => {
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

	onLoad((options: any) => {
		if (JSON.stringify(options) !== '{}') {
			model.id = options.aid;
			getDetailInfo();
		}
	});

	onReady(() => {
		recalcTopFixedHeight();
	})
	
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

		<view class="topFixedWrap" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-navbar left-arrow title="售后设备详情" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft"></wd-navbar>
		</view>

		<view :style="{ backgroundColor: isDark ? '#1B1B1B' : '#FFFFFF', borderRadius: '20px', margin: '10px', overflowX: 'hidden' }">
			<view class="aftersaleItem">
				<view class="left">
					设备编号
				</view>
				<view class="right">
					{{ model.sn }}
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					设备型号
				</view>
				<view class="right">
					{{ model.model }}
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					寄回类型
				</view>
				<view class="right">
					{{ model.details === 0 ? '仅裸机' : model.details === 1 ? '含配件' : '未知' }}
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					寄回配件详情
				</view>
				<view class="right">
					{{ model.accessory }}
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					故障现象
				</view>
				<view class="right">
					{{ model.fault }}
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					售后原因
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<wd-text :text="model.aftersalesReason" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					<wd-icon v-if="model.canUpdateSn || model.canInsertMiddle || model.canDeleteMiddle" name="edit-outline" size="18px"
						@click.stop="handleJumpPageChange('/mePages/updaterenames/Index?sid=' + model.id)"></wd-icon>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					诊断结论
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<wd-text :text="model.diagnosis" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					<wd-icon v-if="model.canUpdateSn" name="edit-outline" size="18px"
						@click.stop="handleUpdateCheckChange(model, 'diagnosis')"></wd-icon>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					临时处理
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<wd-text :text="model.tphand" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					<wd-icon v-if="model.canUpdateSn" name="edit-outline" size="18px"
						@click.stop="handleUpdateCheckChange(model, 'tphand')"></wd-icon>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					长期改善
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<wd-text :text="model.impv" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
					<wd-icon v-if="model.canUpdateSn" name="edit-outline" size="18px"
						@click.stop="handleUpdateCheckChange(model, 'impv')"></wd-icon>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					处理结论
				</view>
				<view class="right">
					<wd-tag type="primary" plain round>
						{{ model.conc === 0 ? '质保维修返回' : model.conc === 1 ? '整体置换返回' : model.conc === 2 ? '报废' : model.conc === 3 ? '付费维修返回' : model.conc === 4 ? '原件返回' : model.conc === 9 ? '其他' : '未知' }}
					</wd-tag>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					是否推送厂家
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<wd-tag :type="model.manu === 1 ? 'success' : 'danger'" plain round>
						{{ model.manu === 1 ? '是' : '否' }}
					</wd-tag>
					<wd-icon v-if="model.canUpdateSn" name="edit-outline" size="18px" @click="handleUpdatePushManuChange"></wd-icon>
				</view>
			</view>
			
			<view class="aftersaleItem">
				<view class="left">
					发货信息
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<wd-text type="primary" :text="model.returnnum" @click="handleOpenNewTab(model.returnnum)"></wd-text>
					<wd-icon v-if="model.canUpdateSn" name="edit-outline" size="18px" @click.stop="handleUpdateReceiptOrRreceiptChange(model)"></wd-icon>
					<wd-icon v-if="model.returnnum" name="file-copy" :color="isDark ? '#ffffff' : '#000000'" custom-style="margin-left: 20rpx;" @click="handleCopyChange(model.returnnum)" />
				</view>
			</view>
			
			<view v-if="model.returnnum">
				<view class="aftersaleItem">
					<view class="left">
						发货时间
					</view>
					<view class="right">
						{{ model.rdbtime }}
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						发货网关编号
					</view>
					<view class="right">
						{{ model.rsn }}
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						发货网关型号
					</view>
					<view class="right">
						{{ model.rmodel }}
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						发货是否包含配件
					</view>
					<view class="right">
						{{ model.rdetails === 0 ? '仅裸机' : model.rdetails === 1 ? '含配件' : '未知' }}
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						发货配件详情
					</view>
					<view class="right">
						{{ model.raccessory }}
					</view>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					备注
				</view>
				<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
					<view>{{ model.devnotes }}</view>
					<wd-icon v-if="model.canUpdateSn" name="edit-outline" size="18px" @click.stop="handleUpdateNotesChange(handleUpdateNotesChange)"></wd-icon>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					处理时长
				</view>
				<view class="right">
					{{ model.duration ? (model.conc === -1 ? '已历时: ' + model.duration : '总耗时: ' + model.duration) : '' }}
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					设备二维码照片
				</view>
				<view class="right">
					<wd-upload v-if="model.qrcodeList.length > 0" :limit="1" :file-list="model.qrcodeList" image-mode="aspectFill" disabled></wd-upload>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					现场照片
				</view>
				<view class="right">
					<wd-upload v-if="model.siteFileList.length > 0" :limit="model.siteFileList.length" :file-list="model.siteFileList" image-mode="aspectFill" disabled></wd-upload>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					现场视频
				</view>
				<view class="right">
					<wd-upload v-if="model.videoFileList.length > 0" :limit="model.videoFileList.length" :file-list="model.videoFileList" image-mode="aspectFill" disabled></wd-upload>
				</view>
			</view>
			<view class="aftersaleItem">
				<view class="left">
					分析照片
				</view>
				<view class="right" style="display: flex; flex-direction: column; justify-content: center; gap: 20rpx 0;">
					<wd-upload v-if="model.analyzeFileList.length > 0" :limit="model.analyzeFileList.length" :file-list="model.analyzeFileList" image-mode="aspectFill" disabled></wd-upload>
					<view v-if="model.canUpdateSn" style="color: #4d80f0" @click="handleUpdatePictureShowChange(model, 1)">
						编辑分析照片
					</view>
				</view>
			</view>
			
			<wd-gap bg-color="#cccccc" height="2rpx" v-if="model.canUpdateSn || model.canDeleteSn"></wd-gap>

			<view :style="{ display: 'flex', justifyContent: 'flex-end', padding: '10rpx 30rpx 15rpx 0', gap: '0 10rpx', background: isDark ? '#1b1b1b' : '#ffffff' }" v-if="model.canUpdateSn || model.canDeleteSn">
				<wd-button :loading="updateLoading" v-if="model.canUpdateSn" size="small" type="primary" @click.stop="handleUpdateAftersaleSnChange('/mePages/updateaftersaledevice/Index?id=' + model.id)">修改</wd-button>
				<wd-button v-if="model.canDeleteSn" size="small" type="error" @click.stop="handleDeleteAftersaleSnChange(model.id)">删除</wd-button>
			</view>
		</view>

		<wd-popup :z-index="99" v-model="receiptShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text text="填写寄出信息" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			<wd-form ref="receiptForm" :model="receiptModel" :rules="receiptRules">
				<wd-input label="寄出信息" label-width="100px" prop="receipt" required clearable
					v-model="receiptModel.receipt" placeholder="请输入客户寄出信息" />
				<wd-input label="寄出设备编号" label-width="100px" prop="rsn" required clearable
					v-model="receiptModel.rsn" placeholder="请输入寄出设备编号" />	
				<wd-cell title="寄件类型">
					<wd-radio-group v-model="receiptModel.rdetails" inline shape="dot">
						<wd-radio :value="0">仅裸机</wd-radio>
						<wd-radio :value="1">含配件</wd-radio>
					</wd-radio-group>
				</wd-cell>
				<wd-textarea label="寄件配件详情" label-width="100px" type="textarea" prop="raccessory" clearable v-if="receiptModel.rdetails === 1"
					v-model="receiptModel.raccessory" placeholder="请输入寄件配件详情"
					:rules="[{ required: receiptModel.rdetails === 0 ? false : true, message: '请输入寄件配件详情' }]" />

				<view class="footer">
					<wd-button hairline type="info" @click="handleCancelReceiptShowChange" block>取消</wd-button>
					<wd-button hairline type="primary" :loading="receiptLoading" @click="handleSubmitReceiptShowChange"
						block>确认</wd-button>
				</view>
			</wd-form>
		</wd-popup>
		
		<!-- 是否推送厂家 -->
		<wd-popup :z-index="99" position="bottom" v-model="pushManuShow" custom-style="padding: 20rpx; height: 400rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text text="是否推送厂家" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			
			<wd-form :model="pushManuForm">
				<wd-picker :columns="pushManuList" label="是否推送厂家" v-model="pushManuForm.selectManu" align-right label-key="name" value-key="value" />

			    <view class="footer" style="margin-top: 180rpx;">
					<wd-button hairline type="info" @click="handleCancelPushMenuChange" block>取消</wd-button>
			        <wd-button hairline type="primary" :loading="pushManuLoading" @click="handleSubmitPushMenuChange" block>确认</wd-button>
			    </view>
			</wd-form>
		</wd-popup>

		<wd-popup closable :safe-area-inset-bottom="true"
			:custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="uploadFileVisibleShow"
			position="left" @close="handleCloseUploadFileShowChange">
			<wd-gap height="70rpx" />

			<view style="padding: 20rpx;">
				<view style="margin-bottom: 20rpx;">
					<wd-text :text="uploadImageForm.selectedType === 0 ? '现场照片' : '分析照片'" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</view>

				<wd-upload accept="image" :limit="3" multiple
					v-model:file-list="uploadFileList" image-mode="aspectFill" :upload-method="handleCustomUploadChange"
					@remove="handleRemoveFileChange"></wd-upload>

				<wd-button block type="primary" :loading="uploadFileLoading"
					@click="handleUploadfileSubmitChange">确定</wd-button>
			</view>
		</wd-popup>
		
		<!-- 诊断结论、临时处理、长期改善 -->
		<wd-popup :z-index="99" v-model="diagnosisCheckShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text :text="'填写' + diagnosisCheckForm.selectTypeName" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			<wd-form ref="diagnosisCheckRef" :model="diagnosisCheckForm" :rules="diagnosisCheckFormRules">
				<wd-textarea :label="diagnosisCheckForm.selectTypeName" label-width="100px" type="textarea" prop="diagnosisCheckValue" clearable
					v-model="diagnosisCheckForm.diagnosisCheckValue" :placeholder="'请输入' + diagnosisCheckForm.selectTypeName" />
				
				<view class="footer">
					<wd-button hairline type="info" @click="handleCancelDiagnosisCheckChange" block>取消</wd-button>
					<wd-button hairline type="primary" :loading="diagnosisCheckLoading" @click="handleSubmitDiagnosisCheckChange" block>确认</wd-button>
				</view>
			</wd-form>
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

	:deep(.wd-radio-group) {
		padding-top: 0 !important;
		padding-bottom: 20rpx !important;
		overflow: auto !important;

		.wd-radio {
			width: auto !important;
		}
	}
	
	.radioCellWrap {
	    padding: 10rpx 20rpx !important;
		
		:deep(.wd-radio) {
		    margin-right: 0 !important;
		}
		
		:deep(.wd-radio__label) {
			width: calc(100% - 60rpx) !important;
			text-align: left !important;
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
		flex-wrap: wrap;
		padding: 10rpx 0;
	}
	
	.flexLayoutItem {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		gap: 10rpx 0;
		width: calc(100% - 80rpx);
		word-break: break-all;
	}
	
	.aftersaleItem {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		padding: 20rpx 20rpx 20rpx;
		
		.left {
			width: 220rpx;
			font-size: 28rpx;
		}
		
		.right {
			font-size: 28rpx;
			font-weight: bolder;
			width: calc(100% - 240rpx);
			text-align: right;
			word-break: break-all;
		}
	}
	
	.btn-wrapper {
		display: flex;
		justify-content: flex-end;
		padding: 10rpx 30rpx 15rpx 0;
		gap: 0 10rpx;
		background: #ffffff;
	}
	
	.btn-wrapper.dark {
		background: #1b1b1b;
	}
	
	.fake-btn {
		padding: 8rpx 24rpx;
		font-size: 26rpx;
		border-radius: 32rpx;
		line-height: 1.4;
		text-align: center;
		white-space: nowrap;
		user-select: none;
		transition: opacity 0.15s, transform 0.1s;
	}
	
	/* 主按钮 */
	.fake-btn.primary {
		background-color: #3a7afe;
		color: #ffffff;
	}
	
	/* 危险按钮 */
	.fake-btn.danger {
		background-color: #ff4d4f;
		color: #ffffff;
	}
	
	/* 点击态 */
	.fake-btn:active {
		opacity: 0.75;
		transform: scale(0.96);
	}
</style>