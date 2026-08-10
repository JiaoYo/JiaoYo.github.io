<script lang="ts" setup>
import { useMessage } from 'wot-design-uni';
import { FormRules } from 'wot-design-uni/components/wd-form/types';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetSystemconfigInfo, fetchSaveSystemConfigInfo, fetchGetSystemProjectInfo, fetchUpdateSystemProjectInfo } from '@/service/index';
import { onReady, onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
import { secondsToMinutes, minutesToMilliseconds, hasPermission } from '@/utils/index';

const message = useMessage();

const loading = ref<boolean>(false);

const userId = ref<string>(uni.getStorageSync('userId'));

const userType = ref<any>(uni.getStorageSync('usertype'));

const activeTab = ref<number>(0);

const topFixedWrap = ref<any>(null);

const scrollViewHeight = ref<number>(0);

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const tabsList = ref<{ title: string, value: number }[]>([
    {
        title: '系统配置',
        value: 0
    },
    {
        title: '项目配置',
        value: 1
    }
]);


const model = reactive<{
    id: number;
    captcha: number;
    // cputhreshold: number;
    // memthreshold: number;
    diserror: number;
    merror: number;
    errortime: number;
    prosite: string;
    longitude: number;
    latitude: number;
    sdkkey: string;
    sdkh5: string;
    sdksecret: string;
    systemProId: number;
    dlevel1w: any;
    dlevel2w: any;
    dlevel3w: any;
    dlevel1c: any;
    dlevel2c: any;
    wlevel1w: any;
    wlevel2w: any;
    wlevel3w: any;
    wlevel1c: any;
    wlevel2c: any;
    plevel1w: any;
    plevel2w: any;
    plevel3w: any;
    plevel1c: any;
    plevel2c: any;
    clockin0: any;
    clockin1: any;
    clockin2: any;
    clockin3: any;
    devcheck: any;
    mproject: any;
    ipplantb: any;
    fproject: any;
    onsitept: any;
    mnetwork: any;
    pjbackup: any;
    filcheck: any;
}>({
    id: 1,
    captcha: 0,
    // cputhreshold: 80,
    // memthreshold: 95,
    diserror: 100,
    merror: 500,
    errortime: 120,
    prosite: '浙江省杭州市钱塘区6号大街260号正泰中自科技园',
    longitude: 120.374688,
    latitude: 30.303724,
    sdkkey: '',
    sdkh5: '',
    sdksecret: '',
    systemProId: 1,
    dlevel1w: 1,
    dlevel2w: 1,
    dlevel3w: 1,
    dlevel1c: 1,
    dlevel2c: 1,
    wlevel1w: 1,
    wlevel2w: 1,
    wlevel3w: 1,
    wlevel1c: 1,
    wlevel2c: 1,
    plevel1w: 1,
    plevel2w: 1,
    plevel3w: 1,
    plevel1c: 1,
    plevel2c: 1,
    clockin0: 0,
    clockin1: 0,
    clockin2: 0,
    clockin3: 0,
    devcheck: 0,
    mproject: 0,
    ipplantb: 0,
    fproject: 0,
    onsitept: 0,
    mnetwork: 0,
    pjbackup: 0,
    filcheck: 0,
});

const rules: any = computed(() => {
    if (activeTab.value === 0) {
        return {
            // cputhreshold: [
            //     {
            //         required: true,
            //         message: '请输入CPU阈值',
            //         validator: (value: string) => {
            //             if (value) {
            //                 return Promise.resolve();
            //             } else {
            //                 return Promise.reject('请输入CPU阈值');
            //             }
            //         }
            //     },
            // ],
            // memthreshold: [
            //     {
            //         required: true,
            //         message: '请输入MEM阈值',
            //         validator: (value: string) => {
            //             if (value) {
            //                 return Promise.resolve();
            //             } else {
            //                 return Promise.reject('请输入MEM阈值');
            //             }
            //         }
            //     },
            // ],
            merror: [
                {
                    required: true,
                    message: '请输入打卡误差范围',
                    validator: (value: string) => {
                        if (value) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('请输入打卡误差范围');
                        }
                    },
                },
            ],
            diserror: [
                {
                    required: true,
                    message: '请输入静默打卡误差范围',
                    validator: (value: string) => {
                        if (value) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('请输入静默打卡误差范围');
                        }
                    },
                },
            ],
            errortime: [
                {
                    required: true,
                    message: '请输入打卡时间误差最大值',
                    validator: (value: string) => {
                        if (value) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('请输入打卡时间误差最大值');
                        }
                    }
                },
            ],
            sdkkey: [
                {
                    required: true,
                    message: '请输入AMAP_SDK_KEY',
                    validator: (value: string) => {
                        if (value) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('请输入AMAP_SDK_KEY');
                        }
                    }
                },
            ],
            sdkh5: [
                {
                    required: true,
                    message: '请输入AMAP_SDK_KEY_H5',
                    validator: (value: string) => {
                        if (value) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('请输入AMAP_SDK_KEY_H5');
                        }
                    }
                },
            ],
            sdksecret: [
                {
                    required: true,
                    message: '请输入AMAP_SDK_SECRET',
                    validator: (value: string) => {
                        if (value) {
                            return Promise.resolve();
                        } else {
                            return Promise.reject('请输入AMAP_SDK_SECRET');
                        }
                    }
                },
            ]
        }
    }
    return {
        dlevel1w: [
            {
                required: true,
                message: '请输入合格权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入合格权重分');
                    }
                },
            },
        ],
        dlevel2w: [
            {
                required: true,
                message: '请输入良好权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入良好权重分');
                    }
                },
            },
        ],
        dlevel3w: [
            {
                required: true,
                message: '请输入优秀权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入优秀权重分');
                    }
                },
            },
        ],
        dlevel1c: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        dlevel2c: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        wlevel1w: [
            {
                required: true,
                message: '请输入合格权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入合格权重分');
                    }
                },
            },
        ],
        wlevel2w: [
            {
                required: true,
                message: '请输入良好权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入良好权重分');
                    }
                },
            },
        ],
        wlevel3w: [
            {
                required: true,
                message: '请输入优秀权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入优秀权重分');
                    }
                },
            },
        ],
        wlevel1c: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        wlevel2c: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        plevel1w: [
            {
                required: true,
                message: '请输入合格权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入合格权重分');
                    }
                },
            },
        ],
        plevel2w: [
            {
                required: true,
                message: '请输入良好权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入良好权重分');
                    }
                },
            },
        ],
        plevel3w: [
            {
                required: true,
                message: '请输入优秀权重分',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入优秀权重分');
                    }
                },
            },
        ],
        plevel1c: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        plevel2c: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        clockin0: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        clockin1: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        clockin2: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        clockin3: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        devcheck: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        mproject: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        ipplantb: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        fproject: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        onsitept: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        mnetwork: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        pjbackup: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
        filcheck: [
            {
                required: true,
                message: '请输入',
                validator: (value: string) => {
                    if (value) {
                        return Promise.resolve();
                    } else {
                        return Promise.reject('请输入');
                    }
                },
            },
        ],
    }
});


const form = ref();
const { themeVars, theme } = useTheme();

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取系统配置
async function getSystemconfigInfo() {
    try {
        const data = await fetchGetSystemconfigInfo();
        console.log('获取系统配置成功', data);
        model.id = data.id;
        model.captcha = data.captcha;
        // model.cputhreshold = data.cputhreshold;
        // model.memthreshold = data.memthreshold;
        model.diserror = data.diserror;
        model.merror = data.merror;
        model.errortime = Number(secondsToMinutes(data.errortime));
        model.prosite = data.prosite;
        model.longitude = data.longitude;
        model.latitude = data.latitude;
        model.sdkh5 = data.sdkh5;
        model.sdkkey = data.sdkkey;
        model.sdksecret = data.sdksecret;
    } catch (error) {
        console.error('获取系统配置失败', error);
    }
}

// 获取系统项目权重配置
async function getSystemProjectConfigInfo() {
    try {
        const data = await fetchGetSystemProjectInfo();
        console.log('获取系统项目权重配置成功', data);
        model.systemProId = data.id;
        model.dlevel1w = data.dlevel1w;
        model.dlevel2w = data.dlevel2w;
        model.dlevel3w = data.dlevel3w;
        model.dlevel1c = data.dlevel1c;
        model.dlevel2c = data.dlevel2c;
        model.wlevel1w = data.wlevel1w;
        model.wlevel2w = data.wlevel2w;
        model.wlevel3w = data.wlevel3w;
        model.wlevel1c = data.wlevel1c;
        model.wlevel2c = data.wlevel2c;
        model.plevel1w = data.plevel1w;
        model.plevel2w = data.plevel2w;
        model.plevel3w = data.plevel3w;
        model.plevel1c = data.plevel1c;
        model.plevel2c = data.plevel2c;
        model.clockin0 = data.clockin0;
        model.clockin1 = data.clockin1;
        model.clockin2 = data.clockin2;
        model.clockin3 = data.clockin3;
        model.devcheck = data.devcheck;
        model.mproject = data.mproject;
        model.ipplantb = data.ipplantb;
        model.fproject = data.fproject;
        model.onsitept = data.onsitept;
        model.mnetwork = data.mnetwork;
        model.pjbackup = data.pjbackup;
        model.filcheck = data.filcheck;
    } catch (error) {
        console.error('获取系统项目权重配置失败', error);
    }
}

// 打开内置地图
function handleOpenLocationChange() {
	if (userType.value === 4) {
		return
	}
    uni.chooseLocation({
        latitude: model.latitude,
        longitude: model.longitude,
        useSecureNetwork: true,
        success: function (res1) {
            console.log('res选择地址', res1);
            if (res1 && typeof res1.latitude === 'number' && typeof res1.longitude === 'number' && (res1.address || res1.name)) {
                model.latitude = res1.latitude;
                model.longitude = res1.longitude;
                model.prosite = res1.name ? (res1.address ? res1.address + res1.name : res1.name) : res1.address || res1.name || '';
            }
        },
        fail: function (err1) {
            console.error('获取地址失败', err1);
            if (err1.errMsg !== 'chooseLocation:fail cancel') {
                uni.showToast({
                    title: '获取地址失败',
                    icon: 'error',
                    duration: 2000,
                });
            }
        },
    });
}

// 限制权重
function handleWeight1InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel1w = n;
	})
}

function handleWeight2InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel2w = n;
	})
}

function handleWeight3InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel3w = n;
	})
}

function handleWeight4InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel1c = n;
	})
}

function handleWeight5InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel2c = n;
	})
}

function handleWeight6InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.wlevel1w = n;
	})
}

function handleWeight7InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel2w = n;
	})
}

function handleWeight8InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.dlevel3w = n;
	})
}

function handleWeight9InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.wlevel1c = n;
	})
}

function handleWeight10InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.wlevel2c = n;
	})
}

function handleWeight11InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.plevel1w = n;
	})
}

function handleWeight12InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.plevel2w = n;
	})
}

function handleWeight13InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.plevel3w = n;
	})
}

function handleWeight14InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.plevel1c = n;
	})
}

function handleWeight15InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.plevel2c = n;
	})
}

function handleWeight16InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    let purified = String(val.value).replace(/[^\d]/g, "");
	let n = Number(purified);
	if (isNaN(n)) {
		 n = 0;
	} else {
		if (n < 0) n = 0;
		if (n > 100000) n = 100000;
	}

	nextTick(() => {
		model.clockin0 = n;
	})
}

function handleWeight17InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.clockin1 = n;
        })
    }
}

function handleWeight18InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.clockin2 = n;
        })
    }
}

function handleWeight19InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.clockin3 = n;
        })
    }
}

function handleWeight20InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.devcheck = n;
        })
    }
}

function handleWeight21InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.mproject = n;
        })
    }
}

function handleWeight22InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.ipplantb = n;
        })
    }
}

function handleWeight23InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.fproject = n;
        })
    }
}

function handleWeight24InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.onsitept = n;
        })
    }
}

function handleWeight25InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.mnetwork = n;
        })
    }
}

function handleWeight26InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.pjbackup = n;
        })
    }
}

function handleWeight27InputChange(val: any) {
	console.log('va', val);
    // 1. 去除非数字字符（禁止小数点、字母、特殊符号）
    if (String(val.value)) {
        let purified = String(val.value).replace(/[^\d-]/g, "");
        let n = Number(purified);
        if (isNaN(n)) {
            n = 0;
        } else {
            if (n > 100000) n = 100000;
        }

        nextTick(() => {
            console.log(n);

            model.filcheck = n;
        })
    }
}

function handleSubmit() {
    form.value
        .validate()
        .then(async({ valid, errors }: { valid: boolean; errors: any }) => {
            console.log(valid);
            console.log(errors);
            if (valid) {
                loading.value = true;
                try {
                    if (activeTab.value === 0) {
                        let queryParams = userId.value === '1024' ? {
                            id: model.id,
                            // captcha: model.captcha,
                            // cputhreshold: model.cputhreshold,
                            // memthreshold: model.memthreshold,
                            merror: model.merror,
                            diserror: model.diserror,
                            errortime: minutesToMilliseconds(model.errortime),
                            prosite: model.prosite,
                            longitude: model.longitude,
                            latitude: model.latitude,
                            sdkh5: model.sdkh5,
                            sdkkey: model.sdkkey,
                            sdksecret: model.sdksecret,
                        } : {
                            id: model.id,
                            captcha: model.captcha,
                            // cputhreshold: model.cputhreshold,
                            // memthreshold: model.memthreshold,
                            merror: model.merror,
                            diserror: model.diserror,
                            errortime: minutesToMilliseconds(model.errortime),
                            prosite: model.prosite,
                            longitude: model.longitude,
                            latitude: model.latitude,
                        };
                        const data = await fetchSaveSystemConfigInfo(queryParams);
                        uni.showToast({
                            title: '修改成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft();
                            }
                        });
                    } else {
                        let queryProParams = {
                            id: model.systemProId,
                            dlevel1w: Number(model.dlevel1w),
                            dlevel2w: Number(model.dlevel2w),
                            dlevel3w: Number(model.dlevel3w),
                            dlevel1c: Number(model.dlevel1c),
                            dlevel2c: Number(model.dlevel2c),
                            wlevel1w: Number(model.wlevel1w),
                            wlevel2w: Number(model.wlevel2w),
                            wlevel3w: Number(model.wlevel3w),
                            wlevel1c: Number(model.wlevel1c),
                            wlevel2c: Number(model.wlevel2c),
                            plevel1w: Number(model.plevel1w),
                            plevel2w: Number(model.plevel2w),
                            plevel3w: Number(model.plevel3w),
                            plevel1c: Number(model.plevel1c),
                            plevel2c: Number(model.plevel2c),
                            clockin0: Number(model.clockin0),
                            clockin1: Number(model.clockin1),
                            clockin2: Number(model.clockin2),
                            clockin3: Number(model.clockin3),
                            devcheck: Number(model.devcheck),
                            mproject: Number(model.mproject),
                            ipplantb: Number(model.ipplantb),
                            fproject: Number(model.fproject),
                            onsitept: Number(model.onsitept),
                            mnetwork: Number(model.mnetwork),
                            pjbackup: Number(model.pjbackup),
                            filcheck: Number(model.filcheck),
                        };
                        const data = await fetchUpdateSystemProjectInfo(queryProParams);
                        uni.showToast({
                            title: '修改成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                loading.value = false;
                                handleClickLeft();
                            }
                        });
                    }
                } catch (err) {
                    console.error('修改失败', err);
                    loading.value = false;
                }
            }
        })
        .catch((error: any) => {
            console.log(error, 'error');
        });
}

// 重新计算 .topFixedWrap 的真实高度（像素）
function recalcTopFixedHeight() {
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
                const sysInfo = uni.getSystemInfoSync();
                scrollViewHeight.value = sysInfo.windowHeight - topFixedHeight.value;
            }
        })
        .exec();
}

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

onLoad(() => {
    getSystemconfigInfo();
    getSystemProjectConfigInfo();
});

onPullDownRefresh(() => {
    getSystemconfigInfo();
    getSystemProjectConfigInfo();
    setTimeout(() => {
        uni.hideNavigationBarLoading();
        uni.stopPullDownRefresh();
    }, 1000);
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
        <view class="topFixedWrap" ref="topFixedWrap">
            <wd-navbar left-arrow title="系统配置" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft" />

            <wd-form ref="form" :model="model" :rules="rules">
                <wd-tabs swipeable animated v-model="activeTab">
                    <wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title">
                        <scroll-view :scroll-y="true" :style="{ height: scrollViewHeight + 'px' }">
                            <view v-if="userType === 0 && activeTab === 0" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20rpx;">
                                <view class="wd-input__label-inner">是否开启验证码</view>
                                <wd-switch label="是否开启验证码" v-model="model.captcha" :active-value="1" :inactive-value="0" size="22px" />
                            </view>
                            <!-- <wd-input type="number" label="CPU阈值" label-width="100px" prop="cputhreshold" required clearable v-model="model.cputhreshold" placeholder="请输入CPU阈值" />
                            <wd-input type="number" label="MEM阈值" label-width="100px" prop="memthreshold" clearable v-model="model.memthreshold" placeholder="请输入MEM阈值" /> -->
                            <wd-input v-if="activeTab === 0" :readonly="userType === 4" type="number" label="打卡误差范围(米)" label-width="140px" prop="merror" required clearable v-model="model.merror" placeholder="请输入打卡误差范围" />
                            <wd-input v-if="activeTab === 0" :readonly="userType === 4" type="number" label="静默打卡误差范围(米)" label-width="150px" prop="diserror" required clearable v-model="model.diserror" placeholder="请输入静默打卡误差范围" />
                            <wd-input v-if="activeTab === 0" :readonly="userType === 4" type="number" label="打卡时间误差最大值" label-width="140px" prop="errortime" required clearable v-model="model.errortime" placeholder="请输入打卡时间误差最大值">
                                <template #suffix>
                                    分钟
                                </template>
                            </wd-input>
                            <wd-input v-if="activeTab === 0" label="项目地址" label-width="100px" prop="proaddr" required readonly suffix-icon="arrow-right" clearable v-model="model.prosite" placeholder="请选择项目地址" @click="handleOpenLocationChange" />
                            <wd-textarea v-if="userId === '1024' && activeTab === 0" label="AMAP_SDK_KEY" label-width="120px" type="textarea" v-model="model.sdkkey" placeholder="请输入AMAP_SDK_KEY" clearable prop="sdkkey" />
                            <wd-textarea v-if="userId === '1024' && activeTab === 0" label="AMAP_SDK_KEY_H5" label-width="140px" type="textarea" v-model="model.sdkh5" placeholder="请输入AMAP_SDK_KEY_H5" clearable prop="sdkh5" />
                            <wd-textarea v-if="userId === '1024' && activeTab === 0" label="AMAP_SDK_SECRET" label-width="140px" type="textarea" v-model="model.sdksecret" placeholder="请输入AMAP_SDK_SECRET" clearable prop="sdksecret" />

                            <view v-if="activeTab === 1">
                                <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                                    <view style="display: flex; align-items: center;">
                                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                        <view style="margin-left: 10rpx; font-weight: bolder;">日报</view>
                                    </view>
                                </view>
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="合格权重分" label-width="120px" type="number" prop="dlevel1w" required clearable v-model="model.dlevel1w" placeholder="请输入权重分（1-1000）" @input="handleWeight1InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="良好权重分" label-width="120px" type="number" prop="dlevel2w" required clearable v-model="model.dlevel2w" placeholder="请输入权重分（1-1000）" @input="handleWeight2InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="优秀权重分" label-width="120px" type="number" prop="dlevel3w" required clearable v-model="model.dlevel3w" placeholder="请输入权重分（1-1000）" @input="handleWeight3InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="字符数低于此数值认为合格" label-width="120px" type="number" prop="dlevel1c" required clearable v-model="model.dlevel1c" placeholder="请输入权重分（1-1000）" @input="handleWeight4InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="字符数高于此数值认为优秀, 字符数低于此数值认为良好" label-width="120px" type="number" prop="dlevel2c" required clearable v-model="model.dlevel2c" placeholder="请输入权重分（1-1000）" @input="handleWeight5InputChange" />
                                <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                                    <view style="display: flex; align-items: center;">
                                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                        <view style="margin-left: 10rpx; font-weight: bolder;">周报</view>
                                    </view>
                                </view>
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="合格权重分" label-width="120px" type="number" prop="wlevel1w" required clearable v-model="model.wlevel1w" placeholder="请输入权重分（1-1000）" @input="handleWeight6InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="良好权重分" label-width="120px" type="number" prop="wlevel2w" required clearable v-model="model.wlevel2w" placeholder="请输入权重分（1-1000）" @input="handleWeight7InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="优秀权重分" label-width="120px" type="number" prop="wlevel3w" required clearable v-model="model.wlevel3w" placeholder="请输入权重分（1-1000）" @input="handleWeight8InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="字符数低于此数值认为合格" label-width="120px" type="number" prop="wlevel1c" required clearable v-model="model.wlevel1c" placeholder="请输入权重分（1-1000）" @input="handleWeight9InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="字符数高于此数值认为优秀, 字符数低于此数值认为良好" label-width="120px" type="number" prop="wlevel2c" required clearable v-model="model.wlevel2c" placeholder="请输入权重分（1-1000）" @input="handleWeight10InputChange" />
                                <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                                    <view style="display: flex; align-items: center;">
                                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                        <view style="margin-left: 10rpx; font-weight: bolder;">项目总结</view>
                                    </view>
                                </view>
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="合格权重分" label-width="120px" type="number" prop="plevel1w" required clearable v-model="model.plevel1w" placeholder="请输入权重分（1-1000）" @input="handleWeight11InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="良好权重分" label-width="120px" type="number" prop="plevel2w" required clearable v-model="model.plevel2w" placeholder="请输入权重分（1-1000）" @input="handleWeight12InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="优秀权重分" label-width="120px" type="number" prop="plevel3w" required clearable v-model="model.plevel3w" placeholder="请输入权重分（1-1000）" @input="handleWeight13InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="字符数低于此数值认为合格" label-width="120px" type="number" prop="plevel1c" required clearable v-model="model.plevel1c" placeholder="请输入权重分（1-1000）" @input="handleWeight14InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="字符数高于此数值认为优秀, 字符数低于此数值认为良好" label-width="120px" type="number" prop="plevel2c" required clearable v-model="model.plevel2c" placeholder="请输入权重分（1-1000）" @input="handleWeight15InputChange" />
                                <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                                    <view style="display: flex; align-items: center;">
                                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                        <view style="margin-left: 10rpx; font-weight: bolder;">打卡</view>
                                    </view>
                                </view>
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="正常打卡权重分" label-width="120px" type="number" prop="clockin0" required clearable v-model="model.clockin0" placeholder="请输入权重分（1-1000）" @input="handleWeight16InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="异常打卡权重分" label-width="120px" type="number" prop="clockin1" required clearable v-model="model.clockin1" placeholder="请输入权重分" @input="handleWeight17InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="出发打卡权重分" label-width="120px" type="number" prop="clockin2" required clearable v-model="model.clockin2" placeholder="请输入权重分" @input="handleWeight18InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="到达打卡权重分" label-width="120px" type="number" prop="clockin3" required clearable v-model="model.clockin3" placeholder="请输入权重分" @input="handleWeight19InputChange" />

                                <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                                    <view style="display: flex; align-items: center;">
                                        <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                        <view style="margin-left: 10rpx; font-weight: bolder;">项目流程</view>
                                    </view>
                                </view>
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="设备清点权重分" label-width="120px" type="number" prop="devcheck" required clearable v-model="model.devcheck" placeholder="请输入权重分（1-1000）" @input="handleWeight20InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="项目图纸权重分" label-width="120px" type="number" prop="mproject" required clearable v-model="model.mproject" placeholder="请输入权重分" @input="handleWeight21InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="项目文件权重分" label-width="120px" type="number" prop="ipplantb" required clearable v-model="model.ipplantb" placeholder="请输入权重分" @input="handleWeight22InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="工程文件权重分" label-width="120px" type="number" prop="fproject" required clearable v-model="model.fproject" placeholder="请输入权重分" @input="handleWeight23InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="现场照片权重分" label-width="120px" type="number" prop="onsitept" required clearable v-model="model.onsitept" placeholder="请输入权重分" @input="handleWeight24InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="网络通讯图权重分" label-width="120px" type="number" prop="mnetwork" required clearable v-model="model.mnetwork" placeholder="请输入权重分" @input="handleWeight25InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="组态画面工程备份权重分" label-width="120px" type="number" prop="pjbackup" required clearable v-model="model.pjbackup" placeholder="请输入权重分" @input="handleWeight26InputChange" />
                                <wd-input :readonly="userType === 4 || userId === '1024'" label="验收文件权重分" label-width="120px" type="number" prop="filcheck" required clearable v-model="model.filcheck" placeholder="请输入权重分" @input="handleWeight27InputChange" />
                            </view>

                            <view class="footer">
                                <wd-button v-if="hasPermission('system.conf.update') || userType === 0 || userId === '1024'" hairline type="primary" :loading="loading" @click="handleSubmit" block>提交</wd-button>
                            </view>
                        </scroll-view>
                    </wd-tab>
                </wd-tabs>
            </wd-form>
        </view>
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    width: 100%;
    z-index: 99;
    background-color: #F5F5F5;
    box-sizing: border-box;
}

.footer {
    padding: 0 20rpx 40rpx 20rpx;
    margin-top: 40rpx;
}
</style>