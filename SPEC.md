# 排班換班助手 (Shift Swapper) — 規格書 v1.0

> 2026-07-10 建檔 · 各行業通用 SaaS · 純前端 MVP

## 一、痛點與市場

台灣服務業 (餐飲/零售/醫療/物流/客服/健身房) 排班一直是 Excel 或 LINE 群組亂槍打鳥，業主與員工都痛苦：
- 業主：每月排班耗 4-8 小時；臨時異動要一個個私訊
- 員工：要換班要拜託同事 → 同事也要找代班 → 主管最後才知道
- 薪資：跨夜班/加班費/夜班津貼 Excel 常算錯

**賣點 (從圖標語)**：「員工自己就能搞定班表」 → **Self-service shift swap**

## 二、目標客戶 (各行業)

| 行業 | 班別類型 | 週工時上限 |
|---|---|---|
| 🍽️ 餐飲服務 | 早/午/晚/夜 4 班 | 48hr |
| 🛍️ 零售門市 | 早/中/晚 3 班 | 40hr |
| 🏥 醫療院所 | 白班/小夜/大夜 | 40hr |
| 🚚 物流倉儲 | 日班/夜班/加班 | 48hr |
| 📞 客服中心 | 早/中/晚 3 班 | 40hr |
| 💪 健身房 | 早場/午場/晚場/跨日 | 44hr |

## 三、產品定位

- **單一 dashboard**，依行業自動載入班別模板
- **員工自助**：自己看到班表、自己送出換班申請、自己請假
- **主管核准**：收到通知後一鍵同意/婉拒
- **即時同步**：localStorage + JSON (v1)，後端 v2 才接

## 四、技術架構 (純前端 MVP)

```
Stack:
- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 3 (顯式鎖版，避免 Tailwind 4 PostCSS issue)
- localStorage 模擬資料庫 (v1)
- 無後端、無金流、無登入
- Vercel Hobby plan deploy
```

**檔案結構**：
```
shift-swapper/
├── app/
│   ├── page.tsx              (主頁 7 tabs SPA, 41KB)
│   ├── layout.tsx            (Next 16 viewport export)
│   ├── globals.css           (theme tokens + animations)
│   └── lib/
│       ├── types.ts          (Industry/Shift/Swap/Leave 介面)
│       ├── industries.ts     (6 行業 preset + 班別定義)
│       ├── mockData.ts       (7 員工 + genShiftsForIndustry + MOCK_SWAPS/LEAVES)
│       └── format.ts         (formatDate/relativeTime/avatarFor)
├── vercel.json               (framework: "nextjs")
└── README.md
```

## 五、7 個核心模組

### 1. 🏠 首頁 (HomeView)
- 早安問候 + 今日班表大卡片
- 近期提醒 + 換班申請進度 (3-step indicator)
- 4 個快速操作 (換班/請假/班表/提醒)
- 本週班表 7-day grid

### 2. 📅 我的班表 (ScheduleView)
- 週切換 (上/本/下週)
- 統計卡：本週總時數 / 預估薪資 / 班數
- 完整班表 table (日期/班別/時間/時數/薪資/狀態)
- 跨夜班自動計算正確時數

### 3. 🔁 換班申請 (SwapsView)
- 新增換班申請 (選班/選對象/填原因)
- 我的換班列表
- 對方收到可一鍵同意/婉拒
- 狀態流：pending → manager-pending → approved

### 4. 🏥 請假申請 (LeaveView)
- 新增請假 (類型/起訖/原因)
- 病假/事假/特休 三種類型
- 我的請假列表 + 狀態

### 5. 💰 薪資明細 (PayrollView)
- 當月總時數/總班數/平均時薪/總薪資
- 班別明細 breakdown
- 下載按鈕 (UI mock, v2 接 PDF lib)

### 6. 👥 排班總覽 (TeamView)
- 7 員工 × 7 天 grid
- 每格顯示班別 + 時間
- 主管視角

### 7. ⚙️ 設定 (SettingsView)
- 顯示當前行業 + 班別定義
- 切換行業入口
- 重置所有資料

## 六、行業切換核心邏輯

**最關鍵**：`changeIndustry(id)` 不只更新 `industryId`，還會**重新生成對應行業的班表**：
```ts
function changeIndustry(id: IndustryId) {
  setState((s) => {
    if (id !== s.industryId) {
      const newShifts = genShiftsForIndustry(id, new Date());
      return { ...s, industryId: id, shifts: newShifts };
    }
    return { ...s, industryId: id };
  });
}
```

**沒有這個**：切到「醫療」後班表全空 (因為舊 restaurant 的 shiftTypeId 在 medical 找不到對應)。

## 七、變現路徑 (3 tier)

| Tier | 對象 | 價格 | 解鎖 |
|---|---|---|---|
| **Free** | 個人/微型店家 | NT$0 | 1 行業 / 5 員工 / 本地資料 |
| **Pro** | 中小企業 | NT$499/月 | 全部 6 行業 / 50 員工 / 雲端同步 |
| **Enterprise** | 連鎖/醫療集團 | NT$2,999/月 | 不限 / SSO / API / 排班 AI 建議 |

## 八、不做 (Explicit Non-Goals v1)

- ❌ 真實 LINE 推播 (v2 才接 Twilio/EngagePlus)
- ❌ GPS 打卡 / 上下班刷臉 (v2 才接)
- ❌ 自動排班 AI (v2 才接 GenAI)
- ❌ 多店家 / 多分公司 (v2 才接 org tree)
- ❌ Stripe 金流 (Pro 收款 v2 才接)

## 九、技術踩坑記錄

1. **Tailwind 4 PostCSS issue**: npm install tailwindcss@4 → build 失敗 (PostCSS plugin 已拆出)。修法：鎖版 tailwindcss@3。
2. **Next.js 15.0.3 漏洞警告**: Vercel 拒絕 deploy。修法：`npm install next@latest`。
3. **行業切換班表全空**: 沒重新生成 shifts → 舊 shiftTypeId 找不到。修法：`genShiftsForIndustry(id, date)` 每次切換都重建。
4. **vercel.json framework 預設壞**: 已記錄在 .hermes/skills，重用 #2-#5 學到的經驗，第一次就 deploy 成功。

## 十、Done Criteria (8/8 完成)

- [x] 6 行業 preset 完整定義
- [x] 行業切換自動重組班別
- [x] 7 員工 14 天班表生成
- [x] 換班申請流程 (送出/同意/婉拒/狀態)
- [x] 請假申請 (病/事/特 三類)
- [x] 薪資計算 (含跨夜)
- [x] 7 員工 × 7 天 grid 排班總覽
- [x] 純前端 / Vercel deploy / 200 OK
