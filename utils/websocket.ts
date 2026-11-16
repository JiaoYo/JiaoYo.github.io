// websocket.ts
import { WS_URL } from './request';
import { getUUID, doSM2Sign, base64ToHex } from '@/utils/index';

type SocketTaskType = UniNamespace.SocketTask | null;
type SocketMessageCallback = (res: UniNamespace.OnSocketMessageCallbackResult) => void;

export default class Websocket {
    private socketTask: SocketTaskType = null;
    private isOpenSocket = false; // 是否已连接（open）
    private userEmpowerClose = false; // 用户主动关闭标识
	private baseUrl: string; // 永远不变
    private url: string;
    private data: string | null = null;

    // timers
    private heartbeatTimer: number | null = null;
    private reconnectTimer: number | null = null;
    private connectTimeoutTimer: number | null = null;

    // config
    private timeoutNumber = 20; // 心跳间隔秒
    private connectTimeout = 30 * 1000; // 连接超时 ms（onOpen 之前）
    private againTimeBase = 3; // 初始重连间隔秒
    private maxBackoff = 60; // 最大退避秒

    // reconnect counter for exponential backoff
    private reconnectAttempts = 0;

    // external hooks
    public onTimeout: (() => void) | null = null;

    constructor(path: string) {
        const token = uni.getStorageSync('token');
        if (token) {
			this.baseUrl = `${WS_URL + path}`;
            this.url = '';
            this.connectSocketInit('first');
        } else {
            this.url = '';
        }
    }

    /** 建立连接（入口） */
    private connectSocketInit(type: 'first' | 'next' = 'first') {
        const token = uni.getStorageSync('token');
        // 生成签名参数
        const timestamp = Date.now();
        const nonce = getUUID();
        const se = doSM2Sign(`${nonce}${timestamp}`);
        const signature = base64ToHex(se);
        this.url = `${this.baseUrl}/${signature}/${timestamp}/${nonce}?token=${token}`;
        console.log('[WS] connectSocketInit', type, this.url);

        // 清理上一次
        this.clearConnectTimeout();
        this.clearHeartbeat();
        this.clearReconnectTimer();

        try {
            this.socketTask = uni.connectSocket({
                url: this.url,
                success: () => {
                    console.log('[WS] connectSocket: success callback (socket task created)');
                },
                fail: (err) => {
                    console.warn('[WS] connectSocket: fail', err);
                    this.handleConnectFail(err as any);
                },
            });
        } catch (err) {
            console.error('[WS] connectSocket exception', err);
            this.handleConnectFail(err as any);
            return;
        }

        // 在 onOpen 之前开启连接超时，如果超时则认为建立连接失败 -> 触发重连或回调
        this.startConnectTimeout();
        // 立即绑定事件（socketTask 可能为 null 在某平台，但 uni 通常返回 socketTask）
        this.initSocketEvents();
    }

    /** 绑定 socket 事件监听 */
    private initSocketEvents() {
        if (!this.socketTask) return;

        // onOpen
        this.socketTask.onOpen((res) => {
            console.log('[WS] onOpen', res);
            this.clearConnectTimeout(); // 成功，清除连接超时
            this.isOpenSocket = true;
            this.reconnectAttempts = 0; // 重置重连计数
            this.clearHeartbeat();
            this.heartbeatCheck(); // 开启心跳
            // 清除任何重连定时器（保险）
            this.clearReconnectTimer();
            this.onConnected();
        });

        // onClose
        this.socketTask.onClose((e) => {
            console.warn('[WS] onClose', e);
            this.isOpenSocket = false;
            this.clearHeartbeat();
            this.closeSocketTask(); // release handle
            if (!this.userEmpowerClose) {
                // 非用户主动关闭 -> 尝试重连
                this.scheduleReconnect('next');
            } else {
                // 被动关闭并且是用户自己关闭，不触发重连
                this.onClosed();
            }
        });

        // onError
        this.socketTask.onError((err) => {
            console.error('[WS] onError', err);
            this.isOpenSocket = false;
            this.clearHeartbeat();
            this.closeSocketTask();
            // 出错时也触发重连（除非是用户主动关闭）
            if (!this.userEmpowerClose) {
                this.scheduleReconnect('next');
            }
        });
    }

    /** 连接失败（connect fail 或异常）处理 */
    private handleConnectFail(err?: any) {
        console.warn('[WS] connect failed', err);
        this.isOpenSocket = false;
        this.clearConnectTimeout();
        this.closeSocketTask();
        // 触发重连（如果不是用户主动关闭）
        if (!this.userEmpowerClose) {
            this.scheduleReconnect('next');
        }
    }

    /** start connection timeout (before onOpen) */
    private startConnectTimeout() {
        this.clearConnectTimeout();
        this.connectTimeoutTimer = setTimeout(() => {
            // 如果还没打开 socket，则认为本次连接超时
            if (!this.isOpenSocket) {
                console.warn('[WS] connect timeout (before onOpen)');
                // 通知外部（例如你的业务中提示“下发命令超时”）
                if (typeof this.onTimeout === 'function') {
                    try { this.onTimeout(); } catch (e) { console.error(e); }
                }
                // 标记为用户授权关闭，关闭并触发重连（视你的原逻辑，这里我把行为统一为：如果超时则尝试重连）
                this.userEmpowerClose = false;
                this.close({ reason: 'connect timeout' });
                this.scheduleReconnect('next');
            }
        }, this.connectTimeout) as unknown as number;
    }

    private clearConnectTimeout() {
        if (this.connectTimeoutTimer) {
            clearTimeout(this.connectTimeoutTimer as number);
            this.connectTimeoutTimer = null;
        }
    }

    /** 发送消息 */
    public send(value: string) {
        if (this.socketTask && (this.socketTask as any).readyState === 1) {
            this.socketTask.send({
                data: value,
                success: (res) => { console.log('[WS] send success', res); },
                fail: (e) => { console.warn('[WS] send fail', e); },
            });
        } else {
            console.warn('[WS] send: socket not open, drop message');
        }
    }

    /** 接收消息（外部注册回调） */
    public getMessage(callback: SocketMessageCallback) {
        if (!this.socketTask) return;
        this.socketTask.onMessage((res) => {
            // 如果特定路径不需要 JSON 校验可以直接回调
            if (this.url.includes('/socketFour/chlwatch/')) {
                return callback(res);
            }
            // 仅在 data 为 JSON 字符串时回调
            if (typeof res.data === 'string' && this.isJsonString(res.data)) {
                return callback(res);
            }
            // 非 JSON 的消息会被忽略（与原逻辑一致）
        });
    }

    /** 关闭连接（外部调用） */
    public close(e: { reason: string }) {
        // 标记为用户主动关闭，仅当 reason === '用户自己关闭'
        this.userEmpowerClose = e ? e.reason === '用户自己关闭' : true;
        this.isOpenSocket = false;
        this.clearHeartbeat();
        this.clearConnectTimeout();
        this.clearReconnectTimer();
        this.closeSocketTask();
        if (this.userEmpowerClose) {
            console.log('[WS] closed by user:', e ? e.reason : '用户自己关闭');
        }
    }

    /** 关闭 socketTask 实际 handle */
    private closeSocketTask() {
        if (this.socketTask) {
            try {
                // 某些平台 close 接口接受回调对象
                this.socketTask.close?.({
                    success: (res) => { console.log('[WS] socket close success', res); },
                    fail: (err) => { console.warn('[WS] socket close fail', err); },
                });
            } catch (err) {
                console.warn('[WS] close socketTask exception', err);
            }
            this.socketTask = null;
        }
    }

    /** 重连调度（带指数退避） */
    private scheduleReconnect(type: 'next' | 'first' = 'next') {
        // 清理旧定时器
        this.clearReconnectTimer();
        this.clearHeartbeat();
        this.reconnectAttempts++;

        // 计算退避时间（指数退避）
        const delay = Math.min(this.againTimeBase * Math.pow(2, this.reconnectAttempts - 1), this.maxBackoff);
        console.log(`[WS] scheduleReconnect attempt=${this.reconnectAttempts}, delay=${delay}s`);

        this.reconnectTimer = setTimeout(() => {
            console.log('[WS] trying reconnect now...');
            this.connectSocketInit(type);
        }, delay * 1000) as unknown as number;
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer as number);
            this.reconnectTimer = null;
        }
    }

    /** 心跳 */
    private heartbeatCheck() {
        this.clearHeartbeat();
        // this.data = JSON.stringify([{ contractname: "测试合同名称", projectname: "测试项目修改" }, { contractname: "测试合同名称", projectname: "测试项目修改" }]);
        this.data = 'connect success';
        this.heartbeatTimer = setInterval(() => {
            this.send(this.data!);
        }, this.timeoutNumber * 1000) as unknown as number;
    }

    private clearHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer as number);
            this.heartbeatTimer = null;
        }
    }

    /** 工具：JSON 校验 */
    private isJsonString(str: string) {
        if (typeof str !== 'string') return false;
        try {
            const obj = JSON.parse(str);
            return obj !== null && typeof obj === 'object';
        } catch {
            return false;
        }
    }

    /** hook: 连接成功 */
    protected onConnected() {
        console.log('[WS] onConnected');
    }

    /** hook: 重连尝试 */
    protected onReconnect() {
        console.log('[WS] onReconnect');
    }

    /** hook: 断开 */
    protected onClosed() {
        console.log('[WS] onClosed');
    }

    /** 查询状态 */
    public onSocketStatus(callback: (status: 'Connecting' | 'Disconnected') => void) {
        callback(this.isOpenSocket ? 'Connecting' : 'Disconnected');
    }
}