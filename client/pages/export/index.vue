<template>
  <view :style="themeVars" class="page">
    <!-- Header -->
    <view class="header">
      <text class="header-title">数据导出</text>
      <text class="header-desc">选择试验后导出 Excel 或 CSV 文件</text>
    </view>

    <!-- Session Selector Card -->
    <view class="card">
      <view class="section-head">
        <text class="section-head-title">选择试验</text>
      </view>
      <picker :range="sessionNames" @change="onSessionChange">
        <view :class="['picker-box', selectedSession ? 'picked' : '']">
          <text :class="['picker-text', selectedSession ? '' : 'placeholder']">
            {{ selectedSession ? selectedSessionName : '请选择试验' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </picker>
    </view>

    <!-- Preview Card -->
    <view v-if="selectedSession" class="card section-card">
      <view class="section-head">
        <text class="section-head-title">已提交记录</text>
        <text class="section-head-meta">{{ records.length }} 条</text>
      </view>

      <view v-if="records.length === 0" class="empty-wrap">
        <text class="empty-text">该试验暂无已提交记录</text>
      </view>

      <view v-for="record in records" :key="record.id" class="preview-card">
        <view class="preview-top">
          <text class="preview-summary">{{ record.summary || record.raw_text || '无摘要' }}</text>
        </view>
        <view class="preview-tags">
          <t-tag v-if="record.problem_type" theme="primary" variant="light" size="small">{{ record.problem_type }}</t-tag>
          <t-tag v-if="record.severity" :theme="severityTheme(record.severity)" variant="light" size="small">{{ record.severity }}</t-tag>
        </view>
      </view>
    </view>

    <!-- Export Buttons -->
    <view v-if="selectedSession && records.length > 0" class="card section-card export-card">
      <view class="export-actions">
        <t-button theme="primary" block :loading="exporting" @click="doExport('excel')">
          导出 Excel
        </t-button>
        <t-button variant="outline" block :loading="exporting" @click="doExport('csv')">
          导出 CSV
        </t-button>
      </view>
    </view>
  </view>
</template>

<script>
import { getExportUrl, getRecords, getSessions } from '../../services/api';

export default {
  data() {
    return {
      sessions: [],
      selectedSession: null,
      records: [],
      exporting: false,
    };
  },
  computed: {
    themeVars() {
      return '--td-brand-color: #3B5E6B; --td-brand-color-light: #DEE6EA; --td-brand-color-dark: #1E293B; --td-error-color: #7A4B4B; --td-success-color: #4A6B5E; --td-warning-color: #7A6B4B; --td-bg-color-page: #F3F5F7; --td-bg-color-container: #FFFFFF; --td-text-color-primary: #0F172A; --td-text-color-secondary: #64748B;';
    },
    sessionNames() {
      return this.sessions.map(s =>
        s.tester + ' - ' + s.test_date + (s.route ? ' - ' + s.route : '')
      );
    },
    selectedSessionName() {
      if (!this.selectedSession) return '';
      const s = this.sessions.find(s => s.id === this.selectedSession);
      return s ? s.tester + ' - ' + s.test_date + (s.route ? ' - ' + s.route : '') : '';
    },
  },
  onShow() {
    this.loadSessions();
  },
  methods: {
    async loadSessions() {
      try {
        this.sessions = await getSessions();
      } catch (e) {
        uni.showToast({ title: '加载试验列表失败', icon: 'none' });
      }
    },
    async onSessionChange(e) {
      const idx = e.detail.value;
      this.selectedSession = this.sessions[idx].id;
      try {
        const allRecords = await getRecords(this.selectedSession);
        this.records = allRecords.filter(r => r.status === 'submitted');
      } catch (e) {
        this.records = [];
      }
    },
    severityTheme(severity) {
      const map = {
        致命: 'danger',
        严重: 'danger',
        一般: 'warning',
        轻微: 'default',
      };
      return map[severity] || 'default';
    },
    doExport(type) {
      const ext = type === 'excel' ? 'xlsx' : 'csv';
      const url = getExportUrl(type, this.selectedSession);

      // #ifdef H5
      const link = document.createElement('a');
      link.href = url;
      link.download = `roadtest-${this.selectedSession}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // #endif

      // #ifndef H5
      this.exporting = true;
      uni.downloadFile({
        url,
        success: (res) => {
          if (res.statusCode === 200) {
            const fileType = type === 'excel' ? 'xlsx' : 'csv';
            uni.openDocument({
              filePath: res.tempFilePath,
              fileType,
              showMenu: true,
              success: () => {
                uni.showToast({ title: '导出成功', icon: 'success' });
              },
              fail: (err) => {
                console.error('openDocument fail:', err);
                uni.showToast({ title: '打开文件失败', icon: 'none' });
              },
            });
          } else {
            uni.showToast({ title: '导出失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '下载失败', icon: 'none' });
        },
        complete: () => {
          this.exporting = false;
        },
      });
      // #endif
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

/* ===== Header ===== */
.header {
  margin-bottom: 20rpx;
}
.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}
.header-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--td-text-color-secondary, #64748B);
}

/* ===== Shared Card ===== */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.06);
  padding: 28rpx;
}
.section-card {
  margin-top: 20rpx;
}

/* ===== Section Header ===== */
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.section-head-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
}
.section-head-meta {
  font-size: 24rpx;
  color: #94a3b8;
}

/* ===== Picker ===== */
.picker-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 2rpx solid #e2e6ec;
  border-radius: 16rpx;
  padding: 24rpx;
}
.picker-box.picked {
  border-color: var(--td-brand-color, #3B5E6B);
  background: #f1f3f5;
}
.picker-text {
  flex: 1;
  font-size: 28rpx;
  color: var(--td-text-color-primary, #0F172A);
}
.picker-text.placeholder {
  color: #94a3b8;
}
.picker-arrow {
  font-size: 32rpx;
  color: #94a3b8;
  margin-left: 12rpx;
}

/* ===== Preview ===== */
.empty-wrap {
  text-align: center;
  padding: 40rpx 0;
}
.empty-text {
  font-size: 26rpx;
  color: var(--td-text-color-secondary, #64748B);
}

.preview-card {
  padding: 20rpx 0;
}
.preview-card + .preview-card {
  border-top: 2rpx solid #f0f2f5;
}
.preview-top {
  margin-bottom: 10rpx;
}
.preview-summary {
  font-size: 27rpx;
  color: var(--td-text-color-primary, #0F172A);
  line-height: 1.6;
}
.preview-tags {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

/* ===== Export Actions ===== */
.export-card {
  padding-bottom: 32rpx;
}
.export-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
</style>
