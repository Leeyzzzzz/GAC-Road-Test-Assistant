<template>
  <view class="page">
    <!-- Recording State -->
    <view v-if="!record.id || record.status === 'draft'" class="record-section">
      <!-- Prompt Text -->
      <view v-if="!isRecording && !record.raw_text" class="prompt-box">
        <text class="prompt-text">{{ promptText }}</text>
      </view>

      <!-- Big Record Button -->
      <view class="record-btn-area">
        <view :class="['record-btn', isRecording ? 'recording' : '']" @click="toggleRecording">
          <text class="record-btn-icon">{{ isRecording ? '⏹' : '🎙' }}</text>
        </view>
        <text class="record-hint">{{ isRecording ? recordingHint : '点击开始录音' }}</text>
        <text v-if="isRecording" class="record-timer">{{ formatDuration(recordingDuration) }}</text>
      </view>

      <!-- Transcription Result -->
      <view v-if="record.raw_text" class="result-card">
        <text class="result-label">语音转文字结果</text>
        <textarea
          class="result-textarea"
          v-model="editableText"
          placeholder="编辑文字内容..."
          :maxlength="-1"
        />
      </view>

      <!-- AI Extraction Result -->
      <view v-if="record.summary" class="ai-card">
        <text class="ai-title">AI 识别结果</text>
        <view class="ai-field">
          <text class="ai-label">问题摘要</text>
          <text class="ai-value">{{ record.summary }}</text>
        </view>
        <view class="ai-field">
          <text class="ai-label">问题类型</text>
          <view class="ai-tag"><text class="ai-tag-text">{{ record.problem_type }}</text></view>
        </view>
        <view class="ai-field">
          <text class="ai-label">严重程度</text>
          <view :class="['ai-tag', severityClass(record.severity)]">
            <text class="ai-tag-text">{{ record.severity }}</text>
          </view>
        </view>
        <view v-if="record.details" class="ai-field">
          <text class="ai-label">详细信息</text>
          <text class="ai-value">{{ record.details }}</text>
        </view>
      </view>

      <!-- GPS Info -->
      <view v-if="record.gps_lat" class="info-card">
        <text class="info-title">采集信息</text>
        <view class="info-row">
          <text class="info-label">GPS</text>
          <text class="info-value">{{ record.gps_lat }}, {{ record.gps_lng }}</text>
        </view>
        <view v-if="record.weather" class="info-row">
          <text class="info-label">天气</text>
          <text class="info-value">{{ record.weather }}</text>
        </view>
      </view>

      <!-- Attachments -->
      <view class="attach-section">
        <text class="attach-title">附件</text>
        <view class="attach-btns">
          <view class="attach-btn" @click="takePhoto">
            <text class="attach-btn-icon">📷</text>
            <text class="attach-btn-text">拍照</text>
          </view>
          <view class="attach-btn" @click="chooseVideo">
            <text class="attach-btn-icon">🎬</text>
            <text class="attach-btn-text">录像</text>
          </view>
        </view>
        <view v-if="attachments.length > 0" class="attach-list">
          <view v-for="(att, idx) in attachments" :key="idx" class="attach-item">
            <text class="attach-name">{{ att.type === 'photo' ? '照片' : '视频' }} {{ idx + 1 }}</text>
            <text class="attach-remove" @click="removeAttachment(idx)">删除</text>
          </view>
        </view>
      </view>

      <!-- Action Buttons -->
      <view class="action-area">
        <button v-if="record.raw_text" class="btn-ai" @click="runAI" :disabled="aiProcessing">
          {{ aiProcessing ? 'AI 处理中...' : 'AI 分析' }}
        </button>
        <button class="btn-submit" @click="submitRecord" :disabled="!record.raw_text">
          提交
        </button>
      </view>
    </view>

    <!-- Submitted State -->
    <view v-else class="submitted-section">
      <view class="submitted-badge">
        <text class="submitted-icon">✓</text>
        <text class="submitted-text">已提交</text>
      </view>
      <view class="result-card">
        <text class="result-label">问题描述</text>
        <text class="result-text">{{ record.summary || record.edited_text || record.raw_text }}</text>
      </view>
      <view v-if="record.problem_type" class="ai-card">
        <view class="ai-field">
          <text class="ai-label">类型</text>
          <text class="ai-value">{{ record.problem_type }}</text>
        </view>
        <view v-if="record.severity" class="ai-field">
          <text class="ai-label">严重程度</text>
          <text class="ai-value">{{ record.severity }}</text>
        </view>
      </view>
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
      recordingHint: '正在录音...可以说：问题现象、当时车速、路况、天气等',
      recorderManager: null,
      timer: null,
      draftTimer: null,
      audioFilePath: '',
    };
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
    severityClass(severity) {
      const map = {
        致命: 'severity-critical',
        严重: 'severity-major',
        一般: 'severity-normal',
        轻微: 'severity-minor',
      };
      return map[severity] || '';
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
.page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 200rpx;
}

.prompt-box {
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.prompt-text {
  font-size: 28rpx;
  color: #1890ff;
  line-height: 1.6;
}

.record-btn-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.record-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(238, 90, 36, 0.4);
}

.record-btn.recording {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.record-btn-icon {
  font-size: 60rpx;
}

.record-hint {
  font-size: 26rpx;
  color: #999;
  margin-top: 20rpx;
}

.record-timer {
  font-size: 40rpx;
  font-weight: bold;
  color: #ff4d4f;
  margin-top: 12rpx;
}

.result-card, .ai-card, .info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.result-label, .ai-title, .info-title {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
  display: block;
}

.result-textarea {
  width: 100%;
  min-height: 160rpx;
  font-size: 28rpx;
  line-height: 1.6;
  padding: 12rpx;
  background: #fafafa;
  border-radius: 8rpx;
}

.result-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.ai-field {
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.ai-label {
  font-size: 26rpx;
  color: #999;
  min-width: 120rpx;
}

.ai-value {
  font-size: 28rpx;
  color: #333;
}

.ai-tag {
  background: #f0f0f0;
  border-radius: 6rpx;
  padding: 4rpx 16rpx;
}

.severity-critical { background: #ffccc7; }
.severity-major { background: #ffa39e; }
.severity-normal { background: #fff1f0; }
.severity-minor { background: #f6ffed; }

.ai-tag-text {
  font-size: 24rpx;
  color: #666;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
}

.info-label {
  color: #999;
  font-size: 26rpx;
}

.info-value {
  color: #333;
  font-size: 26rpx;
}

.attach-section {
  margin-bottom: 20rpx;
}

.attach-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.attach-btns {
  display: flex;
  gap: 20rpx;
}

.attach-btn {
  background: #fff;
  border: 1rpx solid #d9d9d9;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.attach-btn-icon {
  font-size: 32rpx;
}

.attach-btn-text {
  font-size: 26rpx;
  color: #333;
}

.attach-list {
  margin-top: 16rpx;
}

.attach-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.attach-name {
  font-size: 26rpx;
  color: #333;
}

.attach-remove {
  font-size: 26rpx;
  color: #ff4d4f;
}

.action-area {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.btn-ai {
  flex: 1;
  background: #fff;
  color: #1890ff;
  border: 1rpx solid #1890ff;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn-submit {
  flex: 1;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
}

.btn-ai[disabled], .btn-submit[disabled] {
  opacity: 0.5;
}

.submitted-section {
  padding: 40rpx;
  text-align: center;
}

.submitted-badge {
  margin: 40rpx 0;
}

.submitted-icon {
  font-size: 80rpx;
  color: #52c41a;
  display: block;
}

.submitted-text {
  font-size: 32rpx;
  color: #52c41a;
  margin-top: 16rpx;
  display: block;
}
</style>
