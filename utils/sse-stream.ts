// SSE 流式请求
//
// 优先使用浏览器原生 fetch + response.body.getReader()：H5 与 App 的 WebView 均为
// Chromium/WKWebView 内核，能真正按块增量读取（与 Web 端 sendStreamMessage 完全一致）。
//
// 为什么不用 plus.net.XMLHttpRequest 做主力：它的 readyState=3 在部分 Android 基座上
// 会把整个响应整包缓冲、到最后一次性倒出 responseText，造成“不是流式”的观感。
// 因此仅作为 fetch 不可用时的兜底。
//
// 都不支持（如微信小程序）时 supportSseStream() 返回 false，调用方回退非流式接口。

// ---------- 能力探测 ----------
function getPlus(): any {
  const g: any =
    typeof globalThis !== 'undefined' ? globalThis :
    typeof window !== 'undefined' ? window : {};
  if (g.plus) return g.plus;
  if (typeof window !== 'undefined' && (window as any).plus) return (window as any).plus;
  return undefined;
}

// 是否支持 fetch 流式读取（H5 / App WebView 均为 true）
function canFetchStream(): boolean {
  try {
    return (
      typeof fetch === 'function' &&
      typeof Response === 'function' &&
      typeof AbortController === 'function' &&
      typeof TextDecoder === 'function' &&
      'body' in Response.prototype
    );
  } catch (e) {
    return false;
  }
}

export function supportSseStream(): boolean {
  if (canFetchStream()) return true;
  const plus = getPlus();
  return !!(plus && plus.net && plus.net.XMLHttpRequest);
}

// ---------- 接口类型 ----------
export interface SseStreamOptions {
  /** 完整请求地址（含 BASE_URL 前缀） */
  url: string;
  method?: string;
  /** 请求体（JSON） */
  data?: any;
  /** 附加请求头，如 { token: '...' } */
  headers?: Record<string, string>;
  /** 每个完整的 SSE 块（\n\n 分隔）回调：event 为事件名，data 为 data: 行内容 */
  onEvent: (eventName: string, data: string) => void;
}

export interface SseStreamHandle {
  abort(): void;
  /** 流结束（成功 resolve；网络/HTTP 错误 reject；主动 abort 时 reject 且 err.isAbort===true） */
  done: Promise<void>;
}

function makeAbortError(): any {
  const err: any = new Error('用户已终止生成');
  err.isAbort = true;
  return err;
}

// 解析单个 SSE 块：收集 event: 行与 data: 行，并统计是否解析出过事件（供整包兜底）
function makeDispatcher(onEvent: (eventName: string, data: string) => void) {
  let anyEvent = false;
  const dispatch = (block: string) => {
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        let data = line.slice(5);
        if (data.startsWith(' ')) data = data.slice(1);
        dataLines.push(data);
      }
    }
    const rawData = dataLines.join('\n');
    if (rawData) {
      anyEvent = true;
      onEvent(eventName, rawData);
    }
  };
  return { dispatch, hasEvent: () => anyEvent };
}

// ---------- 实现一：fetch + response.body.getReader()（优先，真增量） ----------
function createFetchStream(options: SseStreamOptions): SseStreamHandle {
  let settled = false;
  let settleResolve: (() => void) | null = null;
  let settleReject: ((err: any) => void) | null = null;

  const done = new Promise<void>((resolve, reject) => {
    settleResolve = resolve;
    settleReject = reject;
  });
  const settle = (ok: boolean, err?: any) => {
    if (settled) return;
    settled = true;
    if (ok && settleResolve) settleResolve();
    else if (settleReject) settleReject(err || new Error('流式请求失败'));
  };

  const controller = new AbortController();
  const { dispatch, hasEvent } = makeDispatcher(options.onEvent);
  let parseBuffer = '';
  let fullBody = '';

  (async () => {
    try {
      const response = await fetch(options.url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(options.headers || {})
        },
        body: JSON.stringify(options.data || {}),
        signal: controller.signal
      });

      if (!response.ok) {
        let errorText = 'HTTP ' + response.status;
        try {
          const t = await response.text();
          if (t) errorText = t;
        } catch (e) { /* ignore */ }
        console.log('[SSE] fetch HTTP 错误', response.status);
        settle(false, new Error(errorText));
        return;
      }
      if (!response.body) {
        console.log('[SSE] 无 response.body，无法流式读取');
        settle(false, new Error('当前环境不支持流式响应'));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let firstChunk = true;
      while (true) {
        const { done: isDone, value } = await reader.read();
        const piece = decoder.decode(value || new Uint8Array(), { stream: !isDone });
        if (piece) {
          if (firstChunk) {
            console.log('[SSE] fetch 收到首个流块，长度', piece.length);
            firstChunk = false;
          }
          fullBody += piece;
          parseBuffer += piece.replace(/\r\n/g, '\n');
          const blocks = parseBuffer.split('\n\n');
          parseBuffer = blocks.pop() || '';
          for (const block of blocks) {
            if (block.trim()) dispatch(block);
          }
        }
        if (isDone) break;
      }
      if (parseBuffer.trim()) dispatch(parseBuffer);
      // 整包返回且零事件 → __complete__ 兜底（与服务端返回非 SSE 格式时的表现一致）
      if (!hasEvent() && fullBody.trim()) {
        console.log('[SSE] 未解析出 SSE 事件，整包兜底，字节数', fullBody.length);
        options.onEvent('__complete__', fullBody);
      }
      console.log('[SSE] fetch 流结束，总字节', fullBody.length);
      settle(true);
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        console.log('[SSE] fetch 已取消（AbortError）');
        settle(false, makeAbortError());
      } else {
        console.log('[SSE] fetch 流式异常', err);
        settle(false, err instanceof Error ? err : new Error(String(err)));
      }
    }
  })();

  return {
    abort() {
      try { controller.abort(); } catch (e) { /* ignore */ }
      settle(false, makeAbortError()); // 兜底保证 done 一定被 settle
    },
    done
  };
}

// ---------- 实现二：plus.net.XMLHttpRequest（兜底，部分基座整包缓冲） ----------
function createXhrStream(options: SseStreamOptions): SseStreamHandle {
  let settled = false;
  let settleResolve: (() => void) | null = null;
  let settleReject: ((err: any) => void) | null = null;

  const done = new Promise<void>((resolve, reject) => {
    settleResolve = resolve;
    settleReject = reject;
  });
  const settle = (ok: boolean, err?: any) => {
    if (settled) return;
    settled = true;
    if (ok && settleResolve) settleResolve();
    else if (settleReject) settleReject(err || new Error('流式请求失败'));
  };

  const plus = getPlus();
  let xhr: any = null;
  try {
    xhr = new plus.net.XMLHttpRequest();
  } catch (e) {
    settle(false, new Error('创建流式请求失败'));
    return { abort: () => {}, done };
  }

  let aborted = false;
  let lastLen = 0;
  let parseBuffer = '';
  const { dispatch, hasEvent } = makeDispatcher(options.onEvent);

  xhr.open(options.method || 'POST', options.url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  // 要求服务端不压缩：plus.XMLHttpRequest 不能流式解压 gzip（浏览器 fetch 可以），
  // 一旦 gzip，app 端就会整包缓冲到最后一次性倒出。服务端若不尊重该头则无效，需后端对 SSE 关压缩。
  try { xhr.setRequestHeader('Accept-Encoding', 'identity'); } catch (e) { /* 原生层可能禁止设置 */ }
  const headers = options.headers || {};
  for (const key in headers) {
    if (headers[key] != null && headers[key] !== '') xhr.setRequestHeader(key, headers[key]);
  }

  xhr.onreadystatechange = () => {
    const text = xhr.responseText || '';
    if (text.length > lastLen) {
      // 诊断日志：HBuilderX 真机调试的 console 可看到是否出现增量 readyState=3
      if (lastLen === 0 && xhr.readyState === 3) {
        console.log('[SSE] 收到首个增量块 readyState=3, 字节数', text.length);
      }
      parseBuffer += text.slice(lastLen).replace(/\r\n/g, '\n');
      lastLen = text.length;
      const blocks = parseBuffer.split('\n\n');
      parseBuffer = blocks.pop() || '';
      for (const block of blocks) {
        if (block.trim()) dispatch(block);
      }
    }
    if (xhr.readyState === 4) {
      console.log('[SSE] 请求结束 status=', xhr.status, 'readyState=4, 总字节', text.length, 'aborted=', aborted);
      // 末尾可能没有以 \n\n 结尾的完整块，flush 掉
      if (parseBuffer.trim()) dispatch(parseBuffer);
      // 整包返回且没解析出任何 SSE 事件：把完整响应体兜底交给调用方
      if (!aborted && xhr.status >= 200 && xhr.status < 300 && !hasEvent() && text.trim()) {
        console.log('[SSE] 未解析出 SSE 事件，整包兜底，字节数', text.length);
        options.onEvent('__complete__', text);
      }
      if (aborted) settle(false, makeAbortError());
      else if (xhr.status >= 200 && xhr.status < 300) settle(true);
      else settle(false, new Error('HTTP ' + xhr.status));
    }
  };

  xhr.onerror = () => {
    console.log('[SSE] 网络错误 aborted=', aborted);
    if (aborted) settle(false, makeAbortError());
    else settle(false, new Error('网络请求失败'));
  };

  xhr.send(JSON.stringify(options.data || {}));

  return {
    abort() {
      aborted = true;
      try { if (xhr) xhr.abort(); } catch (e) { /* ignore */ }
      settle(false, makeAbortError()); // 兜底保证 done 一定被 settle
    },
    done
  };
}

// ---------- 对外入口 ----------
export function createSseStream(options: SseStreamOptions): SseStreamHandle {
  // 传输能力诊断：确认 app 运行时到底缺哪个（缺 fetch 则走 JSCore 逻辑层，fetch 方案无望）
  console.log(
    '[SSE] 传输能力 fetch=', typeof fetch,
    'Response=', typeof Response,
    'AbortController=', typeof AbortController,
    'TextDecoder=', typeof TextDecoder,
    'body in Response.prototype=', (typeof Response === 'function' && 'body' in Response.prototype)
  );
  if (canFetchStream()) return createFetchStream(options);
  if (supportSseStream()) return createXhrStream(options);
  return {
    abort: () => {},
    done: Promise.reject(new Error('当前环境不支持流式请求'))
  };
}
