<template>
  <view class="page">
    <!-- Recording State -->
    <view v-if="!record.id || record.status === 'draft'" class="record-section">
      <!-- Prompt Text -->
      <view v-if="!isRecording && !record.raw_text" class="prompt-box soft-card">
        <text class="prompt-text">{{ promptText }}</text>
      </view>

      <!-- Big Record Button -->
      <view class="record-btn-area">
        <view :class="['record-btn', isRecording ? 'recording shadow-floaty bg-gradient-primary' : 'bg-gradient-primary']" @click="toggleRecording">
          <text class="record-btn-icon">{{ isRecording ? '⏹' : '🎙' }}</text>
        </view>
        <text class="record-hint">{{ isRecording ? recordingHint : '点击开始录音' }}</text>
        <text v-if="isRecording" class="record-timer">{{ formatDuration(recordingDuration) }}</text>
      </view>

      <!-- Transcription Result -->
      <view v-if="record.raw_text" class="result-card soft-card">
        <text class="result-label">语音转文字结果</text>
        <textarea
          class="result-textarea"
          v-model="editableText"
          placeholder="编辑文字内容..."
          :maxlength="-1"
        />
      </view>

      <!-- AI Extraction Result -->
      <view v-if="record.summary" class="ai-card soft-card">
        <text class="ai-title">AI 识别结果</text>
        <view class="ai-field">
          <text class="ai-label">问题摘要</text>
          <text class="ai-value">{{ record.summary }}</text>
        </view>
        <view class="ai-field">
          <text class="ai-label">问题类型</text>
          <view class="pill bg-dopamine-purple-light text-dopamine-purple"><text>{{ record.problem_type }}</text></view>
        </view>
        <view class="ai-field">
          <text class="ai-label">严重程度</text>
          <view class="pill bg-dopamine-pink-light text-dopamine-pink">
            <text>{{ record.severity }}</text>
          </view>
        </view>
        <view v-if="record.details" class="ai-field">
          <text class="ai-label">详细信息</text>
          <text class="ai-value">{{ record.details }}</text>
        </view>
      </view>

      <!-- GPS Info -->
      <view v-if="record.gps_lat" class="info-card soft-card">
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
      <view class="attach-section soft-card">
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
        <button class="btn-submit bg-gradient-secondary shadow-floaty" @click="submitRecord" :disabled="!record.raw_text">
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
      <view class="result-card soft-card">
        <text class="result-label">问题描述</text>
        <text class="result-text">{{ record.summary || record.edited_text || record.raw_text }}</text>
      </view>
      <view v-if="record.problem_type" class="ai-card soft-card">
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
  padding: 30rpx;
  padding-bottom: 200rpx;
}

.prompt-box {
  background: rgba(255, 255, 255, 0.9);
  padding: 30rpx;
  margin-bottom: 30rpx;
  border-left: 8rpx solid var(--dopamine-sky);
}

.prompt-text {
  font-size: 28rpx;
  color: var(--calm-ink);
  font-weight: 500;
  line-height: 1.6;
}

.record-btn-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.record-btn {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14rpx 32rpx rgba(255, 107, 139, 0.3);
  transition: all 0.3s;
}

.record-btn:active {
  transform: scale(0.95);
}

.record-btn.recording {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 139, 0.6); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 30rpx rgba(255, 107, 139, 0); }
}

.record-btn-icon {
  font-size: 70rpx;
  color: white;
}

.record-hint {
  font-size: 28rpx;
  color: var(--calm-mute);
  margin-top: 24rpx;
  font-weight: 500;
}

.record-timer {
  font-size: 48rpx;
  font-weight: 900;
  color: var(--dopamine-orange);
  margin-top: 16rpx;
  font-variant-numeric: tabular-nums;
}

.result-card, .ai-card, .info-card, .attach-section {
  padding: 30rpx;
  margin-bottom: 24rpx;
}

.result-label, .ai-title, .info-title, .attach-title {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--calm-ink);
  margin-bottom: 16rpx;
  display: block;
}

.result-textarea {
  width: 100%;
  min-height: 200rpx;
  font-size: 28rpx;
  line-height: 1.6;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--calm-line);
  border-radius: 16rpx;
  color: var(--calm-ink);
  transition: all 0.2s;
  box-sizing: border-box;
}

.result-textarea:focus {
  background: #fff;
  border-color: var(--dopamine-sky);
}

.result-text {
  font-size: 28rpx;
  color: var(--calm-ink);
  line-height: 1.6;
}

.ai-field {
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.ai-label {
  font-size: 28rpx;
  color: var(--calm-mute);
  min-width: 120rpx;
  font-weight: 500;
}

.ai-value {
  font-size: 28rpx;
  color: var(--calm-ink);
  font-weight: 500;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.info-label {
  color: var(--calm-mute);
  font-size: 28rpx;
}

.info-value {
  color: var(--calm-ink);
  font-size: 28rpx;
  font-weight: 600;
}

.attach-btns {
  display: flex;
  gap: 20rpx;
}

.attach-btn {
  background: rgba(255, 255, 255, 0.8);
  border: 1px dashed var(--calm-mute);
  border-radius: 20rpx;
  padding: 20rpx 40rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  transition: all 0.2s;
}

.attach-btn:active {
  background: rgba(255, 255, 255, 1);
  border-color: var(--dopamine-sky);
}

.attach-btn-icon {
  font-size: 36rpx;
}

.attach-btn-text {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--calm-ink);
}

.attach-list {
  margin-top: 24rpx;
}

.attach-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1px dashed var(--calm-line);
}

.attach-name {
  font-size: 28rpx;
  color: var(--calm-ink);
  font-weight: 500;
}

.attach-remove {
  font-size: 28rpx;
  color: #ff4d4f;
  font-weight: bold;
}

.action-area {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.btn-ai {
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  color: var(--dopamine-sky);
  border: 1px solid var(--dopamine-sky);
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.btn-submit {
  flex: 1;
  color: #fff;
  border: none;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 800;
}

.btn-ai[disabled], .btn-submit[disabled] {
  opacity: 0.5;
}

.submitted-section {
  padding: 60rpx 40rpx;
  text-align: center;
}

.submitted-badge {
  margin: 60rpx 0;
}

.submitted-icon {
  font-size: 100rpx;
  color: var(--dopamine-mint);
  display: block;
}

.submitted-text {
  font-size: 36rpx;
  font-weight: 900;
  color: var(--dopamine-mint);
  margin-top: 20rpx;
  display: block;
}
</style>
