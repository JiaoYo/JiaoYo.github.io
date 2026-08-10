<script lang="ts" setup>
	import { throttle } from "@/utils/debounce";
	import { useToast, useMessage } from 'wot-design-uni';
	import { FormRules } from 'wot-design-uni/components/wd-form/types';
	import { reactive, ref, onMounted, computed, nextTick } from 'vue';
	import { useI18n } from 'vue-i18n';
	import { copyText } from '@/utils/copyText';
	import { uploadFile } from '@/utils/uploadFile';
	import { getSystemDate, hasPermission, validateExpressCode } from '@/utils/index';
	import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
	import { useTheme } from '@/composables/theme/theme';
	import { fetchGetAftersaleCompDataList, fetchGetInterfaceDataList, fetchGetAftersaleSnAndDeviceDataList, fetchGetAftersaleSnInfo, fetchUpdateAftersaleSnInfo, fetchDeleteAftersaleSnInfo, fetchGetAftersaleCompInfo, fetchGetAftersaleReasonDataList } from '@/service/index';
	import type { UploadMethod, UploadFile } from '@/uni_modules/wot-design-uni/components/wd-upload/types'

	const { t } = useI18n();

	const { themeVars, theme } = useTheme();

	const message = useMessage();
	
	const clickLock = ref<boolean>(false);

	const isDark = computed(() => theme.value === 'dark');

	const state = ref<any>('loading');
	const dataList = ref<any[]>([]);
	const scrollTop = ref<number>(0);
	const userId = ref<number>(uni.getStorageSync('userId'));
	const userType = ref<number>(uni.getStorageSync('usertype'));
	// 顶部固定区域高度（px）
	const topFixedHeight = ref<number>(0);

	// 更多过滤条件是否显示
	const moreFilterVisible = ref<boolean>(false);
	
	// 类型选择
	const selectCheckboxed = ref<any[]>([]);
	
	// 起止时间
	const rangeTime = ref<any[]>([]);

	// 状态选择
	const selectedConc = ref<number>(-1);

	// 备注
	const updateNote = ref<string>('');
	
	// 密码
	const password = ref<string>('');
	
	const canUpdateSn = ref<boolean>(hasPermission('aftermarket:update:permission.do'));
	const canDeleteSn = ref<boolean>(hasPermission('aftermarket:delete:permission.do'));
	const canInsertMiddle = ref<boolean>(hasPermission('aftermarket:middle:insert'));
	const canDeleteMiddle = ref<boolean>(hasPermission('aftermarket:middle:delete'));

	// 物流信息弹框
	const receiptShow = ref<boolean>(false);
	const receiptLoading = ref<boolean>(false);
	const receiptForm = ref(null);
	const receiptModel = ref<{
		selectedId : any;
		selectedIndex : number;
		receipt : string;
		rsn: string;
		rdetails : number;
		raccessory : string;
	}>({
		selectedId: null,
		selectedIndex: 0,
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
		selectedIndex : number;
	}>({
		selectedId: null,
		selectedType: 0,
		selectedIndex: 0,
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
	
	// 客户公司弹框
	const comapnyShow = ref<boolean>(false);
	const companyTriggered = ref<boolean>(false);
	
	// 网关型号弹框
	const modelShow = ref<boolean>(false);
	const modelTriggered = ref<boolean>(false);
	
	// 售后原因弹框
	const reidShow = ref<boolean>(false);
	const reidTriggered = ref<boolean>(false);
	
	// 诊断结论、临时处理、长期改善弹框
	const diagnosisCheckShow = ref<boolean>(false);
	const diagnosisCheckLoading = ref<boolean>(false);
	const diagnosisCheckForm = reactive<{
		selectedId: any;
		selectTypeIndex: number;
		selectType: string;
		selectTypeName: string;
		diagnosisCheckValue: string;
	}>({
		selectedId: null,
		selectTypeIndex: 0,
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
	const manuShow = ref<boolean>(false);
	const manuLoading = ref<boolean>(false);
	const manuModel = ref<{
		selectId: any;
		selectIndex: number;
		selectManu: number;
	}>({
		selectId: null,
		selectIndex: 0,
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

	const model = reactive<{
		page: number;
		limit: number;
		total: number;
		sn: string;
		companyName: string;
		companyPage: number;
		companyLimit: number;
		companyTotal: number;
		companyFuzzy: string;
		checkedCompany: any;
		companyDataList: any;
		modelPage: number;
		modelLimit: number;
		modelTotal: number;
		modelFuzzy: string;
		checkedModelNames: string;
		checkedModel: any;
		modelDataList: any;
		reidPage: number;
		reidLimit: number;
		reidTotal: number;
		reidFuzzy: string;
		checkedReidNames: string;
		checkedReid: null;
		reidDataList: any;
	}>({
		page: 1,
		limit: 20,
		total: 0,
		sn: '',
		companyName: '',
		companyPage: 1,
		companyLimit: 100,
		companyTotal: 0,
		companyFuzzy: '',
		companyDataList: [],
		modelPage: 1,
		modelLimit: 100,
		modelTotal: 0,
		modelFuzzy: '',
		checkedModelNames: '',
		checkedModel: [],
		modelDataList: [],
		reidPage: 1,
		reidLimit: 100,
		reidTotal: 0,
		reidFuzzy: '',
		checkedReidNames: '',
		checkedReid: null,
		reidDataList: []
	})

	function handleClickLeft() {
		// #ifdef H5
		history.go(-1);
		// #endif

		// #ifndef H5
		uni.navigateBack();
		// #endif
	}
	
	// 清空选中的客户公司
	function handleClearCompanyChange() {
		model.checkedCompany = null;
		model.companyName = "";
		model.page = 1;
		getDataList();
	}
	
	// 打开弹出层(客户公司)
	function handleLinkCompanyShowChange() {
	    comapnyShow.value = true;
	}
	
	// 清除(客户公司)
	function handleClearCompanyFuzzyChange() {
		model.companyPage = 1;
		getCompanyDataList();
	}
	
	// 搜索(客户公司)
	function handleSearchComapnyFuzzyChange() {
		model.companyPage = 1;
		getCompanyDataList();
	}
	
	// 获取分页数据(客户公司)
	async function getCompanyDataList() {
	    if (model.companyPage === 1) {
	        model.companyDataList = [];
	    }
	    try {
	        const data = await fetchGetAftersaleCompDataList({ page: model.companyPage, limit: model.companyLimit, cname: model.companyFuzzy });
	        model.companyTotal = Number(data.total);
	        model.companyDataList = model.companyDataList.concat(data.list);
	    } catch (error) {
	        console.error('获取客户公司数据失败', error);
	    }
	}
	
	// 刷新(客户公司)
	function handleScrollRefreshCompanyChange() {
	    companyTriggered.value = true;
	    model.companyPage = 1;
	    getCompanyDataList();
	    setTimeout(() => {
	        companyTriggered.value = false;
	        console.log('刷新完成');
	    }, 1000)
	}
	
	// 滚动到底部(客户公司)
	function handleScrolltolowerCompanyChange(e: any) {
	    console.log('e', e);
	    if (e.detail.direction === 'bottom' && model.companyDataList.length < model.companyTotal) {
	        model.companyPage++;
	        getCompanyDataList();
	    }
	}
	
	// 关闭弹出层(客户公司)
	function handleCloseCompanyChange() {
	    comapnyShow.value = false;
	}
	
	// 选择客户公司(客户公司)
	function handleRadioCompanySelectChange({ value }: { value: any }) {
	    console.log('value', value);
	    model.checkedCompany = value;
		model.companyName = model.companyDataList.find((item: any) => item.id === value).comp || '';
		comapnyShow.value = false;
		model.page = 1;
		getDataList();
	}
	
	// 清空选中的网关型号
	function handleClearModelChange() {
		model.checkedModel = [];
		model.checkedModelNames = "";
		model.page = 1;
		getDataList();
	}
	
	// 打开弹出层(网关型号)
	function handleLinkModelShowChange() {
	    modelShow.value = true;
	}
	
	// 清除(网关型号)
	function handleClearModelFuzzyChange() {
		model.modelPage = 1;
		getModelDataList();
	}
	
	// 搜索(网关型号)
	function handleSearchModelFuzzyChange() {
		model.modelPage = 1;
		getModelDataList();
	}
	
	// 获取分页数据(网关型号)
	async function getModelDataList() {
	    if (model.modelPage === 1) {
	        model.modelDataList = [];
	    }
	    try {
	        const data = await fetchGetInterfaceDataList({ page: model.modelPage, limit: model.modelLimit, fuzzy: model.companyFuzzy });
	        model.modelTotal = Number(data.total);
	        model.modelDataList = model.modelDataList.concat(data.list);
	    } catch (error) {
	        console.error('获取网关型号数据失败', error);
	    }
	}
	
	// 刷新(网关型号)
	function handleScrollRefreshModelChange() {
	    modelTriggered.value = true;
	    model.modelPage = 1;
	    getModelDataList();
	    setTimeout(() => {
	        modelTriggered.value = false;
	        console.log('刷新完成');
	    }, 1000)
	}
	
	// 滚动到底部(网关型号)
	function handleScrolltolowerModelChange(e: any) {
	    console.log('e', e);
	    if (e.detail.direction === 'bottom' && model.modelDataList.length < model.modelTotal) {
	        model.modelPage++;
	        getModelDataList();
	    }
	}
	
	// 关闭弹出层(网关型号)
	function handleCloseModelChange() {
	    modelShow.value = false;
	}
	
	// 选择网关型号(网关型号)
	// function handleRadioModelSelectChange({ value }: { value: any }) {
	//     console.log('value', value);
	//     model.checkedModel = value;
	// 	model.checkedModelNames = value;
	// 	modelShow.value = false;
	// 	model.page = 1;
	// 	getDataList();
	// }
	function handleCheckModelSelectChange({ value }: { value: any }) {
	    console.log('value', value);
		model.checkedModelNames = value.length > 0 ? value.join(",") : "";
		model.page = 1;
		getDataList();
		// modelShow.value = false;
	}
	
	// 清空选中的售后原因
	function handleClearReidChange() {
		model.checkedReid = null;
		model.checkedReidNames = "";
		model.page = 1;
		getDataList();
	}
	
	// 打开弹出层(售后原因)
	function handleLinkReidShowChange() {
	    reidShow.value = true;
	}
	
	// 清除(售后原因)
	function handleClearReidFuzzyChange() {
		model.reidPage = 1;
		getCompanyDataList();
	}
	
	// 搜索(售后原因)
	function handleSearchReidFuzzyChange() {
		model.reidPage = 1;
		getCompanyDataList();
	}
	
	// 获取分页数据(售后原因)
	async function getReidDataList() {
	    if (model.reidPage === 1) {
	        model.reidDataList = [];
	    }
	    try {
	        const data = await fetchGetAftersaleReasonDataList({ page: model.reidPage, limit: model.reidLimit, fuzzy: model.reidFuzzy });
	        model.reidTotal = Number(data.total);
	        model.reidDataList = model.reidDataList.concat(data.list);
	    } catch (error) {
	        console.error('获取售后原因数据失败', error);
	    }
	}
	
	// 刷新(售后原因)
	function handleScrollRefreshReidChange() {
	    reidTriggered.value = true;
	    model.reidPage = 1;
	    getReidDataList();
	    setTimeout(() => {
	        reidTriggered.value = false;
	        console.log('刷新完成');
	    }, 1000)
	}
	
	// 滚动到底部(售后原因)
	function handleScrolltolowerReidChange(e: any) {
	    console.log('e', e);
	    if (e.detail.direction === 'bottom' && model.reidDataList.length < model.reidTotal) {
	        model.reidPage++;
	        getReidDataList();
	    }
	}
	
	// 关闭弹出层(售后原因)
	function handleCloseReidChange() {
	    reidShow.value = false;
	}
	
	// 选择售后原因(售后原因)
	function handleRadioReidSelectChange({ value }: { value: any }) {
	    console.log('value', value);
	    model.checkedReid = value;
		model.checkedReidNames = model.reidDataList.find((item: any) => item.id === value).rs || '';
		reidShow.value = false;
		model.page = 1;
		getDataList();
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
	
	// 清除起止时间
	function handleClearRangeTimeChange() {
		rangeTime.value = [];
		handleSearchChange();
	}

	// 获取售后列表信息
	const getDataList = throttle(async () => {
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
			let queryParams : any = { page: model.page, limit: userType.value === 7 ? model.limit : 10 };
			if (model.checkedCompany) {
				queryParams['cid'] = model.checkedCompany;
			}
			if (model.checkedModelNames) {
				queryParams['gws'] = model.checkedModelNames;
			}
			if (model.checkedReid) {
				queryParams['reid'] = model.checkedReid;
			}
			if (model.sn) {
				queryParams['sn'] = model.sn;
			}
			if (selectedConc.value !== -1) {
				queryParams['conc'] = selectedConc.value;
			}
			if (rangeTime.value.length > 0) {
				queryParams['startTime'] = rangeTime.value.length > 0 ? rangeTime.value[0] ? getSystemDate(1, rangeTime.value[0]) : null : null;
				queryParams['endTime'] = rangeTime.value.length > 0 ? rangeTime.value[1] ? getSystemDate(1, rangeTime.value[1]) : null : null;
			}
			if (selectCheckboxed.value.length > 0) {
				queryParams['pending'] = 1;
			}
			const data = await fetchGetAftersaleSnAndDeviceDataList(queryParams);
			dataList.value = dataList.value.concat(data.list.map((item : any) => {
				return {
					...item,
					aftersalesReason: item.hasOwnProperty('list') ? formatReNames(item.list) : '',
					qrcodeList: [item.qrcode].filter(src => src).map(imageItem => {
						return {
							url: imageItem
						}
					}),
					siteFileList: [item.devre1, item.devre2, item.devre3].filter(src => src).map(imageItem => {
						return {
							url: imageItem
						}
					}),
					videoFileList: [item.devre4].filter(src => src).map(imageItem => {
						return {
							url: imageItem
						}
					}),
					analyzeFileList: [item.devre5, item.devre6, item.devre7].filter(src => src).map(imageItem => {
						return {
							url: imageItem
						}
					})
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
	}, 1000, { leading: true, trailing: true })
	
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
		receiptModel.value.receipt = item.returnnum;
		receiptModel.value.rsn = item.hasOwnProperty('rsn') ? item.rsn : '';
		receiptModel.value.selectedIndex = index;
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
		receiptModel.value.selectedIndex = 0;
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
						if (!hasPermission('aftermarket:update:permission.do')) {
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
								dataList.value[receiptModel.value.selectedIndex].returnnum = data1.returnnum;
								dataList.value[receiptModel.value.selectedIndex].rdbtime = data1.rdbtime;
								dataList.value[receiptModel.value.selectedIndex].rsn = data1.rsn;
								dataList.value[receiptModel.value.selectedIndex].rmodel = data1.rmodel;
								dataList.value[receiptModel.value.selectedIndex].rdetails = data1.rdetails;
								dataList.value[receiptModel.value.selectedIndex].raccessory = data1.raccessory;
								receiptModel.value.selectedId = null;
								receiptModel.value.receipt = null;
								receiptModel.value.rsn = "";
								receiptModel.value.rdetails = null;
								receiptModel.value.raccessory = null;
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
			.catch((error : any) => {
				console.log(error, 'error');
			});
	}

	// 填写备注
	function handleUpdateNotesChange(item: any, index: number) {
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
					dataList.value[index].devnotes = data1.devnotes;
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
		uploadFileList.value = type === 0 ? item.siteFileList : item.analyzeFileList;
		uploadFileVisibleShow.value = true;
	}

	const handleCustomUploadChange : UploadMethod = (file: any, formData: any, options: any) => {
		// file.status = "success";
		// uploadFileList.value.push(file);
		options.onSuccess(file.url, file, formData);
	}

	const handleRemoveFileChange = (e: any) => {
		console.log('e', e);
		// uploadFileList.value = uploadFileList.value.filter((item : any) => item.uid !== e.file.uid);
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
				dataList.value[uploadImageForm.value.selectedIndex].siteFileList = [data1.devre1, data1.devre2, data1.devre3].filter(src => src).map(imageItem => {
					return {
						url: imageItem
					}
				});
			} else {
				dataList.value[uploadImageForm.value.selectedIndex].analyzeFileList = [data1.devre5, data1.devre6, data1.devre7].filter(src => src).map(imageItem => {
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
		if (clickLock.value) return;
		clickLock.value = true;
		uni.navigateTo({
			url,
			complete: () => {
				clickLock.value = false;
			}
		})
	}

	// 删除售后
	async function handleDeleteAftersaleSnChange(id: any) {
		if (!hasPermission('aftermarket:delete:permission.do')) {
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
	
	// 打开诊断结论、临时处理、长期改善弹框
	function handleUpdateCheckChange(item: any, index: number, name: string) {
		diagnosisCheckForm.selectedId = item.id;
		diagnosisCheckForm.selectTypeIndex = index;
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
		diagnosisCheckForm.selectTypeIndex = 0;
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
			dataList.value[diagnosisCheckForm.selectTypeIndex][diagnosisCheckForm.selectType] = data1[diagnosisCheckForm.selectType];
			uni.showToast({
				icon: "none",
				title: "修改成功",
				duration: 1500,
				complete: () => {
					diagnosisCheckLoading.value = false;
					diagnosisCheckShow.value = false;
					diagnosisCheckForm.selectedId = null;
					diagnosisCheckForm.selectTypeIndex = 0;
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
	async function handleUpdatePushManuChange(item: any, index: number) {
		manuModel.value.selectId = item.id;
		manuModel.value.selectIndex = 0;
		manuModel.value.selectManu = item.hasOwnProperty('manu') ? item.manu : 0;
		manuLoading.value = false;
		manuShow.value = true;
	}
	
	// 取消推送厂家
	function handleCancelManuChange() {
		manuShow.value = false;
		manuLoading.value = false;
		manuModel.value.selectId = null;
		manuModel.value.selectIndex = 0;
		manuModel.value.selectManu = 0;
	}
	
	// 确定提交厂家
	async function handleSubmitManuChange() {
		try {
			manuLoading.value = true;
			const data = await fetchUpdateAftersaleSnInfo([{ id: manuModel.value.selectId, manu: manuModel.value.selectManu }]);
			const data1 = await fetchGetAftersaleSnInfo(manuModel.value.selectId);
			dataList.value[manuModel.value.selectIndex].manu = data1.manu;
			uni.showToast({
				icon: "none",
				title: "修改成功",
				duration: 1500,
				complete: () => {
					manuShow.value = false;
					manuLoading.value = false;
					manuModel.value.selectId = null;
					manuModel.value.selectIndex = 0;
					manuModel.value.selectManu = 0;
				}
			})
		} catch (error) {
			//TODO handle the exception
			manuLoading.value = false;
		}
	}
	
	// 跳转
	function handleJumpPageChange(url: string) {
		if (clickLock.value) return;
		clickLock.value = true;
		uni.navigateTo({
			url,
			complete: () => {
				clickLock.value = false;
			}
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

	onLoad(async (options: any) => {
		if (JSON.stringify(options) !== '{}') {
			model.checkedCompany = Number(options.cid);
			const data = await fetchGetAftersaleCompInfo(model.checkedCompany);
			model.companyFuzzy = data.comp;
			model.companyName = data.comp;
			if (userType.value !== 7) {
				await getCompanyDataList();
			}
		} else {
			if (userType.value !== 7) {
				await getCompanyDataList();
			}
		}
		await getModelDataList();
		await getReidDataList();
		await getDataList();
		uni.$on('refreshListUpdateAftersaleSn', getDataList); // 监听刷新事件
	});

	onReady(() => {
		recalcTopFixedHeight();
	})

	onUnload(() => {
		uni.$off('refreshListUpdateAftersaleSn', getDataList); // 页面销毁时解绑
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

		<view class="topFixedWrap" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-navbar left-arrow title="售后设备" safe-area-inset-top placeholder :bordered="false"
				@click-left="handleClickLeft"></wd-navbar>
			<wd-search hide-cancel v-model="model.sn" placeholder="请输入设备编号"
				:placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索"
				@search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />	
			<view @click="handleMoreFilterChange"
				style="display: flex; align-items: center; gap: 0 10rpx; padding: 20rpx;">
				<view style="display: flex; align-items: center; gap: 0 10rpx;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">更多过滤条件</view>
					<wd-icon :name="moreFilterVisible ? 'arrow-up' : 'arrow-down'" size="20px"></wd-icon>
				</view>
			</view>
			<view v-if="moreFilterVisible">
				<view v-if="userType !== 7" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', border: '1px solid #cccccc', borderRadius: '40rpx', margin: '0 20rpx', padding: '5rpx 10rpx', width: 'calc(100vw - 60rpx)' }">
					<wd-input clearable disabled no-border v-model="model.companyName" placeholder="请选择客户公司" custom-style="padding-left: 10rpx;">
						<template #suffix>
							<view style="display: flex; align-items: center; gap: 0 10rpx;">
								<!-- <wd-icon v-if="model.companyName" name="close-circle" size="20px" @click="handleClearCompanyChange"></wd-icon> -->
								<wd-button icon="link" size="small" @click.stop="handleLinkCompanyShowChange">关联客户公司</wd-button>
							</view>
						</template>
					</wd-input>
				</view>
				<view style="border: 1px solid #cccccc; border-radius: 40rpx; margin: 20rpx 20rpx 0; padding: 5rpx 10rpx; width: calc(100vw - 60rpx);">
					<wd-input clearable disabled no-border v-model="model.checkedModelNames" placeholder="请选择网关型号" custom-style="padding-left: 10rpx;">
						<template #suffix>
							<view style="display: flex; align-items: center; gap: 0 10rpx;">
								<wd-icon v-if="model.checkedModelNames" name="close-circle" size="20px" @click="handleClearModelChange"></wd-icon>
								<wd-button icon="link" size="small" @click.stop="handleLinkModelShowChange">关联网关型号</wd-button>
							</view>
						</template>
					</wd-input>
				</view>
				<view style="border: 1px solid #cccccc; border-radius: 40rpx; margin: 20rpx 20rpx 0; padding: 5rpx 10rpx; width: calc(100vw - 60rpx);">
					<wd-input clearable disabled no-border v-model="model.checkedReidNames" placeholder="请选择售后原因" custom-style="padding-left: 10rpx;">
						<template #suffix>
							<view style="display: flex; align-items: center; gap: 0 10rpx;">
								<wd-icon v-if="model.checkedReid" name="close-circle" size="20px" @click="handleClearReidChange"></wd-icon>
								<wd-button icon="link" size="small" @click.stop="handleLinkReidShowChange">关联售后原因</wd-button>
							</view>
						</template>
					</wd-input>
				</view>
				<view style="display: flex; align-items: center; gap: 0 10rpx; padding: 20rpx 0 0 20rpx;">
				    <view style="width: 5px; height: 15px; background: #0055FE;"></view>
				    <view style="margin-left: 10rpx; font-weight: bolder;">快速查询</view>
				</view>
				<view style="padding: 20rpx 20rpx; width: calc(100vw - 40rpx);">
					<wd-checkbox-group v-model="selectCheckboxed" shape="button" @change="handleSearchChange">
						<wd-checkbox :modelValue="1">待厂家处理</wd-checkbox>
					</wd-checkbox-group>
				</view>
				<view v-if="userType !== 7" style="display: flex; align-items: center; gap: 0 10rpx; padding: 20rpx 0 0 20rpx;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">处理结论</view>
				</view>
				<scroll-view scroll-x style="background-color: #FFFFFF; margin-top: 20rpx;" v-if="userType !== 7">
					<wd-radio-group v-model="selectedConc" shape="button" cell inline style="display: flex; align-items: center; flex-wrap: nowrap;" @change="handleSearchChange">
						<wd-radio :value="-1">全部</wd-radio>
						<wd-radio :value="0">质保维修返回</wd-radio>
						<wd-radio :value="1">整体置换返回</wd-radio>
						<wd-radio :value="2">报废</wd-radio>
						<wd-radio :value="3">付费维修返回</wd-radio>
						<wd-radio :value="4">原件返回</wd-radio>
						<wd-radio :value="5">其他</wd-radio>
					</wd-radio-group>
				</scroll-view>
				
				<view style="display: flex; align-items: center; gap: 0 10rpx; padding: 20rpx 0 0 20rpx;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">起止时间</view>
				</view>
				<view style="display: flex; align-items: center; justify-content: space-between; width: calc(100vw - 40rpx);">
					<wd-datetime-picker use-second :z-index="9999" v-model="rangeTime" :default-value="['', Date.now()]" custom-style="width: calc(100vw - 80rpx);" @confirm="handleSearchChange" />
					<wd-button v-if="rangeTime && rangeTime.length > 0" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearRangeTimeChange"></wd-button>
				</view>
			</view>
			<wd-notice-bar custom-class="noticeBarWrap" :scrollable="false" :text="'共 ' + model.total + '条售后设备'" prefix="check-outline" type="warning" />
		</view>

		<view v-if="dataList.length > 0">
			<view v-for="(item, index) in dataList" :key="index" :style="{ backgroundColor: isDark ? '#1B1B1B' : '#FFFFFF', borderRadius: '20px', margin: '10px', overflow: 'hidden' }">
				<view class="aftersaleItem">
					<view class="left">
						设备编号
					</view>
					<view class="right">
						{{ item.sn }}
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						设备型号
					</view>
					<view class="right">
						{{ item.model }}
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						寄回类型
					</view>
					<view class="right">
						{{ item.details === 0 ? '仅裸机' : item.details === 1 ? '含配件' : '未知' }}
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						配件详情
					</view>
					<view class="right">
						{{ item.accessory }}
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						故障现象
					</view>
					<view class="right">
						{{ item.fault }}
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						售后原因
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-text :text="item.aftersalesReason" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
						<wd-icon v-if="userType !== 7 && (canUpdateSn || canInsertMiddle || canDeleteMiddle)" name="edit-outline" size="18px"
							@click.stop="handleJumpPageChange('/mePages/updaterenames/Index?sid=' + item.id)"></wd-icon>
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						诊断结论
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-text :text="item.diagnosis" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
						<wd-icon v-if="canUpdateSn" name="edit-outline" size="18px"
							@click.stop="handleUpdateCheckChange(item, index, 'diagnosis')"></wd-icon>
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						临时处理
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-text :text="item.tphand" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
						<wd-icon v-if="canUpdateSn" name="edit-outline" size="18px"
							@click.stop="handleUpdateCheckChange(item, index, 'tphand')"></wd-icon>
					</view>
				</view>
				<view class="aftersaleItem">
					<view class="left">
						长期改善
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-text :text="item.impv" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
						<wd-icon v-if="canUpdateSn" name="edit-outline" size="18px"
							@click.stop="handleUpdateCheckChange(item, index, 'impv')"></wd-icon>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						处理结论
					</view>
					<view class="right">
						<wd-tag type="primary" plain round>
							{{ item.conc === 0 ? '质保维修返回' : item.conc === 1 ? '整体置换返回' : item.conc === 2 ? '报废' : item.conc === 3 ? '付费维修返回' : item.conc === 4 ? '原件返回' : item.conc === 9 ? '其他' : '未知' }}
						</wd-tag>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						是否推送厂家
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-tag :type="item.manu === 1 ? 'success' : 'danger'" plain round>
							{{ item.manu === 1 ? '是' : '否' }}
						</wd-tag>
						<wd-icon v-if="canUpdateSn" name="edit-outline" size="18px" @click="handleUpdatePushManuChange(item, index)"></wd-icon>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						发货信息
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<wd-text type="primary" :text="item.returnnum" @click="handleOpenNewTab(item.returnnum)"></wd-text>
						<wd-icon v-if="canUpdateSn" name="edit-outline" size="18px" @click.stop="handleUpdateReceiptOrRreceiptChange(item, index)"></wd-icon>
						<wd-icon v-if="item.returnnum" name="file-copy" :color="isDark ? '#ffffff' : '#000000'" custom-style="margin-left: 20rpx;" @click="handleCopyChange(item.returnnum)" />
					</view>
				</view>
				<view v-if="model.returnnum && userType !== 7">
					<view class="aftersaleItem">
						<view class="left">
							发货时间
						</view>
						<view class="right">
							{{ item.rdbtime }}
						</view>
					</view>
					<view class="aftersaleItem">
						<view class="left">
							发货人
						</view>
						<view class="right">
							{{ item.rcusername }}
						</view>
					</view>
					<view class="aftersaleItem">
						<view class="left">
							发货网关编号
						</view>
						<view class="right">
							{{ item.rsn }}
						</view>
					</view>
					<view class="aftersaleItem">
						<view class="left">
							发货网关型号
						</view>
						<view class="right">
							{{ item.rmodel }}
						</view>
					</view>
					<view class="aftersaleItem">
						<view class="left">
							发货是否包含配件
						</view>
						<view class="right">
							{{ item.rdetails === 0 ? '仅裸机' : item.rdetails === 1 ? '含配件' : '未知' }}
						</view>
					</view>
					<view class="aftersaleItem">
						<view class="left">
							发货配件详情
						</view>
						<view class="right">
							{{ item.raccessory }}
						</view>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						备注
					</view>
					<view class="right" style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx;">
						<view>{{ item.devnotes }}</view>
						<wd-icon v-if="canUpdateSn" name="edit-outline" size="18px" @click.stop="handleUpdateNotesChange(item, index)"></wd-icon>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						处理时长
					</view>
					<view class="right">
						{{ item.duration ? (item.conc === -1 ? '已历时: ' + item.duration : '总耗时: ' + item.duration) : '' }}
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						设备二维码照片
					</view>
					<view class="right">
						<wd-upload v-if="item.qrcodeList.length > 0" :limit="1" :file-list="item.qrcodeList" image-mode="aspectFill" disabled></wd-upload>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						现场照片
					</view>
					<view class="right">
						<wd-upload v-if="item.siteFileList.length > 0" :limit="item.siteFileList.length" :file-list="item.siteFileList" image-mode="aspectFill" disabled></wd-upload>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						现场视频
					</view>
					<view class="right">
						<wd-upload v-if="item.videoFileList.length > 0" :limit="item.videoFileList.length" :file-list="item.videoFileList" image-mode="aspectFill" disabled></wd-upload>
					</view>
				</view>
				<view class="aftersaleItem" v-if="userType !== 7">
					<view class="left">
						分析照片
					</view>
					<view class="right" style="display: flex; flex-direction: column; justify-content: center; gap: 20rpx 0;">
						<wd-upload v-if="item.analyzeFileList.length > 0" :limit="item.analyzeFileList.length" :file-list="item.analyzeFileList" image-mode="aspectFill" disabled></wd-upload>
						<view v-if="canUpdateSn" style="color: #4d80f0" @click="handleUpdatePictureShowChange(item, 1, index)">
							编辑分析照片
						</view>
					</view>
				</view>
				
				<wd-gap bg-color="#cccccc" height="2rpx" v-if="canUpdateSn || canDeleteSn"></wd-gap>
				
				<view :style="{ display: 'flex', justifyContent: 'flex-end', padding: '10rpx 30rpx 15rpx 0', gap: '0 10rpx', background: isDark ? '#1b1b1b' : '#ffffff' }" v-if="canUpdateSn || canDeleteSn">
					<wd-button v-if="canUpdateSn" size="small" type="primary" @click.stop="handleUpdateAftersaleSnChange(userType !== 7 ? '/mePages/updateaftersaledevice/Index?id=' + item.id : '/mePages/updateaftersalemanu/Index?id=' + item.id)">修改</wd-button>
					<wd-button v-if="canDeleteSn" size="small" type="error" @click.stop="handleDeleteAftersaleSnChange(item.id)">删除</wd-button>
				</view>
			</view>

			<wd-loadmore :state="state" @reload="getDataList" />

			<wd-backtop :bottom="40" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
		</view>

		<view v-else
			:style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
			<wd-status-tip image="../../static/search.png" tip="暂无售后数据" />
		</view>

		<!-- 寄出信息 -->
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
					<wd-button hairline type="primary" :loading="receiptLoading" @click="handleSubmitReceiptShowChange" block>确认</wd-button>
				</view>
			</wd-form>
		</wd-popup>
		
		<!-- 是否推送厂家 -->
		<wd-popup :z-index="99" position="bottom" v-model="manuShow" custom-style="padding: 20rpx; height: 400rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text text="是否推送厂家" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			
			<wd-form :model="manuModel">
				<wd-picker label="是否推送厂家" label-width="100px" align-right :columns="pushManuList" v-model="manuModel.selectManu" label-key="name" value-key="value"></wd-picker>
				
			    <view class="footer" style="margin-top: 180rpx;">
					<wd-button hairline type="info" @click="handleCancelManuChange" block>取消</wd-button>
			        <wd-button hairline type="primary" :loading="manuLoading" @click="handleSubmitManuChange" block>确认</wd-button>
			    </view>
			</wd-form>
		</wd-popup>

		<!-- 照片上传 -->
		<wd-popup closable :safe-area-inset-bottom="true"
			:custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="uploadFileVisibleShow"
			position="left" @close="handleCloseUploadFileShowChange">
			<wd-gap height="70rpx" />

			<view style="padding: 20rpx;">
				<view style="margin-bottom: 40rpx;">
					<wd-text :text="uploadImageForm.selectedType === 0 ? '现场照片' : '分析照片'" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
				</view>

				<wd-upload accept="image" :limit="3" multiple
					v-model:file-list="uploadFileList" image-mode="aspectFill" :upload-method="handleCustomUploadChange"
					@remove="handleRemoveFileChange"></wd-upload>

				<wd-button block type="primary" :loading="uploadFileLoading"
					@click="handleUploadfileSubmitChange">确定</wd-button>
			</view>
		</wd-popup>
		
		<!-- 客户公司名称 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="comapnyShow" position="left" @close="handleCloseCompanyChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.companyFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchComapnyFuzzyChange" @cancel="handleSearchComapnyFuzzyChange" @clear="handleClearCompanyFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="companyTriggered" @refresherrefresh="handleScrollRefreshCompanyChange" @scrolltolower="handleScrolltolowerCompanyChange" :style="{ height: moreFilterVisible ? 'calc(100vh - 1220rpx)' : 'calc(100vh - 400rpx)' }">
		        <wd-radio-group v-model="model.checkedCompany" shape="dot" @change="handleRadioCompanySelectChange">
					<view class="radioCellWrap">
						<wd-radio v-for="(companyItem, companyIndex) in model.companyDataList" :key="companyIndex" :value="companyItem.id">{{ companyItem.comp }}</wd-radio>
					</view>
				</wd-radio-group>
		    </scroll-view>
		</wd-popup>
		
		<!-- 网关型号 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="modelShow" position="left" @close="handleCloseModelChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.modelFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchModelFuzzyChange" @cancel="handleSearchModelFuzzyChange" @clear="handleClearModelFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="modelTriggered" @refresherrefresh="handleScrollRefreshModelChange" @scrolltolower="handleScrolltolowerModelChange" :style="{ height: moreFilterVisible ? userType !== 7 ? 'calc(100vh - 1220rpx)' : 'calc(100vh - 990rpx)' : 'calc(100vh - 400rpx)' }">
		        <!-- <wd-radio-group v-model="model.checkedModel" shape="dot" @change="handleRadioModelSelectChange">
					<wd-radio v-for="(modelItem, modelIndex) in model.modelDataList" :key="modelIndex" class="radioCellWrap" :value="modelItem">{{ modelItem }}</wd-radio>
				</wd-radio-group> -->
				<wd-cell-group border>
				    <wd-checkbox-group v-model="model.checkedModel" @change="handleCheckModelSelectChange">
				        <wd-cell v-for="(modelItem, modelIndex) in model.modelDataList" :key="modelIndex" :title="modelItem" center>
				            <wd-checkbox :modelValue="modelItem"></wd-checkbox>
				        </wd-cell>
				    </wd-checkbox-group>
				</wd-cell-group>
		    </scroll-view>
		</wd-popup>
		
		<!-- 售后原因名称 -->
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" v-model="reidShow" position="left" @close="handleCloseReidChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.reidFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchReidFuzzyChange" @cancel="handleSearchReidFuzzyChange" @clear="handleClearReidFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled	:refresher-triggered="reidTriggered" @refresherrefresh="handleScrollRefreshReidChange" @scrolltolower="handleScrolltolowerReidChange" :style="{ height: moreFilterVisible ? userType !== 7 ? 'calc(100vh - 1220rpx)' : 'calc(100vh - 990rpx)' : 'calc(100vh - 400rpx)' }">
		        <wd-radio-group v-model="model.checkedReid" shape="dot" @change="handleRadioReidSelectChange">
					<view class="radioCellWrap">
						<wd-radio v-for="(reidItem, reidIndex) in model.reidDataList" :key="reidIndex" :value="reidItem.id">{{ reidItem.rs }}</wd-radio>
					</view>
				</wd-radio-group>
		    </scroll-view>
		</wd-popup>
		
		<!-- 诊断结论、临时处理、长期改善 -->
		<wd-popup :z-index="99" v-model="diagnosisCheckShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx;">
			<view style="margin-bottom: 20rpx;">
				<wd-text :text="'填写' + diagnosisCheckForm.selectTypeName" bold :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			</view>
			<wd-form ref="diagnosisCheckRef" :model="diagnosisCheckForm" :rules="diagnosisCheckFormRules">
				<!-- <wd-textarea :label="diagnosisCheckForm.selectTypeName" label-width="100px" type="textarea" prop="diagnosisCheckValue" clearable
					v-model="diagnosisCheckForm.diagnosisCheckValue" :placeholder="'请输入' + diagnosisCheckForm.selectTypeName"
					:rules="[{ required: true, message: '请输入' + diagnosisCheckForm.selectTypeName }]" /> -->
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
	
	:deep(.radioCellWrap) {
	    padding: 10rpx 20rpx !important;
		
		:deep(.wd-radio__label) {
			width: calc(100% - 60rpx) !important;
			text-align: left !important;
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