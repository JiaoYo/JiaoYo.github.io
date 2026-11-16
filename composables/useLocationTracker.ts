import { fetchSavePrjClockinInfo } from '@/service/index';
import { usePushPermission } from '@/composables/usePushPermission';
const { initPushPermission, sendLocalPush, initPushClickListener } = usePushPermission();

export class CrossPlatformLocationService {
    private timer: number | null = null; // H5 前台定时器
    private watchId: number | null = null; // App 后台定位监听
    private lastUploadTime = 0; // 上次上传时间
    private params: any = null; // 参数保存
    private running = false; // 服务是否运行

    constructor() {
        // H5 回到前台时补偿一次定位
        uni.onAppShow(() => {
            if (!this.isApp() && this.running) {
                console.log("H5 回到前台，补偿一次定位上报");
                this.getLocationOnce(this.params);
            }
        });
    }

    // ---------------------------------------------------------
    // 启动定位（跨平台）
    // ---------------------------------------------------------
    start(e: any) {
        if (this.running) return;

        this.running = true;
        this.params = e;
        this.lastUploadTime = 0;

        if (this.isApp()) {
            console.log("启动 APP 后台定位（watchPosition）");
            this.startAppBackgroundLocation();
        } else {
            console.log("启动 H5 前台定时定位");
            this.startH5Timer();
        }

        // 立即执行一次上传
        // this.getLocationOnce(e);
    }

    // ---------------------------------------------------------
    // 停止定位（跨平台）
    // ---------------------------------------------------------
    stop() {
        this.running = false;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.watchId) {
            plus.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        console.log("定位服务已停止");
    }

    // ---------------------------------------------------------
    // H5 定时器（后台会挂起）
    // ---------------------------------------------------------
    private startH5Timer() {
        this.timer = setInterval(() => {
            this.tryUploadIfNeeded();
        }, 30 * 1000) as unknown as number;
    }

    // ---------------------------------------------------------
    // APP 后台定位（原生 watchPosition，可在后台存活）
    // ---------------------------------------------------------
    private startAppBackgroundLocation() {
        this.watchId = plus.geolocation.watchPosition(
            (res) => {
                console.log("APP 定位回调:", Date.now());
                this.tryUploadIfNeeded();
            },
            (err) => console.log("APP 定位失败:", err.message),
            {
                enableHighAccuracy: true,
                coordsType: "gcj02",
                maximumAge: 3000
            }
        );
    }

    // ---------------------------------------------------------
    // 若超过 15 分钟则执行一次定位 + 上传
    // ---------------------------------------------------------
    private async tryUploadIfNeeded() {
        if (!this.running) return;

        const now = Date.now();

        if (now - this.lastUploadTime < 30 * 1000) {
            return; // 不到 15 分钟，不上传
        }

        this.lastUploadTime = now;

        try {
            const location = await this.getLocation();
            await this.upload(location);

            console.log("位置已上传:", location);
        } catch (e) {
            console.log("上传失败:", e);
        }
    }

    // ---------------------------------------------------------
    // 手动触发一次定位 + 上传（H5/APP通用）
    // ---------------------------------------------------------
    async getLocationOnce(e: any) {
        this.params = e;

        try {
            const location = await this.getLocation();
            await this.upload(location);
            return location;
        } catch (err) {
            console.log("getLocationOnce 定位失败:", err);
            throw err;
        }
    }

    // ---------------------------------------------------------
    // 获取定位（H5 + App 通用）
    // ---------------------------------------------------------
    private getLocation(): Promise<any> {
        return new Promise((resolve, reject) => {
            uni.getLocation({
                type: 'gcj02',
                success: (res) => {
                    resolve({
                        pid: this.params.pid,
                        latitude: res.latitude,
                        longitude: res.longitude,
                        accuracy: res.accuracy
                    });
                },
                fail: (err) => reject(err)
            });
        });
    }

    // ---------------------------------------------------------
    // 上传定位数据
    // ---------------------------------------------------------
    private async upload(location: any) {
        console.log('loca', location);
        sendLocalPush('上传定位数据', `上传定位数据成功, 请注意查看! `, {
            pid: 922,
            projectname: '222',
            type: 1
        });
        // uni.showToast({
        //     icon: 'none',
        //     title: JSON.stringify(location),
        //     duration: 1500
        // })
        // return await fetchSavePrjClockinInfo({
        //     list: [{
        //         pid: location.pid,
        //         ctype: 2,
        //         longitude: location.longitude,
        //         latitude: location.latitude,
        //         devtime: Date.now()
        //     }],
        //     check: false
        // });
    }

    // ---------------------------------------------------------
    // 判断是否 App 平台
    // ---------------------------------------------------------
    private isApp() {
        // #ifdef APP-PLUS
        return true;
        // #endif
        return false;
    }
}

// 导出单例
export const onlineAudioLocationService = new CrossPlatformLocationService();
