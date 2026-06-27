# 禾笙文理補習班 - 開發紀錄

## 專案資訊
- **Framework**: Angular 21
- **CSS**: Tailwind CSS v3
- **專案路徑**: `frontend/`

---

## 已完成功能

### 頁面 (Routes)

| 路由 | 頁面名稱 | 說明 |
|------|---------|------|
| `/` | Home 首頁 | 一頁式響應式招生頁面 |
| `/register` | Register 登入/註冊 | Tab 切換登入/註冊 |
| `/register-details` | Register Details 學生註冊詳細資料 | 第二步驟註冊表單 |
| `/faculty` | Faculty 師資團隊 | 師資介紹詳情頁面 |
| `/course-details` | Course Details 詳細課程介紹 | 課程詳細頁面 |
| `/student` | Student Profile 學生會員中心 | 登入後的學生首頁 |
| `/leave-makeup` | Leave Makeup 請假與補課管理 | 請假補課管理頁面 |
| `/communication-book` | Communication Book 數位聯絡簿 | 聯絡簿詳細頁面 |
| `/admin/banners` | Admin Banners 輪播管理 | Banner CRUD + 圖片上傳 (上限6張) |
| `/admin/about-cards` | Admin About Cards 卡片管理 | 關於我們卡片 CRUD (上限5張) |
| `/admin/teachers` | Admin Teachers 師資管理 | 師資介紹 CRUD + 圖片上傳 |
| `/admin/honors` | Admin Honors 榜單管理 | 歷年榜單 CRUD (上限40名) |
---

### 功能清單

#### 首頁 (Home)
- [x] Navbar - 導航列（Logo + 註冊/登入按鈕）
- [x] Hero 區塊 - Banner 輪播（6張圖片，每5秒自動切換 + 手動切換）
- [x] About 區塊 - 我們的使命 + 老闆的話
- [x] Teachers 區塊 - 師資介紹（卡片式）+ 連結到 /faculty
- [x] Courses 區塊 - 課程內容（國小部/國中部 + 科目網格）+ 連結到 /course-details
- [x] Honors 區塊 - 歷年榜單（40位學生資料 + 展開/收合功能）
- [x] Footer - 頁尾
- [x] 浮動客服按鈕
- [x] 響應式設計（手機/平板/桌機）
#### 後台管理 (Admin Panel)
- [x] 整合至 `/register` 登入流程
  - [x] 輸入 admin / admin 自動跳轉後台 `/admin/banners`
  - [x] 一般使用者維持原有流程 → `/student`
  - [x] 表單驗證與錯誤提示
- [x] 後台 Layout (`/admin`)
  - [x] 可收合側邊欄導航
  - [x] 四個管理模組選單（Banner / 關於我們 / 師資 / 榜單）
  - [x] 登出功能 + 回到前台連結
  - [x] 未登入自動跳轉登入頁
- [x] Banner 輪播管理 (`/admin/banners`)
  - [x] 卡片式列表展示（圖片預覽 + 標題 + 排序編號）
  - [x] 新增/編輯 Modal（標題、圖片上傳預覽、連結URL）
  - [x] 顯示/隱藏切換
  - [x] 上移/下移排序
  - [x] 刪除確認
  - [x] 上限 6 張限制
- [x] 關於我們卡片管理 (`/admin/about-cards`)
  - [x] 卡片式列表展示（圖示 + 標題 + 內容預覽）
  - [x] 新增/編輯 Modal（標題、內容、圖示選擇器 10 種）
  - [x] 顯示/隱藏切換
  - [x] 上移/下移排序
  - [x] 刪除確認
  - [x] 上限 5 張限制
- [x] 師資介紹管理 (`/admin/teachers`)
  - [x] 卡片式列表展示（形象照 + 姓名 + 科目 + 格言）
  - [x] 新增/編輯 Modal（姓名、科目選擇、職稱、格言、完整說明）
  - [x] 形象照上傳預覽
  - [x] 生活照上傳預覽
  - [x] 顯示/隱藏切換
  - [x] 上移/下移排序
  - [x] 刪除確認
- [x] 歷年榜單管理 (`/admin/honors`)
  - [x] 表格列表展示（姓名、學校、科系、年度、考試類型）
  - [x] 新增/編輯 Modal（學生姓名、學校、科系、年度、考試類型）
  - [x] 上移/下移排序
  - [x] 刪除確認
  - [x] 上限 40 名限制

#### 登入/註冊 (Register)
- [x] Tab 切換（登入 / 註冊）
- [x] 密碼顯示/隱藏 toggle
- [x] 第三方登入（Line, Google, Apple）
- [x] 「登入帳號」→ 跳轉 /student
- [x] 「立即註冊」→ 跳轉 /register-details
- [x] 響應式設計

#### 學生註冊詳細資料 (Register Details)
- [x] 學生姓名輸入
- [x] 出生年月日選擇
- [x] 家長姓名輸入
- [x] 聯絡電話輸入
- [x] 目前年級選擇
- [x] 就讀學校輸入
- [x] 感興趣科目多選（數學/英文/理化/國文）
- [x] 第三方快速註冊
- [x] 響應式設計

#### 師資團隊 (Faculty)
- [x] 搜尋功能（老師姓名/科目）
- [x] 篩選功能（全部/數學/英文/理化/國文）
- [x] 師資卡片列表（13位老師）
- [x] 老師詳細 Modal（點擊「了解更多」顯示）
  - [x] 形象照 + 基本資訊
  - [x] 名言 Highlight
  - [x] 「老師的話」完整說明
  - [x] 生活照展示（部分老師）
- [x] 「聯絡導師」按鈕
- [x] 響應式設計
- [x] 使用真實老師照片（形象照 + 生活照）

#### 首頁師資區塊 (Home Teachers)
- [x] 精選4位老師展示（程昊、秦清、Eva、段諭）
- [x] 使用真實老師照片
- [x] 點擊卡片 → 連結到 /faculty 並自動滾動到該老師
- [x] 連結到 /faculty 詳細頁面

#### 學生會員中心 (Student Profile)
- [x] 個人資訊區塊（頭像/姓名/年級）
- [x] 學習進度（進度條）
- [x] 我的課程（今日課程卡）
- [x] 考試成績快捷
- [x] 作業進度快捷
- [x] 最新公告
- [x] 底部導航欄（所有會員頁面共用）：
  - [x] 首頁 → `/` 
  - [x] 請假補課 → `/leave-makeup`
  - [x] QR掃描 → (UI 完成)
  - [x] 聯絡簿 → `/communication-book`
  - [ ] 個人檔案 → (待開發)
- [x] 浮動客服按鈕
- [x] 響應式設計

#### 請假與補課管理 (Leave Makeup)
- [x] 頁面header（返回按鈕 + 標題 + 幫助按鈕）
- [x] 請假申請快捷區塊
- [x] 請假紀錄列表（已核准/待審核）
- [x] 補課安排月曆
- [x] 即將到來的補課資訊
- [x] 補課規範說明區塊
- [x] 底部導航欄
- [x] 浮動客服按鈕
- [x] 響應式設計

#### 數位聯絡簿 (Communication Book)
- [x] 頁面header（返回按鈕 + 標題 + 通知按鈕）
- [x] 學生資訊卡片（頭像/姓名/班級/學號）
- [x] 週曆選擇器
- [x] 今日表現（專注度/課堂互動/作業完成）
- [x] 老師評語
- [x] 今日作業列表
- [x] 提醒事項
- [x] 家長回饋與簽署區塊
- [x] 底部導航欄
- [x] 浮動客服按鈕
- [x] 響應式設計

#### 詳細課程介紹 (Course Details)
- [x] Tab 切換（國小部 / 國中部）
- [x] 國小部課程（資優數學、全美語、創意作文）
- [x] 國中部課程（理化衝刺、會考英文）
- [x] 早鳥報名優惠區塊
- [x] 浮動客服按鈕
- [x] 響應式設計

---

### UI/UX 設計

- [x] Tailwind CSS 整合
- [x] 自定義主題色彩（primary: #27889b, accent-gold: #D9B44A）
- [x] Material Symbols Outlined 字體
- [x] Manrope 字體
- [x] Dark Mode 支援
- [x] 響應式斷點（md: 768px, lg: 1024px, xl: 1280px）
- [x] 圖片使用 aspect-ratio 避免裁切

---

## 素材管理

### 圖片資源 (public/)

| 資料夾 | 內容 | 說明 |
|--------|------|------|
| `public/banners/` | 6張輪播圖 | 首頁 Hero Banner |
| `public/teachers/` | 13位老師形象照 | `{姓名}_photo.jpg` |
| `public/teachers/` | 13張生活照 | `{姓名}_life.jpg` |

### 來源資料夾
- `素材/首頁資訊/1_hero/` - Banner 圖片
- `素材/首頁資訊/2_about/` - 關於我們內容（about.docx）
- `素材/首頁資訊/3_teachers/` - 老師照片（形象照 + 生活照）
- `素材/榜單.xlsx` - 歷年榜單資料（40位學生）

---

---

## 待開發功能

### 高優先級
- [x] 取得 domain name → 設定 HTTPS（nginx + Let's Encrypt）
- [x] 更新 environment.ts apiUrl 為 HTTPS domain → redeploy Firebase
- [x] 我的課程頁面 (UI only)
- [ ] QR 掃描功能
- [x] 個人檔案/編輯頁面（/edit-profile）
- [ ] 訊息功能
- [x] 分校管理（branches CRUD + courses/students/teachers 外鍵 + 前台篩選）
- [x] 註冊流程大修（依 `家長創建帳號所需資料.md` 規格）
  - [x] 補上性別、班級、家長2、住家電話、身分證字號欄位
  - [x] register.ts + register-details.ts 串接後端 API
  - [x] 註冊成功後自動登入跳轉
- [x] 數位聯絡簿串 API
  - [x] 學生資訊 + 週曆從 API 載入
  - [x] 表現/評語/作業/提醒從 API 載入
  - [x] 家長回饋簽署串 API
- [x] Admin 後台數位聯絡簿管理
  - [x] AdminCommunication component（學生下拉、日期、評分 slider、作業/提醒動態增刪）
  - [x] 側邊欄新增「數位聯絡簿」入口

### 中優先級
- [x] 自動 refresh token（401 時靜態換 token）
- [x] 學生個人資料編輯頁面（/edit-profile）
- [ ] Excel 種子資料匯入（seed script）
- [ ] 忘記密碼功能
- [x] 表單驗證（登入/註冊/聯絡簿）

### 低優先級
- [ ] Dark Mode 切換開關
- [ ] 多語言支援
- [ ] PWA 支援

---

## 參考檔案
- `stitch_html_code_example/index.html` - 首頁參考
- `stitch_html_code_example/register.html` - 登入/註冊參考
- `stitch_html_code_example/register_details.html` - 註冊詳細資料參考
- `stitch_html_code_example/faculty_profiles.html` - 師資團隊參考
- `stitch_html_code_example/student_profiles.html` - 學生會員中心參考
- `stitch_html_code_example/communication_book.html` - 數位聯絡簿參考

---

## 執行指令

```bash
# 進入前端目錄
cd frontend

# 開發伺服器
npm start
# 訪問 http://localhost:4200

# 建置生產版本
npm run build
```

---

*最後更新：2026-06-07*

## 版本紀錄

### v1.9.0 (2026-06-06) - 學生個人資料編輯頁面
- 新增 `/edit-profile` 路由 + EditProfile component
  - 大頭貼 + 姓名 + email header（同首頁風格）
  - 完整編輯表單：姓名、性別、生日、年級、學校、班級、家長資訊、電話、身分證、興趣科目
  - 儲存按鈕串接 `PUT /student/me`，成功/失敗訊息提示
- 底部導航「個人資料」連結從 `/student` 改為 `/edit-profile`（三個學生頁面同步更新）
- 首頁 `/student` 保留原有儀表板功能不變

### v1.10.0 (2026-06-07) - 數位聯絡簿後台功能修正
- 修復班級共用欄位同步中斷（syncToStudents 加入 lastSynced 比對機制）
- 移除考試分數 input spinner 箭頭（新增 .no-spinner CSS）
- 講義欄位 → 作業下拉選單（完成/未完成/沒帶/請假）
- 後端欄位 handout_completed(bool) → handout_status(varchar)
- 輔導課欄位改為可手動切換的下拉選單（是/否）

### v1.11.0 (2026-06-07) - Admin 後台滾動行為優化
- 外層容器 `h-screen` → `min-h-screen`，改為瀏覽器原生 scroll
- Sidebar 改 `sticky top-0 h-screen`，不再跟隨頁面滾動
- 右側容器移除 `overflow-y-auto`，統一由瀏覽器處理滾動
- `<main>` 補回 `flex-1`，短內容時仍撐滿版
- 僅一支 browser scroll bar，滑鼠在任何位置滾輪皆有效

### v1.8.0 (2026-06-06) - 自動 Refresh Token 機制
- 前端 auth interceptor 全面改寫：API 回傳 401 時自動用 refresh_token 換新 token
- 多重請求同時 401 只 refresh 一次，全部排隊等新 token
- Refresh 成功後自動重試原始請求，使用者完全無感
- Refresh 也失效（閒置超過 30 天）才導回登入頁

### v1.7.0 (2026-06-06) - 多分校管理系統
- 新增 `branches` 表（名稱/電話/地址/啟用）+ 自動 migration
- 後端 Branch CRUD API（`GET/POST/PUT/DELETE /admin/branches`）
- `courses` 新增 `branch_id` FK（取代純文字 location）
- `students`、`teachers` 新增 `branch_id` FK
- 前端 AdminBranches component：表格展示（序號/名稱/電話/地址/啟用/管理）
- 課程管理表單：文字 location → 分校下拉選單，列表顯示分校名稱
- 師資管理表單：新增所屬分校下拉
- 師資團隊頁面（`/faculty`）：新增分校篩選按鈕
- 側邊欄新增「分校管理」選單項

### v1.6.0 (2026-05-23) - 排課系統建置（課程/選課管理）
- 後端 DB schema 擴充：`courses` 表新增 7 個排課欄位（grade_level/day_of_week/start_time/end_time/location/school_year/semester）
- 後端 Admin 課程 CRUD API（`GET/POST/PUT/DELETE /admin/courses`）
- 後端 Admin 選課管理 API（`GET/POST/DELETE /admin/enrollments`）
- 後端 Admin 課程篩選 API（`GET /admin/course-filters`）＋學生依課程篩選（`GET /admin/students?course_id=`）
- AdminCourses 前端頁面：課程列表、篩選（學部/年級/科目）、CRUD Modal
- AdminEnrollments 前端頁面：課程下拉 → 學生列表 + 加入/移除
- 聯絡簿整合課程篩選：溝通管理 Tab 新增課程 dropdown 過濾學生

### v1.5.0 (2026-05-23) - 學生專區 API 化 + 頭像 + 簽署鎖定
- 學生專區資訊全面改為 API 載入（profile/progress/courses/exams/homework/announcements）
- 頭像 fallback：無 avatar_url 時顯示姓名首字彩色圓底（Gmail 風格）
- 頭像上傳功能：點擊頭像 → 上傳 → 即時更新
- 底部導航「個人檔案」button 改為 routerLink（3 頁面）
- 家長簽署鎖定：已簽署後表單隱藏 + 後端 403 雙層保護
- Admin 檢視回饋 Tab 完整實作

### v1.4.0 (2026-05-23) - 註冊流程大修 + 數位聯絡簿 API 串接 + Admin 後台
- 登入/註冊表單補上 Enter 鍵提交、密碼顯示/隱藏
- 兩步驟註冊改為 Step1 email+password → Step2 完整學生資料表單
- 註冊成功後自動登入並跳轉 /student
- 數位聯絡簿全面改為 API 資料源（entries、weekly、feedback）
- 日曆日期改為本地時間顯示（`5月23日` 格式）
- 新增 StudentAuthGuard 保護 `/student`、`/communication-book`
- 已登入學生 Navbar 顯示「學生專區」按鈕
- 後台 Admin 側邊欄新增「數位聯絡簿」管理
- AdminCommunication component：學生下拉、日期選擇、評分 slider、作業/提醒動態增刪
- 修復 `[class.xxx]` 多 class 綁定導致 `DOMTokenList` 噴錯（全部改用 `[ngClass]`）
- 修復 Upload 圖片 Mixed Content（HTTP→HTTPS）
- 修復 科目 tab 切換、教師列表 500、Faculty 圖片自適應

### v1.3.0 (2026-05-16) - HTTPS 上線 & Bug 修復
- 取得 domain `www.gateway2go.bbroot.com` → 後來換為 `gateway2go.cc.cd`
- VM 固定 IP → `34.4.109.26`
- VM 安裝 nginx + Let's Encrypt（certbot），成功啟用 HTTPS
- 修復 nginx HTTP/1.0 CORS preflight bug（加上 `proxy_http_version 1.1`）
- 修復 `.env` CORS_ORIGINS 未包含新網域導致 preflight 被拒
- 更新 `environment.ts` apiUrl → `https://api.gateway2go.bbroot.com/api/v1` → 最終 `https://api.gateway2go.cc.cd/api/v1`
- 更新後端 CORS origins 加入新網域
- 重 build 並 deploy 前端至 Firebase

### v1.2.0 (2026-05-16) - 前後端 API 串接 & 部署
- 前端 Angular 串接所有後端 API（登入、Banner/About/Teachers/Honors CRUD、圖片上傳）
- 新增 ApiService / AuthService / authInterceptor（JWT Bearer token）
- 前台 Hero / About / Teachers / Honors / Faculty 改為 API 資料源
- Admin Layout 改為 JWT + role 驗證
- 修復 `register.ts` admin → admin@cramschool.com 映射
- 部署前端至 Firebase Hosting（https://cramschool-b4d52.web.app）
- 加入 HTTPS TODO（mixed content blocking：前端 HTTPS 呼叫後端 HTTP）

### v1.1.0 (2026-05-01) - 後台管理面板
- 後台登入整合至 `/register` 登入流程（admin / admin → 後台）
- 新增後台 Layout（可收合側邊欄 + 四個管理模組）
- 新增 Banner 輪播管理（CRUD + 圖片上傳 + 排序，上限6張）
- 新增關於我們卡片管理（CRUD + 圖示選擇器 + 排序，上限5張）
- 新增師資介紹管理（CRUD + 形象照/生活照上傳 + 排序，13位老師）
- 新增歷年榜單管理（CRUD + 表格展示 + 排序，上限40名）
- 路由設定：`/admin/banners`、`/admin/about-cards`、`/admin/teachers`、`/admin/honors`
- 修復：router-outlet 內 @for 列表僅顯示第一項的變更偵測 bug（加入 ChangeDetectorRef）

### v1.0.0 (2026-04-25) - 靜態網頁發布
- 首頁完成（含 Banner 輪播、關於我們、師資介紹、課程、榜單）
- 師資團隊頁面（13位老師、Modal 展示、生活照）
- 學生會員中心（含底部導航）
- 請假補課頁面
- 數位聯絡簿頁面
- 所有頁面響應式設計

### v2.0.0 (2026-06-27) - 0622 客戶需求第二階段修改 (CP2~CP13)
- **CP2**: 註冊管理移除 email 欄、顯示第二位家長電話
- **CP3**: 學生姓名點擊彈窗顯示完整詳細資料
- **CP4**: 考試分數輸入 Enter/↓ 縱向跳行（含自訂欄位循環）
- **CP5**: 調課 (交換) 選項 + 日期選擇器（前端 + 後端 reschedule_date 欄位）
- **CP6**: 選課學生搜尋改用 input + 下拉，僅顯示「在籍」學生
- **CP7**: 從其他課程整批複製學生（含後端 batch-copy API）
- **CP8**: 課程篩選依年級對應科目（GRADE_SUBJECT_MAP）
- **CP9**: 報名註冊管理排序改為註冊日期舊→新
- **CP10**: 匯出 Excel (CSV) 移至報名註冊管理頁面
- **CP11**: 學生聯絡簿加入日期選擇器 (input type date)
- **CP12**: 編輯個人資料家長2排版比照家長1（姓名/稱謂同行、電話獨立）
- **CP13**: 同日多筆聯絡簿全部顯示，每堂課加 border-2 外框

### v2.1.0 (2026-06-27) - 聯絡簿模板：國中數學 + 英文單字改名
- **CP14**: 新增「國中數學模板」按鈕，作業狀態改為「講義作業」+「題本作業」兩個下拉選單
  - 題本作業選項：完成、未完成、無計算過程、未帶、請假
  - 講義作業沿用既有 handout 選項
- **CP15**: 英文模板「英語背誦」欄位名稱改為「英文單字」
- 後端新增 `homework_material` / `homework_workbook` 兩欄位 + 自動 migration
- 學生聯絡簿頁面同步顯示講義作業/題本作業
