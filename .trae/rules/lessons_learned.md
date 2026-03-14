---
alwaysApply: false
---

---
alwaysApply: false
---

# Kiwi TCMS 项目经验教训

## 认证问题
- 错误做法：直接在 URL 中传 user:pass@host
- 正确做法：使用 tcms-api 库的 TCMSXmlrpc + login()

## TestCase 创建/删除
- 删除失败：TestCase.remove() 需要传字典 {'id': case_id}
- 创建失败：需要 case_status 字段

## create_date 序列化
- Kiwi TCMS 返回对象格式 {"value": "20260314T16:17:52"}

## 分类字段隐藏
- 智驾场景不需要分类，前端自动使用默认分类

## 自定义字段
- Kiwi TCMS 原生不支持，用 notes 字段存 JSON

