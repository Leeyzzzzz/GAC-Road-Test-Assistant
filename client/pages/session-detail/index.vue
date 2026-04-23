<template>
  <view class="page">
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

    <view v-else>
      <view class="info-card">
        <view class="info-head">
          <view>
            <text class="project-title">{{ projectName || `项目 ${session.project_id}` }}</text>
            <text class="project-subtitle">{{ projectCode || '试验详情' }}</text>
          </view>
          <t-tag :theme="session.status === 'active' ? 'success' : 'default'" variant="light">
            {{ session.status === 'active' ? '进行中' : '已结束' }}
          </t-tag>
        </view>

        <view class="info-grid">
          <view class="info-row">
            <text class="info-label">测试人员</text>
            <text class="info-value">{{ session.tester }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">测试日期</text>
            <text class="info-value">{{ session.test_date }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">车辆信息</text>
            <text class="info-value">{{ session.vehicle_info || '未填写' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">测试路线</text>
            <text class="info-value">{{ session.route || '未填写' }}</text>
          </view>
        </view>

        <view class="detail-actions">
          <t-button size="small" variant="outline" @click="goToEditSession">编辑试验</t-button>
          <t-button
            v-if="session.status === 'active'"
            size="small"
            theme="danger"
            variant="outline"
            @click="endSession"
          >
            结束试验
          </t-button>
        </view>
      </view>

      <view class="records-section">
        <view class="section-head">
          <text class="section-title">记录列表</text>
          <text class="section-subtitle">{{ records.length }} 条记录</text>
        </view>

        <view v-if="records.length === 0" class="empty-wrap">
          <text class="empty-title">暂无记录</text>
          <text class="empty-desc">点击下方按钮开始录音并创建记录。</text>
        </view>

        <view
          v-for="record in records"
          :key="record.id"
          class="record-card"
          @click="goToRecord(record.id)"
        >
          <view class="record-head">
            <t-tag size="small" variant="light" :theme="record.status === 'draft' ? 'warning' : 'success'">
              {{ record.status === 'draft' ? '草稿' : '已提交' }}
            </t-tag>
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
      form: {
        tester: '',
        testDate: new Date().toISOString().split('T')[0],
        vehicleInfo: '',
        route: '',
      },
    };
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
.page {
  min-height: 100vh;
  background: #f3f5f7;
  padding: 24rpx 24rpx 160rpx;
}

.form-wrap,
.info-card,
.empty-wrap,
.record-card,
.context-card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}

.form-wrap {
  padding: 32rpx 28rpx;
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
}

.context-label {
  display: block;
  font-size: 24rpx;
  color: #64748b;
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

.info-card {
  padding: 28rpx;
}

.info-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.project-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}

.project-subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #64748b;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.info-label {
  font-size: 25rpx;
  color: #64748b;
}

.info-value {
  flex: 1;
  text-align: right;
  font-size: 25rpx;
  color: #0f172a;
}

.detail-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}

.detail-actions :deep(.t-button) {
  flex: 1;
}

.records-section {
  margin-top: 28rpx;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.section-subtitle {
  font-size: 24rpx;
  color: #64748b;
}

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
  color: #64748b;
}

.record-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.record-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.record-time {
  font-size: 23rpx;
  color: #94a3b8;
}

.record-summary {
  font-size: 27rpx;
  color: #0f172a;
  line-height: 1.6;
}
</style>
