<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { throttle } from "@/utils/debounce";
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue';
import { onReady, onLoad, onShow } from '@dcloudio/uni-app';
import { uploadFile } from '@/utils/uploadFile';
import { useToast, useMessage } from 'wot-design-uni';
// import { useI18nSync } from '@/hooks/useI18nSync';
import { useTheme } from '@/composables/theme/theme';
import { copyText } from '@/utils/copyText';
import { useLargeArrayStore } from '@/store/useDataStore';
import { BASE_URL, QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { fetchGetUploadFileTokenInfo, fetchGetUserInfo, fetchGetUserInfoWithWechat, logout, fetchUpdateUserImageInfo, fetchUpdateUserType, fetchGetSystemMenuInfo } from '@/service/index';
import { hasPermission, maskPhone, extractPermissionsByPtype } from '@/utils/index';
import { globalData } from '@/utils/global';
import { silenceUpdate } from '@/utils/silence-update';
import { WEB_URL } from '@/utils/request';
import { useTabbar } from '@/composables/useTabbar';
import weChatpng from '@/static/wechat.png';
import type { UploadMethod, UploadFile } from 'wot-design-uni/components/wd-upload/types';
import LevelCertificate from '@/components/awardpopup.vue';

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, setTabbarItem, tabbarList } = useTabbar();

// 使用国际化钩子
// const { setLocale, currentLang } = useI18nSync();
const store = useLargeArrayStore();
const { theme } = useTheme();

const message = useMessage();

// 点击锁定
const clickLock = ref<boolean>(false);

// 控制语言切换弹出层的显示
const showLanguageSwitch = ref(false);

// 版本号
const version = ref<string>('');

const fileList = ref<UploadFile[]>([]);

const userId = ref<string>(uni.getStorageSync('userId'));

const userType = ref<any>(uni.getStorageSync('usertype'));

const showModal = ref<boolean>(false);

const rankName = ref<string>('');

const showCert = () => {
	showModal.value = true
}

// 用户信息
const userInfo = reactive<{
	username: string;
	phnum: string;
	nickname: string;
	dbtime: string;
	isBind: boolean;
	usertype: number;
	rank?: number;
}>({
    username: '',
    phnum: '',
	nickname: '',
	dbtime: '',
	isBind: false,
	usertype: 0,
	rank: null
})

const rankMap: any = ref<any>({
    0: 'T1_#CCCCCC',
    1: 'T2_#3399FF',
    2: 'T3_#0066CC',
    3: 'T4_#33CC66',
    4: 'T5_#FFCC00',
    5: 'T6_#FF6600',
    6: 'T7_#CC0000',
});

// 按时间问候语
const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早上好';
    if (hour >= 12 && hour < 14) return '中午好';
    if (hour >= 14 && hour < 18) return '下午好';
    return '晚上好';
});

// 问候语 emoji
const greetingEmoji = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) return '🌅';
    if (hour >= 8 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 14) return '🍚';
    if (hour >= 14 && hour < 18) return '🌤️';
    return '🌙';
});

// 今天日期
const greetingDate = computed(() => {
    const now = new Date();
    const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${week}`;
});

// 获取用户基本信息
async function getUserDetailInfo() {
    try {
		const data = await fetchGetUserInfoWithWechat();
		userInfo.username = data.username || uni.getStorageSync('username');
		userInfo.phnum = data.phnum ? data.phnum : '';
		userInfo.nickname = data.nickname;
		userInfo.dbtime = data.dbtime;
		userInfo.usertype = data.usertype;
		userInfo.rank = data.rank;
		if (userInfo.nickname) {
			userInfo.isBind = true;
		} else {
			userInfo.isBind = false;
		}
		fileList.value = [{ url: data.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
		uni.setStorageSync('usertype', data.usertype);
		if ((userInfo.usertype === 2 || userInfo.usertype === 3 || userInfo.usertype === 9) && rankMap.value[userInfo.rank]) {
			if (uni.getStorageSync('oldRank')) {
				if (String(uni.getStorageSync('oldRank')) !== String(userInfo.rank)) {
					rankName.value = rankMap.value[userInfo.rank].substring(0, 2);
					showModal.value = true;
					uni.setStorageSync('oldRank', String(userInfo.rank));
				}
			} else {
				rankName.value = rankMap.value[userInfo.rank].substring(0, 2);
				showModal.value = true;
				uni.setStorageSync('oldRank', String(userInfo.rank));
			}
		}
		// const data = await fetchGetUserInfo();
        // userInfo.username = data.username || uni.getStorageSync('username');
        // userInfo.phnum = data.phnum ? data.phnum : '';
        // fileList.value = [{ url: data.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
        // uni.setStorageSync('usertype', data.usertype);
    } catch (err) {
		console.error('获取用户信息失败', err);
        userInfo.username = uni.getStorageSync('username');
        userInfo.phnum = '';
		userInfo.nickname = '';
		userInfo.dbtime = '';
		userInfo.isBind = false;
        fileList.value = [{ url: 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
    }
}

// 语言切换选项
// const languageActions = computed(() => [
//     {
//         name: '中文 🇨🇳',
//         color: currentLang.value === 'zh-CN' ? '#0083ff' : '',
//     },
//     {
//         name: 'English 🇺🇸',
//         color: currentLang.value === 'en-US' ? '#0083ff' : '',
//     },
// ]);

// 语言选择
function handleLanguageSelect({ index }: { index: number }) {
    const locale = index === 0 ? 'zh-CN' : 'en-US';
    switchLanguage(locale);
}

// 切换语言
function switchLanguage(locale: string) {
    // setLocale(locale);
}

const isDark = computed(() => theme.value === 'dark');

const { toggleTheme, themeVars, colorColumns } = useTheme();

function handleToggleThemeChange() {
    toggleTheme();
}

// 拨打电话
function handleMakePhoneChange() {
    if (!userInfo.phnum) {
        return false
    }
    uni.makePhoneCall({
        phoneNumber: userInfo.phnum
    })
}

// 复制
async function handleCopyChange() {
    try {
        await copyText(userInfo.phnum);
        uni.showToast({ title: '复制成功', icon: 'success' });
    } catch (err) {
        if (err instanceof Error) {
            uni.showToast({ title: err.message, icon: 'none' });
        }
    }
}

// 跳转页面（去掉 throttle：leading-only 会静默吞掉 1s 内后续点击，改由 clickLock 防连点）
let navLoadingTimer: any = null;
function handleJumpPageChange(url: string) {
	try {
		if (clickLock.value) return;
		clickLock.value = true;
		// 慢导航兜底反馈：点击 250ms 后还没跳走（低端机目标页加载慢），给个"加载中"遮罩
		navLoadingTimer = setTimeout(() => {
			uni.showLoading({ title: '加载中', mask: true });
		}, 250);
		uni.navigateTo({
		    url,
			complete: () => {
				clearTimeout(navLoadingTimer);
				navLoadingTimer = null;
				uni.hideLoading();
				clickLock.value = false;
			}
		});
	} catch (err) {
		clearTimeout(navLoadingTimer);
		navLoadingTimer = null;
		uni.hideLoading();
		clickLock.value = false;
	}
}

// 用户卡片点击 → 个人信息
function handleUserCardClick() {
	if (!hasPermission('sys:user:getById')) return;
	handleJumpPageChange('/mePages/userinfo/Index');
}

// 切换角色：项目负责人(2) ↔ 研发工程师(5)
const switchableRoleText: Record<number, string> = { 2: '项目负责人', 5: '研发工程师' };
const switchingRole = ref(false);
function handleSwitchRoleChange() {
	const current = Number(userInfo.usertype);
	if (current !== 2 && current !== 5) return;
	// 仅测试账号 1024 可切换
	if (String(userId.value) !== '1024') {
		uni.showToast({ title: '暂无权限操作', icon: 'none' });
		return;
	}
	const target = current === 2 ? 5 : 2;
	message
		.confirm({
			msg: `确定切换为「${switchableRoleText[target]}」角色吗？切换后工作台功能将随之变化`,
			title: '切换角色',
		})
		.then(async () => {
			if (switchingRole.value) return;
			switchingRole.value = true;
			uni.showLoading({ title: '切换中', mask: true });
			try {
				await fetchUpdateUserType({ utype: target });
				userInfo.usertype = target;
				userType.value = target;
				uni.setStorageSync('usertype', target);
				// 权限列表按 usertype 过滤，切换后重算并同步 globalData（hasPermission 优先读它）
				try {
					const systemMenuInfo = await fetchGetSystemMenuInfo();
					globalData.permissionList = extractPermissionsByPtype(systemMenuInfo, target);
					uni.setStorageSync('permissionList', globalData.permissionList);
				} catch (permErr) {
					console.error('刷新权限列表失败', permErr);
				}
				// 重置旧角色的待办角标
				store.todoCount = 0;
				setTabbarItem('map', 0);
				uni.hideLoading();
				uni.showToast({ title: `已切换为${switchableRoleText[target]}`, icon: 'none' });
				// 底部 tabbar 结构随角色变化（storage 非响应式），销毁全部页面栈重建实现整体刷新
				setTimeout(() => {
					uni.reLaunch({ url: '/pages/me' });
				}, 800);
			} catch (err) {
				uni.hideLoading();
				uni.showToast({ title: '切换失败，请重试', icon: 'none' });
			} finally {
				switchingRole.value = false;
			}
		})
		.catch(() => {});
}

// 工作台宫格数据（按业务域分组，权限不足的分组自动隐藏）
const workGroups = computed(() => {
	const groups = [
		{
			title: '项目管理',
			tone: 'blue',
			items: [
				{ title: '实时任务', icon: '🕒', url: '/mePages/rtask/Index', show: hasPermission('project:RealTimeTask:select') },
				{ title: '项目分组', icon: '👥', url: '/mePages/groupmanage/Index', show: (userType.value === 0 || userType.value === 2|| userType.value === 4) && hasPermission('project:team:select') },
				{ title: '主站调度', icon: '🎛️', url: '/mePages/dispatchmanage/Index', show: hasPermission('project:Dispatch:select') },
				{ title: '现场文件', icon: '🖼️', url: '/mePages/projectimage/Index', show: [0, 4, 12].includes(userType.value) },
        { title: '气象信息', icon: '🌤️', url: '/mePages/prjmoji/Index', show: hasPermission('project:moji:select') && userType.value !== 1 },
				{ title: '服务验收单', icon: '📝', url: '/mePages/projectServiceSign/Index', show: hasPermission('project:ServiceSign:select') },
				{ title: '合同列表', icon: '📜', url: '/projectPages/contractpage/Index', show: [0,4].includes(userType.value)  },
				{ title: '点表管理', icon: '🔢', url: '/mePages/pection/Index', show: [0,2,3,5,8,9].includes(userType.value) },
				{ title: '待审核', icon: '✅', url: '/mePages/auditmanage/Index', show: userType.value === 0 || userType.value === 2, badge: store.items.length },
				{ title: '返工列表', icon: '🔁', url: '/mePages/rework/Index', show: [0, 2, 3, 9].includes(userType.value) && (hasPermission('project:Info:select') || hasPermission('project:Info:update')) },
				{ title: '工程等级考试', icon: '🎓', url: '/mePages/assessment/Index', show: userType.value === 0 || userType.value === 2 || userType.value === 3 ||userType.value === 4|| userType.value === 9 },
				{ title: '工程考核中心', icon: '🏗️', url: '/mePages/engineeringAssessment/Index', show: [0, 2, 9, 4, 3].includes(userType.value) || userId.value === '1024' },
				{ title: '满意度评价', icon: '⭐', url: '/mePages/projectSatisfaction/Index', show:  userType.value === 0 || userType.value === 1 },
				{ title: '出差推送', icon: '✈️', url: '/mePages/tripPush/Index', show: userType.value === 0 || userType.value === 2 || userType.value === 4 },
				{ title: '值班表', icon: '📆', url: '/mePages/holidayDuty/Index', show: true },
			],
		},
		{
      title: '智能助手',
			tone: 'violet',
			items: [
        { title: '知识库', icon: '📖', url: '/mePages/projectQa/Index', show: true },
				{ title: '知识问答', icon: '💡', url: '/mePages/aiCustomerService/Index', show: true },
				{ title: '项目助手', icon: '🤖', url: '/mePages/aiPrj/Index', show: true },
			],
		},
    {
      title: '研发中心',
      tone: 'indigo',
      items: [
        { title: '研发考核', icon: '🎯', url: '/mePages/rdassessment/Index', show: userType.value === 0  ||  userType.value === 4 || userType.value === 5 },
        { title: '研发需求', icon: '📋', url: '/mePages/rddemand/Index', show: true},
        { title: '研发缺陷', icon: '🐞', url: '/mePages/rddefect/Index', show: [0,2,3,5,8,9].includes(userType.value) },
				{ title: '网安加固', icon: '🛡️', url: '/mePages/networksecurityhardening/Index', show: [0,2,3,5,8,9].includes(userType.value) },
				{ title: '研发周报', icon: '📑', url: '/mePages/rdWeeklyReport/Index', show: userType.value === 0  ||  userType.value === 4 || userType.value === 5 },
				{ title: '研发满意度', icon: '😊', url: '/mePages/rdSatisfaction/Index', show: [0,1,2,3,4,9].includes(userType.value) },
      ],
    },
		{
			title: '报表管理',
			tone: 'teal',
			items: [
				{ title: '技术日报', icon: '📄', url: '/mePages/technicalsupportdaily/Index', show: hasPermission('project:DailyReport:select') && userType.value !== 5 && userType.value !== 1&& userType.value !== 6},
				{ title: '技术周报', icon: '📊', url: '/mePages/technicalsupportweekly/Index', show: hasPermission('project:Week:select') && userType.value !== 5 && userType.value !== 1 && userType.value !== 6},
				{ title: '项目总结', icon: '📝', url: '/projectPages/prjsummarypage/Index', show: hasPermission('project:Summary:select') && userType.value !== 5 && userType.value !== 1 && userType.value !== 6},
				{ title: '项目报表', icon: '📈', url: '/mePages/prjreport/Index', show: hasPermission('project:report') && userType.value !== 5 },
				{ title: '调试报表', icon: '🔍', url: '/mePages/debugreport/Index', show: hasPermission('project:debug') && userType.value !== 5 },
				{ title: '会议纪要', icon: '📅', url: '/mePages/meetingminutes/Index', show: hasPermission('project:Meeting:select') && userType.value !== 3 },
				{ title: '行为规范', icon: '📋', url: '/mePages/dailyweeksummaryreport/Index', show: userType.value === 0 || userType.value === 4 },
				{ title: '考勤统计', icon: '🗓', url: '/mePages/attendancestatistics/Index', show: hasPermission('project:Clockin:report:select') },
				{ title: '历史轨迹', icon: '🧭', url: '/mePages/historytrajectory/Index', show: hasPermission('system:Real:Time:Trajectory:select') && (userType.value === 0 || userType.value === 4) },
				{ title: '实时考勤', icon: '📍', url: '/mePages/engineeringcenterstaffattendancestatistics/Index', show: userType.value !== 0 && userType.value !== 1 && userType.value !== 4 && (userId.value === '1024' || userId.value === '1010') },
				{ title: '排班表', icon: '🗓', url: '/mePages/typesettingTableApp/Index', show: hasPermission('project:report') },
				{ title: '满意度报表', icon: '📊', url: '/mePages/projectSatisfactionReport/Index', show: userType.value === 0 || userType.value === 1 },
				{ title: '研发积分报表', icon: '🏅', url: '/mePages/rdScoreReport/Index', show: userType.value === 0 || userType.value === 4  },
        { title: '客户服务评价', icon: '💬', url: '/mePages/signServiceFeedback/Index', show: userType.value === 0 || userType.value === 4  },
				{ title: '周期完成率', icon: '📐', url: '/mePages/projectCycleReport/Index', show: hasPermission('project:report') },
				{ title: '研发缺陷报表', icon: '🐞', url: '/mePages/defectReport/Index', show: hasPermission('rd:defect:select') },
				{ title: '值班报表', icon: '📊', url: '/mePages/dutyReport/Index', show: userType.value === 0 || userType.value === 4},
				{ title: '项目财务报表', icon: '💰', url: '/mePages/financeReport/Index', show: true },
				{ title: '线索报表', icon: '📊', url: '/mePages/operationSales/leadReport/Index', show: [0, 4].includes(userType.value) },
				{ title: '日报报表', icon: '🗒️', url: '/mePages/personDailyReport/Index', show: userType.value === 0 || userType.value === 4 },
      ],
		},
		{
			title: '售后管理',
			tone: 'orange',
			items: [
				{ title: '售后管理', icon: '🛠️', url: '/mePages/aftersalemanage/Index', show: (hasPermission('aftermarket:select:permission.do') || hasPermission('project:afterMarket:reason:select')) && userType.value !== 7 },
				{ title: '售后设备', icon: '📦', url: '/mePages/aftersaledevice/Index', show: hasPermission('aftermarket:select:permission.do') || hasPermission('project:afterMarket:reason:select') },
				{ title: '售后原因', icon: '💡', url: '/mePages/aftersalereason/Index', show: hasPermission('project:afterMarket:reason:select') },
			],
		},
		{
			title: '运营管理',
			tone: 'rose',
			items: [
				{ title: '销售线索', icon: '🧲', url: '/mePages/operationSales/lead/Index', show: [0, 1, 12].includes(userType.value) },
				{ title: '展会管理', icon: '🎪', url: '/mePages/operationSales/exhibition/Index', show: [0, 1, 12].includes(userType.value) },
			],
		},
		{
			title: '系统管理',
			tone: 'slate',
			items: [
        { title: '用户管理', icon: '👤', url: '/mePages/membermanage/Index', show: hasPermission('sys:user:getPage') && (userType.value === 0 || userType.value === 4) },
				{ title: '系统配置', icon: '⚙️', url: '/mePages/systemconfig/Index', show: hasPermission('system.conf.update') || userId.value === '1024' || userType.value === 4 },
				{ title: '项目权重', icon: '⚖️', url: '/mePages/prjweightpage/Index', show: hasPermission('project:Weight:select') },
				{ title: '调试任务模板', icon: '🧩', url: '/mePages/debugTaskTemplate/Index', show: userType.value === 0 || userType.value === 2 },
				{ title: '项目物料库', icon: '📦', url: '/mePages/materialLibrary/Index', show: true },
				{ title: '物料权重', icon: '🔗', url: '/mePages/materialLibraryWeight/Index', show: true },
				{ title: '项目变更', icon: '🔄', url: '/mePages/projectchange/Index', show: hasPermission('project:Change:Info:select') },
				{ title: '合同变更', icon: '✍️', url: '/mePages/contractchange/Index', show: hasPermission('project:Change:Contract:select') && userType.value !== 5 },
        { title: 'SIM卡管理', icon: '📱', url: '/mePages/simCardAreaManage/Index', show: userType.value === 0 || userType.value === 2 },
				{ title: 'WorkBuddy', icon: '🔌', url: '/mePages/workbuddy/Index', show: [0,12].includes(userType.value) },
				{ title: '财务报表变更', icon: '💹', url: '/mePages/financeReportChange/Index', show: [0,4].includes(userType.value) },
				{ title: '确认单事项', icon: '📝', url: '/mePages/confirmLibrary/Index', show: [0,1,2].includes(userType.value) },
				{ title: '规约转换器', icon: '📡', url: '/mePages/protocolConverter/Index', show: [0,1].includes(userType.value) },
			],
		},
	];
	return groups
		.map(g => ({ ...g, items: g.items.filter((it: any) => it.show) }))
		.filter(g => g.items.length > 0);
});

// 清除缓存
function handleClearStorageChange() {
    message
        .confirm({
            msg: '确定要清除缓存吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            uni.removeStorageSync('username');
            uni.removeStorageSync('password');
            uni.removeStorageSync('checked');
            uni.removeStorageSync('usertype');
			uni.removeStorageSync('phoneNumber');
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
}

// 检查新版本
const handleCheckUpgradeChange = throttle(async (url: string) => {
	try {
		if (clickLock.value) return;
		clickLock.value = true;

	} catch (err) {
		clickLock.value = false;
	}
    // #ifdef MP-WEIXIN
    const updateManager = uni.getUpdateManager();
    updateManager.onCheckForUpdate((res) => {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate);
		clickLock.value = false;
    });

    updateManager.onUpdateReady((res1: any) => {
        console.log('res1', res1);
        uni.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success(res: any) {
                if (res.confirm) {
                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                    updateManager.applyUpdate();
                } else if (res.cancel) {
                    console.log('用户点击取消，不更新');
                }
            },
        });
    });

    updateManager.onUpdateFailed((res: any) => {
        console.log('res', res);
        // 新的版本下载失败
        uni.showModal({
            title: '已经有新版本了哟~',
            content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
        });
    });
    // #endif

    // #ifdef APP || APP-PLUS
    const platform = uni.getSystemInfoSync().platform;
    plus.runtime.getProperty((plus.runtime as any).appid, (inf) => {
        console.log('inf', inf);
        // 获取服务器的版本号
        uni.request({
            url: WEB_URL + '/projectcontract.json',
            method: 'GET',
            data: {
                edition_type: plus.runtime.appid,
                version_type: platform, // android或者ios
                edition_number: inf.versionCode, // 打包时manifest设置的版本号
                _t: new Date().getTime(),
            },
            success: (resVersion: any) => {
                console.log('resVersion', resVersion);
                if (Number(resVersion.data.data[platform].edition_number) <= Number(inf.versionCode)) {
                    uni.showToast({
                        icon: 'none',
                        duration: 2000,
                        title: '已是最新版本',
						complete: () => {
							clickLock.value = false;
						}
                    });
                } else {
					clickLock.value = false;
                    // 如果是wgt升级，并且是静默更新 （注意！！！ 如果是手动检查新版本，就不用判断静默更新，请直接跳转更新页，不然点击检查新版本后会没反应）
                    if (resVersion.data.data[platform].package_type === 1) {
                        // 调用静默更新方法 传入下载地址
                        silenceUpdate(resVersion.data.data[platform].edition_url);
                    } else {
                        message
                            .confirm({
                                // msg: `亲爱的用户，发现新版本${resVersion.data.data.describe.replace(/<br>/g, ' ')}`,
                                msg: `亲爱的用户，发现新版本${resVersion.data.data[platform].edition_name}。${resVersion.data.data.describe.replace(/<br>/g, ' ')}`,
                                title: '更新提示',
                            })
                            .then(() => {
                                plus.runtime.openURL(resVersion.data.data[platform].edition_url);
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                    }
                }
            },
            fail: () => {},
        });
    });
    // #endif
}, 2000)

// 退出登录
function handleLogoutChange() {
    message
        .confirm({
            msg: '确定要退出登录吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            try {
                const data = await logout();
                uni.removeStorageSync('userId');
                uni.removeStorageSync('token');
                uni.removeStorageSync('usertype');
                uni.removeStorageSync('permissionList');
                uni.$emit('user-logout');
                uni.reLaunch({
                    url: '/pages/login',
                });
            } catch (err) {
                console.error('退出登录失败', err);
				uni.removeStorageSync('userId');
				uni.removeStorageSync('token');
				uni.removeStorageSync('usertype');
				uni.removeStorageSync('permissionList');
				uni.$emit('user-logout');
				uni.reLaunch({
				    url: '/pages/login',
				});
            }
            // setTabbarItemActive('home');
            // router.pushTab({ name: 'home' });
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
}

// 上传头像
const handleImgUploadChange: UploadMethod = async(file, formData, options) => {
    console.log('file', file);

    // #ifdef H5
    uni.uploadFile({
        url: BASE_URL + '/projectFile/uploadFile.do',
        filePath: file.url,
        name: 'multipartFile',
        header: {
            token: uni.getStorageSync('token')
        },
        success: async(res) => {
            try {
                let result: any = JSON.parse(res.data);
                if (result.code !== 0) {
                    uni.showToast({
                        icon: 'none',
                        title: result.data || result.msg,
                        duration: 1500
                    })
                } else {
                    const dataRes = result.data; // 解析后端返回
                    const data = await fetchUpdateUserImageInfo({ id: Number(uni.getStorageSync('userId')), image: dataRes });
                    uni.showToast({
                        icon: 'none',
                        title: '修改头像成功',
                        duration: 1500,
                        success: () => {
                            fileList.value = [{ url: dataRes, status: 'success' }];
                        }
                    })
                }
            } catch (error) {
                console.log('修改头像失败', error);
                fileList.value = [{ url: 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
            }
        },
        fail(err) {
            uni.showToast({
                icon: 'none',
                title: '上传头像失败',
                duration: 1500
            })
        }
    })
    // #endif

    // #ifdef APP || APP-PLUS
    uni.uploadFile({
        url: BASE_URL + '/projectFile/uploadFile.do',
        filePath: file.url,
        name: 'multipartFile',
        header: {
            token: uni.getStorageSync('token')
        },
        success: async(res) => {
            try {
                let result: any = JSON.parse(res.data);
                if (result.code !== 0) {
                    uni.showToast({
                        icon: 'none',
                        title: result.data || result.msg,
                        duration: 1500
                    })
                } else {
                    const dataRes = result.data; // 解析后端返回
                    const data = await fetchUpdateUserImageInfo({ id: Number(uni.getStorageSync('userId')), image: dataRes });
                    uni.showToast({
                        icon: 'none',
                        title: '修改头像成功',
                        duration: 1500,
                        success: () => {
                            fileList.value = [{ url: dataRes, status: 'success' }];
                        }
                    })
                }
            } catch (error) {
                console.log('修改头像失败', error);
                fileList.value = [{ url: 'https://pms.linkqi.cn:18443/soybean.jpg', status: 'success' }];
            }
        },
        fail: (uploadErr) => {
            console.error('上传失败:', uploadErr);
        }
    })
    // #endif
}

// 底部tabbar切换
function handleTabbarChange({ value }: { value: string }) {
    if (value !== 'me') {
		if (clickLock.value) return;
		clickLock.value = true;
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name,
			complete: () => {
				clickLock.value = false;
			}
		})
	}
}

// 预加载高频工作台页面：低端机点击进入时目标页已初始化，减少白屏等待（仅 APP/H5 生效）
let workPagePreloaded = false;
function preloadWorkPages() {
	if (workPagePreloaded) return;
	workPagePreloaded = true;
	const type = Number(userType.value);
	const targets = [
		{ url: '/mePages/rtask/Index', ok: hasPermission('project:RealTimeTask:select') },
		{ url: '/mePages/projectQa/Index', ok: true },
		{ url: '/mePages/assessment/Index', ok: type === 0 || type === 2 || type === 3 || type === 9 },
	];
	// #ifdef APP || H5
	targets.filter(t => t.ok).forEach(t => {
		uni.preloadPage({ url: t.url, fail: () => {} });
	});
	// #endif
}

// 获取版本号
function getAppversion() {
	// #ifdef H5 || MP-WEIXIN
	const systemInfo: any = uni.getSystemInfoSync();
	version.value = systemInfo.appVersion;
	// #endif

	// #ifdef APP || APP-PLUS
	plus.runtime.getProperty(plus.runtime.appid, function(inf) {
		version.value = inf.version;
	})
	// #endif
}

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
})

onLoad(() => {
    getAppversion();
    preloadWorkPages();
})

onShow(() => {
	getUserDetailInfo();
})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-navbar title="我" safe-area-inset-top placeholder fixed :bordered="false" :custom-style="`background:${isDark ? '#0F1524' : '#F4F8FF'}; color:${isDark ? '#E8ECF8' : '#1F2A44'}`" />

		<view class="page" :class="isDark ? 'dark' : ''">
			<!-- 用户卡片 -->
			<view class="hero-card" @click="handleUserCardClick">
				<view class="hero-blob hero-blob-1"></view>
				<view class="hero-blob hero-blob-2"></view>
				<view class="hero-blob hero-blob-3"></view>

				<view class="hero-greeting">
					<text class="hero-greeting-emoji">{{ greetingEmoji }}</text>
					<text class="hero-greeting-title">{{ greeting }}</text>
					<text class="hero-greeting-date">{{ greetingDate }}</text>
				</view>

				<view class="hero-main">
					<view class="avatar-ring" @click.stop>
						<view class="avatar-inner">
							<wd-upload v-model:file-list="fileList" reupload :limit="1" :upload-method="handleImgUploadChange"></wd-upload>
						</view>
					</view>

					<view class="hero-info">
						<view class="hero-name-row">
							<text class="hero-name">{{ userInfo.username }}</text>
							<wd-tag size="small" round color="#FFFFFF" bg-color="rgba(255,255,255,0.22)" v-if="userType !== 7">
								{{ userInfo.usertype === 0 ? '系统管理员' : userInfo.usertype === 1 ? '销售' : userInfo.usertype === 2 ? '项目负责人' : userInfo.usertype === 3 ? '技术工程师' : userInfo.usertype === 4 ? '综合管理' : userInfo.usertype === 5 ? '研发工程师' : userInfo.usertype === 6 ? '生产工程师' : userInfo.usertype === 7 ? '厂家' : userInfo.usertype === 8 ? '测试' : userInfo.usertype === 9 ? '组长' : userInfo.usertype === 10 ? '只读' : '未知'  }}
							</wd-tag>
							<wd-tag size="small" round color="#FFFFFF" :bg-color="rankMap[userInfo.rank].substring(3)" v-if="(userType === 2 || userType === 3 || userType === 9) && rankMap[userInfo.rank]">
								{{ rankMap[userInfo.rank].substring(0, 2) }}
							</wd-tag>
							<wd-icon v-if="userInfo.isBind" class-prefix="icon" name="weixinmw" color="#0DD116" custom-style="font-size: 32rpx" @click.stop="handleJumpPageChange('/mePages/userinfo/Index')"></wd-icon>
						</view>
						<view class="hero-phone" @click.stop="handleMakePhoneChange">
							<text class="hero-phone-text">{{ maskPhone(userInfo.phnum) || '暂无' }}</text>
							<wd-icon v-if="userInfo.phnum" name="file-copy" color="rgba(255,255,255,0.92)" custom-style="font-size: 26rpx; margin-left: 6rpx" @click.stop="handleCopyChange" />
						</view>
					</view>
          <view class="hero-actions">
            <view v-if="userId == '1024'" class="hero-icon-btn" @click.stop="handleSwitchRoleChange">
              <wd-icon name="refresh" color="#FFFFFF" size="18px"></wd-icon>
            </view>
          </view>
					<view class="hero-actions">
						<view  class="hero-icon-btn" @click.stop="handleJumpPageChange('/mePages/updatepassword/Index')">
							<wd-icon name="lock-on" color="#FFFFFF" size="18px"></wd-icon>
						</view>
						<view class="hero-icon-btn" @click.stop="handleUserCardClick">
              <wd-icon name="user" color="#FFFFFF" size="18px"></wd-icon>
						</view>
					</view>
				</view>
			</view>

			<wd-gap height="32rpx" />

			<template v-for="group in workGroups" :key="group.title">
				<view class="workbench-group" :class="['tone-' + group.tone, isDark ? 'dark' : '']">
					<view class="group-header">
						<view class="group-dot"></view>
						<text class="group-title">{{ group.title }}</text>
						<text class="group-count">{{ group.items.length }} 项</text>
					</view>
					<view class="grid-card" :class="isDark ? 'dark' : ''">
						<view v-for="item in group.items" :key="item.title" class="grid-item" @click="handleJumpPageChange(item.url)">
							<view class="grid-icon">
								<wd-badge v-if="item.badge > 0" :model-value="item.badge" max="99">
									<text class="grid-icon-text">{{ item.icon }}</text>
								</wd-badge>
								<text v-else class="grid-icon-text">{{ item.icon }}</text>
							</view>
							<text class="grid-label">{{ item.title }}</text>
						</view>
					</view>
				</view>
			</template>

			<view class="workbench-group" :class="['tone-slate', isDark ? 'dark' : '']">
				<view class="group-header">
					<view class="group-dot"></view>
					<text class="group-title">通用设置</text>
				</view>
				<view class="settings-card" :class="isDark ? 'dark' : ''">
					<wd-cell title="暗黑模式" custom-style="background: transparent">
						<wd-switch v-model="isDark" size="18px" @change="handleToggleThemeChange" />
					</wd-cell>
					<wd-cell title="清除缓存" custom-style="background: transparent" is-link @click="handleClearStorageChange" />
					<!-- #ifdef APP || APP-PLUS || MP-WEIXIN -->
					<wd-cell title="版本" title-width="200px" custom-style="background: transparent" :value="version" is-link @click="handleCheckUpgradeChange" />
					<!-- #endif -->
					<!-- #ifdef H5 -->
					<wd-cell title="版本" title-width="200px" custom-style="background: transparent" :value="version" />
					<!-- #endif -->
					<wd-cell v-if="userType !== 7" title="用户协议" title-width="200px" custom-style="background: transparent" is-link @click="handleJumpPageChange('/mePages/webview/Index?url=https://pms.linkqi.cn:18443/userprotocol.html&title=' + encodeURIComponent('用户协议'))" />
					<wd-cell v-if="userType !== 7" title="隐私政策" title-width="200px" custom-style="background: transparent" is-link @click="handleJumpPageChange('/mePages/webview/Index?url=https://pms.linkqi.cn:18443/privacy.html&title=' + encodeURIComponent('隐私政策'))" />
					<wd-cell v-if="userType !== 7" title="关于我们" title-width="200px" custom-style="background: transparent" is-link @click="handleJumpPageChange('/mePages/webview/Index')" />
				</view>
			</view>

			<wd-gap height="40rpx" />

			<wd-button hairline type="error" :custom-class="isDark ? 'darkButtonWrap' : 'lightButtonWrap'" block @click="handleLogoutChange">退出登录</wd-button>

			<wd-gap height="40rpx" />

			<!-- <view class="wd-action-sheet-else">
				<wd-action-sheet v-model="showLanguageSwitch" class="" safe-area-inset-bottom :actions="languageActions" :cancel-text="$t('qu-xiao')" :title="$t('yuYan')" @select="handleLanguageSelect" />
			</view> -->

			<wd-tabbar v-if="userType !== 7" shape="round" model-value="me" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
				<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
			</wd-tabbar>

			<wd-message-box />

			<LevelCertificate v-model:visible="showModal" :level="rankName" :department="'工程中心'"
				:honorQuote="'引领AI技术革新，突破多项技术壁垒，特授予首席技术荣誉'" :achievement="'发表顶会论文8篇 | 专利12项 | 培养5名高级专家'" />
		</view>
	</wd-config-provider>
</template>

<style lang="scss" scoped>
:deep(uni-image > div) {
    width: 50px !important;
    height: 50px !important;
}

:deep(.wd-upload__close) {
    display: none !important;
}

:deep(.wechatImage) {
	scale: 0.4 !important;
	margin-left: -20rpx !important;
}

/* ===== 页面容器 ===== */
.page {
	padding: 20rpx 24rpx 60rpx;
	min-height: 100vh;
	background: #F4F8FF;
	box-sizing: border-box;
}

.page.dark {
	background: #0F1524;
}

/* ===== 用户卡片（渐变头部） ===== */
.hero-card {
	position: relative;
	overflow: hidden;
	border-radius: 32rpx;
	padding: 30rpx 32rpx 30rpx;
	background: linear-gradient(135deg, #5B9BFF 0%, #2E6BFF 55%, #1B4FD8 100%);
	box-shadow: 0 16rpx 40rpx rgba(46, 107, 255, 0.28);
	-webkit-tap-highlight-color: transparent;
}

.hero-card:active {
	opacity: 0.96;
}

.hero-blob {
	position: absolute;
	border-radius: 50%;
	pointer-events: none;
}

.hero-blob-1 {
	width: 240rpx;
	height: 240rpx;
	background: rgba(255, 255, 255, 0.14);
	top: -110rpx;
	right: -60rpx;
}

.hero-blob-2 {
	width: 160rpx;
	height: 160rpx;
	background: rgba(255, 255, 255, 0.10);
	bottom: -70rpx;
	left: 40rpx;
}

.hero-blob-3 {
	width: 56rpx;
	height: 56rpx;
	background: rgba(255, 255, 255, 0.22);
	right: 96rpx;
	bottom: 32rpx;
}

.hero-main {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
}

.avatar-ring {
	width: 120rpx;
	height: 120rpx;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	padding: 10rpx;
	background: rgba(255, 255, 255, 0.92);
	box-sizing: border-box;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.16);
}

.avatar-inner {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	overflow: hidden;
	background: #E9F2FF;
}

.hero-info {
	flex: 1;
	min-width: 0;
	margin-left: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.hero-greeting {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.hero-greeting-emoji {
	font-size: 42rpx;
	line-height: 1;
	margin-right: 14rpx;
}

.hero-greeting-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #FFFFFF;
	letter-spacing: 3rpx;
	text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.hero-greeting-date {
	margin-left: auto;
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.72);
	letter-spacing: 1rpx;
	align-self: flex-end;
	padding-bottom: 6rpx;
}

.hero-name-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12rpx;
}

.hero-name {
	font-size: 36rpx;
	font-weight: 700;
	color: #FFFFFF;
	max-width: 320rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.hero-phone {
	display: flex;
	align-items: center;
}

.hero-phone-text {
	font-size: 25rpx;
	color: rgba(255, 255, 255, 0.88);
}

.hero-actions {
	position: relative;
	z-index: 1;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18rpx;
	margin-left: 12rpx;
}

.hero-icon-btn {
	width: 62rpx;
	height: 62rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.20);
	border: 1rpx solid rgba(255, 255, 255, 0.28);
	display: flex;
	align-items: center;
	justify-content: center;
}

.hero-icon-btn:active {
	background: rgba(255, 255, 255, 0.32);
}

/* ===== 工作台分组 ===== */
.workbench-group {
	margin-bottom: 20rpx;
}

.group-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
	padding: 0 8rpx;
}

.group-dot {
	width: 10rpx;
	height: 28rpx;
	border-radius: 6rpx;
	background: linear-gradient(180deg, #5B9BFF, #2E6BFF);
	box-shadow: 0 4rpx 10rpx rgba(46, 107, 255, 0.35);
	margin-right: 14rpx;
}

.group-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1F2A44;
}

.group-count {
	margin-left: auto;
	font-size: 22rpx;
	color: #A0AAC2;
}

/* ===== 宫格卡片 ===== */
.grid-card {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	border-radius: 28rpx;
	background: #FFFFFF;
	padding: 24rpx 12rpx 8rpx;
	gap: 4rpx 0;
	box-sizing: border-box;
	box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.grid-card.dark {
	background: #171F31;
	border: 1rpx solid rgba(255, 255, 255, 0.04);
	box-shadow: none;
}

.grid-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 18rpx 4rpx;
	gap: 16rpx;
	border-radius: 20rpx;
	-webkit-tap-highlight-color: transparent;
}

.grid-item:active {
	background: rgba(46, 107, 255, 0.05);
}

/* 立体按钮式图标：顶部高光 + 底部厚度 + 按压缩回 */
.grid-icon {
	position: relative;
	width: 88rpx;
	height: 88rpx;
	border-radius: 24rpx;
	background: linear-gradient(180deg, var(--gi-top, #F2F7FF), var(--gi-bot, #E6EFFF));
	display: flex;
	align-items: center;
	justify-content: center;
	transform: translateZ(0);
	transition: transform 0.12s ease, box-shadow 0.12s ease;
	box-shadow:
		inset 0 3rpx 4rpx rgba(255, 255, 255, 0.70),
		inset 0 -4rpx 6rpx var(--gi-inset, rgba(46, 107, 255, 0.12)),
		0 8rpx 0 0 var(--gi-edge, rgba(46, 107, 255, 0.32)),
		0 14rpx 24rpx var(--gi-glow, rgba(46, 107, 255, 0.16));
}

.grid-item:active .grid-icon {
	transform: translateY(6rpx);
	box-shadow:
		inset 0 3rpx 4rpx rgba(255, 255, 255, 0.70),
		inset 0 -4rpx 6rpx var(--gi-inset, rgba(46, 107, 255, 0.12)),
		0 2rpx 0 0 var(--gi-edge, rgba(46, 107, 255, 0.32)),
		0 6rpx 12rpx var(--gi-glow, rgba(46, 107, 255, 0.16));
}

.grid-card.dark .grid-icon {
	background: linear-gradient(180deg, var(--gi-top-d, rgba(46, 107, 255, 0.22)), var(--gi-bot-d, rgba(46, 107, 255, 0.08)));
	box-shadow:
		inset 0 2rpx 3rpx rgba(255, 255, 255, 0.10),
		0 6rpx 0 0 var(--gi-edge-d, rgba(46, 107, 255, 0.32)),
		0 10rpx 18rpx rgba(0, 0, 0, 0.35);
}

.grid-icon-text {
	font-size: 52rpx;
	line-height: 1;
}

.grid-label {
	font-size: 24rpx;
	font-weight: 500;
	color: #4A5570;
	text-align: center;
}

/* ===== 分组柔色系 ===== */
/* 项目管理 · 蓝 */
.workbench-group.tone-blue .group-dot {
	background: linear-gradient(180deg, #6EA5FF, #2E6BFF);
	box-shadow: 0 4rpx 10rpx rgba(46, 107, 255, 0.35);
}

.workbench-group.tone-blue {
	--gi-top: #F2F7FF;
	--gi-bot: #E6EFFF;
	--gi-inset: rgba(46, 107, 255, 0.12);
	--gi-edge: rgba(46, 107, 255, 0.32);
	--gi-glow: rgba(46, 107, 255, 0.16);
	--gi-top-d: rgba(46, 107, 255, 0.22);
	--gi-bot-d: rgba(46, 107, 255, 0.08);
	--gi-edge-d: rgba(46, 107, 255, 0.32);
}

/* 智能助手 · 紫 */
.workbench-group.tone-violet .group-dot {
	background: linear-gradient(180deg, #B3A0FF, #7C6BFF);
	box-shadow: 0 4rpx 10rpx rgba(124, 107, 255, 0.35);
}

.workbench-group.tone-violet {
	--gi-top: #F4F1FF;
	--gi-bot: #EAE4FF;
	--gi-inset: rgba(124, 107, 255, 0.14);
	--gi-edge: rgba(124, 107, 255, 0.34);
	--gi-glow: rgba(124, 107, 255, 0.16);
	--gi-top-d: rgba(124, 107, 255, 0.22);
	--gi-bot-d: rgba(124, 107, 255, 0.08);
	--gi-edge-d: rgba(124, 107, 255, 0.34);
}

/* 报表管理 · 青 */
/* 报表管理 · 蓝紫 */
.workbench-group.tone-teal .group-dot {
  background: linear-gradient(180deg, #6B8CFF, #4F6FE8);
  box-shadow: 0 4rpx 10rpx rgba(79, 111, 232, 0.28);
}

.workbench-group.tone-teal {
  --gi-top: #F0F3FF;
  --gi-bot: #E7ECFF;
  --gi-inset: rgba(79, 111, 232, 0.10);
  --gi-edge: rgba(79, 111, 232, 0.24);
  --gi-glow: rgba(79, 111, 232, 0.12);
  --gi-top-d: rgba(79, 111, 232, 0.18);
  --gi-bot-d: rgba(79, 111, 232, 0.05);
  --gi-edge-d: rgba(79, 111, 232, 0.26);
}
/* 售后管理 · 橙 */
.workbench-group.tone-orange .group-dot {
	background: linear-gradient(180deg, #FFB980, #FF8A3D);
	box-shadow: 0 4rpx 10rpx rgba(255, 138, 61, 0.30);
}

.workbench-group.tone-orange {
	--gi-top: #FFF5EC;
	--gi-bot: #FFEBDD;
	--gi-inset: rgba(255, 138, 61, 0.12);
	--gi-edge: rgba(255, 138, 61, 0.30);
	--gi-glow: rgba(255, 138, 61, 0.14);
	--gi-top-d: rgba(255, 138, 61, 0.20);
	--gi-bot-d: rgba(255, 138, 61, 0.06);
	--gi-edge-d: rgba(255, 138, 61, 0.30);
}

/* 系统管理 */
.workbench-group.tone-slate .group-dot {
	background: linear-gradient(180deg, #6EA5FF, #2E6BFF);
	box-shadow: 0 4rpx 10rpx rgba(46, 107, 255, 0.35);
}

.workbench-group.tone-slate {
	--gi-top: #F2F7FF;
	--gi-bot: #E6EFFF;
	--gi-inset: rgba(46, 107, 255, 0.12);
	--gi-edge: rgba(46, 107, 255, 0.32);
	--gi-glow: rgba(46, 107, 255, 0.16);
	--gi-top-d: rgba(46, 107, 255, 0.22);
	--gi-bot-d: rgba(46, 107, 255, 0.08);
	--gi-edge-d: rgba(46, 107, 255, 0.32);
}


/* 研发中心 · 靛蓝 */
.workbench-group.tone-indigo .group-dot {
	background: linear-gradient(180deg, #7986FF, #5C6BC0);
	box-shadow: 0 4rpx 10rpx rgba(92, 107, 192, 0.35);
}

.workbench-group.tone-indigo {
	--gi-top: #E8EAF6;
	--gi-bot: #C5CAE9;
	--gi-inset: rgba(92, 107, 192, 0.12);
	--gi-edge: rgba(92, 107, 192, 0.32);
	--gi-glow: rgba(92, 107, 192, 0.16);
	--gi-top-d: rgba(92, 107, 192, 0.22);
	--gi-bot-d: rgba(92, 107, 192, 0.08);
	--gi-edge-d: rgba(92, 107, 192, 0.32);
}

/* 运营管理 · 玫红 */
.workbench-group.tone-rose .group-dot {
	background: linear-gradient(180deg, #FF9AB8, #FF5C8A);
	box-shadow: 0 4rpx 10rpx rgba(255, 92, 138, 0.30);
}

.workbench-group.tone-rose {
	--gi-top: #FFF1F5;
	--gi-bot: #FFE3EB;
	--gi-inset: rgba(255, 92, 138, 0.12);
	--gi-edge: rgba(255, 92, 138, 0.30);
	--gi-glow: rgba(255, 92, 138, 0.14);
	--gi-top-d: rgba(255, 92, 138, 0.20);
	--gi-bot-d: rgba(255, 92, 138, 0.06);
	--gi-edge-d: rgba(255, 92, 138, 0.30);
}

/* ===== 通用设置卡片 ===== */
.settings-card {
	border-radius: 28rpx;
	overflow: hidden;
	background: #FFFFFF;
	box-shadow: 0 8rpx 28rpx rgba(58, 111, 255, 0.06);
}

.settings-card.dark {
	background: #171F31;
	border: 1rpx solid rgba(255, 255, 255, 0.04);
	box-shadow: none;
}

/* ===== 退出登录按钮 ===== */
.lightButtonWrap,
.darkButtonWrap {
	height: 92rpx !important;
	border-radius: 46rpx !important;
	border: none !important;
	background: linear-gradient(90deg, #FF7A8A, #FF4D5E) !important;
	color: #FFFFFF !important;
	font-size: 30rpx !important;
	font-weight: 600 !important;
	box-shadow: 0 12rpx 28rpx rgba(255, 77, 94, 0.25);
}

.lightButtonWrap::after,
.darkButtonWrap::after {
	border: none !important;
}

/* ===== 暗色适配 ===== */
.workbench-group.dark .group-title {
	color: #E8ECF8;
}

.workbench-group.dark .group-count {
	color: #6A7590;
}

.grid-card.dark .grid-label {
	color: #C6CDE0;
}
</style>
