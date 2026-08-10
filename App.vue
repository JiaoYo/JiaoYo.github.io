<script setup lang="ts">
	import { useTheme } from '@/composables/theme/theme';
	import { ref, watch, createVNode, render, onMounted, onUnmounted } from 'vue';
	import { onReady, onLaunch, onShow, onHide, onUnload } from '@dcloudio/uni-app';
	// #ifdef APP || APP-PLUS
	import { usePushPermission } from '@/composables/usePushPermission';
	const { initPushPermission, sendLocalPush, initPushClickListener } = usePushPermission();
	// #endif
	import { useI18nSync } from './hooks/useI18nSync';
	import { useIframeMessage } from './hooks/useIframeMessage';
	import { silenceUpdate } from '@/utils/silence-update';
	import { getUUID, doSM2Sign, base64ToHex, getType, hasPermission } from '@/utils/index';
	import Websocket from '@/utils/websocket';
	import globalnoticebar from '@/components/globalnoticebar.vue';
	import { WEB_URL } from '@/utils/request';
	import { fetchGetPrjClockinLastInfo } from '@/service/index';
	import { useLargeArrayStore } from '@/store/useDataStore';
	
	const store = useLargeArrayStore();
	
	const { toggleTheme, themeVars, colorColumns } = useTheme();
	
	const { setLocale } = useI18nSync(); // 禁用内置的iframe消息监听，使用专门的hook处理
	
	// 推送项目、合同、审核消息
	const ws: any = ref<any>(null);
	// const text = ref<string[]>([]);
	const text = ref<any>(null);
	
	// 推送售后消息
	const wsAftersale: any = ref<any>(null);
	
	// 推送调试消息
	const wsDebug: any = ref<any>(null);
	
	// 使用专门的iframe消息处理hook
	useIframeMessage({
	    onLocaleChange: (locale) => {
	        setLocale(locale);
	    },
	});
	
	// #ifdef H5
	// 创建全局提示栏（只创建一次）
	const vnode = createVNode(globalnoticebar, { text });
	const container = document.createElement('div');
	document.body.appendChild(container);
	render(vnode, container);
	// #endif
	
	function initWebSocket() {
	    // 已登录验证
	    const token = uni.getStorageSync('token');
	    if (!token) {
	        console.log('未登录，不建立 WebSocket 连接')
	        return
	    }
		
	    if (!hasPermission('project:review:websocket')) {
	        // uni.showToast({
	        //     icon: 'none',
	        //     title: '暂无获取项目、合同、审核推送权限、请联系管理员',
	        //     duration: 1500
	        // })
	        return false
	    }
		
		if (ws.value) {
			return
		}
	
	    // // 生成签名参数
	    // const timestamp = Date.now();
	    // const nonce = getUUID();
	    // const se = doSM2Sign(`${nonce}${timestamp}`);
	    // const signature = base64ToHex(se);
	
	    // 建立连接
	    ws.value = new Websocket(`/review`);
	
	    // 接收消息
	    ws.value.getMessage((res: any) => {
	        console.log('收到消息：', res)
	        const data = JSON.parse(res.data)
	        console.log('data', data);
	        if (getType(data) === 'object') {
	            // #ifdef H5
	            // let newText = ''
	            // if (data.hasOwnProperty('reviewname') && data.reviewname === 'contract') {
	            //     newText = `您收到了一份合同。项目名称: ${data.projectname}  合同名称: ${data.contractname}`;
	            // } else {
	            //     newText = `项目名称: ${data.projectname}  合同名称: ${data.contractname}`;
	            // }
	            // text.value.push(newText);
	            text.value = JSON.stringify(data);
	            // #endif
	            // #ifdef APP || APP-PLUS
	            if (data.type === 0) {
					store.addItem({
	                    id: data.id,
	                    projectname: data.name,
	                    type: 1
	                });
	                sendLocalPush('审核通知', `项目 [${data.name}] 中有待审核任务, 请注意查看! `, {
	                    pid: data.id,
	                    projectname: encodeURIComponent(data.name),
	                    type: 1
	                });
	            } else if (data.type === 1) {
					store.addItem({
					    proid: data.proid,
					    projectname: data.name,
						activeTab: 4,
					    type: 1
					});
	                sendLocalPush('审核通知', `项目 [${data.name}] 中有待审核任务, 请注意查看! `, {
	                    pid: data.proid,
	                    cid: data.ids,
	                    activeTab: 4,
	                    type: 1
	                });
	            } else if (data.type === 2) {
	                data.data.forEach((item: any) => {
						store.addItem({
						    id: item.id,
						    projectname: item.projectname,
						    type: 2
						});
	                    sendLocalPush('审核通知', `项目 [${item.projectname}] 待审核, 请注意查看! `, {
	                        pid: item.id,
	                        projectname: item.projectname,
	                        type: 2
	                    });
	                });
	            } else if (data.type === 3) {
	                data.data.forEach((item: any) => {
						store.addItem({
						    proid: item.proid,
						    projectname: item.projectname,
							debugname: item.debugname,
							activeTab: 4,
						    type: 3
						});
	                    sendLocalPush('审核通知', `项目名称 [${item.projectname}]  调试业务名称 [${item.debugname}]  待审核, 请注意查看! `, {
	                        pid: item.proid,
	                        activeTab: 4,
	                        type: 3
	                    });
	                });
	            } else if (data.type === 4) {
	                data.data.forEach((item: any) => {
						store.addItem({
						    proid: item.proid,
						    projectname: item.name,
							activeTab: 4,
						    type: 4
						});
	                    sendLocalPush('审核通知', `项目名称 [${item.name}]  有申请调试任务待通过, 请注意查看! `, {
	                        pid: item.proid,
	                        activeTab: 4,
	                        type: 4
	                    });
	                });
	            }
	            // #endif
	        }
	    })
	}
	
	function initAfterWebSocket() {
		// 已登录验证
		const token = uni.getStorageSync('token');
		if (!token) {
		    console.log('未登录，不建立 WebSocket 连接')
		    return
		} 
		
		const userId = uni.getStorageSync('userId');
		const userType = uni.getStorageSync('usertype');
		
		if (userType !== 0 && userId !== '1023' && userId !== '1025') {
			return
		}
		
		if (wsAftersale.value) {
			return
		}
		
		wsAftersale.value = new Websocket(`/afterMarket`)
			
		// 接收消息
		wsAftersale.value.getMessage((res: any) => {
		    console.log('收到消息：', res)
		    const data = JSON.parse(res.data)
		    if (getType(data) === 'object') {
				data.messageType = 'aftersale';
		        // #ifdef H5
		        // let newText = ''
		        // if (data.hasOwnProperty('reviewname') && data.reviewname === 'contract') {
		        //     newText = `您收到了一份合同。项目名称: ${data.projectname}  合同名称: ${data.contractname}`;
		        // } else {
		        //     newText = `项目名称: ${data.projectname}  合同名称: ${data.contractname}`;
		        // }
		        // textDebug.value.push(newText);
		        text.value = JSON.stringify(data);
		        // #endif
		        // #ifdef APP || APP-PLUS
		        if (data.type === 0) {
					data.data.forEach((item: any) => {
					    sendLocalPush('售后通知', `您有新的售后信息 [${item.comp}]  待审核, 请注意查看! `, {
					        comp: encodeURIComponent(item.comp),
							messageType: data.messageType,
					        type: 0
					    });
					});
		        } else if (data.type === 1) {
					data.data.forEach((item: any) => {
					    sendLocalPush('售后通知', `您有新的售后信息 [${item.comp}]  待审核, 请注意查看! `, {
					        comp: encodeURIComponent(item.comp),
							messageType: data.messageType,
					        type: 1
					    });
					});
		        }
		        // #endif
		    }
		})
	}
	
	function initDebugWebSocket() {
	    // 已登录验证
	    const token = uni.getStorageSync('token');
	    if (!token) {
	        console.log('未登录，不建立 WebSocket 连接')
	        return
	    }
	    if (!hasPermission('project:reviewDebug:websocket')) {
	        // uni.showToast({
	        //     icon: 'none',
	        //     title: '暂无获取调试推送权限、请联系管理员',
	        //     duration: 1500
	        // })
	        return false
	    }
		
		if (wsDebug.value) {
			return
		}
	
	    wsDebug.value = new Websocket(`/reviewDebug`)
	
	    // 接收消息
	    wsDebug.value.getMessage((res: any) => {
	        console.log('收到消息：', res)
	        const data = JSON.parse(res.data)
	        console.log('data', data);
	        if (getType(data) === 'object') {
				data.messageType = 'debug';
	            // #ifdef H5
	            // let newText = ''
	            // if (data.hasOwnProperty('reviewname') && data.reviewname === 'contract') {
	            //     newText = `您收到了一份合同。项目名称: ${data.projectname}  合同名称: ${data.contractname}`;
	            // } else {
	            //     newText = `项目名称: ${data.projectname}  合同名称: ${data.contractname}`;
	            // }
	            // textDebug.value.push(newText);
	            text.value = JSON.stringify(data);
	            // #endif
	            // #ifdef APP || APP-PLUS
	            if (data.type === 0) {
	                sendLocalPush('调试任务通知', `项目 [${data.proname}] 中您有待调试任务, 请注意查看! `, {
	                    pid: data.proid,
	                    projectname: encodeURIComponent(data.proname),
	                    type: 0,
	                    messageType: data.messageType
	                });
	            }
	            // #endif
	        }
	    })
	}
	
	const initPush = () => {
	    initPushPermission();
	    initPushClickListener();
	}
	
	// 获取上次打卡信息
	async function getSystemClockInfo() {
	    // 已登录验证
	    const token = uni.getStorageSync('token');
	    if (token) {
	        const data = await fetchGetPrjClockinLastInfo();
	        if (data) {
	            // #ifdef APP || APP-PLUS
	            if (data.ctype !== 1 && data.pid != -1) {
	                acquireWakeLock();
	                onlineAudioLocationService.start({
	                    pid: data.pid
	                });
	            }
	            // #endif
	        }
	    }
	}
	
	// 断网延迟处理
	let offlineTimer: number | null = null;
	
	/**
	 * 网络状态回调
	 */
	const handleNetworkChange = (res: UniApp.OnNetworkStatusChangeResult) => {
		console.log('网络变化：', res)
	
		// 断网处理
		if (!res.isConnected) {
			// 如果已经在等待确认断网，就不重复计时
			if (offlineTimer) return
			
			offlineTimer = setTimeout(() => {
				offlineTimer = null;
				uni.showToast({
					title: '当前网络不可用',
					icon: 'none',
					duration: 2000
				})
			}, 1500) // 断网确认阈值 1.5 秒
			return
		} else {
			console.log('网络已恢复：', res.networkType);
			// 如果断网未达到阈值，则取消提示
			if (offlineTimer) {
				clearTimeout(offlineTimer);
				offlineTimer = null;
			}
		}
	}

	onLaunch(() => {
		// 1️⃣ 启动时先获取一次网络状态
		uni.getNetworkType({
			success: (res) => {
				console.log('启动时网络状态：', res.networkType)
		
				if (res.networkType === 'none') {
					offlineTimer = setTimeout(() => {
						offlineTimer = null;
						uni.showToast({
							title: '当前无网络',
							icon: 'none',
							duration: 2000
						})
					}, 1500)
				}
			},
		})
		// 2️⃣ 监听网络变化（全局）
		uni.onNetworkStatusChange(handleNetworkChange)
		// #ifdef APP || APP-PLUS
		initPushPermission();
		initPushClickListener();
		// setTimeout(async() => {
		// 	await startServe("前台运行中","点击返回软件");
		// 	// console.log('getLocation获取是否开启定位', getLocation());
		// 	// console.log('preciseLocation获取是否开启始终定位', preciseLocation());
		// 	// console.log('getBattery是否开启电池优化白名单', getBattery());
		// 	let a = function(){
		// 	    console.log('发送请求');
		// 	    console.log(uni.getStorageSync('LIn97112479'));
		// 	}
		// 	let b = function(err: any){
		// 		uni.showModal({
		// 			title: '提示',
		// 			content: JSON.stringify(err)
		// 		})
		// 	}
		// 	await getLocations({provider:"system",geocode:true,fun:a,err:b,time:10000}) 
		// }, 10000)
		// #endif
	});
	
	// 监听登录事件
	uni.$on('user-login-success', () => {
	    console.log('检测到用户登录成功，开始建立 WebSocket 连接')
	    initWebSocket();
		initAfterWebSocket();
	    initDebugWebSocket();
	});
	
	uni.$on('user-logout', () => {
	    if (ws.value) {
	        ws.value.close()
	        ws.value = null
	        console.log('WebSocket 已关闭')
	    }
		
		if (wsAftersale.value) {
		    wsAftersale.value.close()
		    wsAftersale.value = null
		    console.log('售后WebSocket 已关闭')
		}
	
	    if (wsDebug.value) {
	        wsDebug.value.close()
	        wsDebug.value = null
	        console.log('调试WebSocket 已关闭')
	    }
	
	    uni.$emit("locationPositionCloseChange");
	});
	
	onMounted(() => {
	    // App 启动时如果已经登录（刷新页面后保持登录），直接连接
	    if (uni.getStorageSync('token')) {
			console.log('用户处于登录状态，开始建立 WebSocket 连接');
	        initWebSocket();
			initAfterWebSocket();
	        initDebugWebSocket();
	    }
	});
	
	onShow(() => {
		console.log('App Show');
		const token = uni.getStorageSync("token");
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const currentRoute = currentPage?.route || "";
		
		// 登录页不检查 token，避免死循环
		// if (!token) return
		// #ifdef APP || APP-PLUS
		const info = uni.getSystemInfoSync();
		// toggleTheme(info.osTheme);
		if (currentRoute === "mePages/rtuniupdate/Index") return;
		const platform = info.platform;
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
					if (Number(resVersion.data.data[platform].edition_number) > Number(inf.versionCode)) {
						// 如果是wgt升级，并且是静默更新 （注意！！！ 如果是手动检查新版本，就不用判断静默更新，请直接跳转更新页，不然点击检查新版本后会没反应）
						if (resVersion.data.data[platform].package_type === 1) {
							// 调用静默更新方法 传入下载地址
							silenceUpdate(resVersion.data.data[platform].edition_url);
						} else {
							// setTimeout(() => {
							if (resVersion.data.data[platform].edition_force_update === 1) {
								uni.navigateTo({
									url: `/mePages/rtuniupdate/Index?obj=${JSON.stringify(resVersion.data.data)}`,
								});
							}
							// }, 1000)
							// message
							//   .confirm({
							//     msg: `亲爱的用户，发现新版本${resVersion.data.data.describe.replace(/<br>/g, ' ')}`,
							//     title: '更新提示',
							//   })
							//   .then(() => {
							//     plus.runtime.openURL(resVersion.data.data[platform].edition_url)
							//   })
							//   .catch((error) => {
							//     console.log(error)
							//   })
						}
					}
				},
				fail: () => { },
			});
		});
		// #endif
	});
	
	onHide(() => {
	    console.log('App Hide');
	});
	
	onUnload(() => {
	    ws.value.close({ reason: '用户自己关闭' });
		wsAftersale.value.close({ reason: '用户自己关闭' });
	    wsDebug.value.close({ reason: '用户自己关闭' });
	});
</script>

<style lang="scss">
	@import '@/iconfont/prj.css';
	@import '@/iconfont/index.css';

	::-webkit-scrollbar {
		width: 0;
		height: 0;
	}

	page {
		margin: 0;
		padding: 0;
		font-family: San Francisco, Rotobo, arial, PingFang SC, Noto SansCJK, Microsoft Yahei, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-size: 13px;
		background: #f8f9fa;
		min-height: 100vh;
		-webkit-user-select: text; 
		user-select: text;
	}

	.wd-action-sheet-else .wd-action-sheet {
		/* #ifdef H5 || APP || APP-PLUS */
		margin: 0 10px calc(var(--window-bottom) + 70px) 10px !important;
		/* #endif */

		/* #ifdef MP-WEIXIN */
		margin: 0 10px calc(var(--window-bottom) + 40px) 10px !important;
		/* #endif */
	}

	.wd-select-picker__value {
		text-align: right;
	}

	.wd-tabbar--round {
		bottom: 10px !important;
	}

	.wot-theme-light {
		.wd-icon-arrow-left {
			color: #000000 !important;
		}

		.wd-navbar__title {
			color: #000000 !important;
		}

		.wd-pager__icon {
			color: #000000 !important;
		}

		.wd-pager__nav--disabled {
			color: rgba($color: #000000, $alpha: 0.15) !important;
		}
	}

	.wot-theme-dark {
		color: #f5f5f5;
		background-color: black;

		.wd-icon-arrow-left {
			color: #ffffff !important;
		}

		.wd-navbar__title {
			color: #ffffff !important;
		}

		.wd-pager__icon {
			color: #ffffff !important;
		}

		.wd-pager__nav--disabled {
			color: rgba($color: #ffffff, $alpha: 0.15) !important;
		}
	}

	.wd-cell__title_else {
		white-space: nowrap !important;
		overflow: hidden !important;
		text-overflow: ellipsis !important;
	}

	.wdSearchContainer {
		position: fixed;
		left: 0;
		width: calc(100% - 20rpx);
		z-index: 99;
	}

	.whiteClass {
		color: #ffffff;
	}

	.greyClass {
		color: #bfbfbf;
	}

	.cellGroupSpecial {
		border-radius: 20rpx;
		overflow: hidden;
	}

	.darkButtonWrap {
		width: 100% !important;
	}

	.lightButtonWrap {
		width: 100% !important;
	}
	
	.amap-logo {
		display: none !important;
	}
	
	.amap-copyright {
		display: none !important;
	}
</style>
