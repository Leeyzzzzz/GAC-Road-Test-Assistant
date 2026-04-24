<template>
  <view :style="themeVars" class="page">
    <!-- Hero: compact title + archive link -->
    <view class="hero">
      <view class="hero-row">
        <text class="page-title">我的项目</text>
        <text class="archive-link" @click="goToArchived">归档项目 ›</text>
      </view>
      <view class="stats-badges">
        <text class="badge badge-primary">{{ projects.length }} 进行中</text>
        <text class="badge badge-muted">{{ activeSessionCount }} 试验中</text>
        <text v-if="currentWeekProjects > 0" class="badge badge-success">+{{ currentWeekProjects }} 本周</text>
      </view>
    </view>

    <!-- Search bar (UI only) -->
    <view class="search-bar">🔍 搜索项目名称或编号…</view>

    <!-- Empty State -->
    <view v-if="projects.length === 0" class="card empty-wrap">
      <text class="empty-title">还没有项目</text>
      <text class="empty-desc">先创建一个项目，再在项目内管理试验与记录</text>
      <t-button theme="primary" block @click="goToCreateProject">创建项目</t-button>
    </view>

    <!-- Project List -->
    <view v-else class="project-list">
      <view
        v-for="project in enrichedProjects"
        :key="project.id"
        class="card project-card"
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
      return '--td-brand-color: #1E293B; --td-brand-color-light: #E8EAF0; --td-error-color: #DC2626; --td-success-color: #059669; --td-warning-color: #D97706; --td-bg-color-page: #F3F5F7; --td-bg-color-container: #FFFFFF; --td-text-color-primary: #0F172A; --td-text-color-secondary: #64748B;';
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

/* ===== Hero ===== */
.hero {
  margin-bottom: 20rpx;
}
.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}
.archive-link {
  font-size: 26rpx;
  color: var(--td-brand-color, #1E293B);
  font-weight: 500;
}

/* ===== Stats Badges ===== */
.stats-badges {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-top: 14rpx;
}
.badge {
  font-size: 24rpx;
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-weight: 500;
}
.badge-primary {
  background: var(--td-brand-color, #1E293B);
  color: #ffffff;
}
.badge-success {
  background: var(--td-success-color, #059669);
  color: #ffffff;
}
.badge-muted {
  background: #e8eaed;
  color: var(--td-text-color-secondary, #64748B);
}

/* ===== Search Bar ===== */
.search-bar {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: #94a3b8;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
  margin-bottom: 20rpx;
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
  border-left: 6rpx solid var(--td-success-color, #059669);
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
</style>
