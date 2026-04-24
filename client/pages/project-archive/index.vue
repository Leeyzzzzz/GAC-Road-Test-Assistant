<template>
  <view :style="themeVars" class="page">
    <!-- Hero -->
    <view class="hero">
      <view class="hero-row">
        <text class="page-title">归档项目</text>
        <text class="select-link" @click="toggleSelectMode">{{ selectMode ? '完成' : '选择模式 ›' }}</text>
      </view>
      <text class="page-subtitle">历史项目统一收纳在这里，默认不打扰首页主流程。</text>
    </view>

    <!-- Filter tabs -->
    <view class="filter-tabs">
      <text
        v-for="tab in filterTabs"
        :key="tab.key"
        :class="['filter-tab', activeFilter === tab.key ? 'active' : '']"
        @click="activeFilter = tab.key"
      >{{ tab.label }}</text>
    </view>

    <!-- Empty State -->
    <view v-if="filteredProjects.length === 0" class="card empty-wrap">
      <text class="empty-title">暂无归档项目</text>
      <text class="empty-desc">当你归档项目后，会在这里查看和恢复。</text>
    </view>

    <!-- Project List -->
    <view v-else class="project-list">
      <view v-for="project in filteredProjects" :key="project.id" class="card project-card">
        <view class="project-row">
          <view class="project-info">
            <view class="project-head">
              <text class="project-name">{{ project.name }}</text>
              <t-tag theme="default" variant="light" size="small">{{ project.code }}</t-tag>
            </view>
            <text class="project-meta">{{ project.tech_lead || '未填写' }} · 归档于 {{ formatArchiveDate(project.archived_at) }}</text>
          </view>
          <view class="project-actions">
            <t-button size="small" theme="primary" @click="handleRestore(project)">恢复</t-button>
            <t-button size="small" variant="outline" theme="danger" @click="handleDelete(project)">删除</t-button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { deleteProject, getArchivedProjects, restoreProject } from '../../services/api';

export default {
  data() {
    return {
      projects: [],
      selectMode: false,
      activeFilter: 'all',
      filterTabs: [
        { key: 'all', label: '全部' },
        { key: 'recent', label: '近期归档' },
        { key: 'older', label: '更早' },
      ],
    };
  },
  computed: {
    themeVars() {
      return '--td-brand-color: #3B5E6B; --td-brand-color-light: #DEE6EA; --td-brand-color-dark: #1E293B; --td-error-color: #7A4B4B; --td-success-color: #4A6B5E; --td-warning-color: #7A6B4B; --td-bg-color-page: #F3F5F7; --td-bg-color-container: #FFFFFF; --td-text-color-primary: #0F172A; --td-text-color-secondary: #64748B;';
    },
    filteredProjects() {
      if (this.activeFilter === 'all') return this.projects;
      if (this.activeFilter === 'recent') {
        return this.projects.filter(p => {
          if (!p.archived_at) return false;
          const d = new Date(p.archived_at.replace(/-/g, '/'));
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return d >= monthAgo;
        });
      }
      if (this.activeFilter === 'older') {
        return this.projects.filter(p => {
          if (!p.archived_at) return true;
          const d = new Date(p.archived_at.replace(/-/g, '/'));
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return d < monthAgo;
        });
      }
      return this.projects;
    },
  },
  onShow() {
    this.loadProjects();
  },
  methods: {
    async loadProjects() {
      try {
        this.projects = await getArchivedProjects();
      } catch (err) {
        uni.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    },
    toggleSelectMode() {
      this.selectMode = !this.selectMode;
    },
    formatArchiveDate(dateStr) {
      if (!dateStr) return '未知';
      return dateStr.slice(0, 10);
    },
    handleRestore(project) {
      uni.showModal({
        title: '恢复项目',
        content: `恢复后，"${project.name}" 会重新回到首页。`,
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await restoreProject(project.id);
            uni.showToast({ title: '已恢复', icon: 'success' });
            this.loadProjects();
          } catch (err) {
            uni.showToast({ title: err.message || '恢复失败', icon: 'none' });
          }
        },
      });
    },
    handleDelete(project) {
      uni.showModal({
        title: '彻底删除项目',
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
                this.loadProjects();
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
  padding: 24rpx 24rpx 60rpx;
}

/* ===== Hero ===== */
.hero {
  margin-bottom: 16rpx;
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
.select-link {
  font-size: 26rpx;
  color: var(--td-brand-color, #3B5E6B);
  font-weight: 500;
}
.page-subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.6;
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

/* ===== Shared Card ===== */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
  padding: 28rpx;
}

/* ===== Empty State ===== */
.empty-wrap {
  padding: 40rpx 28rpx;
}
.empty-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}
.empty-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 25rpx;
  color: var(--td-text-color-secondary, #64748B);
}

/* ===== Project List ===== */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* ===== Project Card ===== */
.project-card {
  border-left: 6rpx solid #7A7B82;
}
.project-row {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.project-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.project-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}
.project-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.project-meta {
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.project-actions {
  display: flex;
  gap: 16rpx;
}
.project-actions :deep(.t-button) {
  flex: 1;
}
</style>
