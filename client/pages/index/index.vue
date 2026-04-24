<template>
  <view class="page">
    <view class="header">
      <view class="header-content soft-card">
        <text class="title">路测助手</text>
        <text class="subtitle">智驾场地试验管理系统</text>
      </view>
    </view>

    <view class="session-list">
      <view v-if="sessions.length === 0" class="empty soft-card">
        <text class="empty-text">暂无试验记录</text>
        <text class="empty-hint">点击下方按钮创建新试验</text>
      </view>

      <view
        v-for="session in sessions"
        :key="session.id"
        class="session-card soft-card"
        @click="goToDetail(session.id)"
      >
        <view class="card-header">
          <text class="card-project">{{ getProjectName(session.project_id) }}</text>
          <view :class="['pill', session.status === 'active' ? 'bg-dopamine-pink-light text-dopamine-pink' : 'bg-dopamine-mint-light text-dopamine-mint']">
            <text>{{ session.status === 'active' ? '进行中' : '已结束' }}</text>
          </view>
        </view>
        <view class="card-info">
          <text class="card-info-text">测试人员：{{ session.tester }}</text>
          <text class="card-info-text">日期：{{ session.test_date }}</text>
        </view>
        <view v-if="session.route" class="card-info">
          <text class="card-info-text">路线：{{ session.route }}</text>
        </view>
        <view v-if="session.vehicle_info" class="card-info">
          <text class="card-info-text">车辆：{{ session.vehicle_info }}</text>
        </view>
      </view>
    </view>

    <view class="fab bg-gradient-primary shadow-floaty" @click="goToNewSession">
      <text class="fab-text">+ 新建试验</text>
    </view>
  </view>
</template>

<script>
import { getSessions, getProjects } from '../../services/api';

export default {
  data() {
    return {
      sessions: [],
      projects: [],
    };
  },
  onShow() {
    this.loadData();
  },
  methods: {
    getProjectName(projectId) {
      var p = this.projects.find(function(p) { return p.id === projectId; });
      return p ? p.name : '未知项目';
    },
    async loadData() {
      try {
        var results = await Promise.all([getSessions(), getProjects()]);
        this.sessions = results[0];
        this.projects = results[1];
      } catch (err) {
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },
    goToDetail(sessionId) {
      uni.navigateTo({ url: '/pages/session-detail/index?id=' + sessionId });
    },
    goToNewSession() {
      uni.navigateTo({ url: '/pages/session-detail/index?new=1' });
    },
  },
};
</script>

<style scoped>
.page {
  padding-bottom: 140rpx;
}

.header {
  padding: 40rpx 30rpx 20rpx;
}

.header-content {
  padding: 40rpx 30rpx;
  background: rgba(255, 255, 255, 0.85); /* Slightly more transparent for header */
}

.title {
  font-size: 52rpx;
  font-weight: 900;
  background: linear-gradient(135deg, var(--dopamine-orange), var(--dopamine-pink));
  -webkit-background-clip: text;
  color: transparent;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: var(--calm-mute);
  margin-top: 12rpx;
  display: block;
  font-weight: 500;
}

.session-list {
  padding: 0 30rpx;
}

.empty {
  text-align: center;
  padding: 100rpx 40rpx;
  margin-top: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: var(--calm-ink);
  font-weight: bold;
  display: block;
}

.empty-hint {
  font-size: 26rpx;
  color: var(--calm-mute);
  margin-top: 16rpx;
  display: block;
}

.session-card {
  padding: 32rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s ease;
}

.session-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-project {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--calm-ink);
}

.card-info {
  margin-top: 8rpx;
}

.card-info-text {
  font-size: 26rpx;
  color: var(--calm-mute);
  display: block;
  line-height: 1.6;
}

.fab {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 999px;
  padding: 24rpx 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.fab:active {
  transform: translateX(-50%) scale(0.95);
}

.fab-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}
</style>
