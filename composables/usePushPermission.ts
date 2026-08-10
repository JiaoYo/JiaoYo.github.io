import { useTabbar } from '@/composables/useTabbar';

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

// usePushPermission.ts
export function usePushPermission() {
    /**
     * 🔔 Android 创建“全开”通知通道（横幅 + 锁屏 + 铃声 + 振动 + 角标）
     */
    const createNotificationChannel = (): void => {
        try {
            if (typeof plus === 'undefined') return;

            const main: any = plus.android.runtimeMainActivity();
            const NotificationManager: any = plus.android.importClass('android.app.NotificationManager');
            const NotificationChannel: any = plus.android.importClass('android.app.NotificationChannel');
            const AudioAttributes: any = plus.android.importClass('android.media.AudioAttributes');
            const RingtoneManager: any = plus.android.importClass('android.media.RingtoneManager');

            const channelId = 'dingiiot_warning';
            const channelName = '预警通知';
            const importance = NotificationManager.IMPORTANCE_HIGH; // 高优先级，确保横幅提示

            const manager = main.getSystemService(main.NOTIFICATION_SERVICE);
            const channel = new NotificationChannel(channelId, channelName, importance);

            // ✅ 开启所有提示特性
            channel.enableLights(true); // 通知灯
            channel.enableVibration(true); // 振动
            channel.setShowBadge(true); // 允许角标
            channel.setLockscreenVisibility(1); // 1 = VISIBILITY_PUBLIC, 锁屏可见

            // 🔊 设置系统默认铃声
            const soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            const attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(soundUri, attrs);

            // 创建或更新通道
            manager.createNotificationChannel(channel);
            console.log('[Push] ✅ 已创建高优先级通知通道：横幅+锁屏+铃声+振动+角标');
        } catch (err) {
            console.error('[Push] ❌ 创建通知通道失败：', err);
        }
    };

    /**
     * ⚙️ Android 检测通知权限
     */
    const ensureAndroidNotificationEnabled = (): void => {
        if (typeof plus === 'undefined') return;

        try {
            const main: any = plus.android.runtimeMainActivity();
            const NotificationManagerCompat: any = plus.android.importClass('androidx.core.app.NotificationManagerCompat');
            const manager = NotificationManagerCompat.from(main);
            const areNotificationsEnabled = manager.areNotificationsEnabled();

            if (!areNotificationsEnabled) {
                uni.showModal({
                    title: '通知未开启',
                    content: '为保证您能及时收到预警，请开启通知权限（横幅、铃声、振动等）。',
                    confirmText: '去开启',
                    success: (res) => {
                        if (res.confirm) openAndroidNotificationSetting();
                    }
                });
            } else {
                console.log('[Push] Android 通知权限已开启 ✅');
            }

            // 确保通道已创建
            createNotificationChannel();
        } catch (err) {
            console.error('[Push] 检测通知权限失败：', err);
        }
    };

    /**
     * 📲 打开 Android 通知设置页
     */
    const openAndroidNotificationSetting = (): void => {
        if (typeof plus === 'undefined') return;

        try {
            const main: any = plus.android.runtimeMainActivity();
            const Intent: any = plus.android.importClass('android.content.Intent');
            const Settings: any = plus.android.importClass('android.provider.Settings');
            const Uri: any = plus.android.importClass('android.net.Uri');
            const intent: any = new Intent();

            if (parseFloat((plus.os.version as any)) >= 8.0) {
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, main.getPackageName());
            } else {
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                const uri = Uri.fromParts('package', main.getPackageName(), null);
                intent.setData(uri);
            }

            main.startActivity(intent);
        } catch (err) {
            console.error('[Push] 打开通知设置页失败：', err);
        }
    };

    /**
     * 🍎 iOS 检测通知权限
     */
    const ensureIOSNotificationEnabled = (): void => {
        if (typeof plus === 'undefined') return;

        (plus.runtime as any).requestPermission({ name: 'push' }, (res: any) => {
            if (!res.granted) {
                uni.showModal({
                    title: '通知未开启',
                    content: '请在系统设置中打开通知权限，以接收消息提醒（横幅、铃声、震动等）。',
                    confirmText: '前往设置',
                    success: (r) => {
                        if (r.confirm) plus.runtime.openURL('app-settings:');
                    }
                });
            } else {
                console.log('[Push] iOS 通知已开启 ✅');
            }
        });
    };

    /**
     * 🚀 初始化通知权限（启动时调用）
     */
    const initPushPermission = (): void => {
        if (typeof plus === 'undefined') return;
        plus.push.getClientInfo();

        if (plus.os.name === 'Android') {
            ensureAndroidNotificationEnabled();
        } else if (plus.os.name === 'iOS') {
            ensureIOSNotificationEnabled();
        }
    };

    const initPushClickListener = (): void => {
        if (typeof plus === 'undefined') return;
        plus.push.addEventListener("click", function (msg: any) {
            console.log('msg', msg);

            if (msg.payload.hasOwnProperty('messageType')) {
				if (msg.payload.messageType === 'debug') {
					uni.navigateTo({
					    url: '/projectPages/projectdetail/Index?pid=' + msg.payload.pid + '&activeTab=2'
					})
				} else if (msg.payload.messageType === 'aftersale') {
					uni.navigateTo({
					    url: '/mePages/aftersalemanage/Index?comp=' + msg.payload.comp
					})
				}
            } else {
                if (msg.payload.type === 0) {
                    const pages = getCurrentPages();
                    const currentPage = pages[pages.length - 1];
                    if (currentPage.route === 'pages/project') {
                        // 当前已经在项目页面，直接更新数据
                        // 假设项目页面有接收数据的方法
                        uni.$emit('projectChanged', {
                            projectname: msg.payload.projectname
                        });
                    } else {
                        setTabbarItemActive('project');
                        uni.setStorageSync('projectname', msg.payload.projectname);
                        uni.switchTab({
                            url: '/pages/project'
                        })
                    }
                } else if (msg.payload.type === 1) {
                    uni.navigateTo({
                        url: '/projectPages/projectdetail/Index?pid=' + msg.payload.pid + '&activeTab=2'
                    })
                } else if (msg.payload.type === 2) {
                    const pages = getCurrentPages();
                    const currentPage = pages[pages.length - 1];
                    if (currentPage.route === 'pages/project') {
                        // 当前已经在项目页面，直接更新数据
                        // 假设项目页面有接收数据的方法
                        uni.$emit('projectChanged', {
                            projectname: msg.payload.projectname
                        });
                    } else {
                        setTabbarItemActive('project');
                        uni.setStorageSync('projectname', msg.payload.projectname);
                        uni.switchTab({
                            url: '/pages/project'
                        })
                    }
                } else if (msg.payload.type === 3) {
                    uni.navigateTo({
                        url: '/projectPages/projectdetail/Index?pid=' + msg.payload.pid + '&activeTab=2'
                    })
                } else if (msg.payload.type === 4) {
                    uni.navigateTo({
                        url: '/projectPages/projectdetail/Index?pid=' + msg.payload.pid + '&activeTab=2'
                    })
                }
            }
        }, false);
    };

    /**
     * 📩 发送带铃声+振动的本地通知
     */
    const sendLocalPush = (title: string, content: string, data: Record<string, any> = {}): void => {
        if (typeof plus === 'undefined') return;

        const options: any = {
            cover: false,
            when: new Date(),
            title: title || '系统通知',
            sound: 'system',  // 🔊 系统铃声
            vibration: true,  // 📳 振动
            channel: {
                id: 'dingiiot_warning',
                name: '预警通知',
                importance: 'high',
                sound: 'system',
                vibration: true
            }
        };
        const payload = JSON.stringify(data);
        plus.push.createMessage(content, payload, options);
    };

    return {
        initPushPermission,
        initPushClickListener,
        sendLocalPush
    };
}
