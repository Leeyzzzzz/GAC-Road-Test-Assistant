<template>
  <view class="page">
    <view class="header">
      <text class="title">数据导出</text>
    </view>

    <!-- Session Selector -->
    <view class="section">
      <text class="section-title">选择试验</text>
      <picker :range="sessionNames" @change="onSessionChange">
        <view class="picker-box">
          <text :class="['picker-text', selectedSession ? '' : 'placeholder']">
            {{ selectedSession ? selectedSessionName : '请选择试验' }}
          </text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- Preview -->
    <view v-if="selectedSession" class="section">
      <text class="section-title">已提交记录 ({{ records.length }} 条)</text>

      <view v-if="records.length === 0" class="empty">
        <text class="empty-text">该试验暂无已提交记录</text>
      </view>

      <view v-for="record in records" :key="record.id" class="preview-card">
        <view class="preview-header">
          <text class="preview-summary">{{ record.summary || '无摘要' }}</text>
        </view>
        <view class="preview-tags">
          <view v-if="record.problem_type" class="tag"><text class="tag-text">{{ record.problem_type }}</text></view>
          <view v-if="record.severity" class="tag"><text class="tag-text">{{ record.severity }}</text></view>
        </view>
      </view>
    </view>

    <!-- Export Buttons -->
    <view v-if="selectedSession && records.length > 0" class="export-area">
      <button class="btn-export" @click="doExport('excel')" :disabled="exporting">
        {{ exporting ? '导出中...' : '导出 Excel' }}
      </button>
      <button class="btn-export btn-csv" @click="doExport('csv')" :disabled="exporting">
        {{ exporting ? '导出中...' : '导出 CSV' }}
      </button>
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
    doExport(type) {
      const ext = type === 'excel' ? 'xlsx' : 'csv';
      const url = getExportUrl(type, this.selectedSession);

      // #ifdef H5
      // H5: use <a> tag to trigger browser download
      const link = document.createElement('a');
      link.href = url;
      link.download = `roadtest-${this.selectedSession}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // #endif

      // #ifndef H5
      // App / Mini Program: download then open document
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
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 40rpx;
}

.header {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  padding: 60rpx 40rpx 40rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.section {
  padding: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.picker-box {
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
}

.picker-text.placeholder {
  color: #999;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
}

.empty {
  text-align: center;
  padding: 60rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.preview-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 12rpx;
}

.preview-header {
  margin-bottom: 8rpx;
}

.preview-summary {
  font-size: 28rpx;
  color: #333;
}

.preview-tags {
  display: flex;
  gap: 8rpx;
}

.tag {
  background: #f0f0f0;
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
}

.tag-text {
  font-size: 22rpx;
  color: #666;
}

.export-area {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.btn-export {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn-csv {
  background: #fff;
  color: #1890ff;
  border: 1rpx solid #1890ff;
}
</style>
