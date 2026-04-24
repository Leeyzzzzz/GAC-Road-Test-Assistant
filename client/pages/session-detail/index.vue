<template>
  <view class="page">
    <!-- New Session Form -->
    <view v-if="isNew" class="form-section soft-card" style="margin: 30rpx;">
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

      <button class="btn-primary bg-gradient-primary shadow-floaty" @click="createNewSession" :disabled="submitting">
        {{ submitting ? '创建中...' : '创建试验' }}
      </button>
    </view>

    <!-- Session Detail -->
    <view v-else>
      <!-- Session Info Card -->
      <view class="info-card soft-card">
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
          <view :class="['pill', session.status === 'active' ? 'bg-dopamine-pink-light text-dopamine-pink' : 'bg-dopamine-mint-light text-dopamine-mint']">
            <text>{{ session.status === 'active' ? '进行中' : '已结束' }}</text>
          </view>
        </view>
      </view>

      <!-- Records List -->
      <view class="records-section">
        <text class="section-title" style="margin-left: 10rpx;">记录列表 ({{ records.length }})</text>

        <view v-if="records.length === 0" class="empty soft-card">
          <text class="empty-text">暂无记录，点击下方按钮开始录音</text>
        </view>

        <view
          v-for="record in records"
          :key="record.id"
          class="record-card soft-card"
          @click="goToRecord(record.id)"
        >
          <view class="record-header">
            <view :class="['pill', record.status === 'draft' ? 'bg-dopamine-orange-light text-dopamine-orange' : 'bg-dopamine-sky-light text-dopamine-sky']">
              <text>{{ record.status === 'draft' ? '草稿' : '已提交' }}</text>
            </view>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
          </view>
          <text class="record-summary">{{ record.summary || record.raw_text || '未处理' }}</text>
          <view v-if="record.problem_type" class="record-tags">
            <view class="pill" style="background: rgba(155,93,229,0.1); color: var(--dopamine-purple); font-size: 20rpx; padding: 4rpx 14rpx;">
              <text>{{ record.problem_type }}</text>
            </view>
            <view v-if="record.severity" class="pill bg-dopamine-pink-light text-dopamine-pink" style="font-size: 20rpx; padding: 4rpx 14rpx;">
              <text>{{ record.severity }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- End Session Button -->
      <view v-if="session.status === 'active'" class="end-session">
        <button class="btn-end" @click="endSession">结束试验</button>
      </view>
    </view>

    <!-- Floating Record Button -->
    <view v-if="!isNew && session.status === 'active'" class="fab-record shadow-floaty" @click="goToNewRecord">
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
  padding-bottom: 200rpx;
}

.form-section {
  padding: 40rpx 30rpx;
}
.records-section {
  padding: 0 30rpx 40rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--calm-ink);
  margin-bottom: 30rpx;
  display: block;
}

.form-group {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--calm-ink);
  margin-bottom: 12rpx;
  display: block;
}

.input, .picker {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--calm-line);
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: var(--calm-ink);
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--dopamine-sky);
  background: #fff;
}

.btn-primary {
  color: #fff;
  border: none;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 800;
  margin-top: 40rpx;
  padding: 10rpx 0;
}

.btn-primary[disabled] {
  opacity: 0.6;
}

.info-card {
  margin: 30rpx;
  padding: 30rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1px dashed var(--calm-line);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--calm-mute);
  font-size: 28rpx;
  font-weight: 500;
}

.info-value {
  color: var(--calm-ink);
  font-size: 28rpx;
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 80rpx 40rpx;
  margin-top: 20rpx;
}

.empty-text {
  color: var(--calm-mute);
  font-size: 28rpx;
  font-weight: 500;
}

.record-card {
  padding: 30rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s ease;
}
.record-card:active {
  transform: scale(0.98);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.record-time {
  font-size: 24rpx;
  color: var(--calm-mute);
}

.record-summary {
  font-size: 28rpx;
  color: var(--calm-ink);
  display: block;
  line-height: 1.6;
}

.record-tags {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.end-session {
  padding: 0 30rpx 30rpx;
}

.btn-end {
  background: rgba(255, 255, 255, 0.8);
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.fab-record {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--dopamine-orange), var(--dopamine-pink));
  border-radius: 50%;
  width: 140rpx;
  height: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.fab-record:active {
  transform: translateX(-50%) scale(0.95);
}

.fab-record-icon {
  font-size: 44rpx;
}

.fab-record-text {
  font-size: 24rpx;
  font-weight: bold;
  color: #fff;
  margin-top: 4rpx;
}
</style>
