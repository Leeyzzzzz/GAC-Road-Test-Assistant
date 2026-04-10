<template>
  <view class="page">
    <view class="header">
      <text class="title">路测助手</text>
      <text class="subtitle">智驾场地试验管理系统</text>
    </view>

    <view class="session-list">
      <view v-if="sessions.length === 0" class="empty">
        <text class="empty-text">暂无试验记录</text>
        <text class="empty-hint">点击下方按钮创建新试验</text>
      </view>

      <view
        v-for="session in sessions"
        :key="session.id"
        class="session-card"
        @click="goToDetail(session.id)"
      >
        <view class="card-header">
          <text class="card-project">{{ getProjectName(session.project_id) }}</text>
          <view :class="['card-status', session.status === 'active' ? 'status-active' : 'status-completed']">
            <text class="status-text">{{ session.status === 'active' ? '进行中' : '已结束' }}</text>
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

    <view class="fab" @click="goToNewSession">
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
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.header {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  padding: 60rpx 40rpx 40rpx;
  color: #fff;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
  display: block;
}

.session-list {
  padding: 20rpx;
}

.empty {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  display: block;
}

.empty-hint {
  font-size: 26rpx;
  color: #bbb;
  margin-top: 16rpx;
  display: block;
}

.session-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.card-project {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.card-status {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.status-active {
  background-color: #e6f7ff;
}

.status-completed {
  background-color: #f6ffed;
}

.status-text {
  font-size: 22rpx;
}

.status-active .status-text {
  color: #1890ff;
}

.status-completed .status-text {
  color: #52c41a;
}

.card-info {
  margin-top: 8rpx;
}

.card-info-text {
  font-size: 26rpx;
  color: #666;
  display: block;
  line-height: 1.6;
}

.fab {
  position: fixed;
  bottom: 140rpx;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border-radius: 48rpx;
  padding: 24rpx 60rpx;
  box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.4);
}

.fab-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}
</style>
