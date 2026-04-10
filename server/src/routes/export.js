const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { getSessionById, getSubmittedRecordsBySession } = require('../models/queries');

// GET /api/export/excel?session_id=xxx - export to Excel
router.get('/excel', (req, res) => {
  const session_id = req.query.session_id || req.body?.session_id;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id 必填' });
  }

  const session = getSessionById(Number(session_id));
  if (!session) {
    return res.status(404).json({ error: '试验不存在' });
  }

  const records = getSubmittedRecordsBySession(session_id);
  if (records.length === 0) {
    return res.status(400).json({ error: '没有已提交的记录可导出' });
  }

  const data = records.map(r => ({
    '记录ID': r.id,
    '问题描述': r.summary || '',
    '问题类型': r.problem_type || '',
    '严重程度': r.severity || '',
    '详细描述': r.details || '',
    '原始文字': r.raw_text || '',
    '编辑后文字': r.edited_text || '',
    'GPS纬度': r.gps_lat || '',
    'GPS经度': r.gps_lng || '',
    '地址': r.gps_address || '',
    '天气': r.weather || '',
    '发生时间': r.occurred_at || '',
    '状态': r.status,
    '创建时间': r.created_at,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
    { wch: 30 }, { wch: 40 }, { wch: 40 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 20 },
    { wch: 8 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '路测记录');

  // Add session info sheet
  const sessionInfo = [{
    '项目ID': session.project_id,
    '测试人员': session.tester,
    '测试日期': session.test_date,
    '车辆信息': session.vehicle_info || '',
    '测试路线': session.route || '',
    '状态': session.status,
  }];
  const ws2 = XLSX.utils.json_to_sheet(sessionInfo);
  XLSX.utils.book_append_sheet(wb, ws2, '试验信息');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="roadtest-${session_id}-${Date.now()}.xlsx"`);
  res.send(buf);
});

// GET /api/export/csv?session_id=xxx - export to CSV
router.get('/csv', (req, res) => {
  const session_id = req.query.session_id || req.body?.session_id;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id 必填' });
  }

  const session = getSessionById(Number(session_id));
  if (!session) {
    return res.status(404).json({ error: '试验不存在' });
  }

  const records = getSubmittedRecordsBySession(session_id);
  if (records.length === 0) {
    return res.status(400).json({ error: '没有已提交的记录可导出' });
  }

  const data = records.map(r => ({
    '记录ID': r.id,
    '问题描述': r.summary || '',
    '问题类型': r.problem_type || '',
    '严重程度': r.severity || '',
    '详细描述': r.details || '',
    '原始文字': r.raw_text || '',
    'GPS纬度': r.gps_lat || '',
    'GPS经度': r.gps_lng || '',
    '天气': r.weather || '',
    '状态': r.status,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  const csv = XLSX.utils.sheet_to_csv(ws);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="roadtest-${session_id}-${Date.now()}.csv"`);
  // Add BOM for Excel to recognize UTF-8
  res.send('\ufeff' + csv);
});

module.exports = router;
