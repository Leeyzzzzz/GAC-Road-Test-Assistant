<template>
  <view class="page">
    <view v-if="showForm" class="form-wrap">
      <text class="form-title">{{ formMode === 'new' ? '创建项目' : '编辑项目' }}</text>
      <text class="form-desc">项目是试验的容器，进入项目后再创建具体试验。</text>

      <view class="field-group">
        <text class="field-label">项目名称 *</text>
        <t-input v-model:value="form.name" placeholder="请输入项目名称" clearable />
      </view>

      <view class="field-group">
        <text class="field-label">项目编号 / 代号 *</text>
        <t-input v-model:value="form.code" placeholder="例如：GAC-ADAS-001" clearable />
      </view>

      <view class="field-group">
        <text class="field-label">技术负责人 *</text>
        <t-input v-model:value="form.techLead" placeholder="请输入技术负责人" clearable />
      </view>

      <view class="form-actions">
        <t-button theme="primary" block :loading="submitting" @click="submitProject">
          {{ formMode === 'new' ? '创建项目' : '保存项目' }}
        </t-button>
      </view>
    </view>

    <view v-else>
      <view class="hero-card">
        <view class="hero-head">
          <view class="hero-texts">
            <text class="project-name">{{ project.name }}</text>
            <text class="project-lead">技术负责人：{{ project.tech_lead || '未填写' }}</text>
          </view>
          <t-tag theme="primary" variant="light">{{ project.code }}</t-tag>
        </view>

        <view class="hero-stats">
          <t-tag size="small" variant="light" theme="default">试验 {{ sessions.length }}</t-tag>
          <t-tag size="small" variant="light" :theme="activeSessions > 0 ? 'success' : 'default'">
            进行中 {{ activeSessions }}
          </t-tag>
        </view>

        <view class="project-actions">
          <t-button size="small" variant="outline" @click="goToEditProject">编辑项目</t-button>
          <t-button size="small" variant="outline" @click="handleArchiveProject">归档项目</t-button>
          <t-button size="small" theme="danger" variant="outline" @click="handleDeleteProject">删除项目</t-button>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">项目试验</text>
        <text class="section-subtitle">按测试日期升序分组，时间越早越靠上</text>
      </view>

      <view v-if="groupedSessions.length === 0" class="empty-wrap">
        <text class="empty-title">这个项目下还没有试验</text>
        <text class="empty-desc">先创建一条试验，后续记录、录音和导出都基于试验进行</text>
        <t-button theme="primary" block @click="goToCreateSession">新建试验</t-button>
      </view>

      <view v-else class="group-list">
        <view v-for="group in groupedSessions" :key="group.date" class="group-block">
          <view class="group-head">
            <text class="group-title">{{ group.date }}</text>
            <text class="group-count">{{ group.sessions.length }} 条试验</text>
          </view>

          <view
            v-for="session in group.sessions"
            :key="session.id"
            class="session-card"
          >
            <view class="session-main" @click="goToSession(session.id)">
              <view class="session-head">
                <text class="session-name">{{ session.tester }}</text>
                <t-tag
                  size="small"
                  variant="light"
                  :theme="session.status === 'active' ? 'success' : 'default'"
                >
                  {{ session.status === 'active' ? '进行中' : '已结束' }}
                </t-tag>
              </view>
              <text class="session-meta">车辆：{{ session.vehicle_info || '未填写' }}</text>
              <text class="session-meta">路线：{{ session.route || '未填写' }}</text>
            </view>

            <view class="session-actions">
              <t-button size="small" variant="outline" @click="goToEditSession(session.id)">编辑</t-button>
              <t-button size="small" theme="danger" variant="outline" @click="handleDeleteSession(session)">删除</t-button>
            </view>
          </view>
        </view>
      </view>

      <t-fab icon="add" text="新建试验" @click="goToCreateSession" />
    </view>
  </view>
</template>

<script>
import {
  archiveProject,
  createProject,
  deleteProject,
  deleteSession,
  getProject,
  getSessions,
  updateProject,
} from '../../services/api';

export default {
  data() {
    return {
      projectId: null,
      formMode: 'new',
      showForm: false,
      submitting: false,
      project: {},
      sessions: [],
      form: {
        name: '',
        code: '',
        techLead: '',
      },
    };
  },
  computed: {
    activeSessions() {
      return this.sessions.filter(session => session.status === 'active').length;
    },
    groupedSessions() {
      const sorted = this.sessions.slice().sort((a, b) => {
        if (a.test_date === b.test_date) {
          if (a.status === b.status) return 0;
          return a.status === 'active' ? -1 : 1;
        }
        return a.test_date < b.test_date ? -1 : 1;
      });

      const groups = [];
      sorted.forEach((session) => {
        const date = session.test_date || '未知日期';
        let group = groups.find(item => item.date === date);
        if (!group) {
          group = { date, sessions: [] };
          groups.push(group);
        }
        group.sessions.push(session);
      });
      return groups;
    },
  },
  onLoad(options) {
    if (options.new === '1') {
      this.formMode = 'new';
      this.showForm = true;
      uni.setNavigationBarTitle({ title: '创建项目' });
      return;
    }

    if (options.id) {
      this.projectId = Number(options.id);
      this.formMode = options.edit === '1' ? 'edit' : 'view';
      this.showForm = this.formMode === 'edit';
      uni.setNavigationBarTitle({ title: this.showForm ? '编辑项目' : '项目详情' });
      this.loadData();
    }
  },
  onShow() {
    if (this.projectId && !this.showForm) {
      this.loadSessions();
    }
  },
  methods: {
    async loadData() {
      try {
        const results = await Promise.all([
          getProject(this.projectId),
          getSessions(this.projectId),
        ]);
        this.project = results[0];
        this.sessions = results[1];
        this.form.name = results[0].name || '';
        this.form.code = results[0].code || '';
        this.form.techLead = results[0].tech_lead || '';
      } catch (err) {
        uni.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    },
    async loadSessions() {
      try {
        this.sessions = await getSessions(this.projectId);
      } catch (err) {
        uni.showToast({ title: err.message || '加载试验失败', icon: 'none' });
      }
    },
    async submitProject() {
      if (!this.form.name || !this.form.code || !this.form.techLead) {
        uni.showToast({ title: '请完整填写项目字段', icon: 'none' });
        return;
      }

      this.submitting = true;
      try {
        if (this.formMode === 'new') {
          const created = await createProject({
            name: this.form.name,
            code: this.form.code,
            tech_lead: this.form.techLead,
          });
          uni.showToast({ title: '项目已创建', icon: 'success' });
          uni.redirectTo({ url: `/pages/project-detail/index?id=${created.id}` });
        } else {
          await updateProject(this.projectId, {
            name: this.form.name,
            code: this.form.code,
            tech_lead: this.form.techLead,
          });
          uni.showToast({ title: '项目已保存', icon: 'success' });
          uni.redirectTo({ url: `/pages/project-detail/index?id=${this.projectId}` });
        }
      } catch (err) {
        uni.showToast({ title: err.message || '保存失败', icon: 'none' });
      } finally {
        this.submitting = false;
      }
    },
    goToEditProject() {
      uni.navigateTo({ url: `/pages/project-detail/index?id=${this.projectId}&edit=1` });
    },
    goToCreateSession() {
      uni.navigateTo({
        url: `/pages/session-detail/index?new=1&project_id=${this.projectId}&project_name=${encodeURIComponent(this.project.name)}&project_code=${encodeURIComponent(this.project.code || '')}`,
      });
    },
    goToSession(sessionId) {
      uni.navigateTo({ url: `/pages/session-detail/index?id=${sessionId}` });
    },
    goToEditSession(sessionId) {
      uni.navigateTo({ url: `/pages/session-detail/index?id=${sessionId}&edit=1` });
    },
    handleArchiveProject() {
      uni.showModal({
        title: '归档项目',
        content: `归档后，“${this.project.name}” 会从首页移到归档项目页。`,
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await archiveProject(this.projectId);
            uni.showToast({ title: '已归档', icon: 'success' });
            uni.navigateBack();
          } catch (err) {
            uni.showToast({ title: err.message || '归档失败', icon: 'none' });
          }
        },
      });
    },
    handleDeleteProject() {
      uni.showModal({
        title: '删除项目',
        content: `删除后，“${this.project.name}” 下的全部试验和记录将被永久移除，且不可恢复。`,
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
                await deleteProject(this.projectId);
                uni.showToast({ title: '项目已删除', icon: 'success' });
                uni.switchTab({ url: '/pages/index/index' });
              } catch (err) {
                uni.showToast({ title: err.message || '删除失败', icon: 'none' });
              }
            },
          });
        },
      });
    },
    handleDeleteSession(session) {
      uni.showModal({
        title: '删除试验',
        content: `删除后，试验“${session.tester} / ${session.test_date}”下的全部记录将被永久移除，且不可恢复。`,
        confirmColor: '#d54941',
        success: async (res) => {
          if (!res.confirm) return;
          uni.showModal({
            title: '再次确认删除',
            content: '这是不可恢复操作。确认后会立即删除该试验及其全部记录。',
            confirmColor: '#d54941',
            success: async (finalRes) => {
              if (!finalRes.confirm) return;
              try {
                await deleteSession(session.id);
                uni.showToast({ title: '试验已删除', icon: 'success' });
                this.loadSessions();
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
  padding: 24rpx 24rpx 160rpx;
}

.form-wrap,
.hero-card,
.empty-wrap,
.session-card {
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

.field-group {
  margin-bottom: 24rpx;
}

.field-label {
  display: block;
  margin-bottom: 10rpx;
  font-size: 26rpx;
  color: #334155;
}

.form-actions {
  margin-top: 12rpx;
}

.hero-card {
  padding: 28rpx;
}

.hero-head {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.hero-texts {
  flex: 1;
}

.project-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #0f172a;
}

.project-lead {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #64748b;
}

.hero-stats {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.project-actions,
.session-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 24rpx;
}

.project-actions :deep(.t-button),
.session-actions :deep(.t-button) {
  flex: 1;
}

.section-head {
  margin: 28rpx 0 20rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.section-subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #64748b;
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
  margin: 14rpx 0 28rpx;
  font-size: 25rpx;
  color: #64748b;
  line-height: 1.6;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.group-block {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.group-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #334155;
}

.group-count {
  font-size: 24rpx;
  color: #94a3b8;
}

.session-card {
  padding: 24rpx;
}

.session-main {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.session-head {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  align-items: flex-start;
}

.session-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.session-meta {
  font-size: 25rpx;
  color: #64748b;
}
</style>
