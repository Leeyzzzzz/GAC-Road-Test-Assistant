<template>
  <view class="page">
    <!-- New Session Form -->
    <view v-if="isNew" class="form-section">
      <text class="section-title">新建试验</text>

      <view class="form-group">
        <text class="label">项目名称 *</text>
        <input class="input" v-model="form.projectName" placeholder="请输入项目名称" />
      </view>

      <view class="form-group">
        <text class="label">技术负责人</text>
        <input class="input" v-model="form.techLead" placeholder="请输入技术负责人" />
      </view>

      <view class="form-group">
        <text class="label">测试人员 *</text>
        <input class="input" v-model="form.tester" placeholder="请输入测试人员" />
      </view>

      <view class="form-group">
        <text class="label">测试日期</text>
        <picker mode="date" :value="form.testDate" @change="onDateChange">
          <view class="picker">{{ form.testDate }}</view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">车辆信息</text>
        <input class="input" v-model="form.vehicleInfo" placeholder="如：沪A12345" />
      </view>

      <view class="form-group">
        <text class="label">测试路线</text>
        <input class="input" v-model="form.route" placeholder="如：高速环线" />
      </view>

      <button class="btn-primary" @click="createNewSession" :disabled="submitting">
        {{ submitting ? '创建中...' : '创建试验' }}
      </button>
    </view>

    <!-- Session Detail -->
    <view v-else>
      <!-- Session Info Card -->
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">测试人员</text>
          <text class="info-value">{{ session.tester }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">测试日期</text>
          <text class="info-value">{{ session.test_date }}</text>
        </view>
        <view v-if="session.vehicle_info" class="info-row">
          <text class="info-label">车辆信息</text>
          <text class="info-value">{{ session.vehicle_info }}</text>
        </view>
        <view v-if="session.route" class="info-row">
          <text class="info-label">测试路线</text>
          <text class="info-value">{{ session.route }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">状态</text>
          <text :class="['info-value', session.status === 'active' ? 'text-blue' : 'text-green']">
            {{ session.status === 'active' ? '进行中' : '已结束' }}
          </text>
        </view>
      </view>

      <!-- Records List -->
      <view class="records-section">
        <text class="section-title">记录列表 ({{ records.length }})</text>

        <view v-if="records.length === 0" class="empty">
          <text class="empty-text">暂无记录，点击下方按钮开始录音</text>
        </view>

        <view
          v-for="record in records"
          :key="record.id"
          class="record-card"
          @click="goToRecord(record.id)"
        >
          <view class="record-header">
            <view :class="['record-status', record.status === 'draft' ? 'draft' : 'submitted']">
              <text class="record-status-text">{{ record.status === 'draft' ? '草稿' : '已提交' }}</text>
            </view>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
          </view>
          <text class="record-summary">{{ record.summary || record.raw_text || '未处理' }}</text>
          <view v-if="record.problem_type" class="record-tags">
            <view class="tag"><text class="tag-text">{{ record.problem_type }}</text></view>
            <view v-if="record.severity" class="tag severity"><text class="tag-text">{{ record.severity }}</text></view>
          </view>
        </view>
      </view>

      <!-- End Session Button -->
      <view v-if="session.status === 'active'" class="end-session">
        <button class="btn-end" @click="endSession">结束试验</button>
      </view>
    </view>

    <!-- Floating Record Button -->
    <view v-if="!isNew && session.status === 'active'" class="fab-record" @click="goToNewRecord">
      <text class="fab-record-icon">🎙</text>
      <text class="fab-record-text">录音</text>
    </view>
  </view>
</template>

<script>
import { getSession, createSession, updateSession, getRecords, createProject, getProjects } from '../../services/api';

export default {
  data() {
    return {
      isNew: false,
      sessionId: null,
      session: {},
      records: [],
      submitting: false,
      form: {
        projectName: '',
        techLead: '',
        tester: '',
        testDate: new Date().toISOString().split('T')[0],
        vehicleInfo: '',
        route: '',
      },
    };
  },
  onLoad(options) {
    if (options.new === '1') {
      this.isNew = true;
    } else if (options.id) {
      this.sessionId = Number(options.id);
      this.loadSession();
    }
  },
  onShow() {
    if (this.sessionId) {
      this.loadRecords();
    }
  },
  methods: {
    async loadSession() {
      try {
        this.session = await getSession(this.sessionId);
      } catch (err) {
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },
    async loadRecords() {
      try {
        this.records = await getRecords(this.sessionId);
      } catch (err) {
        uni.showToast({ title: '加载记录失败', icon: 'none' });
      }
    },
    onDateChange(e) {
      this.form.testDate = e.detail.value;
    },
    async createNewSession() {
      const f = this.form;
      if (!f.projectName || !f.tester) {
        uni.showToast({ title: '请填写必填项', icon: 'none' });
        return;
      }
      this.submitting = true;
      try {
        const projects = await getProjects();
        let project = projects.find(p => p.name === f.projectName);
        if (!project) {
          project = await createProject({ name: f.projectName, tech_lead: f.techLead });
        }
        const sess = await createSession({
          project_id: project.id,
          tester: f.tester,
          test_date: f.testDate,
          vehicle_info: f.vehicleInfo,
          route: f.route,
        });
        this.sessionId = sess.id;
        this.isNew = false;
        this.session = sess;
        uni.showToast({ title: '创建成功', icon: 'success' });
      } catch (err) {
        uni.showToast({ title: err.message || '创建失败', icon: 'none' });
      } finally {
        this.submitting = false;
      }
    },
    endSession() {
      uni.showModal({
        title: '确认结束试验？',
        content: '结束后将无法继续录音',
        success: async (res) => {
          if (res.confirm) {
            try {
              this.session = await updateSession(this.sessionId, { status: 'completed' });
              uni.showToast({ title: '试验已结束', icon: 'success' });
            } catch (err) {
              uni.showToast({ title: '操作失败', icon: 'none' });
            }
          }
        },
      });
    },
    goToRecord(recordId) {
      uni.navigateTo({ url: '/pages/record/index?id=' + recordId + '&session_id=' + this.sessionId });
    },
    goToNewRecord() {
      uni.navigateTo({ url: '/pages/record/index?session_id=' + this.sessionId });
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
  background-color: #f5f5f5;
  padding-bottom: 200rpx;
}

.form-section, .records-section {
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.form-group {
  margin-bottom: 24rpx;
}

.label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.input {
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.picker {
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.btn-primary {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  margin-top: 40rpx;
}

.btn-primary[disabled] {
  opacity: 0.6;
}

.info-card {
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #999;
  font-size: 28rpx;
}

.info-value {
  color: #333;
  font-size: 28rpx;
  font-weight: 500;
}

.text-blue { color: #1890ff; }
.text-green { color: #52c41a; }

.empty {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-status {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.record-status.draft {
  background: #fff7e6;
}

.record-status.submitted {
  background: #e6f7ff;
}

.record-status-text {
  font-size: 22rpx;
}

.record-status.draft .record-status-text {
  color: #fa8c16;
}

.record-status.submitted .record-status-text {
  color: #1890ff;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-summary {
  font-size: 28rpx;
  color: #333;
  display: block;
  line-height: 1.5;
}

.record-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}

.tag {
  background: #f0f0f0;
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
}

.tag.severity {
  background: #fff1f0;
}

.tag-text {
  font-size: 22rpx;
  color: #666;
}

.tag.severity .tag-text {
  color: #f5222d;
}

.end-session {
  padding: 20rpx;
}

.btn-end {
  background: #fff;
  color: #ff4d4f;
  border: 1rpx solid #ff4d4f;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.fab-record {
  position: fixed;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-radius: 50%;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.5);
}

.fab-record-icon {
  font-size: 36rpx;
}

.fab-record-text {
  font-size: 20rpx;
  color: #fff;
  margin-top: 2rpx;
}
</style>
