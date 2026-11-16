<template>
    <wd-config-provider :theme-vars="themeVars" :custom-style="pageStyle" :theme="theme">
        <wd-navbar left-arrow title="缺陷详情" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
            <template v-if="isCreator" #right>
                <text class="nav-edit" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }" @click="handleEdit">编辑</text>
            </template>
        </wd-navbar>
        <view v-if="loading" class="loading-wrap"><wd-loading /></view>
        <scroll-view v-else scroll-y class="scroll-content">
            <!-- 状态卡 -->
            <view class="form-section status-card">
                <view class="status-card-top">
                    <view class="detail-title">{{ defect.defect || '-' }}</view>
                    <view class="status-tag-wrap">
                        <view v-if="Number(defect.pauseStatus) > 0" class="status-tag" :style="{ background: pauseColor + '1A', color: pauseColor }">{{ pauseLabel }}</view>
                        <view class="status-tag" :style="{ background: statusColor + '1A', color: statusColor }">{{ statusLabel }}</view>
                    </view>
                </view>
                <view class="status-card-sub">
                    <text class="sub-text">创建人：{{ userName(defect.creater, defect.createrName) }}</text>
                    <text class="sub-text">{{ defect.dbtime || '' }}</text>
                </view>
                <view v-if="pauseTip" class="pause-tip">{{ pauseTip }}</view>
            </view>

            <!-- 基础信息 -->
            <view class="form-section">
                <view class="form-title">基础信息</view>
                <view class="info-grid">
                    <view class="info-item"><text class="info-label">所属产品</text><text class="info-value">{{ defect.productName || '未关联产品' }}</text></view>
                    <view class="info-item"><text class="info-label">优先级</text><view class="mini-tag" :style="{ background: priorityColor + '1A', color: priorityColor }">{{ priorityLabel }}</view></view>
                    <view class="info-item"><text class="info-label">缺陷来源</text><text class="info-value">{{ sourceLabel }}</text></view>
                    <view class="info-item"><text class="info-label">影响程度</text><view class="mini-tag" :style="{ background: severityColor + '1A', color: severityColor }">{{ severityLabel }}</view></view>
                    <view class="info-item"><text class="info-label">测试人员</text><text class="info-value">{{ userName(defect.tester, defect.testerName) || '--' }}</text></view>
                    <view class="info-item"><text class="info-label">负责人验证</text><text class="info-value">{{ defect.responsibleverify === 1 ? '是' : '否' }}</text></view>
                    <view class="info-item"><text class="info-label">发现版本</text><text class="info-value">{{ defect.softver || '--' }}</text></view>
                    <view class="info-item"><text class="info-label">修复版本</text><text class="info-value">{{ defect.fixver || '--' }}</text></view>
                    <view class="info-item"><text class="info-label">客户/项目</text><text class="info-value">{{ defect.proname || '--' }}</text></view>
                </view>
            </view>

            <!-- 一、现场情况 -->
            <view class="form-section">
                <view class="form-title">一、现场情况</view>
                <view class="info-grid">
                    <view class="info-item"><text class="info-label">发生时间</text><text class="info-value">{{ defect.sendTime || '--' }}</text></view>
                    <view class="info-item"><text class="info-label">创建时间</text><text class="info-value">{{ defect.dbtime || '--' }}</text></view>
                </view>
                <view class="rich-field"><text class="info-label">实际结果</text><rich-or-plain :value="defect.actualResult" /></view>
                <view class="rich-field"><text class="info-label">期望结果</text><rich-or-plain :value="defect.expectedResult" /></view>
            </view>

            <!-- 二、复现方式 -->
            <view class="form-section">
                <view class="form-title">二、复现方式</view>
                <view class="info-grid">
                    <view class="info-item"><text class="info-label">复现频率</text><text class="info-value">{{ defect.reproduceFrequency || '--' }}</text></view>
                </view>
                <view class="rich-field"><text class="info-label">前置条件</text><rich-or-plain :value="defect.precondition" /></view>
                <view class="rich-field"><text class="info-label">复现步骤</text><rich-or-plain :value="defect.reproduceStep" /></view>
            </view>

            <!-- 三、补充信息 -->
            <view class="form-section">
                <view class="form-title">三、补充信息</view>
                <view class="rich-field"><text class="info-label">备注</text><rich-or-plain :value="defect.notes" /></view>
            </view>

            <!-- 责任人 -->
            <view class="form-section">
                <view class="form-title">责任人（{{ (assignees || []).length }}）</view>
                <view v-if="!(assignees || []).length" class="empty-line">暂无责任人，待指派/认领</view>
                <view v-for="item in assignees" :key="item.id" class="assignee-card">
                    <view class="assignee-head">
                        <text class="assignee-name">{{ userName(item.assignee, item.assigneeName) }}</text>
                        <view class="mini-tag grey">{{ defectAssignTypeMap[item.assignType] ?? '-' }}</view>
                        <view class="mini-tag" :style="{ background: asgStatusColor(item.status) + '1A', color: asgStatusColor(item.status) }">{{ asgStatusLabel(item) }}</view>
                        <text v-if="liveTimeText(item)" class="live-time" :class="{ frozen: Number(defect.status) === 8 || paused }">{{ liveTimeText(item) }}</text>
                    </view>
                    <view class="assignee-grid">
                        <view class="info-item"><text class="info-label">指派人</text><text class="info-value">{{ userName(item.assigner, item.assignerName) || '--' }}</text></view>
                        <view class="info-item"><text class="info-label">指派/认领时间</text><text class="info-value">{{ item.assignTime || '--' }}</text></view>
                        <view v-if="item.confirmTime" class="info-item"><text class="info-label">确认时间</text><text class="info-value">{{ item.confirmTime }}</text></view>
                        <view v-if="item.handleTime" class="info-item"><text class="info-label">完成时间</text><text class="info-value">{{ item.handleTime }}</text></view>
                        <view v-if="item.workdayUsedTime || Number(item.workdayUsedSeconds) > 0" class="info-item"><text class="info-label">工作日耗时</text><text class="info-value">{{ item.workdayUsedTime || formatDurationHms(item.workdayUsedSeconds) }}</text></view>
                        <view v-if="reportOf(item)?.fixver" class="info-item"><text class="info-label">修复版本</text><text class="info-value">{{ reportOf(item)?.fixver }}</text></view>
                        <view v-if="Number(item.assignType) === 3 && pickLogNotes(logs, [19], item.assignTime, item.assigner)" class="span-all"><text class="info-label">协助说明</text><text class="info-value pre-line">{{ pickLogNotes(logs, [19], item.assignTime, item.assigner) }}</text></view>
                        <view v-if="item.rejectReason" class="span-all"><text class="info-label">拒绝原因</text><text class="info-value pre-line">{{ item.rejectReason }}</text></view>
                        <view v-if="reportOf(item)?.reason" class="span-all"><text class="info-label">缺陷原因</text><text class="info-value pre-line">{{ reportOf(item)?.reason }}</text></view>
                        <view v-if="reportOf(item)?.solution" class="span-all"><text class="info-label">解决方案</text><text class="info-value pre-line">{{ reportOf(item)?.solution }}</text></view>
                        <view v-if="reportOf(item)?.report" class="span-all"><text class="info-label">缺陷报告</text><text class="info-value pre-line">{{ reportOf(item)?.report }}</text></view>
                        <view v-if="reportOf(item)?.notes" class="span-all"><text class="info-label">报告备注</text><text class="info-value pre-line">{{ reportOf(item)?.notes }}</text></view>
                        <view v-if="imgListOf(reportOf(item)?.attachmentUrls).length" class="span-all">
                            <text class="info-label">报告附件</text>
                            <view class="img-list">
                                <image v-for="(u, i) in imgListOf(reportOf(item)?.attachmentUrls)" :key="i" class="thumb" :src="u" mode="aspectFill" @click="previewImgs(imgListOf(reportOf(item)?.attachmentUrls), i)" />
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 反馈信息（提出人/项目负责人等可提交，流程暂停时仍允许） -->
            <view class="form-section">
                <view class="form-title">反馈信息（{{ progressList.length }}）</view>
                <view v-if="canCreatorVerify" class="fb-input-row">
                    <textarea class="fb-textarea" v-model="progressText" :maxlength="255" placeholder="补充反馈信息（选填，255 字内，同日可多条）" placeholder-class="placeholder-class" />
                    <wd-button size="small" type="primary" :loading="progressSubmitting" @click="submitFeedback">提交</wd-button>
                </view>
                <view v-if="!progressGrouped.length" class="empty-line">暂无反馈信息</view>
                <view v-for="g in progressGrouped" :key="g.date" class="fb-day">
                    <view class="fb-date">{{ g.date }}</view>
                    <view v-for="(p, i) in g.items" :key="i" class="fb-item">
                        <text class="fb-user">{{ progressUserNameOf(p) }}</text>
                        <text class="fb-text pre-line">{{ progressTextOf(p) || '--' }}</text>
                    </view>
                </view>
            </view>

            <!-- 暂停/恢复（创建人可申请暂停；已暂停时原暂停申请人可申请恢复；审核由项目负责人处理） -->
            <view class="form-section">
                <view class="form-title">暂停 / 恢复</view>
                <view v-if="pauseTip" class="pause-tip section-tip">{{ pauseTip }}</view>
                <view v-if="canApplyPause || isPauseApplicant" class="pause-actions">
                    <wd-button v-if="canApplyPause" size="small" type="warning" @click="openPauseModal('pause')">申请暂停</wd-button>
                    <wd-button v-if="isPauseApplicant" size="small" type="primary" @click="openPauseModal('resume')">申请恢复</wd-button>
                </view>
                <view v-if="!pauseRequests.length" class="empty-line">暂无暂停/恢复记录</view>
                <view v-for="(r, idx) in pauseRequests" :key="pauseReqId(r) ?? idx" class="pause-card">
                    <view class="pause-head">
                        <view class="mini-tag" :style="reqTypeOf(r) === 'resume' ? passedTagStyle : warnTagStyle">{{ reqTypeLabel(r) }}</view>
                        <view class="mini-tag" :style="reqStateStyle(r)">{{ reqStateOf(r).label }}</view>
                        <text class="pause-meta">{{ pauseReqUser(r) }} · {{ r.applyTime || r.dbtime || '--' }}</text>
                    </view>
                    <view class="info-item"><text class="info-label">{{ reqTypeOf(r) === 'resume' ? '恢复原因' : '暂停原因' }}</text><text class="info-value pre-line">{{ r.reason || r.pauseReason || r.resumeReason || '--' }}</text></view>
                    <view v-if="r.statusAtApply != null" class="info-item"><text class="info-label">申请时状态</text><text class="info-value">{{ statusTextOf(r.statusAtApply) }}</text></view>
                    <view v-if="reqStateOf(r).label !== '待审核'" class="info-item"><text class="info-label">审核人</text><text class="info-value">{{ pauseReqReviewer(r) }}</text></view>
                    <view v-if="reqStateOf(r).label !== '待审核'" class="info-item"><text class="info-label">审核时间</text><text class="info-value">{{ r.reviewTime || r.updateTime || '--' }}</text></view>
                    <view v-if="reqStateOf(r).label !== '待审核' && (r.notes || r.reviewNotes)" class="info-item"><text class="info-label">审核备注</text><text class="info-value pre-line">{{ r.notes || r.reviewNotes }}</text></view>
                    <view v-if="reqTypeOf(r) === 'resume' && reqStateOf(r).label === '已通过' && r.resumeMode != null" class="info-item"><text class="info-label">恢复方式</text><text class="info-value">{{ defectResumeModeMap[Number(r.resumeMode)] ?? r.resumeMode }}</text></view>
                </view>
            </view>

            <!-- 状态流转 -->
            <view class="form-section">
                <view class="form-title">状态流转</view>
                <view v-if="!timeline.length" class="empty-line">暂无流转记录</view>
                <view v-else class="timeline">
                    <view v-for="(t, idx) in timeline" :key="idx" class="tl-item" :class="{ pending: t.pending }">
                        <view class="tl-left">
                            <view class="tl-dot" :style="{ background: defectTimelineColorMap[t.type] }"></view>
                            <view v-if="idx < timeline.length - 1" class="tl-line"></view>
                        </view>
                        <view class="tl-body">
                            <view class="tl-label" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ t.label }}</view>
                            <view v-if="t.time" class="tl-time">{{ t.time }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 测试用例 -->
            <view class="form-section">
                <view class="form-title">有效测试用例（{{ caseList.length }}）</view>
                <view v-if="!caseList.length" class="empty-line">暂无有效测试用例</view>
                <view v-for="c in caseList" :key="c.id" class="fold-card">
                    <view class="fold-head" @click="toggleCase(c.id)">
                        <text class="fold-title">{{ c.caseName || '--' }}</text>
                        <view class="fold-head-tags">
                            <view class="mini-tag grey">{{ defectCaseTypeMap[c.caseType] ?? '-' }}</view>
                            <view class="mini-tag" :style="{ background: '#fa8c161A', color: '#fa8c16' }">{{ defectCasePriorityMap[c.priority] ?? '-' }}</view>
                            <text class="fold-arrow">{{ expandedCases.indexOf(c.id) >= 0 ? '▾' : '▸' }}</text>
                        </view>
                    </view>
                    <view v-if="expandedCases.indexOf(c.id) >= 0" class="fold-body">
                        <view class="rich-field"><text class="info-label">测试目的</text><rich-or-plain :value="c.testPurpose" /></view>
                        <view class="rich-field"><text class="info-label">前置条件</text><rich-or-plain :value="c.precondition" /></view>
                        <view class="rich-field"><text class="info-label">测试步骤</text><rich-or-plain :value="c.testSteps" /></view>
                        <view class="rich-field"><text class="info-label">预期结果</text><rich-or-plain :value="c.expectedResult" /></view>
                        <view v-if="c.remark" class="rich-field"><text class="info-label">备注</text><rich-or-plain :value="c.remark" /></view>
                        <view class="info-grid">
                            <view class="info-item"><text class="info-label">命令/功能</text><text class="info-value">{{ c.cmdFunc || '--' }}</text></view>
                            <view class="info-item"><text class="info-label">适用客户端</text><text class="info-value">{{ c.applyRole || '--' }}</text></view>
                            <view class="info-item"><text class="info-label">编写人</text><text class="info-value">{{ userName(c.creater, c.createrName) || '--' }}</text></view>
                            <view class="info-item"><text class="info-label">创建时间</text><text class="info-value">{{ c.dbtime || '--' }}</text></view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 测试记录 -->
            <view class="form-section">
                <view class="form-title">测试记录（{{ recordBatches.length }} 批）</view>
                <view v-if="!recordBatches.length" class="empty-line">暂无测试执行记录</view>
                <view v-for="batch in recordBatches" :key="batch.batchNo" class="fold-card">
                    <view class="fold-head" @click="toggleBatch(batch.batchNo)">
                        <text class="fold-title">批次 {{ batch.batchNo }}</text>
                        <view class="fold-head-tags">
                            <view class="mini-tag grey">{{ batch.records.length }} 条</view>
                            <view class="mini-tag" :style="passedStyle(batch)">{{ passedText(batch) }}</view>
                            <text class="fold-arrow">{{ expandedBatches.indexOf(batch.batchNo) >= 0 ? '▾' : '▸' }}</text>
                        </view>
                    </view>
                    <view v-if="expandedBatches.indexOf(batch.batchNo) >= 0" class="fold-body">
                        <view v-if="batchNotes(batch)" class="batch-note">整体备注：{{ batchNotes(batch) }}</view>
                        <view v-for="r in batch.records" :key="r.id" class="record-card">
                            <view class="record-top">
                                <text class="record-name">{{ r.caseName || '--' }}</text>
                                <view class="mini-tag" :style="r.passed ? passedTagStyle : failTagStyle">{{ r.passed ? '通过' : '不通过' }}</view>
                            </view>
                            <view class="rich-field"><text class="info-label">实际结果</text><rich-or-plain :value="r.actualResult" /></view>
                            <view v-if="r.testReport" class="rich-field"><text class="info-label">测试报告</text><rich-or-plain :value="r.testReport" /></view>
                            <view v-if="imgListOf(r.screenshotUrls).length" class="rich-field">
                                <text class="info-label">截图</text>
                                <view class="img-list">
                                    <image v-for="(u, i) in imgListOf(r.screenshotUrls)" :key="i" class="thumb" :src="u" mode="aspectFill" @click="previewImgs(imgListOf(r.screenshotUrls), i)" />
                                </view>
                            </view>
                            <view class="info-grid">
                                <view class="info-item"><text class="info-label">执行人</text><text class="info-value">{{ userName(r.tester, r.testerName) || '--' }}</text></view>
                                <view class="info-item"><text class="info-label">执行时间</text><text class="info-value">{{ r.dbtime || '--' }}</text></view>
                            </view>
                            <view v-if="r.notes" class="rich-field"><text class="info-label">备注</text><rich-or-plain :value="r.notes" /></view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- 操作日志 -->
            <view class="form-section">
                <view class="form-title">操作日志</view>
                <view v-if="!logs.length" class="empty-line">暂无操作日志</view>
                <view v-for="l in logs" :key="l.id" class="log-row">
                    <view class="log-line">
                        <text class="log-action" :style="{ color: isDark ? '#69b1ff' : '#1677ff' }">{{ defectLogActionMap[Number(l.action)] ?? '-' }}</text>
                        <text class="log-op">{{ userName(l.operator, l.operatorName) }}</text>
                        <text class="log-time">{{ l.dbtime }}</text>
                    </view>
                    <view class="log-sub">
                        <text class="log-status">{{ statusTextOf(l.beforeStatus) }} → {{ statusTextOf(l.afterStatus) }}</text>
                        <text v-if="l.notes" class="log-notes">{{ l.notes }}</text>
                    </view>
                </view>
            </view>
            <view style="height: 160rpx;"></view>
        </scroll-view>

        <!-- 缺陷提出人验证操作条（状态 6；创建人或用户类型 2/3/9 可操作；暂停/恢复待审核期流程冻结隐藏） -->
        <view v-if="!loading && !paused && canCreatorVerify && Number(defect.status) === 6" class="bottom-bar">
            <wd-button type="success" size="large" style="flex:1" :loading="verifying" @click="handleVerifyPass">验证通过</wd-button>
            <wd-button type="error" size="large" style="flex:1" @click="openVerifyFail">验证不通过</wd-button>
        </view>

        <!-- 拒绝（状态 4）缺陷：创建人或用户类型 2/3/9 可直接做提出人验证（重新指派/关闭走原流程不变；暂停期隐藏） -->
        <view v-if="!loading && !paused && canCreatorVerify && Number(defect.status) === 4" class="bottom-bar">
            <wd-button type="success" size="large" style="flex:1" :loading="verifying" @click="handleVerifyPass">提出人验证通过</wd-button>
            <wd-button type="error" size="large" style="flex:1" @click="openVerifyFail">提出人验证不通过</wd-button>
        </view>

        <!-- 验证不通过弹层：选返工责任人（已完成记录）+ 意见 -->
        <view v-if="verifyFailVisible" class="mask" @click="verifyFailVisible = false">
            <view class="popup-panel" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click.stop>
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">验证不通过</view>
                <view class="popup-label required" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">返工责任人（已完成记录）</view>
                <view v-if="!verifyFailOptions.length" class="empty-line">无可返工的责任人记录</view>
                <view v-else class="option-chips">
                    <view v-for="o in verifyFailOptions" :key="o.value" class="option-chip" :class="{ active: failForm.assigneeIds.indexOf(o.value) >= 0 }" @click="toggleFailAssignee(o.value)">{{ o.label }}</view>
                </view>
                <view class="popup-label" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">验证意见</view>
                <textarea class="fail-textarea" v-model="failForm.notes" :maxlength="255" placeholder="请填写不通过原因（选填）" placeholder-class="placeholder-class" />
                <view class="popup-actions">
                    <wd-button size="small" type="info" plain @click="verifyFailVisible = false">取消</wd-button>
                    <wd-button size="small" type="error" :loading="verifying" @click="submitVerifyFail">提交</wd-button>
                </view>
            </view>
        </view>

        <!-- 暂停/恢复原因弹层：mode=pause 申请暂停 / mode=resume 申请恢复 -->
        <view v-if="pauseModalVisible" class="mask" @click="pauseModalVisible = false">
            <view class="popup-panel" :style="{ background: isDark ? '#2a2a2a' : '#fff' }" @click.stop>
                <view class="popup-title" :style="{ color: isDark ? '#e8e8e8' : '#1a1a1a' }">{{ pauseModalMode === 'pause' ? '申请暂停缺陷' : '申请恢复处理' }}</view>
                <view class="popup-label required" :style="{ color: isDark ? '#c9cdd4' : '#323233' }">{{ pauseModalMode === 'pause' ? '暂停原因' : '恢复原因' }}</view>
                <textarea class="fail-textarea" v-model="pauseModalText" :maxlength="255" placeholder="请填写原因" placeholder-class="placeholder-class" />
                <view class="popup-actions">
                    <wd-button size="small" type="info" plain @click="pauseModalVisible = false">取消</wd-button>
                    <wd-button size="small" type="primary" :loading="pauseModalSubmitting" @click="submitPauseModal">提交</wd-button>
                </view>
            </view>
        </view>
    </wd-config-provider>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { useTheme } from "@/composables/theme/theme";
import { fetchRdDefectInfo, fetchCreatorVerify, fetchGetReportList, fetchGetTestCaseList, fetchGetTestRecordList, fetchGetProgressList, fetchSubmitDefectFeedback, fetchGetPauseRequestList, fetchApplyPauseDefect, fetchApplyResumeDefect } from "@/service/rddefect";
import { fetchGetAllUserDataList } from "@/service/member";
import RichOrPlain from "./rich-or-plain.vue";
import {
    defectStatusMap,
    defectStatusColorMap,
    defectPriorityMap,
    defectPriorityColorMap,
    defectSeverityMap,
    defectSeverityColorMap,
    defectSourceMap,
    defectAssigneeStatusMap,
    defectAssigneeStatusColorMap,
    defectAssignTypeMap,
    defectLogActionMap,
    defectCaseTypeMap,
    defectCasePriorityMap,
    defectTimelineColorMap,
    defectPauseStatusMap,
    defectPauseStatusColorMap,
    defectResumeModeMap,
    isDefectPaused,
    pickLogNotes,
    getDefectTimeline,
    mergeExtraUsers
} from "../constants";

const { themeVars, theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');
const pageStyle = computed(() => {
    if (!isDark.value) return 'min-height: 100vh';
    return 'min-height: 100vh; background: #1b1b1b; --rd-card-bg: #2a2a2a; --rd-card-shadow: none; --rd-title: #e8e8e8; --rd-label: #c9cdd4; --rd-field-bg: #333333; --rd-field-color: #e8e8e8; --rd-arrow: #6a6a6a; --rd-chip-bg: #3a3a3a; --rd-chip-color: #c9cdd4; --rd-chip-active-bg: rgba(22, 119, 255, 0.3); --rd-chip-active-color: #69b1ff; --rd-placeholder: #6a6a6a;';
});

const userId = ref<number>(uni.getStorageSync("userId"));
const userType = ref<number>(Number(uni.getStorageSync("usertype")));
const loading = ref(true);
const defectId = ref<any>('');
const defect = ref<any>({});
const assignees = ref<any[]>([]);
const logs = ref<any[]>([]);
const reportMap = ref<Map<string, any>>(new Map());
const caseList = ref<any[]>([]);
const recordBatches = ref<{ batchNo: string; records: any[] }[]>([]);
const userMap = ref<Record<string, string>>({});
const expandedCases = ref<any[]>([]);
const expandedBatches = ref<string[]>([]);
const verifying = ref(false);
const verifyFailVisible = ref(false);
const failForm = ref<{ assigneeIds: any[]; notes: string }>({ assigneeIds: [], notes: '' });
// 反馈信息（提出人/项目负责人等可提交，同日可多条不覆盖）
const progressList = ref<any[]>([]);
const progressText = ref('');
const progressSubmitting = ref(false);
// 暂停/恢复申请与审核记录 + 原因弹层
const pauseRequests = ref<any[]>([]);
const pauseModalVisible = ref(false);
const pauseModalMode = ref<'pause' | 'resume'>('pause');
const pauseModalText = ref('');
const pauseModalSubmitting = ref(false);

// 实时计时基准：缺陷未关闭时每秒刷新（耗时展示随 nowTick 重算）
const nowTick = ref(Date.now());
const fetchedAt = ref(Date.now());
let elapsedTimer: ReturnType<typeof setInterval> | null = null;

const isCreator = computed(() => defect.value?.creater != null && String(defect.value.creater) === String(userId.value));
// 缺陷提出人验证权限：原仅创建人，现放宽为用户类型 2/3/9（项目负责人/技术工程师/组长）
const canCreatorVerify = computed(() => isCreator.value || [2, 3, 9].includes(userType.value));
// 暂停状态（与主状态分离）：2 已暂停 / 3 恢复待审核 时流程写操作冻结，仅反馈与暂停恢复申请可用
const paused = computed(() => isDefectPaused(defect.value));
const pauseLabel = computed(() => defectPauseStatusMap[Number(defect.value?.pauseStatus)] ?? '');
const pauseColor = computed(() => defectPauseStatusColorMap[Number(defect.value?.pauseStatus)] ?? '#fa8c16');
const pauseTip = computed(() => ({
    0: '',
    1: '已有暂停申请待项目负责人审核，审核期间流程不受影响',
    2: '缺陷已暂停：指派/处理/报告/测试/验证等流程写操作被冻结，仅可提交反馈信息或恢复',
    3: '恢复申请待项目负责人审核，流程仍处暂停'
}[Number(defect.value?.pauseStatus) || 0] || ''));
// 申请暂停资格：pauseStatus=0 且状态在流转中（不含待指派/拒绝/关闭），创建人或用户类型 2/3/9
const canApplyPause = computed(
    () =>
        Number(defect.value?.pauseStatus) === 0 &&
        [1, 2, 3, 5, 6, 7].includes(Number(defect.value?.status)) &&
        (isCreator.value || [2, 3, 9].includes(userType.value))
);
// 原暂停申请人可申请恢复（仅已暂停时）
const isPauseApplicant = computed(() => {
    if (Number(defect.value?.pauseStatus) !== 2) return false;
    return pauseRequests.value.some(
        (r: any) => reqTypeOf(r) === 'pause' && String(r?.applicant ?? r?.creater ?? '') === String(userId.value)
    );
});
// 反馈按日期分组（后端已按日期倒序，保持其顺序，同日内按提交顺序展示多条）
const progressGrouped = computed(() => {
    const groups: { date: string; items: any[] }[] = [];
    const index = new Map<string, { date: string; items: any[] }>();
    progressList.value.forEach((p: any) => {
        const date = p.progressDate || p.feedbackDate || '--';
        let g = index.get(date);
        if (!g) {
            g = { date, items: [] };
            index.set(date, g);
            groups.push(g);
        }
        g.items.push(p);
    });
    return groups;
});
const statusLabel = computed(() => defectStatusMap[Number(defect.value?.status)] ?? '-');
const statusColor = computed(() => defectStatusColorMap[Number(defect.value?.status)] ?? '#909399');
const priorityLabel = computed(() => defectPriorityMap[Number(defect.value?.priority)] ?? '-');
const priorityColor = computed(() => defectPriorityColorMap[Number(defect.value?.priority)] ?? '#909399');
const severityLabel = computed(() => defectSeverityMap[Number(defect.value?.severity)] ?? '-');
const severityColor = computed(() => defectSeverityColorMap[Number(defect.value?.severity)] ?? '#909399');
const sourceLabel = computed(() => defectSourceMap[Number(defect.value?.source)] ?? '-');
const timeline = computed(() => getDefectTimeline({ ...defect.value, assignees: assignees.value, logs: logs.value }, userMap.value));
const verifyFailOptions = computed(() => (assignees.value || []).filter((a: any) => Number(a.status) === 2).map((a: any) => ({ label: userName(a.assignee, a.assigneeName), value: a.id })));
const passedTagStyle = { background: '#52c41a1A', color: '#52c41a' };
const failTagStyle = { background: '#f5222d1A', color: '#f5222d' };
const warnTagStyle = { background: '#fa8c161A', color: '#fa8c16' };

function userName(id: any, name?: any): string {
    return name || (id != null ? userMap.value[String(id)] : '') || '';
}
function statusTextOf(s: any): string {
    return s == null || s === '' ? '—' : defectStatusMap[Number(s)] ?? '-';
}
function asgStatusLabel(item: any): string {
    // 缺陷已关闭时已完成责任人显示「已关闭」（与 web 口径一致）
    if (Number(defect.value?.status) === 8 && Number(item?.status) === 2) return '已关闭';
    return defectAssigneeStatusMap[Number(item?.status)] ?? '-';
}
function asgStatusColor(status: any): string {
    return defectAssigneeStatusColorMap[Number(status)] ?? '#909399';
}
// 耗时统一「时分秒」格式：小时不封顶（关闭态展示用；实时态自走秒针）
function formatDurationHms(total: any): string {
    const n = Number(total);
    if (!Number.isFinite(n) || n < 0) return '';
    const s = Math.floor(n);
    return `${Math.floor(s / 3600)}时${Math.floor((s % 3600) / 60)}分${s % 60}秒`;
}
// 未关闭缺陷的实时耗时（秒）：待确认/处理中自指派/认领起按真实时间累计；
// 其余状态以后端 usedSeconds 快照为基准、锚定取数时刻只叠加本地流逝秒数；
// 无 usedSeconds 时自 handleTime/rejectTime 续算，再无锚点自取数时刻起算（每次刷新自动对时）
function liveSecondsOf(a: any): number {
    // 暂停/恢复待审核期流程冻结：耗时定格在取数时刻，不叠加本地流逝秒数
    const now = paused.value ? fetchedAt.value : nowTick.value;
    const status = Number(a?.status);
    if (status === 0 || status === 1) {
        const start = Date.parse(a?.assignTime || '');
        if (!Number.isNaN(start)) return Math.floor(Math.max(0, (now - start) / 1000));
    }
    const base = Number(a?.usedSeconds);
    if (Number.isFinite(base) && base >= 0) {
        return Math.floor(base + Math.max(0, (now - fetchedAt.value) / 1000));
    }
    const end = Date.parse(a?.handleTime || a?.rejectTime || '');
    if (!Number.isNaN(end)) return Math.floor(Math.max(0, (now - end) / 1000));
    return Math.floor(Math.max(0, (now - fetchedAt.value) / 1000));
}
function liveTimeText(item: any): string {
    if (Number(defect.value?.status) !== 8) return formatDurationHms(liveSecondsOf(item));
    // 已关闭：已完成记录显示冻结终值，其余状态不展示
    if (Number(item?.status) === 2) return formatDurationHms(item?.usedSeconds) || item?.usedTime || '';
    return '';
}
function reportOf(item: any): any {
    return item?.id != null ? reportMap.value.get(String(item.id)) : undefined;
}
function parseUrlList(s: any): string[] {
    try {
        const arr = s ? JSON.parse(s) : [];
        return Array.isArray(arr) ? arr.filter((u: any) => typeof u === 'string' && u) : [];
    } catch {
        return [];
    }
}
function imgListOf(s: any): string[] {
    return parseUrlList(s).filter(u => /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(u));
}
function previewImgs(urls: string[], current: number) {
    uni.previewImage({ urls, current });
}
function passedStyle(batch: { records: any[] }) {
    const all = batch.records.every((r: any) => r.passed);
    return all ? passedTagStyle : failTagStyle;
}
function passedText(batch: { records: any[] }) {
    return `${batch.records.filter((r: any) => r.passed).length}/${batch.records.length} 通过`;
}
// 批次整体备注：记录在日志表（action 8/9），以批次最早执行时间为锚点就近匹配（与缺陷测试人员相同者优先）
function batchNotes(batch: { records: any[] }): string {
    const times = (batch.records || []).map((r: any) => r?.dbtime).filter(Boolean).sort();
    return pickLogNotes(logs.value, [8, 9], times[0] || '', defect.value?.tester);
}
function toggleCase(id: any) {
    const idx = expandedCases.value.indexOf(id);
    if (idx >= 0) expandedCases.value.splice(idx, 1); else expandedCases.value.push(id);
}
function toggleBatch(no: string) {
    const idx = expandedBatches.value.indexOf(no);
    if (idx >= 0) expandedBatches.value.splice(idx, 1); else expandedBatches.value.push(no);
}
function toggleFailAssignee(id: any) {
    const idx = failForm.value.assigneeIds.indexOf(id);
    if (idx >= 0) failForm.value.assigneeIds.splice(idx, 1); else failForm.value.assigneeIds.push(id);
}
function handleClickLeft() { uni.navigateBack(); }
// 创建人编辑：add 页按 id 拉 getById 权威数据回填
function handleEdit() {
    uni.navigateTo({ url: '/mePages/rddefect/add/Index?id=' + defectId.value });
}

async function getUserMap() {
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 200, usertypes: '5' });
        const map: Record<string, string> = {};
        mergeExtraUsers((data.list || [])).forEach((item: any) => { map[String(item.id)] = item.username; });
        userMap.value = map;
    } catch (err) { console.error('获取用户列表失败', err); }
}

async function loadAll() {
    loading.value = true;
    fetchedAt.value = Date.now();
    try {
        // 详情为权威数据源：getById 返回 { defect, assignees, logs }（兼容平铺结构）
        const data: any = await fetchRdDefectInfo(defectId.value);
        const rd: any = data;
        const d: any = rd.defect ?? rd;
        // 先清空再赋值，规避 app 端嵌套结构整体替换渲染异常
        assignees.value = [];
        logs.value = [];
        defect.value = d || {};
        assignees.value = rd.assignees ?? d.assignees ?? [];
        logs.value = rd.logs ?? [];
        // 并发补拉反馈信息与暂停/恢复记录（内部各自容错）
        loadProgressList();
        loadPauseRequests();
        // 并发补拉报告（按责任人记录 id）/ 用例 / 测试记录（按批次分组）
        const [reports, cases, records] = await Promise.all([
            fetchGetReportList(defectId.value).catch(() => null),
            fetchGetTestCaseList(defectId.value).catch(() => null),
            fetchGetTestRecordList(defectId.value).catch(() => null)
        ]);
        const rMap = new Map<string, any>();
        ((reports as any) || []).forEach((r: any) => { if (r?.assigneeId != null) rMap.set(String(r.assigneeId), r); });
        reportMap.value = rMap;
        caseList.value = (cases as any) || [];
        const list = (records as any) || [];
        const bMap = new Map<string, any[]>();
        list.forEach((item: any) => {
            if (!bMap.has(item.batchNo)) bMap.set(item.batchNo, []);
            bMap.get(item.batchNo)!.push(item);
        });
        recordBatches.value = [...bMap.entries()].map(([batchNo, recs]) => ({ batchNo, records: recs }));
    } catch (err) {
        console.error('获取缺陷详情失败', err);
        uni.showToast({ title: '获取缺陷详情失败', icon: 'none' });
    } finally {
        loading.value = false;
    }
}

// 创建人验证通过（状态 6）
function handleVerifyPass() {
    uni.showModal({
        title: '提示',
        content: '确认验证通过？',
        success: async (res) => {
            if (!res.confirm) return;
            verifying.value = true;
            try {
                await fetchCreatorVerify(defectId.value, { passed: true });
                uni.showToast({ title: '验证结果已提交', icon: 'success' });
                uni.$emit('refreshRdDefectList');
                loadAll();
            } catch (err: any) {
                console.error('提交失败', err);
                uni.showToast({ title: err?.msg || '提交失败', icon: 'none' });
            } finally {
                verifying.value = false;
            }
        }
    });
}
function openVerifyFail() {
    failForm.value = { assigneeIds: [], notes: '' };
    verifyFailVisible.value = true;
}
async function submitVerifyFail() {
    if (!failForm.value.assigneeIds.length) {
        uni.showToast({ title: '请选择需要返工的责任人（已完成记录）', icon: 'none' });
        return;
    }
    verifying.value = true;
    try {
        await fetchCreatorVerify(defectId.value, { passed: false, assigneeIds: failForm.value.assigneeIds, notes: failForm.value.notes });
        verifyFailVisible.value = false;
        uni.showToast({ title: '验证不通过，已退回责任人处理', icon: 'none' });
        uni.$emit('refreshRdDefectList');
        loadAll();
    } catch (err: any) {
        console.error('提交失败', err);
        uni.showToast({ title: err?.msg || '提交失败', icon: 'none' });
    } finally {
        verifying.value = false;
    }
}

// ---------------- 反馈信息 ----------------
// 反馈人姓名：后端 *Name 优先，缺失时按提交人用户 ID 从 userMap 解析
function progressUserNameOf(p: any): string {
    return p?.assigneeName || p?.feedbackName || p?.createrName || userName(p?.creater) || '--';
}
// 反馈内容字段兼容读取（新接口 feedback / 历史每日进度 progress）
function progressTextOf(p: any): string {
    return p?.feedback ?? p?.progress ?? '';
}
async function loadProgressList() {
    try {
        progressList.value = ((await fetchGetProgressList(defectId.value)) as any) || [];
    } catch (err) {
        console.error('获取反馈信息失败', err);
    }
}
async function submitFeedback() {
    const text = String(progressText.value ?? '').trim();
    if (!text) {
        uni.showToast({ title: '请填写反馈内容', icon: 'none' });
        return;
    }
    if (text.length > 255) {
        uni.showToast({ title: '反馈内容最长 255 字符', icon: 'none' });
        return;
    }
    progressSubmitting.value = true;
    try {
        await fetchSubmitDefectFeedback(defectId.value, text);
        // 同日可多条，提交后清空输入框，不回填历史内容
        progressText.value = '';
        uni.showToast({ title: '反馈已提交', icon: 'success' });
        loadProgressList();
    } catch (err: any) {
        console.error('提交反馈失败', err);
        uni.showToast({ title: err?.msg || '提交失败', icon: 'none' });
    } finally {
        progressSubmitting.value = false;
    }
}

// ---------------- 暂停/恢复 ----------------
async function loadPauseRequests() {
    try {
        pauseRequests.value = ((await fetchGetPauseRequestList(defectId.value)) as any) || [];
    } catch (err) {
        console.error('获取暂停/恢复记录失败', err);
    }
}
// 申请类型：0 暂停申请、1 恢复申请（兼容 RESUME 字符串值）
function reqTypeOf(r: any): 'pause' | 'resume' {
    const t = r?.requestType ?? r?.type;
    return Number(t) === 1 || t === 'RESUME' ? 'resume' : 'pause';
}
function reqTypeLabel(r: any): string {
    return reqTypeOf(r) === 'resume' ? '恢复申请' : '暂停申请';
}
// 审核状态：待审核/已通过/已拒绝（兼容 passed 布尔与 status 数值两种返回）
function reqStateOf(r: any): { label: string; color: string } {
    if (r?.status != null) {
        const s = Number(r.status);
        if (s === 0) return { label: '待审核', color: '#fa8c16' };
        if (s === 1) return { label: '已通过', color: '#52c41a' };
        if (s === 2) return { label: '已拒绝', color: '#f5222d' };
    }
    if (r?.passed === true) return { label: '已通过', color: '#52c41a' };
    if (r?.passed === false && r?.reviewer != null) return { label: '已拒绝', color: '#f5222d' };
    return { label: '待审核', color: '#fa8c16' };
}
function reqStateStyle(r: any) {
    const s = reqStateOf(r);
    return { background: s.color + '1A', color: s.color };
}
// 申请记录字段名后端未定版，做兼容读取
function pauseReqId(r: any): any {
    return r?.requestId ?? r?.id;
}
function pauseReqUser(r: any): string {
    return r?.applicantName || r?.createrName || userName(r?.applicant ?? r?.creater) || '--';
}
function pauseReqReviewer(r: any): string {
    return r?.reviewerName || r?.auditorName || userName(r?.reviewer ?? r?.auditor) || '--';
}
function openPauseModal(mode: 'pause' | 'resume') {
    pauseModalMode.value = mode;
    pauseModalText.value = '';
    pauseModalVisible.value = true;
}
async function submitPauseModal() {
    const val = String(pauseModalText.value ?? '').trim();
    if (!val) {
        uni.showToast({ title: pauseModalMode.value === 'pause' ? '请填写暂停原因' : '请填写恢复原因', icon: 'none' });
        return;
    }
    pauseModalSubmitting.value = true;
    try {
        if (pauseModalMode.value === 'pause') {
            await fetchApplyPauseDefect(defectId.value, val);
            uni.showToast({ title: '暂停申请已提交，待项目负责人审核', icon: 'none' });
        } else {
            await fetchApplyResumeDefect(defectId.value, val);
            uni.showToast({ title: '恢复申请已提交，待项目负责人审核', icon: 'none' });
        }
        pauseModalVisible.value = false;
        uni.$emit('refreshRdDefectList');
        loadAll();
    } catch (err: any) {
        console.error('提交失败', err);
        uni.showToast({ title: err?.msg || '提交失败', icon: 'none' });
    } finally {
        pauseModalSubmitting.value = false;
    }
}

onLoad(async (options: any) => {
    defectId.value = options.id;
    getUserMap();
    await loadAll();
    // 未关闭缺陷开启逐秒计时（关闭态静态展示，不启定时器）
    if (Number(defect.value?.status) !== 8) {
        elapsedTimer = setInterval(() => { nowTick.value = Date.now(); }, 1000);
    }
    // 编辑保存返回后自动刷新（add 页提交后 emit）
    uni.$on('refreshRdDefectList', loadAll);
});
onUnload(() => {
    if (elapsedTimer) clearInterval(elapsedTimer);
    uni.$off('refreshRdDefectList', loadAll);
});
</script>
<style lang="scss" scoped>
.loading-wrap { display: flex; justify-content: center; padding: 120rpx 0; }
.nav-edit { font-size: 28rpx; }
.scroll-content { height: calc(100vh - 88rpx); }
.form-section { background: var(--rd-card-bg, #fff); margin: 24rpx; border-radius: 16rpx; padding: 32rpx; box-shadow: var(--rd-card-shadow, 0 2rpx 12rpx rgba(0, 0, 0, 0.04)); }
.form-title { font-size: 32rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); margin-bottom: 24rpx; padding-left: 16rpx; border-left: 6rpx solid #1677ff; }
.status-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16rpx; }
.detail-title { flex: 1; font-size: 32rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); line-height: 44rpx; }
.status-tag { padding: 6rpx 16rpx; border-radius: 16rpx; font-size: 22rpx; white-space: nowrap; }
.status-card-sub { display: flex; justify-content: space-between; margin-top: 20rpx; }
.sub-text { font-size: 24rpx; color: var(--rd-label, #999); }
.info-grid { display: flex; flex-wrap: wrap; }
.info-item { width: 100%; box-sizing: border-box; display: flex; align-items: flex-start; margin-bottom: 20rpx; font-size: 26rpx; padding-right: 12rpx; }
.info-label { color: var(--rd-label, #999); min-width: 170rpx; flex-shrink: 0; line-height: 40rpx; }
.info-value { color: var(--rd-field-color, #333); line-height: 40rpx; flex: 1; min-width: 0; word-break: break-all; }
.span-all { width: 100%; }
.info-label + .info-value.pre-line,
.span-all { display: block; }
.pre-line { white-space: pre-line; word-break: break-all; }
.rich-field { margin-bottom: 20rpx; }
.rich-field .info-label { display: block; margin-bottom: 8rpx; }
.mini-tag { padding: 4rpx 14rpx; border-radius: 8rpx; font-size: 22rpx; line-height: 34rpx; white-space: nowrap; }
.mini-tag.grey { background: var(--rd-chip-bg, #f2f3f5); color: var(--rd-chip-color, #646a73); }
.empty-line { font-size: 26rpx; color: var(--rd-label, #999); padding: 12rpx 0; }
.assignee-card { border: 1rpx solid var(--rd-field-bg, #eef0f3); border-radius: 12rpx; padding: 20rpx; margin-bottom: 20rpx; }
.assignee-card:last-child { margin-bottom: 0; }
.assignee-head { display: flex; align-items: center; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.assignee-name { font-size: 28rpx; font-weight: 600; color: var(--rd-title, #1a1a1a); }
.live-time { font-size: 22rpx; color: #f5222d; font-weight: 600; }
.live-time.frozen { color: #64748b; font-weight: 400; }
.img-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 8rpx; }
.thumb { width: 128rpx; height: 128rpx; border-radius: 8rpx; background: var(--rd-field-bg, #f2f3f5); }
.timeline { padding-left: 8rpx; }
.tl-item { display: flex; }
.tl-left { display: flex; flex-direction: column; align-items: center; margin-right: 20rpx; }
.tl-dot { width: 18rpx; height: 18rpx; border-radius: 50%; margin-top: 10rpx; flex-shrink: 0; }
.tl-line { width: 2rpx; flex: 1; background: var(--rd-field-bg, #e5e6eb); min-height: 24rpx; }
.tl-body { flex: 1; padding-bottom: 28rpx; min-width: 0; }
.tl-label { font-size: 26rpx; line-height: 38rpx; word-break: break-all; }
.tl-time { font-size: 22rpx; color: var(--rd-label, #999); margin-top: 4rpx; }
.fold-card { border: 1rpx solid var(--rd-field-bg, #eef0f3); border-radius: 12rpx; margin-bottom: 16rpx; overflow: hidden; }
.fold-card:last-child { margin-bottom: 0; }
.fold-head { display: flex; justify-content: space-between; align-items: center; padding: 20rpx; gap: 12rpx; }
.fold-title { flex: 1; font-size: 26rpx; color: var(--rd-field-color, #333); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fold-head-tags { display: flex; align-items: center; gap: 10rpx; flex-shrink: 0; }
.fold-arrow { font-size: 24rpx; color: var(--rd-arrow, #999); }
.fold-body { padding: 4rpx 20rpx 20rpx; border-top: 1rpx solid var(--rd-field-bg, #eef0f3); }
.batch-note { font-size: 24rpx; color: #fa8c16; background: rgba(250, 140, 22, 0.08); border-radius: 8rpx; padding: 12rpx 16rpx; margin-bottom: 16rpx; }
.record-card { border: 1rpx solid var(--rd-field-bg, #eef0f3); border-radius: 12rpx; padding: 16rpx; margin-bottom: 16rpx; }
.record-card:last-child { margin-bottom: 0; }
.record-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; gap: 12rpx; }
.record-name { flex: 1; font-size: 26rpx; font-weight: 500; color: var(--rd-field-color, #333); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.log-row { padding: 16rpx 0; border-bottom: 1rpx solid var(--rd-field-bg, #f0f1f3); }
.log-row:last-child { border-bottom: none; }
.log-line { display: flex; align-items: center; gap: 16rpx; }
.log-action { font-size: 26rpx; font-weight: 500; flex-shrink: 0; }
.log-op { font-size: 24rpx; color: var(--rd-field-color, #333); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.log-time { font-size: 22rpx; color: var(--rd-label, #999); flex-shrink: 0; }
.log-sub { display: flex; gap: 16rpx; margin-top: 6rpx; flex-wrap: wrap; }
.log-status { font-size: 22rpx; color: var(--rd-label, #999); }
.log-notes { font-size: 22rpx; color: var(--rd-label, #666); word-break: break-all; }
.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 24rpx; padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom)); background: var(--rd-card-bg, #fff); box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06); z-index: 90; }
.mask { position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 99; display: flex; align-items: flex-end; }
.popup-panel { width: 100%; border-radius: 24rpx 24rpx 0 0; padding: 32rpx; box-sizing: border-box; max-height: 80vh; overflow-y: auto; }
.popup-title { font-size: 32rpx; font-weight: 600; text-align: center; margin-bottom: 24rpx; }
.popup-label { display: block; font-size: 28rpx; margin-bottom: 16rpx; }
.popup-label.required::before { content: "*"; color: #f5222d; margin-right: 8rpx; }
.option-chips { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 24rpx; }
.option-chip { padding: 12rpx 32rpx; background: var(--rd-chip-bg, #f5f5f5); border-radius: 32rpx; font-size: 26rpx; color: var(--rd-chip-color, #666); border: 2rpx solid transparent; }
.option-chip.active { background: var(--rd-chip-active-bg, #e6f4ff); color: var(--rd-chip-active-color, #1677ff); border-color: var(--rd-chip-active-color, #1677ff); }
.fail-textarea { width: 100%; box-sizing: border-box; height: 160rpx; padding: 20rpx; background: var(--rd-field-bg, #f7f8fa); border-radius: 12rpx; font-size: 26rpx; color: var(--rd-field-color, #323233); margin-bottom: 24rpx; }
.popup-actions { display: flex; justify-content: flex-end; gap: 24rpx; }
.placeholder-class { color: var(--rd-placeholder, #c0c4cc); }
.status-tag-wrap { display: flex; align-items: center; gap: 10rpx; flex-shrink: 0; }
.pause-tip { font-size: 24rpx; line-height: 36rpx; color: #fa8c16; background: rgba(250, 140, 22, 0.08); border-radius: 8rpx; padding: 12rpx 16rpx; }
.status-card .pause-tip { margin-top: 16rpx; }
.pause-tip.section-tip { margin-bottom: 20rpx; }
.pause-actions { display: flex; gap: 20rpx; margin-bottom: 20rpx; }
.pause-card { border: 1rpx solid var(--rd-field-bg, #eef0f3); border-radius: 12rpx; padding: 20rpx; margin-bottom: 20rpx; }
.pause-card:last-child { margin-bottom: 0; }
.pause-head { display: flex; align-items: center; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.pause-meta { font-size: 22rpx; color: var(--rd-label, #999); }
.fb-input-row { display: flex; align-items: flex-start; gap: 16rpx; margin-bottom: 24rpx; }
.fb-textarea { flex: 1; min-width: 0; height: 140rpx; box-sizing: border-box; padding: 16rpx 20rpx; background: var(--rd-field-bg, #f7f8fa); border-radius: 12rpx; font-size: 26rpx; color: var(--rd-field-color, #323233); }
.fb-day { margin-bottom: 20rpx; }
.fb-day:last-child { margin-bottom: 0; }
.fb-date { font-size: 24rpx; color: var(--rd-label, #999); margin-bottom: 12rpx; }
.fb-item { border-left: 4rpx solid var(--rd-field-bg, #e5e6eb); padding: 4rpx 0 4rpx 16rpx; margin-bottom: 12rpx; }
.fb-user { display: block; font-size: 24rpx; color: var(--rd-label, #666); margin-bottom: 4rpx; }
.fb-text { display: block; font-size: 26rpx; color: var(--rd-field-color, #333); line-height: 38rpx; word-break: break-all; }
.tl-item.pending .tl-dot { background: transparent !important; border: 2rpx dashed var(--rd-label, #999); }
.tl-item.pending .tl-label { color: var(--rd-label, #999); }
</style>
