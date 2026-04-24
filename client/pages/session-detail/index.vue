<template>
  <view :style="themeVars" class="page">
    <!-- ===== FORM VIEW ===== -->
    <view v-if="showForm" class="form-wrap">
      <text class="form-title">{{ formMode === 'new' ? '新建试验' : '编辑试验' }}</text>
      <text class="form-desc">试验属于项目上下文，不再支持在这里手工创建项目。</text>

      <view class="context-card">
        <text class="context-label">所属项目</text>
        <view class="context-main">
          <text class="context-name">{{ projectName || '未关联项目' }}</text>
          <t-tag v-if="projectCode" theme="primary" variant="light" size="small">{{ projectCode }}</t-tag>
        </view>
      </view>

      <view class="field-group">
        <text class="field-label">测试人员 *</text>
        <t-input v-model:value="form.tester" placeholder="请输入测试人员" clearable />
      </view>

      <view class="field-group">
        <text class="field-label">测试日期 *</text>
        <picker mode="date" :value="form.testDate" @change="onDateChange">
          <view class="picker-box">{{ form.testDate }}</view>
        </picker>
      </view>

      <view class="field-group">
        <text class="field-label">车辆信息</text>
        <t-input v-model:value="form.vehicleInfo" placeholder="例如：沪A12345" clearable />
      </view>

      <view class="field-group">
        <text class="field-label">测试路线</text>
        <t-input v-model:value="form.route" placeholder="例如：高速环线" clearable />
      </view>

      <view class="form-actions">
        <t-button theme="primary" block :loading="submitting" @click="submitSession">
          {{ formMode === 'new' ? '创建试验' : '保存试验' }}
        </t-button>
      </view>
    </view>

    <!-- ===== DETAIL VIEW ===== -->
    <view v-else>
      <!-- Info Card -->
      <view class="card info-card">
        <view class="info-top">
          <view class="info-texts">
            <text class="info-project">{{ projectName || session.project_id ? `项目 ${session.project_id}` : '试验详情' }}</text>
            <text class="info-sub">{{ session.tester }} · {{ session.test_date }}</text>
          </view>
          <view class="info-actions">
            <t-tag
              :theme="session.status === 'active' ? 'success' : 'default'"
              variant="light"
              size="small"
            >
              {{ session.status === 'active' ? '进行中' : '已结束' }}
            </t-tag>
            <text class="more-btn" @click="handleMoreAction">⋯</text>
          </view>
        </view>
        <text class="info-detail">车辆：{{ session.vehicle_info || '未填写' }} · 路线：{{ session.route || '未填写' }}</text>

        <!-- Stats Row -->
        <view class="info-stats">
          <text class="info-stat">总记录 {{ records.length }}</text>
          <text class="info-stat-divider">|</text>
          <text class="info-stat">已提交 {{ submittedCount }}</text>
          <text class="info-stat-divider">|</text>
          <text class="info-stat">草稿 {{ draftCount }}</text>
        </view>
      </view>

      <!-- Records Section -->
      <view class="section-head">
        <text class="section-title">记录列表</text>
        <text class="section-subtitle">{{ records.length }} 条记录</text>
      </view>

      <!-- Record Filter Tabs -->
      <view class="filter-tabs">
        <text
          v-for="tab in recordFilterTabs"
          :key="tab.key"
          :class="['filter-tab', recordFilter === tab.key ? 'active' : '']"
          @click="recordFilter = tab.key"
        >{{ tab.label }}</text>
      </view>

      <!-- Empty State -->
      <view v-if="filteredRecords.length === 0" class="card empty-wrap">
        <text class="empty-title">暂无记录</text>
        <text class="empty-desc">点击下方按钮开始录音并创建记录。</text>
      </view>

      <!-- Record List -->
      <view v-else class="record-list">
        <view
          v-for="record in filteredRecords"
          :key="record.id"
          :class="['card', 'record-card', 'severity-' + severityClass(record.severity), record.status === 'draft' ? 'status-draft' : '']"
          @click="goToRecord(record.id)"
        >
          <view class="record-head">
            <view class="record-tags">
              <t-tag v-if="record.problem_type" theme="primary" variant="light" size="small">{{ record.problem_type }}</t-tag>
              <t-tag v-if="record.severity" :theme="severityTheme(record.severity)" variant="light" size="small">{{ record.severity }}</t-tag>
            </view>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
          </view>
          <text class="record-summary">{{ record.summary || record.raw_text || '未处理' }}</text>
        </view>
      </view>

      <t-fab v-if="session.status === 'active'" icon="add" text="录音记录" @click="goToNewRecord" />
    </view>
  </view>
</template>

<script>
import { createSession, getProject, getRecords, getSession, updateSession } from '../../services/api';

export default {
  data() {
    return {
      formMode: 'new',
      showForm: false,
      submitting: false,
      sessionId: null,
      projectId: null,
      projectName: '',
      projectCode: '',
      session: {},
      records: [],
      recordFilter: 'all',
      recordFilterTabs: [
        { key: 'all', label: '全部' },
        { key: 'submitted', label: '已提交' },
        { key: 'draft', label: '草稿' },
      ],
      form: {
        tester: '',
        testDate: new Date().toISOString().split('T')[0],
        vehicleInfo: '',
        route: '',
      },
    };
  },
  computed: {
    themeVars() {
      return '--td-brand-color: #3B5E6B; --td-brand-color-light: #DEE6EA; --td-brand-color-dark: #1E293B; --td-error-color: #7A4B4B; --td-success-color: #4A6B5E; --td-warning-color: #7A6B4B; --td-bg-color-page: #F3F5F7; --td-bg-color-container: #FFFFFF; --td-text-color-primary: #0F172A; --td-text-color-secondary: #64748B;';
    },
    submittedCount() {
      return this.records.filter(r => r.status === 'submitted').length;
    },
    draftCount() {
      return this.records.filter(r => r.status === 'draft').length;
    },
    filteredRecords() {
      if (this.recordFilter === 'all') return this.records;
      return this.records.filter(r => r.status === this.recordFilter);
    },
  },
  onLoad(options) {
    if (options.new === '1') {
      this.projectId = Number(options.project_id);
      this.projectName = options.project_name ? decodeURIComponent(options.project_name) : '';
      this.projectCode = options.project_code ? decodeURIComponent(options.project_code) : '';
      this.formMode = 'new';
      this.showForm = true;
      uni.setNavigationBarTitle({ title: '新建试验' });
      return;
    }

    if (options.id) {
      this.sessionId = Number(options.id);
      this.formMode = options.edit === '1' ? 'edit' : 'view';
      this.showForm = this.formMode === 'edit';
      uni.setNavigationBarTitle({ title: this.showForm ? '编辑试验' : '试验详情' });
      this.loadSession();
    }
  },
  onShow() {
    if (this.sessionId && !this.showForm) {
      this.loadRecords();
    }
  },
  methods: {
    async loadSession() {
      try {
        const session = await getSession(this.sessionId);
        this.session = session;
        this.projectId = session.project_id;
        this.form.tester = session.tester || '';
        this.form.testDate = session.test_date || this.form.testDate;
        this.form.vehicleInfo = session.vehicle_info || '';
        this.form.route = session.route || '';

        try {
          const project = await getProject(session.project_id);
          this.projectName = project.name || '';
          this.projectCode = project.code || '';
        } catch (projectErr) {
          this.projectName = '';
          this.projectCode = '';
        }
      } catch (err) {
        uni.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    },
    async loadRecords() {
      try {
        this.records = await getRecords(this.sessionId);
      } catch (err) {
        uni.showToast({ title: err.message || '加载记录失败', icon: 'none' });
      }
    },
    onDateChange(e) {
      this.form.testDate = e.detail.value;
    },
    async submitSession() {
      if (!this.projectId || !this.form.tester || !this.form.testDate) {
        uni.showToast({ title: '请完整填写试验字段', icon: 'none' });
        return;
      }

      this.submitting = true;
      try {
        if (this.formMode === 'new') {
          const session = await createSession({
            project_id: this.projectId,
            tester: this.form.tester,
            test_date: this.form.testDate,
            vehicle_info: this.form.vehicleInfo,
            route: this.form.route,
          });
          uni.showToast({ title: '试验已创建', icon: 'success' });
          uni.redirectTo({ url: `/pages/session-detail/index?id=${session.id}` });
        } else {
          await updateSession(this.sessionId, {
            tester: this.form.tester,
            test_date: this.form.testDate,
            vehicle_info: this.form.vehicleInfo,
            route: this.form.route,
          });
          uni.showToast({ title: '试验已保存', icon: 'success' });
          uni.redirectTo({ url: `/pages/session-detail/index?id=${this.sessionId}` });
        }
      } catch (err) {
        uni.showToast({ title: err.message || '保存失败', icon: 'none' });
      } finally {
        this.submitting = false;
      }
    },
    goToEditSession() {
      uni.navigateTo({ url: `/pages/session-detail/index?id=${this.sessionId}&edit=1` });
    },
    handleMoreAction() {
      const items = ['编辑试验'];
      if (this.session.status === 'active') {
        items.push('结束试验');
      }
      uni.showActionSheet({
        itemList: items,
        success: (res) => {
          if (res.tapIndex === 0) {
            this.goToEditSession();
          } else if (res.tapIndex === 1) {
            this.endSession();
          }
        },
      });
    },
    endSession() {
      uni.showModal({
        title: '结束试验',
        content: '结束后将无法继续新增录音记录。',
        confirmColor: '#d54941',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            this.session = await updateSession(this.sessionId, { status: 'completed' });
            uni.showToast({ title: '试验已结束', icon: 'success' });
          } catch (err) {
            uni.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        },
      });
    },
    severityClass(severity) {
      const map = { '致命': 'critical', '严重': 'critical', '一般': 'moderate', '轻微': 'minor' };
      return map[severity] || 'none';
    },
    severityTheme(severity) {
      const map = { 致命: 'danger', 严重: 'danger', 一般: 'warning', 轻微: 'default' };
      return map[severity] || 'default';
    },
    goToRecord(recordId) {
      uni.navigateTo({ url: `/pages/record/index?id=${recordId}&session_id=${this.sessionId}` });
    },
    goToNewRecord() {
      uni.navigateTo({ url: `/pages/record/index?session_id=${this.sessionId}` });
    },
    formatTime(timeStr) {
      if (!timeStr) return '';
      return timeStr.replace('T', ' ').slice(0, 16);
    },
  },
};
</script>

<style scoped>
/* ===== Page Layout ===== */
.page {
  min-height: 100vh;
  background: #f3f5f7;
  padding: 24rpx 24rpx 160rpx;
}

/* ===== Shared Card ===== */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
  padding: 28rpx;
}

/* ===== Form View (unchanged) ===== */
.form-wrap {
  padding: 32rpx 28rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}
.form-title {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: #111827;
}
.form-desc {
  display: block;
  margin: 12rpx 0 24rpx;
  font-size: 25rpx;
  color: #64748b;
  line-height: 1.6;
}
.context-card {
  padding: 24rpx;
  margin-bottom: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
}
.context-label {
  display: block;
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.context-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
}
.context-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}
.field-group {
  margin-bottom: 24rpx;
}
.field-label {
  display: block;
  margin-bottom: 10rpx;
  font-size: 26rpx;
  color: #334155;
}
.picker-box {
  background: #ffffff;
  border: 2rpx solid #d7dce3;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #0f172a;
}
.form-actions {
  margin-top: 12rpx;
}

/* ===== Info Card ===== */
.info-card {
  padding: 28rpx;
}
.info-top {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}
.info-texts {
  flex: 1;
}
.info-project {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #0f172a;
}
.info-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 25rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.info-actions {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}
.more-btn {
  font-size: 36rpx;
  color: var(--td-text-color-secondary, #64748B);
  line-height: 1;
  padding: 4rpx;
}
.info-detail {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.info-stats {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f0f2f5;
}
.info-stat {
  font-size: 23rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.info-stat-divider {
  font-size: 23rpx;
  color: #d7dce3;
}

/* ===== Section Header ===== */
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24rpx 0 16rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.section-subtitle {
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
}

/* ===== Filter Tabs ===== */
.filter-tabs {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.filter-tab {
  font-size: 24rpx;
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-weight: 500;
  background: #E8EAF0;
  color: var(--td-text-color-secondary, #64748B);
}
.filter-tab.active {
  background: var(--td-brand-color, #3B5E6B);
  color: #ffffff;
}

/* ===== Empty State ===== */
.empty-wrap {
  padding: 36rpx 28rpx;
}
.empty-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}
.empty-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
}

/* ===== Record List ===== */
.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* ===== Record Card ===== */
.record-card {
  padding: 24rpx;
  border-left: 6rpx solid transparent;
}
.record-card:active {
  opacity: 0.8;
}

/* Severity color bars */
.severity-critical {
  border-left-color: var(--td-error-color, #7A4B4B);
}
.severity-moderate {
  border-left-color: var(--td-warning-color, #7A6B4B);
}
.severity-minor {
  border-left-color: #94a3b8;
}

/* Draft overrides with dashed gray */
.record-card.status-draft {
  border-left: 6rpx dashed #94a3b8;
}

.record-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.record-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
  flex: 1;
}
.record-time {
  font-size: 22rpx;
  color: #94a3b8;
  white-space: nowrap;
  margin-top: 4rpx;
}
.record-summary {
  display: block;
  font-size: 26rpx;
  color: #0f172a;
  line-height: 1.6;
}
</style>
