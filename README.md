# 排班換班助手 (Shift Swapper)

> 各行業通用 SaaS · 純前端 MVP · Vercel Hobby Plan

## 適用行業

- 🍽️ 餐飲服務 — 早/午/晚/夜 4 班
- 🛍️ 零售門市 — 早/中/晚 3 班
- 🏥 醫療院所 — 白班/小夜/大夜
- 🚚 物流倉儲 — 日班/夜班/加班
- 📞 客服中心 — 早/中/晚 3 班
- 💪 健身房 — 早場/午場/晚場/跨日

## 功能模組 (7 個)

1. 🏠 **首頁** — 今日班表 + 提醒 + 換班進度 + 快速操作
2. 📅 **我的班表** — 週切換 + 統計卡 + 完整班表 table
3. 🔁 **換班申請** — 自助送出 → 對方同意 → 主管核准
4. 🏥 **請假申請** — 病假/事假/特休
5. 💰 **薪資明細** — 月總覽 + 班別 breakdown
6. 👥 **排班總覽** — 7×7 grid (主管視角)
7. ⚙️ **設定** — 行業切換 + 資料重置

## 技術

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 3 (鎖版避免 v4 PostCSS 問題)
- localStorage 模擬資料庫
- Vercel Hobby Plan

## 本地開發

```bash
npm install
npm run dev
```

## 部署

```bash
npx vercel --prod
```

## 規格書

詳見 [SPEC.md](./SPEC.md)

## 線上演示

https://shift-swapper.vercel.app
