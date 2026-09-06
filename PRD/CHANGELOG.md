# CHANGELOG · shift-swapper

> 規格書版本演進：v1.0 → v3.0.2 (fleet hardening)
> 完整規格書見 [`PRD/SPEC.md`](./SPEC.md)

---

## v3.0.2 · 2026-09-07 · fleet hardening (Batch 8B)

**Patch 性質**：純部署面 / CI 面 hardening，不變更產品 spec。

### Added
- `PRD/SPEC.md` — v3.0.2 patched 規格書（v1.0 全部 10 章 + v3.0.2 patch header）
- `PRD/CHANGELOG.md` — 本檔案（v1.0 / v3.0.2 變更日誌）
- `.github/workflows/ci.yml` — 4-job CI（lint / test / build / deploy to GitHub Pages）

### Removed
- `SPEC.md`（root）— 已移至 `PRD/SPEC.md`（避免 v1.0 / v3.0.2 雙版本混淆）

### Changed
- 部署契約：補上 GitHub Pages deploy job（`actions/deploy-pages@v4` + `upload-pages-artifact@v3`）
- 觸發條件：`push to main` + `pull_request` + `workflow_dispatch`
- Pages 部署目標：Next.js 16 static export（`next build` → `.next/`）

### Stack
- Next.js `^16.2.10`
- React `^19.0.0-rc-66855b96-20241106`
- TypeScript `^5.9.3`（strict）
- Tailwind `^3.4.19`（鎖版：tailwindcss@4 與 PostCSS plugin 衝突）
- vercel.json：`{ "framework": "nextjs", "buildCommand": "next build" }`

### Validation
- `app/page.tsx` 41 KB — Next.js client component（`useState` + `useEffect` + localStorage）
- `app/lib/` — `format.ts` / `industries.ts` / `mockData.ts` / `types.ts`
- 6 行業 preset（餐飲 / 零售 / 醫療 / 物流 / 客服 / 健身房）
- 7 員工 14 天班表 mock
- 換班 / 請假 / 薪資 / 排班總覽 / 設定 7 個 tab
- 觸發分支：`main`

### Risk
- 預設分支若改為 `master`，需更新 `ci.yml` 觸發條件為 `[main, master]`
- Next.js 16 + React 19 RC 為前沿版本，社群資源尚少，部署踩坑風險中等
- Tailwind 4 已發布但 PostCSS plugin 仍未穩，故鎖 v3.4.19
- v1.0 已有 vercel.json，Vercel 部署可繼續運作；Pages 為 v3.0.2 新增的雙軌部署

---

## v1.0 · 2026-07-10 · initial spec

初版規格書（各行業通用 SaaS 定位）：
- 目標：台灣服務業（餐飲/零售/醫療/物流/客服/健身房）排班
- 痛點：業主每月排班耗 4-8 小時 / 員工換班要拜託同事 / 薪資 Excel 常算錯
- 解決方案：6 行業 preset + 員工自助換班 + 主管一鍵核准 + 跨夜班自動計算
- 變現：Free / Pro NT$499/月 / Enterprise NT$2,999/月
- Stack：Next.js 16 + React 19 RC + TS 5.9 + Tailwind 3.4 + localStorage
- 部署：Vercel（既有 vercel.json）

### 結果
- v1.0 規格階段完成
- 2026-09-07 由 fleet Batch 8B 升級為 v3.0.2（部署面 hardening）
