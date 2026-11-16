<template>
  <wd-config-provider
    :theme-vars="themeVars"
    :custom-style="isDark ? 'min-height: 100vh; background: #1b1b1b;' : 'min-height: 100vh; background: #f5f6f8;'"
    :theme="theme"
  >
    <view class="page">
      <wd-navbar left-arrow title="项目财务报表" safe-area-inset-top placeholder :bordered="false" @click-left="handleBack" />

      <!-- 筛选区 -->
      <view class="filter-area" :style="{ background: isDark ? '#1b1b1b' : '#f5f6f8' }">
        <view class="chips-row">
          <view
            v-for="g in grossOptions"
            :key="String(g.value)"
            class="chip"
            :class="{ active: grossSel === g.value }"
            :style="grossSel === g.value ? '' : { background: isDark ? '#2a2a2a' : '#ffffff' }"
            @click="handleGrossChange(g.value)"
          >
            {{ g.label }}
          </view>
          <view style="flex: 1"></view>
          <view class="search-toggle" :class="{ active: filterExpanded || filterCount > 0 }" @click="filterExpanded = !filterExpanded">
            <wd-icon name="filter" size="14px" />
            <text>筛选</text>
            <text v-if="filterCount" class="f-count">{{ filterCount }}</text>
          </view>
        </view>

        <view v-if="filterExpanded" class="filter-panel" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <!-- 查询日期：日/月/年 + 步进 -->
          <view class="f-row">
            <text class="f-label" :style="{ color: subColor }">日期</text>
            <view class="f-controls">
              <view
                v-for="t in dateTypeOptions"
                :key="t.value"
                class="chip small"
                :class="{ active: dateType === t.value }"
                :style="dateType === t.value ? '' : { background: isDark ? '#383838' : '#f5f6f8' }"
                @click="handleDateTypeChange(t.value)"
              >
                {{ t.label }}
              </view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(-1)">
                <wd-icon name="arrow-left" size="14px" />
              </view>
              <view class="date-label" :style="{ color: textColor }" @click="openDatePicker">{{ dateLabel }}</view>
              <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8' }" @click="stepDate(1)">
                <wd-icon name="arrow-right" size="14px" />
              </view>
            </view>
          </view>

          <!-- 项目状态 -->
          <picker mode="selector" :range="statusPickList" range-key="label" @change="handleStatusPick">
            <view class="select-cell" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
              <text class="sc-label" :style="{ color: subColor }">项目状态</text>
              <text class="sc-value" :style="{ color: statusSel !== null ? textColor : subColor }">
                {{ statusSel !== null ? STATUS_TEXT[statusSel] : '全部状态' }}
              </text>
              <wd-icon name="arrow-down" size="12px" :color="subColor" />
            </view>
          </picker>

          <!-- 报销状态（未完结/已完结，与 web 口径一致） -->
          <picker mode="selector" :range="reimbFinPickList" range-key="label" @change="handleReimbFinPick">
            <view class="select-cell" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
              <text class="sc-label" :style="{ color: subColor }">报销状态</text>
              <text class="sc-value" :style="{ color: reimbFinishedSel !== null ? textColor : subColor }">
                {{ reimbFinishedSel !== null ? (reimbFinishedSel === '1' ? '已完结' : '未完结') : '全部' }}
              </text>
              <wd-icon name="arrow-down" size="12px" :color="subColor" />
            </view>
          </picker>

          <!-- 出差人/创建人（usertype 0/4/11） -->
          <picker v-if="canFilterAll" mode="selector" :range="createrPickList" range-key="label" @change="handleCreaterPick">
            <view class="select-cell" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
              <text class="sc-label" :style="{ color: subColor }">人员</text>
              <text class="sc-value" :style="{ color: createrSel !== null ? textColor : subColor }">
                {{ createrSel !== null ? createrLabel : '全部人员' }}
              </text>
              <wd-icon name="arrow-down" size="12px" :color="subColor" />
            </view>
          </picker>

          <!-- 项目名称模糊（usertype 0/4/11） -->
          <view v-if="canFilterAll" class="fuzzy-row" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
            <input
              class="fuzzy-input"
              v-model="fuzzy"
              placeholder="项目名称搜索"
              placeholder-class="grey-class"
              :placeholder-style="`color:${isDark ? '#6b6b74' : '#9ca3af'}`"
              :style="{ color: textColor }"
              confirm-type="search"
              @confirm="reSearch"
            />
            <wd-icon v-if="fuzzy" name="close-circle" size="16px" :color="subColor" @click="handleFuzzyClear" />
          </view>

          <view class="filter-actions">
            <wd-button size="small" type="primary" @click="reSearch">查询</wd-button>
            <wd-button size="small" type="info" plain @click="resetFilters">重置</wd-button>
          </view>
        </view>
      </view>

      <!-- 已加载合计（固定在滚动区上方，不随列表滚动） -->
      <view v-if="rows.length" class="total-wrap">
        <view class="total-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="total-head">
            <text class="total-title" :style="{ color: textColor }">已加载合计</text>
            <text class="total-count" :style="{ color: subColor }">已加载 {{ rows.length }} 条，共 {{ total }} 条</text>
            <view style="flex: 1"></view>
            <text class="total-unit" :style="{ color: subColor }">单位：元</text>
          </view>
          <view class="total-grid">
            <view class="total-cell">
              <text class="tc-label" :style="{ color: subColor }">服务费</text>
              <text class="tc-value" :style="{ color: textColor }">{{ fmtMoney(totals.servicefee) }}</text>
            </view>
            <view class="total-cell">
              <text class="tc-label" :style="{ color: subColor }">总报销</text>
              <text class="tc-value" :style="{ color: textColor }">{{ fmtMoney(totals.submit) }}</text>
            </view>
            <view class="total-cell">
              <text class="tc-label" :style="{ color: subColor }">总费用</text>
              <text class="tc-value" :style="{ color: textColor }">{{ fmtMoney(totals.totalexpenses) }}</text>
            </view>
            <view class="total-cell">
              <text class="tc-label" :style="{ color: subColor }">毛利润</text>
              <text class="tc-value" :style="{ color: grossColor(totals.grossprofit) }">{{ fmtMoney(totals.grossprofit) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 列表 -->
      <scroll-view
        :scroll-y="true"
        refresher-enabled
        :refresher-triggered="triggered"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
        class="list-scroll"
      >
        <view class="list-inner">
          <!-- 财务卡片 -->
          <view v-for="row in rows" :key="String(row.id)" class="fin-card" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
            <view class="card-head">
              <view class="card-head-main">
                <text class="proname" :style="{ color: textColor }">{{ row.proname || '-' }}</text>
                <view class="tag-row">
                  <view class="tag" :style="{ color: statusColor(row.status), background: withAlpha(statusColor(row.status), 0.12) }">
                    {{ statusText(row.status) }}
                  </view>
                  <view class="tag" :style="{ color: ptypeColor(row.ptype), background: withAlpha(ptypeColor(row.ptype), 0.12) }">
                    {{ ptypeText(row.ptype) }}
                  </view>
                  <view class="tag" :style="{ color: reimbStatusColor(row), background: withAlpha(reimbStatusColor(row), 0.12) }">
                    {{ reimbStatusText(row) }}
                  </view>
                  <view v-if="isManualFinished(row)" class="tag q-tag" @click.stop="showManualFinishInfo(row)">?</view>
                  <view v-if="showCancelled(row)" class="tag" style="color: #d48806; background: rgba(212,136,6,0.12);" @click.stop="showCancelInfo(row)">已撤销</view>
                </view>
              </view>
              <view class="head-ops">
                <text v-if="Number(row.reimbursementfinished) === 0" class="op-link" @click="openManualFinish(row)">人工完结</text>
                <text v-if="Number(row.reimbursementfinishtype) === 2" class="op-link" style="color: #e67e22;" @click="openCancelFinish(row)">撤销</text>
                <text v-if="Number(row.manualreviewrequired) === 1" class="op-link" style="color: #f39c12;" @click="handleReview(row)">复核</text>
                <text class="del-btn" @click="confirmDeleteFin(row)">删除</text>
              </view>
            </view>

            <view class="info-rows">
              <view class="info-row">
                <text class="ir-label" :style="{ color: subColor }">合同</text>
                <text class="ir-value" :style="{ color: textColor }">{{ row.contractname || '-' }}{{ row.contractnum ? `（${row.contractnum}）` : '' }}</text>
              </view>
              <view class="info-half">
                <view class="info-row">
                  <text class="ir-label" :style="{ color: subColor }">进度</text>
                  <text class="ir-value" :style="{ color: textColor }">{{ row.progess || 0 }}%</text>
                </view>
                <view class="info-row">
                  <text class="ir-label" :style="{ color: subColor }">计划天数</text>
                  <text class="ir-value" :style="{ color: textColor }">{{ row.period ?? '-' }}</text>
                </view>
              </view>
              <view class="info-row" @click="row.username && openTrip(row)">
                <text class="ir-label" :style="{ color: subColor }">出差人</text>
                <!-- 无出差人只显示 -，不显示「的行程」入口 -->
                <text v-if="row.username" class="ir-value link" :style="{ color: '#2d8cf0' }">{{ row.username }} 的行程 ›</text>
                <text v-else class="ir-value" :style="{ color: textColor }">-</text>
              </view>
              <view class="date-grid">
                <view class="dg-cell">
                  <text class="ir-label" :style="{ color: subColor }">开始时间</text>
                  <text class="ir-value" :style="{ color: textColor }">{{ row.sdbtime || '-' }}</text>
                </view>
                <view class="dg-cell">
                  <text class="ir-label" :style="{ color: subColor }">计划调试</text>
                  <text class="ir-value" :style="{ color: textColor }">{{ row.plantime || '-' }}</text>
                </view>
                <view class="dg-cell">
                  <text class="ir-label" :style="{ color: subColor }">预计完成</text>
                  <text class="ir-value" :style="{ color: textColor }">{{ row.cpdbtime || '-' }}</text>
                </view>
                <view class="dg-cell">
                  <text class="ir-label" :style="{ color: subColor }">验收时间</text>
                  <text class="ir-value" :style="{ color: textColor }">{{ row.ckdbtime || '-' }}</text>
                </view>
              </view>
            </view>

            <!-- 财务数据（可编辑） -->
            <view class="fin-sec">
              <view class="sec-head">
                <text class="sec-title" :style="{ color: textColor }">财务数据</text>
                <view style="flex: 1"></view>
                <text class="edit-btn" @click="openFinEdit(row)">编辑</text>
              </view>
              <view class="fin-grid">
                <view class="fg-cell">
                  <text class="fg-label" :style="{ color: subColor }">实际天数</text>
                  <text class="fg-value" :style="{ color: textColor }">{{ row.actualdays ?? 0 }}</text>
                </view>
                <view class="fg-cell">
                  <text class="fg-label" :style="{ color: subColor }">实际人次</text>
                  <text class="fg-value" :style="{ color: textColor }">{{ row.actualpers ?? 0 }}</text>
                </view>
                <view class="fg-cell">
                  <text class="fg-label" :style="{ color: subColor }">服务费</text>
                  <text class="fg-value" :style="{ color: textColor }">{{ fmtMoney(row.servicefee) }}</text>
                </view>
                <view class="fg-cell">
                  <text class="fg-label" :style="{ color: subColor }">单日工资</text>
                  <text class="fg-value" :style="{ color: textColor }">{{ fmtMoney(row.dailywagecost) }}</text>
                </view>
                <view class="fg-cell">
                  <text class="fg-label" :style="{ color: subColor }">住宿补贴(日)</text>
                  <text class="fg-value" :style="{ color: textColor }">{{ fmtMoney(row.perac) }}</text>
                </view>
                <view class="fg-cell">
                  <text class="fg-label" :style="{ color: subColor }">用餐补贴(日)</text>
                  <text class="fg-value" :style="{ color: textColor }">{{ fmtMoney(row.perme) }}</text>
                </view>
              </view>
            </view>

            <!-- 汇总（只读） -->
            <view class="sum-sec">
              <view class="sum-row">
                <text class="sum-label" :style="{ color: subColor }">工资总成本</text>
                <text class="sum-value" :style="{ color: textColor }">{{ fmtMoney(row.totalwagecost) }}</text>
              </view>
              <view class="sum-row">
                <text class="sum-label" :style="{ color: subColor }">总报销费用</text>
                <view class="sum-right" @click="toggleReimb(row)">
                  <text class="sum-value" :style="{ color: textColor }">{{ fmtMoney(row.submit) }}</text>
                  <view class="reimb-tag" :class="{ open: expandedId === row.id }">
                    {{ reimbCount(row) }} 笔报销
                  </view>
                </view>
              </view>
              <view class="sum-row">
                <text class="sum-label" :style="{ color: subColor }">总费用</text>
                <text class="sum-value" :style="{ color: textColor }">{{ fmtMoney(row.totalexpenses) }}</text>
              </view>
              <view class="sum-row profit">
                <text class="sum-label" :style="{ color: subColor }">毛利润</text>
                <text class="sum-value big" :style="{ color: grossColor(Number(row.grossprofit ?? 0)) }">{{ fmtMoney(row.grossprofit) }}</text>
              </view>
              <view class="sum-row">
                <text class="sum-label" :style="{ color: subColor }">税后毛利润</text>
                <view class="sum-right">
                  <text class="sum-value" :style="{ color: grossColor(Number(taxAfter(row) ?? 0)) }">{{ fmtMoney(taxAfter(row)) }}</text>
                  <text class="tax-note" :style="{ color: subColor }">{{ taxNote(row) }}</text>
                </view>
              </view>
              <view class="sum-row">
                <text class="sum-label" :style="{ color: subColor }">报销覆盖</text>
                <view class="sum-right">
                  <text class="sum-value" :style="{ color: Number(row.coveredclockincount || 0) < Number(row.clockincount || 0) ? '#ff4d4f' : '#18a058' }">
                    {{ row.coveredclockincount ?? 0 }}/{{ row.clockincount ?? 0 }}天
                  </text>
                  <text v-if="Number(row.legacydatemissingcount) > 0" class="legacy-note" @click="showLegacyTip">历史待补录{{ row.legacydatemissingcount }}条</text>
                </view>
              </view>
            </view>

            <!-- 报销明细 -->
            <view v-if="expandedId === row.id" class="reimb-sec">
              <view v-if="!(row as any)._reimbList?.length" class="reimb-empty" :style="{ color: subColor }">暂无报销记录</view>
              <view
                v-for="(item, idx) in (row as any)._reimbList || []"
                :key="String(item.id ?? idx)"
                class="reimb-item"
                :style="{ background: isDark ? '#383838' : '#f8f9fb' }"
                @click="openReimbEdit(item, row)"
              >
                <view class="ri-top">
                  <text class="ri-name" :style="{ color: textColor }">{{ submitterName(item) }}</text>
                  <text v-if="Number(item.filenum) > 0" class="ri-file">附件{{ item.filenum }}</text>
                  <view style="flex: 1"></view>
                  <text class="ri-submit">{{ fmtMoney(item.submit) }}</text>
                  <wd-icon name="arrow-right" size="12px" :color="subColor" />
                </view>
                <view class="ri-mid" :style="{ color: subColor }">
                  交通 {{ fmtMoney(item.transportationexpenses) }} · 住宿 {{ fmtMoney(item.totaltravelexpenses) }} · 补贴 {{ fmtMoney(item.subsidy) }} · {{ item.tripdays || 1 }}天
                </view>
                <view v-if="item.startdate || item.enddate" class="ri-mid" :style="{ color: subColor }">
                  报销日期 {{ item.startdate }} ~ {{ item.enddate }}
                </view>
                <view v-if="item.notes1 || item.username" class="ri-bottom" :style="{ color: subColor }">
                  <text v-if="item.notes1" class="ri-notes">{{ item.notes1 }}</text>
                  <text v-if="item.username" class="ri-meta">{{ item.username }}{{ item.dbtime ? ` ${item.dbtime}` : '' }}</text>
                </view>
              </view>
              <view class="reimb-add" @click="openReimbAdd(row)">＋ 添加报销</view>
            </view>
          </view>

          <view v-if="!loading && rows.length === 0" class="empty" :style="{ color: subColor }">暂无财务数据</view>
          <wd-loadmore v-if="rows.length" :state="state" />
          <view class="bottom-space"></view>
        </view>
      </scroll-view>

      <!-- 日期选择器（无 show prop，弹层通过 open() 打开；自带 cell 隐藏） -->
      <wd-datetime-picker
        ref="datePickerRef"
        v-model="datePickerValue"
        :type="dateType === 'day' ? 'date' : dateType === 'month' ? 'year-month' : 'year'"
        title="选择日期"
        @confirm="handleDateConfirm"
      />

      <!-- 财务编辑弹层 -->
      <wd-popup closable v-model="finEditShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="sheet-head">
            <text class="sheet-title" :style="{ color: textColor }">编辑财务</text>
            <text class="sheet-sub" :style="{ color: subColor }">{{ finRow?.proname || '' }}</text>
          </view>
          <scroll-view :scroll-y="true" class="sheet-body">
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">实际天数</text>
              <input class="fr-input" v-model="finForm.actualdays" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">实际人次</text>
              <input class="fr-input" v-model="finForm.actualpers" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">服务费</text>
              <input class="fr-input" v-model="finForm.servicefee" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">单日工资</text>
              <input class="fr-input" v-model="finForm.dailywagecost" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">住宿补贴(日)</text>
              <input class="fr-input" v-model="finForm.perac" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">用餐补贴(日)</text>
              <input class="fr-input" v-model="finForm.perme" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>

            <view class="calc-sec" :style="{ background: isDark ? '#383838' : '#f8f9fb' }">
              <view class="calc-row">
                <text class="calc-label" :style="{ color: subColor }">工资总成本 = 单日工资 × 实际人次</text>
                <text class="calc-value" :style="{ color: textColor }">{{ fmtMoney(finPreview.wage) }}</text>
              </view>
              <view class="calc-row">
                <text class="calc-label" :style="{ color: subColor }">总费用 = 总报销 {{ fmtMoney(finRow?.submit) }} + 工资总成本</text>
                <text class="calc-value" :style="{ color: textColor }">{{ fmtMoney(finPreview.expenses) }}</text>
              </view>
              <view class="calc-row">
                <text class="calc-label" :style="{ color: subColor }">毛利润 = 服务费 − 总费用</text>
                <text class="calc-value" :style="{ color: grossColor(finPreview.profit) }">{{ fmtMoney(finPreview.profit) }}</text>
              </view>
            </view>
          </scroll-view>
          <view class="sheet-foot">
            <wd-button type="primary" block :loading="saving" @click="saveFin">保存</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- 报销编辑弹层 -->
      <wd-popup closable v-model="reimbEditShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="sheet-head">
            <text class="sheet-title" :style="{ color: textColor }">{{ reimbForm.id ? '编辑报销' : '添加报销' }}</text>
            <text class="sheet-sub" :style="{ color: subColor }">{{ reimbRow?.proname || '' }}</text>
          </view>
          <scroll-view :scroll-y="true" class="sheet-body">
            <picker mode="selector" :range="userOptions" range-key="label" @change="handleSubmitterPick">
              <view class="form-row picker-like">
                <text class="fr-label" :style="{ color: subColor }">报销人</text>
                <text class="fr-input as-text" :style="{ color: reimbForm.submitter ? textColor : subColor }">
                  {{ submitterLabel }}
                </text>
                <wd-icon name="arrow-down" size="12px" :color="subColor" />
              </view>
            </picker>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">交通费</text>
              <input class="fr-input" v-model="reimbForm.transportationexpenses" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">住宿费</text>
              <input class="fr-input" v-model="reimbForm.accommodation" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">补贴费</text>
              <input class="fr-input" v-model="reimbForm.subsidy" type="digit" placeholder="0" :style="{ color: textColor }" />
            </view>
            <!-- 报销日期：开始/结束必须成对；新增记录必填（与 web 校验一致） -->
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">报销日期</text>
              <view class="date-pair">
                <picker mode="date" :value="reimbForm.startdate" @change="(e: any) => (reimbForm.startdate = e.detail.value)">
                  <view class="date-cell" :style="{ color: reimbForm.startdate ? textColor : subColor }">{{ reimbForm.startdate || '开始日期' }}</view>
                </picker>
                <text class="date-sep" :style="{ color: subColor }">~</text>
                <picker mode="date" :value="reimbForm.enddate" @change="(e: any) => (reimbForm.enddate = e.detail.value)">
                  <view class="date-cell" :style="{ color: reimbForm.enddate ? textColor : subColor }">{{ reimbForm.enddate || '结束日期' }}</view>
                </picker>
                <wd-icon v-if="reimbForm.startdate || reimbForm.enddate" name="close-circle" size="14px" :color="subColor" @click="clearReimbDates" />
              </view>
            </view>
            <view class="form-row">
              <text class="fr-label" :style="{ color: subColor }">出差天数</text>
              <input class="fr-input" v-model="reimbForm.tripdays" type="number" placeholder="1" :style="{ color: textColor }" />
            </view>
            <view class="form-row area-row">
              <text class="fr-label" :style="{ color: subColor }">备注</text>
              <textarea
                class="fr-area"
                v-model="reimbForm.notes1"
                :maxlength="200"
                auto-height
                placeholder="选填"
                :placeholder-style="`color:${isDark ? '#6b6b74' : '#9ca3af'}`"
                :style="{ color: textColor }"
              />
            </view>
            <!-- 附件：仅已保存的报销可传（pid=报销记录 id，ftype=4） -->
            <view v-if="reimbForm.id" class="form-row picker-like" @click="openFileSheet">
              <text class="fr-label" :style="{ color: subColor }">附件</text>
              <view style="flex: 1"></view>
              <text :style="{ color: fileCount > 0 ? '#ff8c00' : subColor, fontSize: '26rpx' }">发票/凭证 {{ fileCount }} 个</text>
              <wd-icon name="arrow-right" size="12px" :color="subColor" />
            </view>
            <view v-else class="form-tip-line" :style="{ color: subColor }">附件请保存报销后再上传</view>

            <view class="calc-sec" :style="{ background: isDark ? '#383838' : '#f8f9fb' }">
              <view class="calc-row">
                <text class="calc-label" :style="{ color: subColor }">小计 = 交通 + 住宿 + 补贴</text>
                <text class="calc-value" :style="{ color: '#18a058' }">{{ fmtMoney(reimbSubmit) }}</text>
              </view>
            </view>
          </scroll-view>
          <view class="sheet-foot">
            <wd-button v-if="reimbForm.id" type="error" plain @click="deleteReimb">删除</wd-button>
            <wd-button type="primary" :loading="saving" @click="saveReimb">保存</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- 报销附件弹层（ftype=4，对齐 web 文件列表） -->
      <wd-popup closable v-model="fileSheetShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="sheet-head">
            <text class="sheet-title" :style="{ color: textColor }">附件列表</text>
            <text class="sheet-sub" :style="{ color: subColor }">{{ submitterLabel }}</text>
          </view>
          <scroll-view :scroll-y="true" class="sheet-body">
            <view v-if="!fileList.length" class="file-empty" :style="{ color: subColor }">暂无附件，点击下方按钮上传发票/凭证照片</view>
            <view v-for="f in fileList" :key="String(f.id)" class="file-item" :style="{ background: isDark ? '#383838' : '#f8f9fb' }">
              <text class="file-name" :style="{ color: textColor }">{{ f.fname || '附件' }}</text>
              <view style="flex: 1"></view>
              <text class="file-op" style="color: #2d8cf0;" @click="previewFile(f)">查看</text>
              <text class="file-op" style="color: #ff4d4f;" @click="deleteFile(f)">删除</text>
            </view>
          </scroll-view>
          <view class="sheet-foot">
            <wd-button type="primary" block :loading="fileUploading" @click="chooseAndUpload">上传附件</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- 人工完结 / 撤销人工完结弹层（原因必填 2-500 字符） -->
      <wd-popup closable v-model="finishSheetShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="sheet-head">
            <text class="sheet-title" :style="{ color: textColor }">{{ finishMode === 'finish' ? '人工确认报销完结' : '撤销人工完结' }}</text>
            <text class="sheet-sub" :style="{ color: subColor }">{{ finishRow?.proname || '' }}</text>
          </view>
          <view class="sheet-body-plain">
            <view class="finish-tip" :style="{ background: isDark ? 'rgba(230,126,34,0.16)' : 'rgba(230,126,34,0.1)', color: isDark ? '#e6a23c' : '#a0620d' }">
              {{ finishMode === 'finish' ? '注意：确认后该项目报销视为已完结（人工），不再随打卡/报销数据自动变化。' : '撤销后系统将立即重新判断报销覆盖状态，未覆盖的打卡会重新标红提示。' }}
            </view>
            <view class="finish-area-wrap" :style="{ background: isDark ? '#383838' : '#f5f6f8' }">
              <textarea
                class="fr-area finish-area"
                v-model="finishReason"
                :maxlength="500"
                auto-height
                placeholder="请输入原因（2-500个字符）"
                :placeholder-style="`color:${isDark ? '#6b6b74' : '#9ca3af'}`"
                :style="{ color: textColor }"
              />
              <text class="finish-count" :style="{ color: subColor }">{{ (finishReason || '').length }}/500</text>
            </view>
          </view>
          <view class="sheet-foot">
            <wd-button type="primary" block :loading="finishSaving" @click="submitFinish">{{ finishMode === 'finish' ? '确认完结' : '确认撤销' }}</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- 行程日历弹层 -->
      <wd-popup closable v-model="tripShow" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="sheet" :style="{ background: isDark ? '#2a2a2a' : '#ffffff' }">
          <view class="sheet-head">
            <text class="sheet-title" :style="{ color: textColor }">项目详情与行程</text>
            <text class="sheet-sub" :style="{ color: subColor }">{{ tripProject?.proname || '' }}</text>
          </view>
          <scroll-view :scroll-y="true" class="sheet-body">
            <view v-if="tripProject" class="trip-info" :style="{ background: isDark ? '#383838' : '#f8f9fb' }">
              <view class="ti-cell">
                <text class="ir-label" :style="{ color: subColor }">进度</text>
                <text class="ir-value" :style="{ color: textColor }">{{ tripProject.progess || 0 }}%</text>
              </view>
              <view class="ti-cell">
                <text class="ir-label" :style="{ color: subColor }">计划天数</text>
                <text class="ir-value" :style="{ color: textColor }">{{ tripProject.period ?? '-' }}</text>
              </view>
              <view class="ti-cell">
                <text class="ir-label" :style="{ color: subColor }">实际天数</text>
                <text class="ir-value" :style="{ color: textColor }">{{ tripProject.actualdays ?? 0 }}</text>
              </view>
              <view class="ti-cell">
                <text class="ir-label" :style="{ color: subColor }">实际人次</text>
                <text class="ir-value" :style="{ color: textColor }">{{ tripProject.actualpers ?? 0 }}</text>
              </view>
              <view class="ti-range" :style="{ color: subColor }">
                打卡起止：{{ tripRange || '暂无打卡记录' }}
              </view>
            </view>

            <template v-if="tripMonths.length">
              <view class="month-nav">
                <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8', opacity: tripMonthIndex === 0 ? 0.4 : 1 }" @click="prevTripMonth">
                  <wd-icon name="arrow-left" size="14px" />
                </view>
                <text class="month-text" :style="{ color: textColor }">{{ tripMonth }}</text>
                <view class="step-btn" :style="{ background: isDark ? '#383838' : '#f5f6f8', opacity: tripMonthIndex === tripMonths.length - 1 ? 0.4 : 1 }" @click="nextTripMonth">
                  <wd-icon name="arrow-right" size="14px" />
                </view>
              </view>

              <view class="week-header">
                <text v-for="w in ['一', '二', '三', '四', '五', '六', '日']" :key="w" class="wh-cell" :style="{ color: subColor }">{{ w }}</text>
              </view>
              <view class="days-grid">
                <view v-for="(day, i) in monthDays(tripMonth)" :key="i" class="day-cell" :style="{ background: isDark ? '#333333' : '#fafbfd' }">
                  <template v-if="day">
                    <text class="day-num" :style="{ color: textColor }">{{ Number(day.slice(-2)) }}</text>
                    <view v-for="u in dayUsers(day)" :key="String(u.id)" class="day-user" :style="{ background: isDark ? '#2a2a2a' : '#f5f7fa' }">
                      <text class="du-name" :style="{ color: textColor }">{{ u.username }}</text>
                      <text class="du-work" :style="worktimeStyle(u.dailyWorktime)">工时{{ u.dailyWorktime ?? '-' }}天</text>
                    </view>
                  </template>
                </view>
              </view>
            </template>
            <view v-else-if="!tripLoading" class="empty" :style="{ color: subColor }">暂无打卡记录</view>
          </scroll-view>
        </view>
      </wd-popup>
    </view>
    <wd-message-box />
  </wd-config-provider>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useMessage } from 'wot-design-uni'
import { useTheme } from '@/composables/theme/theme'
import {
  fetchProjectFinancePage,
  fetchUpdateProjectFinance,
  fetchDeleteProjectFinance,
  fetchProjectReimbursementPage,
  fetchAddProjectReimbursement,
  fetchUpdateProjectReimbursement,
  fetchDeleteProjectReimbursement,
  fetchProjectTripList,
  fetchCheckReimbursementDateConflict,
  fetchManualFinishReimbursement,
  fetchCancelManualFinishReimbursement,
  fetchRecalculateReimbursement,
  fetchFinanceFilePage,
  fetchFinanceFileAdd,
  fetchFinanceFileDelete,
  type ProjectFinanceRow,
  type ProjectTripItem,
} from '@/service/projectFinance'
import { uploadFile } from '@/utils/uploadFile'
import { fetchGetAllUserDataList } from '@/service/member'

const { themeVars, theme } = useTheme()
const message = useMessage()
const isDark = computed(() => theme.value === 'dark')
const textColor = computed(() => (isDark.value ? '#e5e5e5' : '#1f2937'))
const subColor = computed(() => (isDark.value ? '#8e8e93' : '#6b7280'))

function handleBack() {
  // #ifdef H5
  history.go(-1)
  // #endif
  // #ifndef H5
  uni.navigateBack()
  // #endif
}

/** 金额：千分位，最多两位小数，空值 -- */
function fmtMoney(v: any) {
  const n = Number(v)
  if (v == null || Number.isNaN(n)) return '--'
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
function num(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function round2(v: number) {
  return Math.round(v * 100) / 100
}
/** 透明度着色（tag 背景），色值为 #rrggbb */
function withAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
/** 毛利润配色：>0 绿 / <0 红 / 0 灰 */
function grossColor(v: number) {
  if (v > 0) return '#18a058'
  if (v < 0) return '#f0485a'
  return subColor.value
}

/* ---------------- 状态/延期文案 ---------------- */
const STATUS_TEXT: Record<number, string> = { [-1]: '未核准', 0: '未开始', 1: '进行中', 2: '待审核', 3: '完成', 4: '返工中' }
const STATUS_COLOR: Record<number, string> = { [-1]: '#909399', 0: '#2d8cf0', 1: '#ff9f43', 2: '#f0485a', 3: '#18a058', 4: '#9254de' }
function statusText(v: any) {
  return STATUS_TEXT[Number(v)] ?? '-'
}
function statusColor(v: any) {
  return STATUS_COLOR[Number(v)] ?? '#909399'
}
function ptypeText(v: any) {
  const n = Number(v)
  return n === 0 ? '正常' : n === 1 ? '已延期' : '作废'
}
function ptypeColor(v: any) {
  const n = Number(v)
  return n === 0 ? '#18a058' : n === 1 ? '#f0485a' : '#909399'
}

/* ---------------- 筛选 ---------------- */
const canFilterAll = computed(() => [0, 4, 11].includes(Number(uni.getStorageSync('usertype'))))
const filterExpanded = ref(false)
const filterCount = computed(() => (statusSel.value !== null ? 1 : 0) + (createrSel.value !== null ? 1 : 0) + (fuzzy.value.trim() ? 1 : 0) + (reimbFinishedSel.value !== null ? 1 : 0))

// 报销状态筛选：'0' 未完结 / '1' 已完结（由表单直传后端，系统/人工完结口径已合并）
const reimbFinishedSel = ref<'0' | '1' | null>(null)
const reimbFinPickList = [
  { label: '全部', value: null },
  { label: '未完结', value: '0' },
  { label: '已完结', value: '1' },
]
function handleReimbFinPick(e: any) {
  const opt = reimbFinPickList[Number(e.detail.value)]
  reimbFinishedSel.value = opt ? (opt.value as any) : null
}

// 毛利润：全部/盈利/持平/亏损
const grossOptions = [
  { label: '全部', value: null as any },
  { label: '盈利', value: 1 },
  { label: '持平', value: 0 },
  { label: '亏损', value: -1 },
]
const grossSel = ref<any>(null)
function handleGrossChange(v: any) {
  if (grossSel.value === v) return
  grossSel.value = v
  reSearch()
}

// 项目状态
const statusPickList = [{ label: '全部状态', value: null as any }, ...Object.keys(STATUS_TEXT).map(k => ({ label: STATUS_TEXT[Number(k)], value: Number(k) }))]
const statusSel = ref<any>(null)
function handleStatusPick(e: any) {
  const opt = statusPickList[Number(e.detail.value)]
  if (!opt) return
  statusSel.value = opt.value
  reSearch()
}

// 人员（创建人筛选）
const userOptions = ref<{ label: string; value: number }[]>([])
const userMap = computed(() => {
  const m: Record<number, string> = {}
  userOptions.value.forEach(u => (m[u.value] = u.label))
  return m
})
const createrPickList = computed(() => [{ label: '全部人员', value: null as any }, ...userOptions.value])
const createrSel = ref<any>(null)
const createrLabel = computed(() => userOptions.value.find(u => u.value === createrSel.value)?.label || '全部人员')
function handleCreaterPick(e: any) {
  const opt = createrPickList.value[Number(e.detail.value)]
  if (!opt) return
  createrSel.value = opt.value
  reSearch()
}
async function loadUserOptions() {
  try {
    const res: any = await fetchGetAllUserDataList({ page: 1, limit: 500, usertypes: '2,3,9' })
    const arr: any[] = Array.isArray(res) ? res : res?.list || res?.data || []
    userOptions.value = arr
      .filter((u: any) => Number(u.status ?? 0) === 0)
      .map((u: any) => ({ label: u.username, value: u.id }))
  } catch (e) {
    console.error('获取人员列表失败', e)
  }
}

// 项目名称模糊
const fuzzy = ref('')
function handleFuzzyClear() {
  fuzzy.value = ''
  reSearch()
}

function resetFilters() {
  statusSel.value = null
  createrSel.value = null
  reimbFinishedSel.value = null
  fuzzy.value = ''
  reSearch()
}

/* ---------------- 查询日期：日/月/年 ---------------- */
const dateTypeOptions = [
  { label: '日', value: 'day' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' },
]
const dateType = ref<'day' | 'month' | 'year'>('year')
const yearNum = ref(new Date().getFullYear())
const monthSel = ref<string | null>(null)
const daySel = ref<string | null>(null)

const datePickerRef = ref<any>(null)
const datePickerValue = ref(new Date().getTime())

const dateLabel = computed(() => {
  if (dateType.value === 'day') return daySel.value || `${yearNum.value}年`
  if (dateType.value === 'month') return monthSel.value ? `${monthSel.value.split('-')[0]}年${Number(monthSel.value.split('-')[1])}月` : `${yearNum.value}年`
  return `${yearNum.value}年`
})

function buildDateParam() {
  if (dateType.value === 'day') return daySel.value || String(yearNum.value)
  if (dateType.value === 'month') return monthSel.value || String(yearNum.value)
  return String(yearNum.value)
}

function syncPickerValue() {
  const now = new Date()
  if (dateType.value === 'day') {
    if (daySel.value) {
      const [y, m, d] = daySel.value.split('-').map(Number)
      datePickerValue.value = new Date(y, m - 1, d).getTime()
    } else {
      datePickerValue.value = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    }
  } else if (dateType.value === 'month') {
    if (monthSel.value) {
      const [y, m] = monthSel.value.split('-').map(Number)
      datePickerValue.value = new Date(y, m - 1, 1).getTime()
    } else {
      datePickerValue.value = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    }
  } else {
    datePickerValue.value = new Date(yearNum.value, 0, 1).getTime()
  }
}

/** wd-datetime-picker 无 show prop，弹层只能通过暴露的 open() 打开 */
function openDatePicker() {
  syncPickerValue()
  datePickerRef.value?.open()
}

function handleDateConfirm({ value }: any) {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  if (dateType.value === 'day') {
    daySel.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    yearNum.value = d.getFullYear()
    monthSel.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
  } else if (dateType.value === 'month') {
    monthSel.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    yearNum.value = d.getFullYear()
  } else {
    yearNum.value = d.getFullYear()
  }
  reSearch()
}

function handleDateTypeChange(t: 'day' | 'month' | 'year') {
  if (dateType.value === t) return
  dateType.value = t
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  if (t === 'month' && !monthSel.value) monthSel.value = `${yearNum.value}-${pad(now.getMonth() + 1)}`
  if (t === 'day' && !daySel.value) daySel.value = `${yearNum.value}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  reSearch()
}

function stepDate(step: 1 | -1) {
  const pad = (n: number) => String(n).padStart(2, '0')
  if (dateType.value === 'day') {
    const base = daySel.value ? daySel.value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
    const dt = new Date(base[0], base[1] - 1, base[2] + step)
    daySel.value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    yearNum.value = dt.getFullYear()
    monthSel.value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`
  } else if (dateType.value === 'month') {
    const base = monthSel.value ? monthSel.value.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
    const dt = new Date(base[0], base[1] - 1 + step, 1)
    monthSel.value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`
    yearNum.value = dt.getFullYear()
  } else {
    yearNum.value += step
  }
  reSearch()
}

/* ---------------- 列表加载 ---------------- */
const PAGE_SIZE = 20
const rows = ref<ProjectFinanceRow[]>([])
const total = ref(0)
const page = ref(1)
const state = ref<'loading' | 'loadmore' | 'finished' | 'error'>('loadmore')
const loading = ref(false)
const triggered = ref(false)

function buildParams() {
  const p: any = { page: page.value, pageSize: PAGE_SIZE, limit: PAGE_SIZE, date: buildDateParam() }
  if (statusSel.value !== null) p.status = statusSel.value
  if (createrSel.value !== null) p.creater = createrSel.value
  if (grossSel.value !== null) p.grossprofit = grossSel.value
  if (reimbFinishedSel.value !== null) p.reimbursementfinished = reimbFinishedSel.value
  const kw = fuzzy.value.trim()
  if (kw) p.fuzzy = kw
  return p
}

async function loadData(reset = false) {
  if (reset) {
    page.value = 1
    rows.value = []
    total.value = 0
  }
  loading.value = true
  state.value = 'loading'
  try {
    const res: any = await fetchProjectFinancePage(buildParams())
    const list = res?.list || []
    total.value = Number(res?.total ?? 0) || 0
    rows.value = page.value === 1 ? list : [...rows.value, ...list]
    state.value = rows.value.length >= total.value ? 'finished' : 'loadmore'
  } catch (e) {
    state.value = 'error'
    console.error('加载财务报表失败', e)
  } finally {
    loading.value = false
    triggered.value = false
  }
}

function loadMore() {
  if (state.value === 'finished' || state.value === 'loading') return
  page.value++
  loadData()
}

function onRefresh() {
  triggered.value = true
  loadData(true)
}

function reSearch() {
  loadData(true)
}

/** 已加载合计 */
const totals = computed(() => {
  const sum = (k: string) => rows.value.reduce((t: number, r: any) => t + num(r[k]), 0)
  return {
    servicefee: round2(sum('servicefee')),
    submit: round2(sum('submit')),
    totalexpenses: round2(sum('totalexpenses')),
    grossprofit: round2(sum('grossprofit')),
  }
})

/* ---------------- 财务编辑 ---------------- */
const finEditShow = ref(false)
const finRow = ref<ProjectFinanceRow | null>(null)
const finForm = ref({ actualdays: '', actualpers: '', servicefee: '', dailywagecost: '', perac: '', perme: '' })
const saving = ref(false)

function openFinEdit(row: ProjectFinanceRow) {
  finRow.value = row
  finForm.value = {
    actualdays: String(row.actualdays ?? 0),
    actualpers: String(row.actualpers ?? 0),
    servicefee: String(row.servicefee ?? 0),
    dailywagecost: String(row.dailywagecost ?? 0),
    perac: String(row.perac ?? 0),
    perme: String(row.perme ?? 0),
  }
  finEditShow.value = true
}

/** 实时预览：工资总成本 / 总费用 / 毛利润（口径与 web calculateRow 一致） */
const finPreview = computed(() => {
  const wage = round2(num(finForm.value.dailywagecost) * num(finForm.value.actualpers))
  const expenses = round2(num(finRow.value?.submit) + wage)
  const profit = round2(num(finForm.value.servicefee) - expenses)
  return { wage, expenses, profit }
})

function finPayload(row: ProjectFinanceRow) {
  const f = finForm.value
  return {
    id: row.id,
    actualdays: num(f.actualdays),
    actualpers: num(f.actualpers),
    servicefee: num(f.servicefee),
    dailywagecost: num(f.dailywagecost),
    perac: num(f.perac),
    perme: num(f.perme),
    totalwagecost: finPreview.value.wage,
    transportationexpenses: num(row.transportationexpenses),
    totaltravelexpenses: num(row.totaltravelexpenses),
    subsidy: num(row.subsidy),
    submit: Number(row.submit) || 0,
    totalexpenses: finPreview.value.expenses,
    grossprofit: finPreview.value.profit,
  }
}

async function saveFin() {
  const row: any = finRow.value
  if (!row) return
  saving.value = true
  try {
    const payload = finPayload(row)
    await fetchUpdateProjectFinance([payload])
    Object.assign(row, payload)
    uni.showToast({ title: '保存成功', icon: 'success' })
    finEditShow.value = false
  } catch (e) {
    console.error('保存财务失败', e)
  } finally {
    saving.value = false
  }
}

async function confirmDeleteFin(row: ProjectFinanceRow) {
  uni.showModal({
    title: '提示',
    content: `确定删除「${row.proname || ''}」的财务记录吗？`,
    success: async (r: any) => {
      if (!r.confirm) return
      try {
        await fetchDeleteProjectFinance(row.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
        loadData(true)
      } catch (e) {
        console.error('删除失败', e)
      }
    },
  })
}

/* ---------------- 报销明细 ---------------- */
const expandedId = ref<number | null>(null)
const reimbEditShow = ref(false)
const reimbRow = ref<ProjectFinanceRow | null>(null)
const reimbForm = ref({ id: undefined as number | undefined, fid: 0, submitter: undefined as any, transportationexpenses: '', accommodation: '', subsidy: '', tripdays: '1', startdate: '', enddate: '', notes1: '' })

function reimbCount(row: any) {
  return row._reimbList?.length ?? row.financiaList?.length ?? row.fcount ?? 0
}

function submitterName(item: any) {
  if (item.submitter && userMap.value[item.submitter]) return userMap.value[item.submitter]
  return item.username || '-'
}

async function toggleReimb(row: any) {
  if (expandedId.value === row.id) {
    expandedId.value = null
    return
  }
  await loadReimbList(row)
  expandedId.value = row.id
}

async function loadReimbList(row: any) {
  try {
    const res: any = await fetchProjectReimbursementPage({ page: 1, limit: 100, fid: row.id })
    const list = res?.list || []
    row._reimbList = list.map(mapReimb)
  } catch (e) {
    console.error('加载报销明细失败', e)
  }
}

function mapReimb(x: any) {
  const t = num(x.transportationexpenses)
  const a = num(x.accommodation)
  const s = num(x.subsidy)
  return { ...x, totaltravelexpenses: a, submit: round2(t + a + s) }
}

function openReimbAdd(row: any) {
  reimbRow.value = row
  reimbForm.value = { id: undefined, fid: row.id, submitter: undefined, transportationexpenses: '', accommodation: '', subsidy: '', tripdays: '1', startdate: '', enddate: '', notes1: '' }
  fileCount.value = 0
  reimbEditShow.value = true
}

function openReimbEdit(item: any, row: any) {
  reimbRow.value = row
  reimbForm.value = {
    id: item.id,
    fid: item.fid ?? row.id,
    submitter: item.submitter,
    transportationexpenses: String(item.transportationexpenses ?? 0),
    accommodation: String(item.accommodation ?? item.totaltravelexpenses ?? 0),
    subsidy: String(item.subsidy ?? 0),
    tripdays: String(item.tripdays ?? 1),
    startdate: item.startdate || '',
    enddate: item.enddate || '',
    notes1: item.notes1 || '',
  }
  refreshFileCount(item.id)
  reimbEditShow.value = true
}

const submitterLabel = computed(() => (reimbForm.value.submitter && userMap.value[reimbForm.value.submitter]) || '请选择报销人')
function handleSubmitterPick(e: any) {
  const opt = userOptions.value[Number(e.detail.value)]
  if (opt) reimbForm.value.submitter = opt.value
}

/** 报销小计 */
const reimbSubmit = computed(() => round2(num(reimbForm.value.transportationexpenses) + num(reimbForm.value.accommodation) + num(reimbForm.value.subsidy)))

async function saveReimb() {
  const parent: any = reimbRow.value
  if (!parent) return
  if (!reimbForm.value.submitter) {
    uni.showToast({ title: '请选择报销人', icon: 'none' })
    return
  }
  // 报销日期校验：开始/结束必须成对；新增记录必填；开始不能晚于结束（与 web 一致）
  const f = reimbForm.value
  const hasStart = !!f.startdate
  const hasEnd = !!f.enddate
  if (hasStart !== hasEnd) {
    uni.showToast({ title: '报销日期需要同时选择开始和结束日期', icon: 'none' })
    return
  }
  if (!f.id && !hasStart) {
    uni.showToast({ title: '请选择报销日期', icon: 'none' })
    return
  }
  if (hasStart && String(f.startdate) > String(f.enddate)) {
    uni.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
    return
  }
  saving.value = true
  try {
    // 保存前逐条检查重复报销日期，有交叉弹窗让用户确认（confirmOverlap 传后端跳过拦截）
    let confirmOverlap = false
    if (hasStart) {
      const conflicts: any = await fetchCheckReimbursementDateConflict({
        fid: f.fid,
        submitter: Number(f.submitter),
        startdate: f.startdate,
        enddate: f.enddate,
        excludeId: f.id,
      })
      if (Array.isArray(conflicts) && conflicts.length) {
        const goOn = await confirmConflict(conflicts)
        if (!goOn) return
        confirmOverlap = true
      }
    }
    const t = num(f.transportationexpenses)
    const a = num(f.accommodation)
    const s = num(f.subsidy)
    const payload: any = {
      fid: f.fid,
      submitter: Number(f.submitter),
      transportationexpenses: t,
      accommodation: a,
      totaltravelexpenses: a,
      subsidy: s,
      submit: reimbSubmit.value,
      tripdays: Number(f.tripdays) || 1,
      notes1: f.notes1,
    }
    if (hasStart) {
      payload.startdate = f.startdate
      payload.enddate = f.enddate
    }
    try {
      if (f.id) {
        await fetchUpdateProjectReimbursement([{ ...payload, id: f.id }], confirmOverlap)
      } else {
        await fetchAddProjectReimbursement([payload], confirmOverlap)
      }
    } catch (err: any) {
      // 后端保存时再次校验出冲突（含同批次交叉），确认后携带 confirmOverlap 重试
      const saveConflicts = extractDateConflicts(err)
      if (!saveConflicts) {
        uni.showToast({ title: typeof err === 'string' ? err : (err?.msg || '保存失败'), icon: 'none' })
        return
      }
      const goOn = await confirmConflict(saveConflicts)
      if (!goOn) return
      if (f.id) {
        await fetchUpdateProjectReimbursement([{ ...payload, id: f.id }], true)
      } else {
        await fetchAddProjectReimbursement([payload], true)
      }
    }
    await applyReimbAggregates(parent)
    uni.showToast({ title: '保存成功', icon: 'success' })
    reimbEditShow.value = false
  } catch (e) {
    console.error('保存报销失败', e)
  } finally {
    saving.value = false
  }
}

function deleteReimb() {
  const parent: any = reimbRow.value
  const id = reimbForm.value.id
  if (!parent || !id) return
  uni.showModal({
    title: '提示',
    content: '确定删除该笔报销吗？',
    success: async (r: any) => {
      if (!r.confirm) return
      saving.value = true
      try {
        await fetchDeleteProjectReimbursement(id)
        await applyReimbAggregates(parent)
        uni.showToast({ title: '删除成功', icon: 'success' })
        reimbEditShow.value = false
      } catch (e) {
        console.error('删除报销失败', e)
      } finally {
        saving.value = false
      }
    },
  })
}

/** ==================== 报销完结状态 / 人工完结 / 撤销 / 复核（对齐 web） ==================== */

// reimbursementfinished：最终业务状态 0否1是；reimbursementfinishtype：0未完结、1系统自动、2人工确认
function reimbStatusText(row: any) {
  if (Number(row.reimbursementfinished) === 1) return Number(row.reimbursementfinishtype) === 2 ? '已完结（人工）' : '已完结（系统）'
  return '未完结'
}
function reimbStatusColor(row: any) {
  if (Number(row.reimbursementfinished) === 1) return Number(row.reimbursementfinishtype) === 2 ? '#d48806' : '#18a058'
  return '#ff4d4f'
}
function isManualFinished(row: any) {
  return Number(row.reimbursementfinished) === 1 && Number(row.reimbursementfinishtype) === 2
}
// 撤销记录仅在覆盖情况有问题（存在未覆盖打卡）时展示
function showCancelled(row: any) {
  return !!(row.manualcancelreason || row.manualcanceltime) && Number(row.uncoveredclockincount) > 0
}
function showManualFinishInfo(row: any) {
  uni.showModal({
    title: '人工完结信息',
    content: `原因：${row.manualfinishreason || '-'}\n操作人：${row.manualfinishusername || '-'}\n时间：${row.manualfinishtime || '-'}`,
    showCancel: false,
  })
}
function showCancelInfo(row: any) {
  uni.showModal({
    title: '撤销信息',
    content: `撤销原因：${row.manualcancelreason || '-'}\n操作人：${row.manualcanceluser ?? '-'}\n时间：${row.manualcanceltime || '-'}`,
    showCancel: false,
  })
}

// 人工完结 / 撤销人工完结弹层
const finishSheetShow = ref(false)
const finishMode = ref<'finish' | 'cancel'>('finish')
const finishRow = ref<any>(null)
const finishReason = ref('')
const finishSaving = ref(false)
function openManualFinish(row: any) {
  finishMode.value = 'finish'
  finishRow.value = row
  finishReason.value = ''
  finishSheetShow.value = true
}
function openCancelFinish(row: any) {
  finishMode.value = 'cancel'
  finishRow.value = row
  finishReason.value = ''
  finishSheetShow.value = true
}
async function submitFinish() {
  const reason = finishReason.value.trim()
  if (reason.length < 2 || reason.length > 500) {
    uni.showToast({ title: '请输入原因（2-500个字符）', icon: 'none' })
    return
  }
  const row = finishRow.value
  if (!row) return
  finishSaving.value = true
  try {
    if (finishMode.value === 'finish') {
      await fetchManualFinishReimbursement(row.id, reason)
    } else {
      await fetchCancelManualFinishReimbursement(row.id, reason)
    }
    uni.showToast({ title: finishMode.value === 'finish' ? '已人工确认报销完结' : '已撤销人工完结，系统已重新判断报销状态', icon: 'none' })
    finishSheetShow.value = false
    loadData(true)
  } catch (e) {
    console.error('报销完结操作失败', e)
  } finally {
    finishSaving.value = false
  }
}

// 复核：人工完结后打卡/报销数据变化时，重算该项目报销覆盖状态
async function handleReview(row: any) {
  try {
    await message.confirm({
      title: '复核确认',
      msg: '人工完结后项目的打卡或报销数据发生了变化，是否立即重新计算报销覆盖状态？',
    })
  } catch {
    return // 用户取消
  }
  try {
    await fetchRecalculateReimbursement(row.id)
    uni.showToast({ title: '重算完成', icon: 'success' })
    loadData(true)
  } catch (e) {
    console.error('复核重算失败', e)
  }
}

/** ==================== 报销日期冲突（对齐 web showConflictDialog/extractDateConflicts） ==================== */

// 从保存接口报错里提取重复报销日期冲突列表（silentError 时 reject 完整响应体：code 500 + msg 含"重复报销日期" + data 数组）
function extractDateConflicts(err: any): any[] | null {
  if (err && typeof err === 'object' && !Array.isArray(err) && Array.isArray(err.data) && err.data.length && String(err.msg || '').includes('重复报销日期')) return err.data
  if (Array.isArray(err) && err.length) return err
  return null
}
// 冲突确认弹窗：resolve(true) 表示用户确认仍然保存（后续请求携带 confirmOverlap=true）
function confirmConflict(conflicts: any[]): Promise<boolean> {
  const lines = conflicts
    .slice(0, 8)
    .map((c: any, i: number) => `${i + 1}. ${c.username || '报销人' + c.submitter}：${c.overlapstartdate || ''}~${c.overlapenddate || ''} 与记录 ${c.startdate || ''}~${c.enddate || ''} 重叠`)
    .join('\n')
  return new Promise((resolve) => {
    uni.showModal({
      title: '存在重复报销日期',
      content: `以下日期与已有报销记录交叉，是否仍然保存？\n${lines}${conflicts.length > 8 ? `\n…共${conflicts.length}条` : ''}`,
      confirmText: '仍然保存',
      cancelText: '取消',
      success: (r) => resolve(!!r.confirm),
      fail: () => resolve(false),
    })
  })
}

/** ==================== 税后毛利润 / 覆盖情况（对齐 web 口径） ==================== */

const DEFAULT_TAX_RATE = 0.1
// 税率固定 10%；税额 = 服务费 − 服务费 ÷ (1 + 税率)；以后端下发为准，缺失时前端按价税分离兜底
function calcTaxAmount(servicefee: any, rate?: any) {
  const fee = Number(servicefee) || 0
  const r = Number(rate) || DEFAULT_TAX_RATE
  return round2(fee - fee / (1 + r))
}
function taxAfter(row: any) {
  if (row.grossprofitaftertax !== undefined && row.grossprofitaftertax !== null) return row.grossprofitaftertax
  return round2(num(row.grossprofit) - calcTaxAmount(row.servicefee, row.taxrate))
}
function taxNote(row: any) {
  const rate = row.taxrate ?? DEFAULT_TAX_RATE
  return `税率${Math.round(Number(rate) * 1000) / 10}% · 税额${calcTaxAmount(row.servicefee, rate)}`
}
function showLegacyTip() {
  uni.showModal({ title: '说明', content: '有历史报销记录未补录报销日期，不参与系统自动覆盖判断', showCancel: false })
}

/** ==================== 报销附件（ftype=4，对齐 web 文件列表） ==================== */

const fileSheetShow = ref(false)
const fileList = ref<any[]>([])
const fileUploading = ref(false)
const fileCount = ref(0)
async function refreshFileCount(pid?: number) {
  const id = pid ?? reimbForm.value.id
  if (!id) {
    fileCount.value = 0
    return
  }
  try {
    const res: any = await fetchFinanceFilePage({ page: 1, pid: id, limit: 100, ftype: 4 })
    fileList.value = res?.list || []
    fileCount.value = Number(res?.total ?? fileList.value.length) || fileList.value.length
    // 同步卡片报销明细行上的附件数
    const item = (reimbRow.value?._reimbList || []).find((i: any) => i.id === id)
    if (item) item.filenum = fileCount.value
  } catch (e) {
    console.error('获取附件列表失败', e)
  }
}
async function openFileSheet() {
  if (!reimbForm.value.id) {
    uni.showToast({ title: '请先保存报销后再上传附件', icon: 'none' })
    return
  }
  fileSheetShow.value = true
  await refreshFileCount()
}
function chooseAndUpload() {
  if (fileUploading.value) return
  const pid = reimbForm.value.id
  if (!pid) return
  uni.chooseImage({
    count: 9,
    success: async (res: any) => {
      const paths: string[] = res.tempFilePaths || []
      const raws: any[] = res.tempFiles || []
      if (!paths.length) return
      fileUploading.value = true
      let ok = 0
      for (let i = 0; i < paths.length; i++) {
        const fp = paths[i]
        const name = raws[i]?.name || String(fp).split('/').pop() || `附件_${Date.now()}.jpg`
        // 适配 uploadFile 的文件对象：App 端取 tempFilePath，H5 端取原生 File
        const file: any = {
          name,
          tempFilePath: fp,
          url: fp,
          file: raws[i] && typeof File !== 'undefined' && raws[i] instanceof File ? raws[i] : undefined,
        }
        try {
          const response: any = await new Promise((resolve, reject) => uploadFile(file, '', resolve, reject))
          if (response?.data) {
            await fetchFinanceFileAdd([{ furl: response.data, fname: name, pid, ftype: 4 }])
            ok++
          }
        } catch (e) {
          console.error('附件上传失败', e)
        }
      }
      fileUploading.value = false
      if (ok) {
        uni.showToast({ title: `已上传 ${ok} 个附件`, icon: 'success' })
        await refreshFileCount()
      } else {
        uni.showToast({ title: '上传失败', icon: 'none' })
      }
    },
  })
}
function previewFile(f: any) {
  const url = String(f.furl || '')
  if (!url) return
  if (/\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url)) {
    uni.previewImage({ urls: [url] })
    return
  }
  // #ifdef APP-PLUS
  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({ filePath: res.tempFilePath, showMenu: true, fail: () => uni.showToast({ title: '无法打开该文件', icon: 'none' }) })
      }
    },
    fail: () => uni.showToast({ title: '下载失败', icon: 'none' }),
  })
  // #endif
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
}
function deleteFile(f: any) {
  if (!f.id) return
  uni.showModal({
    title: '提示',
    content: '确定删除该附件吗？',
    success: async (r) => {
      if (!r.confirm) return
      try {
        await fetchFinanceFileDelete(String(f.id))
        uni.showToast({ title: '已删除', icon: 'success' })
        await refreshFileCount()
      } catch (e) {
        console.error('删除附件失败', e)
      }
    },
  })
}
function clearReimbDates() {
  reimbForm.value.startdate = ''
  reimbForm.value.enddate = ''
}

/** 重拉报销列表并把合计回写到财务行（口径与 web calculateRow/saveFinance 一致） */
async function applyReimbAggregates(row: any) {
  await loadReimbList(row)
  const list: any[] = row._reimbList || []
  const t = list.reduce((s, i) => s + num(i.transportationexpenses), 0)
  const a = list.reduce((s, i) => s + num(i.accommodation), 0)
  const s2 = list.reduce((s, i) => s + num(i.subsidy), 0)
  const submit = round2(t + a + s2)
  row.transportationexpenses = round2(t)
  row.totaltravelexpenses = round2(a)
  row.subsidy = round2(s2)
  row.submit = submit
  row.totalwagecost = round2(num(row.dailywagecost) * num(row.actualpers))
  row.totalexpenses = round2(submit + num(row.totalwagecost))
  row.grossprofit = round2(num(row.servicefee) - num(row.totalexpenses))
  try {
    await fetchUpdateProjectFinance([
      {
        id: row.id,
        actualdays: num(row.actualdays),
        actualpers: num(row.actualpers),
        servicefee: num(row.servicefee),
        dailywagecost: num(row.dailywagecost),
        perac: num(row.perac),
        perme: num(row.perme),
        totalwagecost: row.totalwagecost,
        transportationexpenses: row.transportationexpenses,
        totaltravelexpenses: row.totaltravelexpenses,
        subsidy: row.subsidy,
        submit: Number(row.submit) || 0,
        totalexpenses: row.totalexpenses,
        grossprofit: row.grossprofit,
      },
    ])
  } catch (e) {
    console.error('回写财务合计失败', e)
  }
}

/* ---------------- 行程日历 ---------------- */
const tripShow = ref(false)
const tripLoading = ref(false)
const tripProject = ref<ProjectFinanceRow | null>(null)
const tripRows = ref<ProjectTripItem[]>([])
const tripMonthIndex = ref(0)

async function openTrip(row: ProjectFinanceRow) {
  tripProject.value = row
  tripRows.value = []
  tripMonthIndex.value = 0
  tripShow.value = true
  tripLoading.value = true
  try {
    const res: any = await fetchProjectTripList({ fid: row.id })
    const arr: ProjectTripItem[] = Array.isArray(res) ? res : res?.list || []
    // 无出差人的打卡记录不进日历（卡片出差人位置显示 -，行程不展示）
    tripRows.value = [...arr]
      .filter(i => String((i as any).username || '').trim())
      .sort((x, y) => String(x.dbtime).localeCompare(String(y.dbtime)))
  } catch (e) {
    console.error('加载行程失败', e)
  } finally {
    tripLoading.value = false
  }
}

const tripMonths = computed(() => Array.from(new Set(tripRows.value.map(i => String(i.dbtime).slice(0, 7)))).sort())
const tripMonth = computed(() => tripMonths.value[tripMonthIndex.value] || '')
function prevTripMonth() {
  if (tripMonthIndex.value > 0) tripMonthIndex.value--
}
function nextTripMonth() {
  if (tripMonthIndex.value < tripMonths.value.length - 1) tripMonthIndex.value++
}
const tripRange = computed(() => {
  if (!tripRows.value.length) return ''
  return `${tripRows.value[0].dbtime} 至 ${tripRows.value[tripRows.value.length - 1].dbtime}`
})

/** 月历格子：周一开头补空白 */
function monthDays(month: string) {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return []
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const cells: (string | null)[] = []
  const lead = (first.getDay() + 6) % 7
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(`${month}-${String(d).padStart(2, '0')}`)
  return cells
}

function dayUsers(date: string) {
  return tripRows.value.filter(i => i.dbtime === date)
}

/** 工时配色：0 红 / ≥1 绿 / 其余蓝 */
function worktimeStyle(w: any) {
  const n = Number(w)
  if (n === 0) return { color: '#cf1322', background: 'rgba(207,19,34,.08)' }
  if (n >= 1) return { color: '#389e0d', background: 'rgba(56,158,13,.08)' }
  return { color: '#1890ff', background: 'rgba(24,144,255,.08)' }
}

onLoad(() => {
  loadUserOptions()
  loadData(true)
})
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ---------------- 筛选区 ---------------- */
.filter-area {
  flex-shrink: 0;
  padding: 16rpx 20rpx 8rpx;
}
.chips-row {
  display: flex;
  gap: 12rpx;
  align-items: center;
  flex-wrap: wrap;
}
.chip {
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #6b7280;
  &.active {
    background: #2d8cf0;
    color: #ffffff;
  }
  &.small {
    padding: 6rpx 20rpx;
  }
}
.chip.active.small {
  background: #2d8cf0;
  color: #fff;
}
.search-toggle {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(45, 140, 240, 0.1);
  color: #2d8cf0;
  font-size: 24rpx;
}
.f-count {
  margin-left: 4rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  border-radius: 999rpx;
  background: #2d8cf0;
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  padding: 0 6rpx;
}
.filter-panel {
  margin-top: 16rpx;
  border-radius: 20rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.f-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.f-label {
  font-size: 24rpx;
  width: 110rpx;
  flex-shrink: 0;
}
.f-controls {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  flex: 1;
}
.step-btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.date-label {
  font-size: 24rpx;
  font-weight: 600;
  min-width: 140rpx;
  text-align: center;
}
.select-cell {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-radius: 14rpx;
  padding: 18rpx 24rpx;
}
.sc-label {
  font-size: 24rpx;
  width: 110rpx;
  flex-shrink: 0;
}
.sc-value {
  flex: 1;
  font-size: 26rpx;
}
.fuzzy-row {
  display: flex;
  align-items: center;
  border-radius: 14rpx;
  padding: 0 24rpx;
}
.fuzzy-input {
  flex: 1;
  height: 72rpx;
  font-size: 26rpx;
}
.filter-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

/* ---------------- 列表 ---------------- */
.list-scroll {
  flex: 1;
  min-height: 0;
}
.list-inner {
  padding: 12rpx 20rpx 0;
}
/* 合计卡固定区（flex-shrink:0 使其不随 list-scroll 滚动） */
.total-wrap {
  flex-shrink: 0;
  padding: 12rpx 20rpx 0;
}
.total-card {
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 0;
}
.total-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}
.total-title {
  font-size: 26rpx;
  font-weight: 600;
}
.total-count {
  margin-left: 12rpx;
  font-size: 22rpx;
}
.total-unit {
  font-size: 22rpx;
}
.total-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}
.total-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.tc-label {
  font-size: 22rpx;
}
.tc-value {
  font-size: 26rpx;
  font-weight: 700;
}
.fin-card {
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}
.card-head-main {
  flex: 1;
  min-width: 0;
}
.proname {
  font-size: 30rpx;
  font-weight: 700;
  line-height: 42rpx;
}
.tag-row {
  display: flex;
  gap: 12rpx;
  margin-top: 10rpx;
}
.tag {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}
.del-btn {
  font-size: 24rpx;
  color: #f0485a;
  padding: 4rpx 8rpx;
}
.info-rows {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.info-half {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx 16rpx;
}
.ir-label {
  font-size: 24rpx;
  flex-shrink: 0;
}
.ir-value {
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ir-value.link {
  text-decoration: underline;
}
.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx 16rpx;
  margin-top: 4rpx;
}
.dg-cell {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.dg-cell .ir-value {
  white-space: normal;
}

/* 财务数据区 */
.fin-sec {
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.15);
}
.sec-head {
  display: flex;
  align-items: center;
  margin-bottom: 14rpx;
}
.sec-title {
  font-size: 26rpx;
  font-weight: 600;
}
.edit-btn {
  font-size: 24rpx;
  color: #2d8cf0;
  padding: 4rpx 12rpx;
}
.fin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx 12rpx;
}
.fg-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.fg-label {
  font-size: 22rpx;
}
.fg-value {
  font-size: 28rpx;
  font-weight: 600;
}

/* 汇总区 */
.sum-sec {
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid rgba(128, 128, 128, 0.15);
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sum-row.profit {
  padding-top: 8rpx;
}
.sum-label {
  font-size: 24rpx;
}
.sum-value {
  font-size: 26rpx;
  font-weight: 600;
}
.sum-value.big {
  font-size: 32rpx;
  font-weight: 700;
}
.sum-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.reimb-tag {
  font-size: 20rpx;
  color: #2d8cf0;
  background: rgba(45, 140, 240, 0.1);
  border-radius: 999rpx;
  padding: 4rpx 16rpx;
}
.reimb-tag.open {
  background: #2d8cf0;
  color: #ffffff;
}

/* 报销明细 */
.reimb-sec {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.reimb-empty {
  font-size: 24rpx;
  text-align: center;
  padding: 12rpx 0;
}
.reimb-item {
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.ri-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.ri-name {
  font-size: 26rpx;
  font-weight: 600;
}
.ri-submit {
  font-size: 26rpx;
  font-weight: 700;
  color: #18a058;
}
.ri-mid {
  font-size: 22rpx;
}
.ri-bottom {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.ri-notes {
  font-size: 22rpx;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ri-meta {
  font-size: 20rpx;
  flex-shrink: 0;
}
.reimb-add {
  text-align: center;
  font-size: 24rpx;
  color: #2d8cf0;
  padding: 12rpx 0;
  border: 1rpx dashed rgba(45, 140, 240, 0.5);
  border-radius: 14rpx;
}

.empty {
  text-align: center;
  font-size: 26rpx;
  padding: 80rpx 0;
}
.bottom-space {
  height: 40rpx;
}

/* ---------------- 弹层 ---------------- */
.sheet {
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}
.sheet-head {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-bottom: 20rpx;
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 700;
}
.sheet-sub {
  font-size: 24rpx;
}
.sheet-body {
  flex: 1;
  min-height: 0;
  max-height: 52vh;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 14rpx 0;
}
.picker-like {
  border-radius: 14rpx;
  padding: 18rpx 24rpx;
  margin-bottom: 8rpx;
}
.fr-label {
  font-size: 26rpx;
  width: 190rpx;
  flex-shrink: 0;
}
.fr-input {
  flex: 1;
  height: 68rpx;
  border-radius: 12rpx;
  background: rgba(128, 128, 128, 0.08);
  padding: 0 20rpx;
  font-size: 26rpx;
  text-align: right;
}
.fr-input.as-text {
  height: auto;
  line-height: 68rpx;
  background: transparent;
  padding: 0;
  text-align: right;
}
.area-row {
  align-items: flex-start;
}
.fr-area {
  flex: 1;
  min-height: 100rpx;
  border-radius: 12rpx;
  background: rgba(128, 128, 128, 0.08);
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  width: auto;
}
.calc-sec {
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.calc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.calc-label {
  font-size: 22rpx;
}
.calc-value {
  font-size: 26rpx;
  font-weight: 700;
}
.sheet-foot {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}

/* 行程日历 */
.trip-info {
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.ti-cell {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.ti-range {
  grid-column: 1 / -1;
  font-size: 22rpx;
}
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 16rpx;
}
.month-text {
  font-size: 30rpx;
  font-weight: 700;
}
.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8rpx;
}
.wh-cell {
  text-align: center;
  font-size: 22rpx;
  padding: 8rpx 0;
}
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6rpx;
}
.day-cell {
  border-radius: 10rpx;
  min-height: 88rpx;
  padding: 6rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.day-num {
  font-size: 22rpx;
  font-weight: 600;
}
.day-user {
  border-radius: 8rpx;
  padding: 4rpx 6rpx;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.du-name {
  font-size: 18rpx;
  line-height: 24rpx;
}
.du-work {
  font-size: 18rpx;
  line-height: 24rpx;
  border-radius: 6rpx;
  padding: 0 4rpx;
  align-self: flex-start;
}

/* 深色模式微调 */
.page.dark .f-count {
  background: #2d8cf0;
}

/* ==================== 报销状态 / 完结 / 附件 / 日期（对齐 web 新增） ==================== */
.head-ops {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.op-link {
  font-size: 24rpx;
  color: #1677ff;
}
.q-tag {
  min-width: 44rpx;
  text-align: center;
  color: #d48806;
  background: rgba(212, 136, 6, 0.12);
  border: 1rpx solid rgba(212, 136, 6, 0.45);
}
.legacy-note {
  font-size: 20rpx;
  color: #ff8c00;
}
.tax-note {
  font-size: 20rpx;
  color: #8a9099;
}
.ri-file {
  font-size: 20rpx;
  color: #ff8c00;
}
.date-pair {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.date-cell {
  flex: 1;
  font-size: 26rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  background: #f5f6f8;
  text-align: center;
}
.date-sep {
  font-size: 24rpx;
  color: #969799;
}
.form-tip-line {
  font-size: 22rpx;
  color: #969799;
  padding: 4rpx 0 0;
}
.file-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  background: #f5f6f8;
}
.file-name {
  flex: 1;
  font-size: 26rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-op {
  font-size: 24rpx;
  color: #1677ff;
}
.file-empty {
  padding: 60rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #969799;
}
.finish-tip {
  font-size: 22rpx;
  line-height: 1.6;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
}
.finish-area-wrap {
  border-radius: 12rpx;
  padding: 4rpx 20rpx 8rpx;
}
.finish-area {
  min-height: 140rpx;
  width: 100%;
  background: transparent;
}
.finish-count {
  display: block;
  text-align: right;
  font-size: 20rpx;
  padding: 4rpx 0 8rpx;
}
.sheet-body-plain {
  padding: 20rpx 24rpx;
}

/* 深色适配 */
.page.dark .date-cell,
.page.dark .file-item {
  background: #2a2a2a;
}
</style>
