// 真机调试用电脑内网IP，H5调试可改回 localhost
const BASE_URL = 'http://192.168.1.10:3000';

function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || `请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

function get(url, data) {
  return request({ url, method: 'GET', data });
}

function post(url, data) {
  return request({ url, method: 'POST', data });
}

function put(url, data) {
  return request({ url, method: 'PUT', data });
}

// ========== Projects ==========
export function getProjects() {
  return get('/api/projects');
}

export function createProject(data) {
  return post('/api/projects', data);
}

export function getProject(id) {
  return get(`/api/projects/${id}`);
}

// ========== Sessions ==========
export function getSessions(projectId) {
  return get('/api/sessions', projectId ? { project_id: projectId } : {});
}

export function createSession(data) {
  return post('/api/sessions', data);
}

export function getSession(id) {
  return get(`/api/sessions/${id}`);
}

export function updateSession(id, data) {
  return put(`/api/sessions/${id}`, data);
}

// ========== Records ==========
export function getRecords(sessionId) {
  return get('/api/records', { session_id: sessionId });
}

export function createRecord(data) {
  return post('/api/records', data);
}

export function getRecord(id) {
  return get(`/api/records/${id}`);
}

export function updateRecord(id, data) {
  return put(`/api/records/${id}`, data);
}

// ========== AI ==========
export function transcribeAudio(audioUrl) {
  return post('/api/ai/transcribe', { audio_url: audioUrl });
}

export function extractFields(text) {
  return post('/api/ai/extract', { text });
}

export function processRecord(recordId, audioUrl) {
  return post('/api/ai/process-record', { record_id: recordId, audio_url: audioUrl });
}

// ========== Upload ==========
export function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/api/upload',
      filePath,
      name: 'file',
      success: (res) => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(res.data));
        } else {
          reject(new Error('上传失败'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败')),
    });
  });
}

// ========== Export ==========
export function exportExcel(sessionId) {
  return post('/api/export/excel', { session_id: sessionId });
}

export function exportCsv(sessionId) {
  return post('/api/export/csv', { session_id: sessionId });
}
