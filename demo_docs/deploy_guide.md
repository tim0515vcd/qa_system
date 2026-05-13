# 部署與發布流程

## 發布前檢查清單

每次發布前必須確認以下項目：

- 所有 PR 已通過 code review 並 merge 至 main
- CI pipeline 全部綠燈（unit test、integration test、lint）
- 已在 staging 環境完成 QA 驗證
- release note 已更新至 Confluence
- 通知相關 stakeholder 發布時間

## 正式發布步驟

1. 在 GitHub 建立新的 release tag，格式為 `v{major}.{minor}.{patch}`
2. GitHub Actions 自動觸發 build 並推送 Docker image 至 ECR
3. 登入 AWS Console，至 ECS 服務執行 rolling update
4. 觀察 CloudWatch 監控，確認 error rate 無異常
5. 在 Slack #deploy 頻道發送發布完成通知

## Rollback 流程

若發布後發現嚴重問題，執行以下 rollback：

1. 立即在 #incident 頻道通知全團隊
2. 至 ECS 將 task definition 切回前一個穩定版本
3. 確認服務恢復正常後，記錄 rollback 原因至 Jira
4. 安排 post-mortem 會議，於 48 小時內完成根因分析

## 發布時間規範

- 正式環境發布限定在週二至週四 10:00–16:00
- 週五、假日前一天禁止發布（避免無人值班時出現問題）
- 緊急修復（hotfix）需經 Tech Lead 批准後才可在管制時間外發布
