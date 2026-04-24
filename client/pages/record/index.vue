<template>
  <view :style="themeVars" class="page">
    <!-- ===================== IDLE / DRAFT STATE ===================== -->
    <template v-if="!record.id || record.status === 'draft'">
      <!-- Prompt notice - only show when idle -->
      <t-notice-bar v-if="!isRecording && !record.raw_text" theme="info" :content="promptText" />

      <!-- ===== Recording Hero Card ===== -->
      <view class="card recording-card">
        <view class="recording-inner">
          <!-- Waveform visualization during recording -->
          <view v-if="isRecording" class="waveform-box">
            <view v-for="i in 5" :key="i" class="wave-bar" />
          </view>

          <!-- Microphone button -->
          <view class="mic-area" @click="toggleRecording">
            <view class="mic-btn" :class="{ 'is-recording': isRecording }">
              <text class="mic-icon">{{ isRecording ? '◼' : '◉' }}</text>
            </view>
          </view>

          <!-- Timer -->
          <text class="timer-text">{{ formatDuration(recordingDuration) }}</text>

          <!-- Status hint -->
          <text class="status-hint">{{ isRecording ? '正在录音，请描述问题…' : (record.raw_text ? '重新录音' : '点击开始录音') }}</text>
        </view>
      </view>

      <!-- ===== Voice Transcription Card ===== -->
      <view v-if="record.raw_text" class="card section-card">
        <view class="section-head">
          <text class="section-head-title">语音转文字</text>
          <text class="section-head-meta">{{ editableText.length }} 字</text>
        </view>
        <t-textarea
          v-model:value="editableText"
          placeholder="编辑文字内容…"
          :maxlength="-1"
          autosize
          :bordered="false"
          class="trans-textarea"
        />
      </view>

      <!-- ===== AI Recognition Card ===== -->
      <view v-if="record.summary" class="card section-card">
        <view class="section-head">
          <text class="section-head-title">AI 识别结果</text>
          <t-tag v-if="aiProcessing" theme="warning" variant="light" size="small">分析中…</t-tag>
        </view>

        <view class="ai-summary-block">
          <text class="ai-label">问题摘要</text>
          <text class="ai-value">{{ record.summary }}</text>
        </view>

        <view class="ai-tags-row">
          <view class="ai-tag-group">
            <text class="ai-label">问题类型</text>
            <t-tag theme="primary" variant="light">{{ record.problem_type }}</t-tag>
          </view>
          <view class="ai-tag-group">
            <text class="ai-label">严重程度</text>
            <t-tag :theme="severityTheme(record.severity)" variant="light">{{ record.severity }}</t-tag>
          </view>
        </view>

        <view v-if="record.details" class="ai-detail-block">
          <text class="ai-label">详细信息</text>
          <text class="ai-value">{{ record.details }}</text>
        </view>
      </view>

      <!-- ===== GPS Info Card ===== -->
      <view v-if="record.gps_lat" class="card section-card info-card-compact">
        <view class="info-row">
          <text class="info-row-label">GPS 位置</text>
          <text class="info-row-value">{{ record.gps_lat }}, {{ record.gps_lng }}</text>
        </view>
        <view v-if="record.weather" class="info-row">
          <text class="info-row-label">天气</text>
          <text class="info-row-value">{{ record.weather }}</text>
        </view>
      </view>

      <!-- ===== Attachments Card ===== -->
      <view class="card section-card">
        <view class="section-head">
          <text class="section-head-title">附件</text>
          <text class="section-head-meta">{{ attachments.length }} 个文件</text>
        </view>

        <view class="attach-actions">
          <t-button variant="outline" icon="camera" @click="takePhoto">拍照</t-button>
          <t-button variant="outline" icon="file-add" @click="chooseVideo">录像</t-button>
        </view>

        <view v-if="attachments.length > 0" class="attach-list">
          <view v-for="(att, idx) in attachments" :key="idx" class="attach-item">
            <text class="attach-item-name">{{ att.type === 'photo' ? '照片' : '视频' }} {{ idx + 1 }}</text>
            <t-tag theme="danger" variant="light" size="small" @click="removeAttachment(idx)">删除</t-tag>
          </view>
        </view>
      </view>
    </template>

    <!-- ===================== SUBMITTED STATE ===================== -->
    <template v-else>
      <view class="success-card">
        <view class="success-icon-wrap">
          <text class="success-icon">✓</text>
        </view>
        <text class="success-title">提交成功</text>
        <text class="success-desc">问题记录已保存至试验记录列表</text>
      </view>

      <view class="card section-card">
        <text class="submit-summary">{{ record.summary || record.edited_text || record.raw_text }}</text>
      </view>

      <view v-if="record.problem_type || record.severity" class="card section-card">
        <view class="ai-tags-row">
          <view v-if="record.problem_type" class="ai-tag-group">
            <text class="ai-label">问题类型</text>
            <t-tag theme="primary" variant="light">{{ record.problem_type }}</t-tag>
          </view>
          <view v-if="record.severity" class="ai-tag-group">
            <text class="ai-label">严重程度</text>
            <t-tag :theme="severityTheme(record.severity)" variant="light">{{ record.severity }}</t-tag>
          </view>
        </view>
      </view>
    </template>

    <!-- ===================== FIXED BOTTOM ACTION BAR ===================== -->
    <view v-if="!record.id || record.status === 'draft'" class="bottom-bar">
      <t-button
        v-if="record.raw_text"
        variant="outline"
        :loading="aiProcessing"
        class="bottom-btn"
        block
        @click="runAI"
      >
        AI 分析
      </t-button>
      <t-button
        v-if="record.raw_text"
        theme="primary"
        class="bottom-btn"
        block
        @click="submitRecord"
      >
        提交
      </t-button>
    </view>
  </view>
</template>

<script>
import {
  getRecord, createRecord, updateRecord,
  uploadFile, transcribeAudio, extractFields,
} from '../../services/api';

export default {
  data() {
    return {
      record: {},
      editableText: '',
      isRecording: false,
      recordingDuration: 0,
      aiProcessing: false,
      attachments: [],
      sessionId: null,
      recordId: null,
      promptText: '请描述刚才发生了什么，包括当时的情况和感受',
      recordingHint: '正在录音…可以说：问题现象、当时车速、路况、天气等',
      recorderManager: null,
      timer: null,
      draftTimer: null,
      audioFilePath: '',
    };
  },
  computed: {
    themeVars() {
      return '--td-brand-color: #3B5E6B; --td-brand-color-light: #DEE6EA; --td-brand-color-dark: #1E293B; --td-error-color: #7A4B4B; --td-success-color: #4A6B5E; --td-warning-color: #7A6B4B; --td-bg-color-page: #F3F5F7; --td-bg-color-container: #FFFFFF; --td-text-color-primary: #0F172A; --td-text-color-secondary: #64748B;';
    },
  },
  onLoad(options) {
    this.sessionId = Number(options.session_id);
    if (options.id) {
      this.recordId = Number(options.id);
      this.loadRecord();
    }
    this.recorderManager = uni.getRecorderManager();
    this.recorderManager.onStop((res) => {
      this.audioFilePath = res.tempFilePath;
      this.handleRecordingDone();
    });
    this.draftTimer = setInterval(this.saveDraft, 3000);
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer);
    if (this.draftTimer) clearInterval(this.draftTimer);
    if (this.isRecording) {
      this.recorderManager.stop();
    }
  },
  methods: {
    async loadRecord() {
      try {
        this.record = await getRecord(this.recordId);
        this.editableText = this.record.edited_text || this.record.raw_text || '';
        if (this.record.attachments) {
          try {
            this.attachments = JSON.parse(this.record.attachments);
          } catch (e) { this.attachments = []; }
        }
      } catch (err) {
        uni.showToast({ title: '加载失败', icon: 'none' });
      }
    },
    toggleRecording() {
      if (this.isRecording) {
        this.recorderManager.stop();
        this.isRecording = false;
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      } else {
        this.collectLocation();
        this.recorderManager.start({
          format: 'mp3',
          sampleRate: 16000,
          numberOfChannels: 1,
        });
        this.isRecording = true;
        this.recordingDuration = 0;
        this.timer = setInterval(() => {
          this.recordingDuration++;
        }, 1000);
      }
    },
    collectLocation() {
      uni.getLocation({
        type: 'wgs84',
        success: (res) => {
          if (!this.record.id) return;
          updateRecord(this.record.id, {
            gps_lat: res.latitude,
            gps_lng: res.longitude,
          }).then(updated => {
            Object.assign(this.record, updated);
          });
        },
        fail: () => {},
      });
    },
    async handleRecordingDone() {
      try {
        if (!this.record.id) {
          const r = await createRecord({
            session_id: this.sessionId,
            occurred_at: new Date().toLocaleString('sv-SE'),
          });
          this.record = r;
          this.recordId = r.id;
        }
        if (this.audioFilePath) {
          const uploadResult = await uploadFile(this.audioFilePath);
          await updateRecord(this.record.id, { audio_url: uploadResult.url });
          this.record.audio_url = uploadResult.url;
          const transcribeResult = await transcribeAudio(uploadResult.url);
          if (transcribeResult.text) {
            this.record.raw_text = transcribeResult.text;
            this.editableText = transcribeResult.text;
            await updateRecord(this.record.id, { raw_text: transcribeResult.text });
          }
        }
      } catch (err) {
        uni.showToast({ title: '处理失败: ' + err.message, icon: 'none' });
      }
    },
    async runAI() {
      if (!this.editableText) return;
      this.aiProcessing = true;
      try {
        const result = await extractFields(this.editableText);
        const updates = {
          summary: result.summary,
          problem_type: result.problemType,
          severity: result.severity,
          details: result.details,
        };
        const updated = await updateRecord(this.record.id, updates);
        this.record = updated;
        uni.showToast({ title: 'AI 分析完成', icon: 'success' });
      } catch (err) {
        uni.showToast({ title: 'AI 分析失败', icon: 'none' });
      } finally {
        this.aiProcessing = false;
      }
    },
    async submitRecord() {
      if (!this.record.id) return;
      try {
        const updates = {
          status: 'submitted',
          edited_text: this.editableText,
          attachments: this.attachments,
        };
        await updateRecord(this.record.id, updates);
        this.record.status = 'submitted';
        uni.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => {
          uni.navigateBack();
        }, 1000);
      } catch (err) {
        uni.showToast({ title: '提交失败', icon: 'none' });
      }
    },
    async saveDraft() {
      if (!this.record.id || !this.editableText) return;
      try {
        await updateRecord(this.record.id, {
          edited_text: this.editableText,
          attachments: this.attachments,
        });
      } catch (e) { /* silent */ }
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const file = res.tempFilePaths[0];
          try {
            const uploadResult = await uploadFile(file);
            this.attachments.push({ type: 'photo', url: uploadResult.url });
          } catch (e) {
            uni.showToast({ title: '上传失败', icon: 'none' });
          }
        },
      });
    },
    chooseVideo() {
      uni.chooseVideo({
        success: async (res) => {
          try {
            const uploadResult = await uploadFile(res.tempFilePath);
            this.attachments.push({ type: 'video', url: uploadResult.url });
          } catch (e) {
            uni.showToast({ title: '上传失败', icon: 'none' });
          }
        },
      });
    },
    removeAttachment(idx) {
      this.attachments.splice(idx, 1);
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
    formatDuration(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
    },
  },
};
</script>

<style scoped>
/* ===== Page Layout ===== */
.page {
  min-height: 100vh;
  background: #f3f5f7;
  padding: 24rpx 24rpx 180rpx;
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
  font-size: 23rpx;
  color: #94a3b8;
}

/* ===== Recording Card ===== */
.recording-card {
  position: relative;
  overflow: hidden;
}
.recording-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 16rpx;
}

/* Waveform */
.waveform-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  height: 80rpx;
  margin-bottom: 16rpx;
}
.wave-bar {
  width: 8rpx;
  background: var(--td-brand-color, #3B5E6B);
  border-radius: 8rpx;
  animation: wave-move 0.9s ease-in-out infinite;
}
.wave-bar:nth-child(1) {
  height: 24rpx;
  animation-delay: 0s;
}
.wave-bar:nth-child(2) {
  height: 44rpx;
  animation-delay: 0.16s;
}
.wave-bar:nth-child(3) {
  height: 64rpx;
  animation-delay: 0.32s;
}
.wave-bar:nth-child(4) {
  height: 44rpx;
  animation-delay: 0.48s;
}
.wave-bar:nth-child(5) {
  height: 24rpx;
  animation-delay: 0.64s;
}

@keyframes wave-move {
  0%, 100% {
    transform: scaleY(0.6);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1.2);
    opacity: 1;
  }
}

/* Microphone button */
.mic-area {
  padding: 12rpx;
}
.mic-btn {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: var(--td-brand-color, #3B5E6B);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(30, 41, 59, 0.35);
  transition: background 0.3s;
}
.mic-btn.is-recording {
  background: var(--td-error-color, #DC2626);
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}
.mic-icon {
  font-size: 64rpx;
  color: #ffffff;
  line-height: 1;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
  100% { box-shadow: 0 0 0 50rpx rgba(220, 38, 38, 0); }
}

/* Timer */
.timer-text {
  font-size: 56rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--td-text-color-primary, #0F172A);
  margin-top: 20rpx;
  letter-spacing: 4rpx;
}

/* Status hint */
.status-hint {
  font-size: 26rpx;
  color: var(--td-text-color-secondary, #64748B);
  margin-top: 12rpx;
}

/* ===== Transcription Textarea ===== */
.trans-textarea {
  font-size: 28rpx;
  color: var(--td-text-color-primary, #0F172A);
  line-height: 1.7;
  --td-textarea-padding: 0;
}

/* ===== AI Result Card ===== */
.ai-summary-block {
  margin-bottom: 20rpx;
}
.ai-detail-block {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0f2f5;
}
.ai-label {
  display: block;
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
  margin-bottom: 8rpx;
}
.ai-value {
  display: block;
  font-size: 27rpx;
  color: var(--td-text-color-primary, #0F172A);
  line-height: 1.6;
}
.ai-tags-row {
  display: flex;
  gap: 32rpx;
}
.ai-tag-group {
  flex: 1;
}

/* ===== GPS Info Compact Card ===== */
.info-card-compact {
  padding: 20rpx 28rpx;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 8rpx 0;
}
.info-row + .info-row {
  border-top: 2rpx solid #f0f2f5;
  margin-top: 8rpx;
  padding-top: 16rpx;
}
.info-row-label {
  font-size: 24rpx;
  color: var(--td-text-color-secondary, #64748B);
}
.info-row-value {
  margin-left: auto;
  font-size: 24rpx;
  color: var(--td-text-color-primary, #0F172A);
  font-weight: 500;
}

/* ===== Attachments ===== */
.attach-actions {
  display: flex;
  gap: 20rpx;
}
.attach-actions :deep(.t-button) {
  flex: 1;
}
.attach-list {
  margin-top: 16rpx;
}
.attach-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}
.attach-item + .attach-item {
  border-top: 2rpx solid #f0f2f5;
}
.attach-item-name {
  font-size: 26rpx;
  color: var(--td-text-color-primary, #0F172A);
}

/* ===== Submitted State ===== */
.success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 40rpx;
}
.success-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--td-success-color, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}
.success-icon {
  font-size: 56rpx;
  color: #ffffff;
  font-weight: 700;
}
.success-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}
.success-desc {
  font-size: 26rpx;
  color: var(--td-text-color-secondary, #64748B);
  margin-top: 10rpx;
}
.submit-summary {
  display: block;
  font-size: 27rpx;
  color: var(--td-text-color-primary, #0F172A);
  line-height: 1.7;
}

/* ===== Fixed Bottom Bar ===== */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom, 20rpx));
  background: #ffffff;
  border-top: 2rpx solid #f0f2f5;
  box-shadow: 0 -4rpx 24rpx rgba(15, 23, 42, 0.06);
  z-index: 100;
}
.bottom-btn {
  flex: 1;
}
</style>
