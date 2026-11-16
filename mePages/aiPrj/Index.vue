<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { onReady } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetUserInfoWithWechat } from '@/service/index';
import { fetchGetAiAnswer } from '@/service/projectQa';
import { createSseStream, supportSseStream } from '@/utils/sse-stream';
import { BASE_URL } from '@/utils/request';

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

// ========== 基础信息 ==========
const statusBarHeight = ref(0);
const bottomSafe = ref(0);

const userAvatar = ref('https://pms.linkqi.cn:18443/soybean.jpg');
const assistantAvatar = ref('/static/linkqi_108_108.png');

// ========== 配置 ==========
// App 端通过 plus.net.XMLHttpRequest 支持 SSE 流式（见 utils/sse-stream.ts），H5/小程序自动回退非流式
// 配置键带 v2：旧版本（无流式支持时）曾把 useStream=false 持久化，需避开旧缓存让默认流式生效
const CONFIG_KEY = 'project_assistant_config_v2';
const showSettings = ref(false);
const config = ref<{ withContext: boolean; useStream: boolean }>({
  withContext: true,
  useStream: true
});
function loadConfig() {
  try {
    const saved = uni.getStorageSync(CONFIG_KEY);
    if (saved) {
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      config.value = { withContext: true, useStream: true, ...parsed };
    }
  } catch (e) { /* ignore */ }
}
loadConfig();
watch(config, (val) => {
  try { uni.setStorageSync(CONFIG_KEY, JSON.stringify(val)); } catch (e) { /* ignore */ }
}, { deep: true });

// ========== 会话管理 ==========
const MAX_QUESTION_LENGTH = 500;

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const messages = ref<any[]>([]);
const inputText = ref('');
const isLoading = ref(false);
const sessionId = ref(generateUUID());
const showHistory = ref(false);

const showScrollToBottom = ref(false);
const scrollIntoView = ref('');
const scrollTop = ref(0);
let chatClientHeight = 0;

// ========== 快捷问题 ==========
const quickQuestions = ['智慧园区项目当前调试进度怎么样？', '最近完成的项目有那些？', '最近有哪些新项目？'];

// ========== 代码片段检测 ==========
function isCodeLike(text: string): boolean {
  const patterns = [
    /function\s*\([^)]*\)\s*\{/,
    /(const|let|var)\s+\w+\s*=\s*[^;]+;/,
    /import\s+.*from\s*['"][^'"]+['"]/,
    /export\s+(default\s+)?\w+/,
    /class\s+\w+\s*\{/,
    /=>\s*\{/,
    /console\.log\(/,
    /\/\/.*/,
    /\/\*[\s\S]*?\*\//,
    /<[^>]+>[\s\S]*?<\/[^>]+>/,
    /^[ \t]*[\w]+\s*[:=]\s*[^;]+;/
  ];
  return patterns.some(p => p.test(text));
}

function wrapCodeIfNeeded(text: string): string {
  if (isCodeLike(text) && !text.includes('```')) {
    return `请分析以下代码：\n\`\`\`\n${text}\n\`\`\``;
  }
  return text;
}

// ========== 解析 AI 回答（结论 + 关键明细） ==========
function parseAnswer(answer: string) {
  if (!answer || typeof answer !== 'string') {
    return { conclusion: '', details: [], fullText: answer || '' };
  }
  try {
    const conclusionMatch = answer.match(/结论[：:](.*?)(?=关键明细[：:]|$)/s);
    const detailMatch = answer.match(/关键明细[：:](.*?)$/s);

    const details: string[] = [];
    if (detailMatch && detailMatch[1]) {
      const lines = detailMatch[1].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          details.push(trimmed.replace(/^[-•]\s*/, '').trim());
        } else if (trimmed) {
          details.push(trimmed);
        }
      }
    }

    return {
      conclusion: (conclusionMatch && conclusionMatch[1] ? conclusionMatch[1] : '').trim() || '',
      details,
      fullText: answer
    };
  } catch (error) {
    console.warn('解析AI回答失败:', error);
    return { conclusion: '', details: [], fullText: answer };
  }
}

// ========== 提取历史消息 ==========
function getValidHistory() {
  const errorPrefixes = ['❌ 请求失败', '⏹️ 请求已取消', '❌ 发生异常'];
  return messages.value
    .filter((m: any) => {
      if (m.type !== 'user' && m.type !== 'assistant') return false;
      if (m.type === 'assistant' && errorPrefixes.some((p: string) => m.content.startsWith(p))) return false;
      if (!m.content || m.content.trim() === '') return false;
      return true;
    })
    .slice(-6)
    .map((m: any) => {
      let content = m.content;
      if (m.type === 'assistant') {
        content = content.replace(/<img[^>]*>/g, '');
      }
      return { role: m.type, content };
    });
}

// ========== 返回 ==========
function handleClickLeft() {
  // #ifdef H5
  history.go(-1);
  // #endif

  // #ifndef H5
  uni.navigateBack();
  // #endif
}

// ========== 时间格式化 ==========
// 手动拼 HH:MM，避免 toLocaleTimeString 在不同 JS 引擎上附带时区/GMT 后缀
function formatTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function addMessage(data: any) {
  const msg: any = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: data.type,
    content: data.content || '',
    time: formatTime(),
    loading: data.loading || false,
    collapsed: data.collapsed !== undefined ? data.collapsed : true,
    parsed: data.parsed || null,
    references: data.references || [],
    meta: data.meta || null,
    ...data
  };
  messages.value.push(msg);
  scrollToBottom();
}

// ========== 滚动 ==========
let scrollTimer: any = null;
let scrollTimer2: any = null;
function scrollToBottom() {
  // scroll-top 只在值变化时触发：先清空再赋大值，超出的部分会被平台钳制到最底，
  // 比 scroll-into-view 锚点可靠（锚点位置在答案渲染前仍是旧布局，只滚一小截）
  scrollTop.value = 0;
  nextTick(() => { scrollTop.value = 999999; });
  // 延迟兜底：答案文本/富文本/引用渲染是异步的，内容变高后旧位置失效，多级补滚
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    scrollTop.value = 0;
    nextTick(() => { scrollTop.value = 999999; });
  }, 120);
  clearTimeout(scrollTimer2);
  scrollTimer2 = setTimeout(() => {
    scrollTop.value = 0;
    nextTick(() => { scrollTop.value = 999999; });
  }, 500);
}

function onScroll(e: any) {
  const d = e.detail || {};
  const atBottom = (d.scrollTop || 0) + chatClientHeight >= (d.scrollHeight || 0) - 40;
  showScrollToBottom.value = !atBottom;
}

function scrollToMessage(id: string) {
  showHistory.value = false;
  nextTick(() => {
    scrollIntoView.value = '';
    nextTick(() => {
      scrollIntoView.value = `msg-${id}`;
    });
  });
}

// ========== 发送消息（核心逻辑：强制截断） ==========
// 当前流式请求句柄（用于“停止”按钮）
let currentStreamHandle: { abort: () => void } | null = null;
const isStreamActive = ref(false);

function stopCurrentStream() {
  if (currentStreamHandle) {
    currentStreamHandle.abort();
    currentStreamHandle = null;
  }
}

// 非流式：填充回答（结论 + 关键明细 结构化）
function applyNonStreamAnswer(tempMsgId: string, answerData: any) {
  const parsed = parseAnswer(answerData.answer);
  const meta = {
    mode: answerData.mode,
    intent: answerData.intent,
    roleName: answerData.roleName,
    dataCount: answerData.dataCount,
    generatedByModel: answerData.generatedByModel,
    sessionId: answerData.sessionId || sessionId.value
  };
  const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
  if (idx !== -1) {
    messages.value[idx] = {
      ...messages.value[idx],
      content: answerData.answer || '抱歉，未能获取回答。',
      parsed,
      references: answerData.references || [],
      meta,
      loading: false
    };
  }
  if (answerData.sessionId) sessionId.value = answerData.sessionId;
  // 回答落定后再滚一次：占位气泡时滚到的位置会因内容变高而失效
  if (!showScrollToBottom.value) scrollToBottom();
}

// 非流式接口
async function runNonStreamAsk(finalQuestion: string, tempMsgId: string, history: any[]) {
  const data = await fetchGetAiAnswer(
    { question: finalQuestion, sessionId: sessionId.value, history },
    { showLoading: false }
  );
  applyNonStreamAnswer(tempMsgId, data || {});
}

// 流式：App 端 plus.net.XMLHttpRequest 增量读取（SSE 分块）；返回 false 表示环境不支持，调用方回退非流式
function runStreamAsk(finalQuestion: string, tempMsgId: string, history: any[]): Promise<boolean> {
  if (!supportSseStream()) return Promise.resolve(false);

  return new Promise<boolean>((resolve, reject) => {
    let streamAnswer = '';

    // 应用完整结果（result 事件 / __complete__ 整包兜底共用）
    const applyResult = (result: any) => {
      const answerText = result.answer || streamAnswer;
      const parsed = parseAnswer(answerText);
      const meta = {
        mode: result.mode,
        intent: result.intent,
        roleName: result.roleName,
        dataCount: result.dataCount,
        generatedByModel: result.generatedByModel,
        sessionId: result.sessionId || sessionId.value
      };
      const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
      if (idx !== -1) {
        messages.value[idx] = {
          ...messages.value[idx],
          loading: false,
          content: answerText,
          parsed,
          references: result.references || [],
          meta,
          collapsed: true
        };
      }
      if (result.sessionId) sessionId.value = result.sessionId;
      streamAnswer = answerText;
      // 回答落定后再滚一次：占位气泡时滚到的位置会因内容变高而失效
      if (!showScrollToBottom.value) scrollToBottom();
    };

    const handle = createSseStream({
      url: BASE_URL + '/ai/projectData/askStream.do',
      data: {
        question: finalQuestion,
        sessionId: sessionId.value || undefined,
        history: history.length ? history : undefined
      },
      headers: { token: uni.getStorageSync('token') || '' },
      onEvent: (eventName, data) => {
        console.log('[AI助手] 收到事件', eventName, data);
        if (eventName === 'token') {
          streamAnswer += data;
          const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
          if (idx !== -1) {
            messages.value[idx].content = streamAnswer;
            messages.value[idx].loading = true;
            // 用户未上滑查看历史时自动跟随底部
            if (!showScrollToBottom.value) scrollToBottom();
          }
        } else if (eventName === 'result') {
          let result: any = {};
          try { result = JSON.parse(data); } catch (e) { result = {}; }
          applyResult(result);
        } else if (eventName === '__complete__') {
          // 服务端未按 SSE 增量返回：整包响应兜底，避免一直卡在“思考中”
          console.log('[AI助手] 收到整包响应，长度', data.length);
          let result: any = null;
          try { result = JSON.parse(data); } catch (e) { result = null; }
          if (result && result.answer) {
            applyResult(result);
          } else {
            // 解析不了 JSON 就展示原文，方便排查响应格式
            const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
            if (idx !== -1) {
              messages.value[idx].loading = false;
              messages.value[idx].content = data;
            }
          }
        } else if (eventName === 'error') {
          let errObj: any = {};
          try { errObj = JSON.parse(data); } catch (e) { errObj = {}; }
          reject(new Error(errObj.message || '流式处理异常'));
        }
      }
    });
    currentStreamHandle = handle;
    isStreamActive.value = true;

    handle.done
      .then(() => {
        currentStreamHandle = null;
        isStreamActive.value = false;
        resolve(true);
      })
      .catch((err: any) => {
        currentStreamHandle = null;
        isStreamActive.value = false;
        if (err && err.isAbort) {
          // 用户主动停止：保留已生成内容
          const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
          if (idx !== -1) {
            if (!messages.value[idx].content) {
              messages.value[idx].content = '⏹️ 请求已取消';
            }
            messages.value[idx].loading = false;
          }
          resolve(true);
        } else {
          reject(err);
        }
      });
  });
}

async function handleSendMessage(questionOverride?: string) {
  const rawText = (questionOverride || inputText.value).trim();
  if (!rawText || isLoading.value) return;

  // 第一步：先截断原始文本到 500 字符
  let truncatedRaw = rawText;
  let truncated = false;
  if (rawText.length > MAX_QUESTION_LENGTH) {
    truncatedRaw = rawText.slice(0, MAX_QUESTION_LENGTH);
    truncated = true;
  }

  // 第二步：包裹代码（如果需要）
  let finalQuestion = wrapCodeIfNeeded(truncatedRaw);

  // 第三步：包裹后仍超长则保底再截断
  if (finalQuestion.length > MAX_QUESTION_LENGTH) {
    finalQuestion = finalQuestion.slice(0, MAX_QUESTION_LENGTH);
    truncated = true;
  }

  if (truncated) {
    uni.showToast({ icon: 'none', title: `内容超过${MAX_QUESTION_LENGTH}字符，已自动截断` });
  }

  // 用户消息显示原始内容（不显示截断后的）
  addMessage({ type: 'user', content: rawText });
  if (!questionOverride) inputText.value = '';

  const tempMsgId = `temp_${Date.now()}`;
  addMessage({
    id: tempMsgId,
    type: 'assistant',
    content: '',
    loading: true,
    parsed: null,
    references: [],
    meta: null
  });

  isLoading.value = true;
  try {
    const historyMessages = config.value.withContext ? getValidHistory() : [];
    // 诊断日志：确认当前走流式还是非流式、plus 是否被识别
    console.log('[AI助手] 发送 useStream=', config.value.useStream, 'supportSseStream=', supportSseStream());
    if (config.value.useStream) {
      const streamed = await runStreamAsk(finalQuestion, tempMsgId, historyMessages);
      // 非 App 环境（H5/小程序）无 plus，回退非流式接口
      if (!streamed) {
        console.log('[AI助手] 无 plus 环境，回退非流式');
        await runNonStreamAsk(finalQuestion, tempMsgId, historyMessages);
      } else {
        console.log('[AI助手] 已走 plus SSE 流式');
      }
    } else {
      await runNonStreamAsk(finalQuestion, tempMsgId, historyMessages);
    }
  } catch (err: any) {
    // 出错：保留气泡并写入错误信息（对齐 Web 端行为）
    const idx = messages.value.findIndex((m: any) => m.id === tempMsgId);
    const text = typeof err === 'string' ? err : (err && err.message) || '请求失败，请稍后重试';
    if (idx !== -1) {
      messages.value[idx].content = `❌ 请求失败：${text}`;
      messages.value[idx].loading = false;
    }
  } finally {
    isLoading.value = false;
    currentStreamHandle = null;
    isStreamActive.value = false;
  }
}

// 点击项目名称发送查询
function sendProjectQuestion(projectName: string) {
  if (!projectName || isLoading.value) return;
  inputText.value = projectName;
  handleSendMessage();
}

// ========== 引用项目展开/收起 ==========
function toggleRefGrid(msg: any) {
  msg.collapsed = !msg.collapsed;
}

// ========== 清空会话 ==========
function handleClearChat() {
  if (messages.value.length === 0) return;
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有对话吗？',
    confirmColor: '#dd524d',
    success: (res) => {
      if (!res.confirm) return;
      messages.value = [];
      sessionId.value = generateUUID();
      showHistory.value = false;
      addMessage({ type: 'assistant', content: '您好！我是您的AI项目助手，可以查询项目调试进度等信息。' });
      uni.showToast({ icon: 'success', title: '已清空对话记录' });
    }
  });
}

// ========== 快捷问题 ==========
function useQuickQuestion(q: string) {
  inputText.value = q;
  handleSendMessage();
}

// ========== 历史记录 ==========
const userMessages = computed(() => messages.value.filter((m: any) => m.type === 'user'));

// ========== 头像 ==========
async function loadUserInfo() {
  try {
    const data = await fetchGetUserInfoWithWechat();
    if (data && data.userimage) userAvatar.value = data.userimage;
  } catch (e) { /* ignore */ }
}

function addWelcome() {
  if (messages.value.length > 0) return;
  addMessage({ type: 'assistant', content: '您好！我是您的AI项目助手，可以查询项目调试进度等信息。' });
}

// ========== 生命周期 ==========
onMounted(() => {
  try {
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 0;
    bottomSafe.value = (info.safeAreaInsets && info.safeAreaInsets.bottom) || 0;
  } catch (e) { /* ignore */ }
  loadUserInfo();
  addWelcome();
});

onReady(() => {
  nextTick(() => {
    setTimeout(() => {
      try {
        uni.createSelectorQuery()
          .select('.chat-scroll')
          .boundingClientRect((rect: any) => {
            if (rect && rect.height) chatClientHeight = rect.height;
          })
          .exec();
      } catch (e) { /* ignore */ }
    }, 100);
  });
});
</script>

<template>
  <wd-config-provider :theme-vars="themeVars" :custom-style="isDark ? 'min-height: 100vh; background: #1a1a1a;' : 'min-height: 100vh;'" :theme="theme">
    <view class="chat-page" :class="{ 'chat-page-dark': isDark }">
      <!-- ========== 头部 ========== -->
      <view class="chat-header" :class="{ 'chat-header-dark': isDark }" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="header-left" @click="handleClickLeft">
          <wd-icon name="arrow-left" size="22px" :color="isDark ? '#ffffff' : '#1a2332'"></wd-icon>
        </view>
        <view class="header-title">
          <text class="title-name" :class="{ 'title-name-dark': isDark }">AI 项目助手</text>
          <text class="title-version">v1.0</text>
        </view>
        <view class="header-actions">
          <view class="header-btn" @click="showHistory = true">
            <wd-icon name="history" size="20px" :color="isDark ? '#cfd3dc' : '#64748b'"></wd-icon>
            <text v-if="userMessages.length" class="history-count">{{ userMessages.length }}</text>
          </view>
          <view class="header-btn" @click="showSettings = true">
            <wd-icon name="setting" size="20px" :color="isDark ? '#cfd3dc' : '#64748b'"></wd-icon>
          </view>
          <view class="header-btn" @click="handleClearChat">
            <wd-icon name="delete1" size="20px" color="#dd524d"></wd-icon>
          </view>
        </view>
      </view>

      <!-- ========== 消息区 ========== -->
      <scroll-view
        class="chat-scroll"
        scroll-y
        :scroll-into-view="scrollIntoView"
        :scroll-top="scrollTop"
        :scroll-with-animation="true"
        @scroll="onScroll"
      >
        <!-- 空状态 -->
        <view v-if="messages.length === 0" class="empty-state">
          <view class="empty-icon">💬</view>
          <text class="empty-text">您好！我是您的AI项目助手，可以查询项目调试进度等信息。</text>
          <view class="empty-quick">
            <text class="empty-hint">快速开始：</text>
            <view v-for="q in quickQuestions" :key="q" class="quick-chip" @click="useQuickQuestion(q)">{{ q }}</view>
          </view>
        </view>

        <!-- 消息列表 -->
        <view
          v-for="message in messages"
          :key="message.id"
          :id="'msg-' + message.id"
          :class="['message', 'message-' + message.type]"
        >
          <!-- 用户消息 -->
          <view v-if="message.type === 'user'" class="message-content user-message">
            <image class="avatar user-avatar" :src="userAvatar" mode="aspectFill"></image>
            <view class="message-bubble user-bubble">
              <text class="bubble-text">{{ message.content }}</text>
            </view>
          </view>

          <!-- 系统消息 -->
          <view v-else-if="message.type === 'system'" class="system-message">
            <text class="system-text">{{ message.content }}</text>
          </view>

          <!-- 助手消息 -->
          <view v-else class="message-content assistant-message">
            <image class="avatar assistant-avatar" :src="assistantAvatar" mode="aspectFill"></image>
            <view class="message-wrapper">
              <!-- 思考中占位 -->
              <view v-if="message.loading && !message.content" class="message-bubble assistant-bubble loading-bubble">
                <text class="thinking-text">思考中</text>
                <view class="typing-dots">
                  <view class="dot"></view><view class="dot"></view><view class="dot"></view>
                </view>
              </view>

              <!-- 正常内容 -->
              <view v-else class="message-bubble assistant-bubble">
                <!-- 结构化展示：结论 + 关键明细 -->
                <template v-if="message.parsed">
                  <view v-if="message.parsed.conclusion" class="section conclusion" :class="{ 'conclusion-dark': isDark }">
                    <text class="conclusion-icon">✅</text>
                    <view class="conclusion-content">
                      <text class="c-label">结论</text>
                      <text class="c-text" :class="{ 'c-text-dark': isDark }">{{ message.parsed.conclusion }}</text>
                    </view>
                  </view>

                  <view v-if="message.parsed.details.length" class="section details">
                    <text class="d-label">📋 关键明细</text>
                    <view v-for="(item, idx) in message.parsed.details" :key="idx" class="detail-item">
                      <text class="detail-dot">▸</text>
                      <text class="detail-text" :class="{ 'detail-text-dark': isDark }">{{ item }}</text>
                    </view>
                  </view>

                  <view v-if="!message.parsed.conclusion && !message.parsed.details.length" class="plain-text" :class="{ 'plain-text-dark': isDark }">{{ message.content }}</view>
                </template>

                <!-- 普通文本（white-space: pre-wrap 保留换行） -->
                <view v-else class="plain-text" :class="{ 'plain-text-dark': isDark }">{{ message.content }}</view>

                <!-- 相关项目 -->
                <view v-if="message.references && message.references.length" class="references">
                  <view class="ref-header">
                    <text class="ref-label">📎 相关项目 ({{ message.references.length }})</text>
                    <text class="ref-toggle" @click.stop="toggleRefGrid(message)">{{ message.collapsed ? '展开' : '收起' }}</text>
                  </view>
                  <view v-if="!message.collapsed" class="ref-grid">
                    <text
                      v-for="ref in message.references"
                      :key="ref.projectId"
                      class="ref-chip"
                      @click="sendProjectQuestion(ref.projectName)"
                    >{{ ref.projectName }}</text>
                  </view>
                </view>

                <!-- 元信息 -->
                <view
                  v-if="message.meta && (message.meta.roleName || message.meta.dataCount !== undefined || message.meta.generatedByModel)"
                  class="meta"
                >
                  <text v-if="message.meta.roleName" class="meta-tag">{{ message.meta.roleName }}</text>
                  <text v-if="message.meta.dataCount !== undefined" class="meta-tag">📊 {{ message.meta.dataCount }}</text>
                  <text v-if="message.meta.generatedByModel" class="meta-tag">🤖 AI</text>
                </view>
              </view>

              <!-- 时间 -->
              <view class="message-footer">
                <text class="message-time">{{ message.time }}</text>
              </view>
            </view>
          </view>
        </view>
        <view id="anchor-bottom" class="anchor-bottom"></view>
      </scroll-view>

      <!-- ========== 快捷问题 ========== -->
      <view v-if="messages.length > 0" class="quick-bar">
        <scroll-view class="quick-scroll" scroll-x :show-scrollbar="false">
          <view class="quick-inner">
            <view v-for="q in quickQuestions" :key="q" class="quick-chip" @click="useQuickQuestion(q)">{{ q }}</view>
          </view>
        </scroll-view>
      </view>

      <!-- 回到底部 -->
      <view v-if="showScrollToBottom" class="scroll-bottom-btn" @click="scrollToBottom">
        <wd-icon name="arrow-down" size="18px" color="#1677ff"></wd-icon>
      </view>

      <!-- ========== 输入区 ========== -->
      <view class="chat-input" :style="{ paddingBottom: (12 + bottomSafe) + 'px' }">
        <view class="input-row">
          <textarea
            v-model="inputText"
            class="chat-textarea"
            placeholder="请输入您的问题…（回车发送，最多500字符）"
            :maxlength="500"
            :disabled="isLoading"
            auto-height
            confirm-type="send"
            @confirm="handleSendMessage()"
          ></textarea>
          <view
            v-if="isStreamActive"
            class="stop-btn"
            @click="stopCurrentStream"
          >
            <text class="stop-text">停止</text>
          </view>
          <view
            class="send-btn"
            :class="{ 'send-btn-disabled': !inputText.trim() || isLoading }"
            @click="handleSendMessage()"
          >
            <text v-if="isLoading" class="send-loading">思考中</text>
            <wd-icon v-else name="enter" size="20px" color="#ffffff"></wd-icon>
          </view>
        </view>
        <view class="input-tip">
          <text>回车发送，最多500字符</text>
        </view>
      </view>

      <!-- ========== 对话记录弹层 ========== -->
      <wd-popup v-model="showHistory" position="right" :lock-scroll="false" :custom-style="'width: 76vw; height: 100vh; background: #ffffff;'">
        <view class="history-page">
          <view class="history-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <text class="history-title">📜 对话记录</text>
            <wd-icon name="close" size="20px" color="#86909c" @click="showHistory = false"></wd-icon>
          </view>
          <scroll-view scroll-y class="history-body">
            <view v-if="userMessages.length === 0" class="empty-text">暂无用户消息</view>
            <view v-for="(msg, index) in userMessages" :key="msg.id" class="history-item" @click="scrollToMessage(msg.id)">
              <text class="history-index">#{{ index + 1 }}</text>
              <text class="history-text">{{ msg.content }}</text>
              <text class="history-time">{{ msg.time || '--:--' }}</text>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <!-- ========== 设置弹层 ========== -->
      <wd-popup v-model="showSettings" position="center" :custom-style="'width: 80%; border-radius: 20rpx; padding: 32rpx;'">
        <view class="settings-form">
          <text class="form-title">⚙️ 设置</text>
          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-label">携带上下文</text>
              <text class="setting-desc">发送历史对话记录，支持多轮对话</text>
            </view>
            <wd-switch v-model="config.withContext" size="24px"></wd-switch>
          </view>
          <view class="setting-item">
            <view class="setting-info">
              <text class="setting-label">流式请求</text>
              <text class="setting-desc">AI回复实时流式输出，体验更流畅</text>
            </view>
            <wd-switch v-model="config.useStream" size="24px"></wd-switch>
          </view>
          <view class="form-actions">
            <wd-button type="primary" @click="showSettings = false">关闭</wd-button>
          </view>
        </view>
      </wd-popup>
    </view>
  </wd-config-provider>
</template>

<style lang="scss" scoped>
// ============================================================
// 页面布局
// ============================================================
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

.chat-page-dark {
  background: linear-gradient(180deg, #141414 0%, #1a1a1a 100%);
}

// ============================================================
// 头部
// ============================================================
.chat-header {
  display: flex;
  align-items: center;
  padding: 0 20rpx 16rpx;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1rpx solid #eef0f4;
  flex-shrink: 0;
  box-sizing: content-box;
}

.chat-header-dark {
  background: rgba(20, 20, 20, 0.92);
  border-bottom: 1rpx solid #2a2a2a;
}

.header-left {
  width: 60rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.header-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;

  .title-name {
    font-size: 34rpx;
    font-weight: 700;
    color: #1a2332;
  }

  .title-name-dark {
    color: #ffffff;
  }

  .title-version {
    font-size: 20rpx;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 4rpx 14rpx;
    border-radius: 20rpx;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .header-btn {
    position: relative;
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
    background: #f5f7fa;

    &:active {
      opacity: 0.7;
    }

    .history-count {
      position: absolute;
      top: -4rpx;
      right: -6rpx;
      min-width: 28rpx;
      height: 28rpx;
      padding: 0 6rpx;
      border-radius: 14rpx;
      background: #1677ff;
      color: #ffffff;
      font-size: 18rpx;
      line-height: 28rpx;
      text-align: center;
      box-sizing: border-box;
    }
  }
}

// ============================================================
// 消息滚动区
// ============================================================
.chat-scroll {
  flex: 1;
  min-height: 0;
  padding: 20rpx 24rpx 8rpx;
  box-sizing: border-box;
}

.anchor-bottom {
  height: 4rpx;
}

// ============================================================
// 空状态
// ============================================================
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 30rpx 20rpx;
  text-align: center;

  .empty-icon {
    font-size: 72rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #64748b;
    line-height: 1.6;
    max-width: 520rpx;
  }

  .empty-quick {
    margin-top: 32rpx;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14rpx;

    .empty-hint {
      width: 100%;
      font-size: 24rpx;
      color: #94a3b8;
      margin-bottom: 4rpx;
    }
  }
}

// ============================================================
// 消息样式
// ============================================================
.message {
  display: flex;
  animation: fadeInUp 0.3s ease-out;
  scroll-margin: 16rpx;
  margin-bottom: 24rpx;

  &.message-user {
    justify-content: flex-end;

    .message-content {
      flex-direction: row-reverse;
    }

    .user-bubble {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      border-radius: 20rpx 20rpx 4rpx 20rpx;
      box-shadow: 0 6rpx 20rpx rgba(99, 102, 241, 0.22);
    }
  }

  &.message-assistant {
    justify-content: flex-start;

    .assistant-bubble {
      background: #ffffff;
      color: #1a2332;
      border-radius: 20rpx 20rpx 20rpx 4rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
      border: 1rpx solid rgba(255, 255, 255, 0.6);
    }
  }

  &.message-system {
    justify-content: center;

    .system-message {
      background: rgba(0, 0, 0, 0.04);
      padding: 12rpx 24rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      color: #666666;
      max-width: 72%;
      text-align: center;
    }
  }
}

.chat-page-dark .message {
  &.message-assistant .assistant-bubble {
    background: #242424;
    color: #e5e7eb;
    border: 1rpx solid #303030;
  }

  &.message-user .user-bubble {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  &.message-system .system-message {
    background: rgba(255, 255, 255, 0.06);
    color: #9ca3af;
  }
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  max-width: 88%;

  &.user-message {
    flex-direction: row-reverse;
  }

  &.assistant-message {
    flex-direction: row;
  }
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
  background: #e2e8f0;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.message-bubble {
  padding: 18rpx 22rpx;
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-word;
  min-width: 60rpx;
}

.bubble-text {
  word-break: break-all;
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .thinking-text {
    font-size: 26rpx;
    color: #94a3b8;
    font-weight: 500;
  }
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .dot {
    width: 12rpx;
    height: 12rpx;
    background: #94a3b8;
    border-radius: 50%;
    animation: bounce 1.4s infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10rpx); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 1; transform: translateY(0); }
}

// ============================================================
// 普通文本（保留换行）
// ============================================================
.plain-text {
  font-size: 28rpx;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
}

.plain-text-dark {
  color: #e5e7eb;
}

// ============================================================
// 结构化：结论 + 关键明细
// ============================================================
.section {
  margin-bottom: 16rpx;
}

.conclusion {
  display: flex;
  gap: 14rpx;
  background: linear-gradient(135deg, #dcfce7, #f0fdf4);
  padding: 14rpx 18rpx;
  border-radius: 14rpx;
  border-left: 6rpx solid #22c55e;
  align-items: flex-start;

  .conclusion-icon {
    font-size: 30rpx;
    line-height: 1.4;
  }

  .conclusion-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .c-label {
      font-size: 22rpx;
      font-weight: 600;
      color: #22a55a;
    }

    .c-text {
      font-size: 28rpx;
      font-weight: 500;
      color: #166534;
      line-height: 1.6;
      word-break: break-word;
    }
  }
}

.conclusion-dark {
  background: linear-gradient(135deg, #14532d, #14532d33);
  border-left: 6rpx solid #22c55e;

  .c-text-dark {
    color: #86efac;
  }
}

.details {
  .d-label {
    font-size: 24rpx;
    font-weight: 600;
    color: #64748b;
    letter-spacing: 0.3rpx;
  }

  .detail-item {
    display: flex;
    align-items: flex-start;
    gap: 10rpx;
    padding: 8rpx 0;
    border-bottom: 1rpx solid #f1f5f9;

    &:last-child {
      border-bottom: none;
    }

    .detail-dot {
      color: #6366f1;
      font-size: 24rpx;
      line-height: 1.7;
      flex-shrink: 0;
    }

    .detail-text {
      font-size: 26rpx;
      color: #334155;
      line-height: 1.7;
      word-break: break-word;
      flex: 1;
    }
  }
}

.chat-page-dark .detail-text-dark {
  color: #cbd5e1;
}

// ============================================================
// 相关项目
// ============================================================
.references {
  margin-top: 18rpx;
  padding-top: 14rpx;
  border-top: 1rpx solid #eef0f4;

  .ref-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10rpx;

    .ref-label {
      font-size: 24rpx;
      font-weight: 600;
      color: #64748b;
    }

    .ref-toggle {
      font-size: 22rpx;
      color: #6366f1;
      background: #eef2ff;
      padding: 2rpx 18rpx;
      border-radius: 18rpx;
      line-height: 34rpx;
    }
  }

  .ref-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;

    .ref-chip {
      background: #f1f5f9;
      border: 1rpx solid #e2e8f0;
      color: #334155;
      font-size: 24rpx;
      padding: 8rpx 20rpx;
      border-radius: 30rpx;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;

      &:active {
        background: #e2e8f0;
        border-color: #6366f1;
      }
    }
  }
}

// ============================================================
// 元信息
// ============================================================
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 14rpx;
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #eef0f4;

  .meta-tag {
    font-size: 22rpx;
    background: #f1f5f9;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    color: #475569;
    font-weight: 500;
  }
}

// ============================================================
// 消息底部
// ============================================================
.message-footer {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
  padding: 0 4rpx;

  .message-time {
    font-size: 22rpx;
    color: #b0b0b0;
  }
}

// ============================================================
// 快捷问题
// ============================================================
.quick-bar {
  flex-shrink: 0;
  padding: 10rpx 24rpx 4rpx;
}

.quick-scroll {
  width: 100%;
  white-space: nowrap;
}

.quick-inner {
  display: inline-flex;
  gap: 14rpx;
  padding: 4rpx 4rpx 8rpx;
}

.quick-chip {
  flex-shrink: 0;
  background: #ffffff;
  border: 1rpx solid #e4e7ed;
  color: #5f6b7a;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 28rpx;
  display: inline-flex;
  align-items: center;

  &:active {
    opacity: 0.7;
  }
}

.chat-page-dark .quick-chip {
  background: #242424;
  border-color: #333333;
  color: #c0c4cc;
}

// ============================================================
// 回到底部按钮
// ============================================================
.scroll-bottom-btn {
  position: absolute;
  right: 30rpx;
  bottom: 300rpx;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

// ============================================================
// 输入区
// ============================================================
.chat-input {
  flex-shrink: 0;
  padding: 10rpx 24rpx 12rpx;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1rpx solid #eef0f4;
  box-sizing: content-box;
}

.chat-page-dark .chat-input {
  background: rgba(20, 20, 20, 0.95);
  border-top: 1rpx solid #2a2a2a;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  background: #f5f7fa;
  border-radius: 24rpx;
  padding: 10rpx 12rpx;
  border: 1rpx solid #e4e7ed;

  &:focus-within {
    border-color: #6366f1;
  }
}

.chat-textarea {
  flex: 1;
  min-height: 44rpx;
  max-height: 180rpx;
  font-size: 28rpx;
  line-height: 1.5;
  padding: 4rpx 8rpx;
  color: #0f172a;
  width: 100%;
}

.chat-page-dark .chat-textarea {
  color: #e5e7eb;
}

.send-btn {
  flex-shrink: 0;
  width: 88rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(99, 102, 241, 0.25);
  color: #ffffff;

  &:active {
    opacity: 0.9;
    transform: scale(0.96);
  }

  .send-loading {
    font-size: 22rpx;
    color: #ffffff;
  }
}

.send-btn-disabled {
  opacity: 0.4;
  box-shadow: none;
}

.stop-btn {
  flex-shrink: 0;
  height: 72rpx;
  padding: 0 26rpx;
  border-radius: 36rpx;
  background: #ef4444;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 16rpx rgba(239, 68, 68, 0.25);

  &:active {
    opacity: 0.9;
    transform: scale(0.96);
  }

  .stop-text {
    font-size: 24rpx;
    color: #ffffff;
  }
}

.input-tip {
  text-align: right;
  font-size: 20rpx;
  color: #94a3b8;
  padding: 8rpx 8rpx 0;
}

// ============================================================
// 弹层通用
// ============================================================
.form-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24rpx;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 28rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .setting-label {
      font-size: 28rpx;
      font-weight: 500;
      color: #1a2332;
    }

    .setting-desc {
      font-size: 22rpx;
      color: #94a3b8;
      line-height: 1.4;
    }
  }
}

.empty-text {
  font-size: 26rpx;
  color: #b0b0b0;
  text-align: center;
  padding: 60rpx 0;
}

// ============================================================
// 对话记录
// ============================================================
.history-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
  box-sizing: content-box;

  .history-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1a1a1a;
  }
}

.history-body {
  flex: 1;
  min-height: 0;
  padding: 12rpx 20rpx;
  box-sizing: border-box;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 10rpx;
  border-bottom: 1rpx solid #f5f6f8;

  &:active {
    background: #f5f7fa;
  }

  .history-index {
    font-size: 22rpx;
    color: #b0b0b0;
    font-weight: 500;
    flex-shrink: 0;
  }

  .history-text {
    flex: 1;
    font-size: 26rpx;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-time {
    font-size: 20rpx;
    color: #c0c4cc;
    flex-shrink: 0;
  }
}

/* 暗黑模式适配 */
.wot-theme-dark {
  /* 输入区 */
  .input-row {
    background: #1f1f1f !important;
    border-color: rgba(255,255,255,0.12) !important;
  }
  .chat-textarea { color: #e5e7eb !important; }
  .input-tip { color: #6A7590 !important; }

  /* 对话记录弹层 */
  .history-page { background: #1b1b1b; }
  .history-header {
    background: #1b1b1b !important;
    border-bottom-color: rgba(255,255,255,0.08) !important;
    .history-title { color: #e8e8e8 !important; }
    :deep(.wd-icon) { color: #8a9099 !important; }
  }
  .history-body { background: #1b1b1b; }
  .history-item {
    border-bottom-color: rgba(255,255,255,0.08) !important;
    &:active { background: rgba(255,255,255,0.06) !important; }
    .history-index { color: #6A7590 !important; }
    .history-text { color: #e8e8e8 !important; }
    .history-time { color: #6A7590 !important; }
  }
  .empty-text { color: #6A7590 !important; }

  /* 设置弹层 */
  .form-title { color: #e8e8e8 !important; }
  .setting-item .setting-label { color: #e8e8e8 !important; }
  .setting-item .setting-desc { color: #6A7590 !important; }

  /* 结论/明细结构化区域 */
  .section.details {
    .d-label { color: #8a9099 !important; }
    .detail-item { border-bottom-color: rgba(255,255,255,0.06) !important; }
    .detail-dot { color: #8b8bff !important; }
  }

  /* 相关项目引用 */
  .references {
    border-top-color: rgba(255,255,255,0.08) !important;
    .ref-label { color: #8a9099 !important; }
    .ref-toggle { color: #8b8bff !important; background: rgba(139,139,255,0.12) !important; }
    .ref-chip { background: #1f1f1f !important; border-color: rgba(139,139,255,0.2) !important; color: #c0c4cc !important; }
  }

  /* 元信息 */
  .meta { border-top-color: rgba(255,255,255,0.08) !important; .meta-tag { background: #2a2a2a !important; color: #8a9099 !important; } }

  /* 标题版本徽章 */
  .title-version { background: #2a2a2a !important; color: #8a9099 !important; }

  /* header btn 背景暗化 */
  .header-btn { background: #2a2a2a !important; }

  /* 回到底部按钮暗化 */
  .scroll-bottom-btn { background: #242424 !important; border-color: rgba(255,255,255,0.12) !important; }
}
</style>
