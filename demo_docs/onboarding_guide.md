# 新人入職指南

## 帳號申請

新人報到第一週需完成以下帳號申請：

- **GitHub**：向 IT 提交申請表，填寫部門與職稱，審核約 1 個工作天
- **Slack**：HR 會在報到當天寄送邀請信，加入後請先加入 #general 與所屬部門頻道
- **Jira**：由直屬主管開通，預設為 Developer 權限
- **AWS Console**：需填寫資安申請單，經資安長審核後開通，約 3 個工作天

## 開發環境設定

請依照以下順序完成本機環境設定：

1. 安裝 Node.js 20 與 Python 3.12
2. Clone 專案後執行 `npm install` 與 `pip install -r requirements.txt`
3. 複製 `.env.sample` 為 `.env` 並填入對應金鑰
4. 執行 `docker compose up -d` 啟動本地服務

如遇問題請先查閱 Confluence 的 FAQ 頁面，或在 #dev-help 頻道發問。

## 試用期目標

前三個月的主要目標：

- 第一個月：熟悉程式碼架構與開發流程，完成至少 2 個小功能
- 第二個月：獨立負責一個 feature，從設計到上線
- 第三個月：參與 code review，開始 mentor 更新的成員

## 請假與工時

- 工時為彈性上班，核心時段為 10:00–16:00
- 請假需提前在 HR 系統申請，並在 Slack 的 #leave 頻道通知
- 年假第一年依比例計算，試用期滿後開始累積
