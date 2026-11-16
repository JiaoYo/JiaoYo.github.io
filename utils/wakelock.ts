// wakelock.ts
// #ifdef APP-PLUS
declare const plus: any;
// #endif

let gWakeLock: any = null;

export function acquireWakeLock() {
    // #ifdef APP-PLUS
    try {
        const main = plus.android.runtimeMainActivity();
        const Context = plus.android.importClass("android.content.Context");
        const PowerManager = plus.android.importClass("android.os.PowerManager");

        const pm = main.getSystemService(Context.POWER_SERVICE);
        gWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MyApp:WakeLock");

        gWakeLock.acquire();
        console.log("🔋 WakeLock 已开启");
    } catch (err) {
        console.error("WakeLock 创建失败", err);
        uni.showToast({
            icon: 'none',
            title: "🔋 WakeLock 创建失败",
            duration: 1500
        })
    }
    // #endif
}

export function releaseWakeLock() {
    // #ifdef APP-PLUS
    try {
        if (gWakeLock != null && gWakeLock.isHeld()) {
            gWakeLock.release();
            console.log("🔌 WakeLock 已释放");
        }
        gWakeLock = null;
    } catch (err) {
        console.error("WakeLock 释放失败", err);
    }
    // #endif
}
