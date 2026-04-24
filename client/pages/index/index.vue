<template>
  <view class="page">
    <view class="hero">
      <text class="page-title">我的项目</text>
      <text class="page-subtitle">按项目管理路试试验，进入项目后查看和创建试验</text>
    </view>

    <view class="toolbar">
      <t-button theme="default" variant="outline" size="small" @click="goToArchived">
        归档项目
      </t-button>
    </view>

    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-value">{{ projects.length }}</text>
        <text class="stat-label">进行中项目</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ activeSessionCount }}</text>
        <text class="stat-label">进行中试验</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ currentWeekProjects }}</text>
        <text class="stat-label">本周新增项目</text>
      </view>
    </view>

    <view v-if="projects.length === 0" class="empty-wrap">
      <text class="empty-title">还没有项目</text>
      <text class="empty-desc">先创建一个项目，再在项目内管理试验与记录</text>
      <t-button theme="primary" block @click="goToCreateProject">创建项目</t-button>
    </view>

    <view v-else class="project-list">
      <view
        v-for="project in enrichedProjects"
        :key="project.id"
        class="project-card"
      >
        <view class="project-card-main" @click="goToProject(project.id)">
          <view class="project-card-head">
            <text class="project-name">{{ project.name }}</text>
            <t-tag theme="primary" variant="light" size="small">{{ project.code }}</t-tag>
          </view>
          <text class="project-meta">技术负责人：{{ project.tech_lead || '未填写' }}</text>
          <view class="project-stats">
            <t-tag size="small" variant="light" theme="default">试验 {{ project.sessionCount }}</t-tag>
            <t-tag size="small" variant="light" :theme="project.activeSessions > 0 ? 'success' : 'default'">
              进行中 {{ project.activeSessions }}
            </t-tag>
          </view>
          <text class="project-meta">最近试验：{{ project.lastSessionDate || '暂无试验' }}</text>
        </view>

        <view class="project-actions">
          <t-button size="small" variant="outline" @click="goToEditProject(project.id)">编辑</t-button>
          <t-button size="small" variant="outline" @click="handleArchiveProject(project)">归档</t-button>
          <t-button size="small" theme="danger" variant="outline" @click="handleDeleteProject(project)">删除</t-button>
        </view>
      </view>
    </view>

    <t-fab icon="add" text="创建项目" @click="goToCreateProject" />
  </view>
</template>

<script>
import { archiveProject, deleteProject, getProjects, getSessions } from '../../services/api';

function isSameWeek(dateText) {
  if (!dateText) return false;
  // 兼容 iOS：将 "2026-04-10 23:15:19" 转为 "2026/04/10 23:15:19"
  const source = new Date(dateText.replace(/-/g, '/'));
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return source >= start && source < end;
}

export default {
  data() {
    return {
      projects: [],
      sessions: [],
    };
  },
  computed: {
    enrichedProjects() {
      return this.projects.map((project) => {
        const projectSessions = this.sessions.filter(session => session.project_id === project.id);
        const sortedSessions = projectSessions.slice().sort((a, b) => {
          return a.test_date < b.test_date ? 1 : -1;
        });
        return {
          ...project,
          sessionCount: projectSessions.length,
          activeSessions: projectSessions.filter(session => session.status === 'active').length,
          lastSessionDate: sortedSessions.length > 0 ? sortedSessions[0].test_date : '',
        };
      });
    },
    activeSessionCount() {
      return this.sessions.filter(session => session.status === 'active').length;
    },
    currentWeekProjects() {
      return this.projects.filter(project => isSameWeek(project.created_at)).length;
    },
  },
  onShow() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const results = await Promise.all([getProjects(), getSessions()]);
        this.projects = results[0];
        this.sessions = results[1];
      } catch (err) {
        uni.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    },
    goToCreateProject() {
      uni.navigateTo({ url: '/pages/project-detail/index?new=1' });
    },
    goToEditProject(projectId) {
      uni.navigateTo({ url: `/pages/project-detail/index?id=${projectId}&edit=1` });
    },
    goToProject(projectId) {
      uni.navigateTo({ url: `/pages/project-detail/index?id=${projectId}` });
    },
    goToArchived() {
      uni.navigateTo({ url: '/pages/project-archive/index' });
    },
    handleArchiveProject(project) {
      uni.showModal({
        title: '归档项目',
        content: `归档后，“${project.name}” 会从首页移到归档项目页。`,
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await archiveProject(project.id);
            uni.showToast({ title: '已归档', icon: 'success' });
            this.loadData();
          } catch (err) {
            uni.showToast({ title: err.message || '归档失败', icon: 'none' });
          }
        },
      });
    },
    handleDeleteProject(project) {
      uni.showModal({
        title: '删除项目',
        content: `删除后，“${project.name}” 下的全部试验和记录将被永久移除，且不可恢复。`,
        confirmColor: '#d54941',
        success: async (res) => {
          if (!res.confirm) return;
          uni.showModal({
            title: '再次确认删除',
            content: '这是不可恢复操作。确认后会立即删除项目、试验和记录。',
            confirmColor: '#d54941',
            success: async (finalRes) => {
              if (!finalRes.confirm) return;
              try {
                await deleteProject(project.id);
                uni.showToast({ title: '项目已删除', icon: 'success' });
                this.loadData();
              } catch (err) {
                uni.showToast({ title: err.message || '删除失败', icon: 'none' });
              }
            },
          });
        },
      });
    },
  },
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f3f5f7;
  padding: 0 24rpx 160rpx;
}

.hero {
  padding: 48rpx 0 24rpx;
}

.page-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #5f6b7a;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx 20rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}

.stat-value {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #64748b;
}

.empty-wrap {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 28rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}

.empty-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #111827;
}

.empty-desc {
  display: block;
  margin: 16rpx 0 32rpx;
  font-size: 26rpx;
  color: #64748b;
  line-height: 1.6;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.project-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}

.project-card-main {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.project-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.project-name {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.5;
}

.project-meta {
  font-size: 25rpx;
  color: #5f6b7a;
}

.project-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.project-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}

.project-actions :deep(.t-button) {
  flex: 1;
}
</style>
