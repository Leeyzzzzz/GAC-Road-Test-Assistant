<template>
  <view :style="themeVars" class="page">
    <!-- Hero: dark gradient card with prominent title -->
    <view class="hero-card">
      <view class="hero-bg"></view>
      <view class="hero-content">
        <view class="hero-top">
          <text class="hero-title">我的项目</text>
          <text class="hero-archive-link" @click="goToArchived">归档项目 ›</text>
        </view>
        <view class="hero-count-row">
          <text class="hero-count-num">{{ projects.length }}</text>
          <text class="hero-count-label">个项目</text>
        </view>
        <view class="hero-stats-row">
          <text class="hero-stat">{{ projects.length }} 进行中</text>
          <text class="hero-stat-divider">|</text>
          <text class="hero-stat">{{ activeSessionCount }} 试验中</text>
          <text v-if="currentWeekProjects > 0" class="hero-stat-divider">|</text>
          <text v-if="currentWeekProjects > 0" class="hero-stat hero-stat-highlight">+{{ currentWeekProjects }} 本周</text>
        </view>
      </view>
    </view>

    <!-- Search bar (UI only) -->
    <view class="search-bar">
      <text class="search-placeholder">搜索项目名称或编号…</text>
    </view>

    <!-- Empty State -->
    <view v-if="projects.length === 0" class="card empty-wrap">
      <text class="empty-title">还没有项目</text>
      <text class="empty-desc">先创建一个项目，再在项目内管理试验与记录</text>
      <t-button theme="primary" block @click="goToCreateProject">创建项目</t-button>
    </view>

    <!-- Project List -->
    <view v-else class="project-list">
      <view
        v-for="(project, index) in enrichedProjects"
        :key="project.id"
        :class="['card', 'project-card', 'anim-card-' + (index % 3)]"
      >
        <view class="project-card-main" @click="goToProject(project.id)">
          <view class="project-row1">
            <text class="project-name">{{ project.name }}</text>
            <t-tag theme="primary" variant="light" size="small">{{ project.code }}</t-tag>
          </view>
          <text class="project-meta">{{ project.tech_lead || '未填写' }} · {{ project.sessionCount }}试验 · {{ project.activeSessions }}进行中 · 最近：{{ project.lastSessionDate || '暂无' }}</text>
        </view>

        <view class="project-actions">
          <t-button size="small" theme="primary" @click="goToProject(project.id)">查看项目</t-button>
          <t-button size="small" variant="outline" @click="handleMoreAction(project)">⋮ 更多</t-button>
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
    themeVars() {
      return '--td-brand-color: #3B5E6B; --td-brand-color-light: #DEE6EA; --td-brand-color-dark: #1E293B; --td-error-color: #7A4B4B; --td-success-color: #4A6B5E; --td-warning-color: #7A6B4B; --td-bg-color-page: #F3F5F7; --td-bg-color-container: #FFFFFF; --td-text-color-primary: #0F172A; --td-text-color-secondary: #64748B;';
    },
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
    goToProject(projectId) {
      uni.navigateTo({ url: `/pages/project-detail/index?id=${projectId}` });
    },
    goToArchived() {
      uni.navigateTo({ url: '/pages/project-archive/index' });
    },
    handleMoreAction(project) {
      uni.showActionSheet({
        itemList: ['编辑项目', '归档项目', '删除项目'],
        success: (res) => {
          if (res.tapIndex === 0) {
            uni.navigateTo({ url: `/pages/project-detail/index?id=${project.id}&edit=1` });
          } else if (res.tapIndex === 1) {
            this.handleArchiveProject(project);
          } else if (res.tapIndex === 2) {
            this.handleDeleteProject(project);
          }
        },
      });
    },
    handleArchiveProject(project) {
      uni.showModal({
        title: '归档项目',
        content: `归档后，"${project.name}" 会从首页移到归档项目页。`,
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
        content: `删除后，"${project.name}" 下的全部试验和记录将被永久移除，且不可恢复。`,
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
/* ===== Page Layout ===== */
.page {
  min-height: 100vh;
  background: #f3f5f7;
  padding: 24rpx 24rpx 160rpx;
}

/* ===== Hero Card ===== */
.hero-card {
  position: relative;
  border-radius: 28rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  animation: fadeUp 0.4s ease-out;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(135deg, #1E293B 0%, #2A4A5A 50%, #3B5E6B 100%);
  z-index: 0;
}
.hero-bg::after {
  content: '';
  position: absolute;
  top: -40%;
  right: -15%;
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
  pointer-events: none;
}
.hero-content {
  position: relative;
  z-index: 1;
  padding: 36rpx 32rpx;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hero-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2rpx;
}
.hero-archive-link {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}
.hero-count-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 24rpx;
}
.hero-count-num {
  font-size: 72rpx;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -1rpx;
  line-height: 1;
}
.hero-count-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.65);
}
.hero-stats-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.1);
}
.hero-stat {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}
.hero-stat-divider {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.2);
}
.hero-stat-highlight {
  color: #ffffff;
  font-weight: 600;
}

/* ===== Search Bar ===== */
.search-bar {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
}
.search-placeholder {
  font-size: 26rpx;
  color: #94a3b8;
}

/* ===== Shared Card ===== */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
  padding: 28rpx;
}

/* ===== Empty State ===== */
.empty-wrap {
  padding: 48rpx 28rpx;
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
  color: var(--td-text-color-secondary, #64748B);
  line-height: 1.6;
}

/* ===== Project List ===== */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* ===== Project Card ===== */
.project-card {
  border-left: 6rpx solid var(--td-success-color, #4A6B5E);
  transition: box-shadow 0.2s, transform 0.2s;
  animation: fadeUp 0.4s ease-out both;
}
.anim-card-0 { animation-delay: 0.05s; }
.anim-card-1 { animation-delay: 0.1s; }
.anim-card-2 { animation-delay: 0.15s; }
.project-card:active {
  transform: scale(0.99);
}
.project-card-main {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.project-row1 {
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
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.project-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}
.project-actions :deep(.t-button) {
  flex: 1;
}

/* ===== Entrance Animation ===== */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
