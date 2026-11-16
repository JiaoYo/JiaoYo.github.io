// utils/useWxLogin.ts
export async function useWxLogin(): Promise<{ token: string, userInfo: any }> {
    return new Promise((resolve, reject) => {

        // ======== H5 微信授权 ========
        // #ifdef H5
        (async () => {
            try {
                const url = window.location.href;
                const appid = "你的公众号APPID"; // 替换成你的公众号appid
                const redirect = encodeURIComponent(url);

                const query = new URLSearchParams(window.location.search);
                const code = query.get("code");

                if (!code) {
                    // 第一次跳转微信授权
                    window.location.href =
                        `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
                    return;
                }

                const res: any = await uni.request({
                    url: "/api/login/wx",
                    method: "POST",
                    data: { code, platform: "h5" }
                });

                resolve(res.data);
            } catch (e) {
                reject(e);
            }
        })();
        // #endif


        // ======== APP 微信登录 ========
		// #ifdef APP || APP-PLUS
        (async () => {
            try {
                plus.oauth.getServices((services) => {
                    const wx = services.find(s => s.id === "weixin");
                    if (!wx) return reject("微信服务未找到");
        
                    // 第一步：调用 authorize
                    wx.login(async (authRes) => {
                        console.log("authorize 返回：", authRes);
                    }, (err) => {
                        reject("授权失败：" + JSON.stringify(err));
                    });
        
                }, (err) => {
                    reject("获取OAuth服务失败：" + JSON.stringify(err));
                });
        
            } catch (e) {
                reject(e);
            }
        })();
        // #endif

        // ======== 微信小程序登录 ========
        // #ifdef MP-WEIXIN
        (async () => {
            try {
                const wxRes = await uni.login();
                const code = wxRes.code;

                const res: any = await uni.request({
                    url: "/api/login/wx",
                    method: "POST",
                    data: { code, platform: "mp" }
                });

                resolve(res.data);
            } catch (e) {
                reject(e);
            }
        })();
        // #endif
    });
}
