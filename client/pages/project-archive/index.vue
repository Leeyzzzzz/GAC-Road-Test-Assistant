<template>
  <view class="page">
    <view class="hero">
      <text class="page-title">归档项目</text>
      <text class="page-subtitle">历史项目统一收纳在这里，默认不打扰首页主流程。</text>
    </view>

    <view v-if="projects.length === 0" class="empty-wrap">
      <text class="empty-title">暂无归档项目</text>
      <text class="empty-desc">当你归档项目后，会在这里查看和恢复。</text>
    </view>

    <view v-else class="project-list">
      <view v-for="project in projects" :key="project.id" class="project-card">
        <view class="project-head">
          <text class="project-name">{{ project.name }}</text>
          <t-tag theme="default" variant="light">{{ project.code }}</t-tag>
        </view>
        <text class="project-meta">技术负责人：{{ project.tech_lead || '未填写' }}</text>
        <text class="project-meta">归档时间：{{ project.archived_at || '未知' }}</text>

        <view class="project-actions">
          <t-button size="small" variant="outline" @click="handleRestore(project)">恢复</t-button>
          <t-button size="small" theme="danger" variant="outline" @click="handleDelete(project)">彻底删除</t-button>
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
    };
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
    handleRestore(project) {
      uni.showModal({
        title: '恢复项目',
        content: `恢复后，“${project.name}” 会重新回到首页。`,
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
.page {
  min-height: 100vh;
  background: #f3f5f7;
  padding: 24rpx;
}

.hero {
  margin-bottom: 24rpx;
}

.page-title {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #64748b;
}

.empty-wrap,
.project-card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
}

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
  color: #64748b;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.project-card {
  padding: 28rpx;
}

.project-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.project-name {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.project-meta {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  color: #64748b;
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
