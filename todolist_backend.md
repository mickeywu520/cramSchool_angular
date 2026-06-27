# 禾笙文理補習班 - 後端開發紀錄

## 專案資訊
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0 (Async)
- **資料庫**: SQLite
- **認證**: JWT (Access + Refresh Token)
- **部署目標**: GCP Cloud Run (e2-micro, 1G RAM)
- **專案路徑**: `backend/`

---

## 已完成功能

### 核心設定
- [x] `requirements.txt` - Python 依賴管理
- [x] `app/config.py` - 環境變數設定 (SECRET_KEY, DB_URL, TOKEN 時效)
- [x] `app/database.py` - SQLite 非同步連線引擎
- [x] `app/main.py` - FastAPI 應用入口 (CORS, Router 註冊, 生命週期)

### SQLAlchemy ORM 模型 (18 張表)

| 檔案 | 表名 | 說明 |
|------|------|------|
| `app/models/user.py` | `users` | 使用者帳號 (email, 密碼雜湊, 角色, 啟用狀態) |
| `app/models/student.py` | `students` | 學生資料 (姓名, 生日, 家長, 學校, 年級, 興趣科目) |
| `app/models/teacher.py` | `teachers` | 老師資料 (姓名, 科目, 職稱, 格言, 簡介, 照片) |
| `app/models/course.py` | `courses` | 課程資訊 (名稱, 類別, 科目, 價格, 早鳥優惠) |
| `app/models/enrollment.py` | `enrollments` | 報名紀錄 (學生-課程關聯, 狀態) |
| `app/models/leave.py` | `leave_applications` | 請假申請 (日期, 類型, 審核狀態) |
| `app/models/makeup.py` | `makeup_classes` | 補課安排 (日期, 時間, 教室) |
| `app/models/communication.py` | `communication_book_entries` | 聯絡簿 (評分, 老師評語) |
| `app/models/homework.py` | `homework_records` | 作業紀錄 (科目, 內容, 截止日) |
| `app/models/reminder.py` | `reminders` | 提醒事項 (內容, 優先級) |
| `app/models/parent_feedback.py` | `parent_feedback` | 家長回饋 (回饋內容, 簽名狀態) |
| `app/models/exam_score.py` | `exam_scores` | 考試成績 (名稱, 科目, 分數, 滿分) |
| `app/models/announcement.py` | `announcements` | 公告 (標題, 內容, 優先級, 目標角色) |
| `app/models/honor.py` | `honors` | 榜單 (學生姓名, 學校, 科系, 年度) |
| `app/models/banner.py` | `banners` | 首頁輪播 (標題, 圖片URL, 連結) |
| `app/models/about_card.py` | `about_cards` | 關於我們卡片 (標題, 內容, 圖示) |
| `app/models/branch.py` | `branches` | 分校 (名稱, 電話, 地址, 啟用, 排序) |
| `app/models/refresh_token.py` | `refresh_tokens` | JWT 刷新令牌 (令牌, 過期時間, 撤銷狀態) |

### Pydantic Schema (9 個模組)

| 檔案 | 說明 |
|------|------|
| `app/schemas/common.py` | 通用回應格式 (SuccessResponse, ErrorResponse, PaginatedResponse) |
| `app/schemas/auth.py` | 認證相關 (RegisterRequest, LoginRequest, TokenResponse, UserInfo) |
| `app/schemas/student.py` | 學生相關 (StudentResponse, ProgressResponse, ExamScoreResponse) |
| `app/schemas/teacher.py` | 老師相關 (TeacherResponse, TeacherListResponse) |
| `app/schemas/course.py` | 課程相關 (CourseResponse, CourseListResponse) |
| `app/schemas/leave.py` | 請假相關 (LeaveApplicationRequest, MakeupClassResponse) |
| `app/schemas/communication.py` | 聯絡簿相關 (CommunicationEntryResponse, FeedbackRequest) |
| `app/schemas/honor.py` | 榜單相關 (HonorResponse, HonorListResponse) |
| `app/schemas/announcement.py` | 公告相關 (AnnouncementResponse, AnnouncementCreateRequest) |
| `app/schemas/banner.py` | 輪播相關 (BannerResponse, BannerCreateRequest, BannerUpdateRequest) |
| `app/schemas/about_card.py` | 關於我們卡片 (AboutCardResponse, AboutCardCreateRequest, AboutCardUpdateRequest) |
| `app/schemas/branch.py` | 分校 (BranchResponse, BranchCreateRequest, BranchUpdateRequest) |

### 工具層 (Utils)

| 檔案 | 說明 |
|------|------|
| `app/utils/security.py` | JWT 建立/驗證, bcrypt 密碼雜湊 |
| `app/utils/exceptions.py` | 自訂例外類別 (NotFound, Unauthorized, Forbidden, Conflict, Validation) |

### 中介層 (Middleware)

| 檔案 | 說明 |
|------|------|
| `app/middleware/auth_middleware.py` | JWT 驗證依賴注入, 角色權限檢查 (student/teacher/admin) |

### 商業邏輯層 (Services)

| 檔案 | 說明 |
|------|------|
| `app/services/auth_service.py` | 註冊、登入、Token 刷新、登出 |
| `app/services/student_service.py` | 學生資料 CRUD、學習進度、課程/考試/作業查詢 |
| `app/services/teacher_service.py` | 老師列表、搜尋、篩選、精選推薦 |
| `app/services/course_service.py` | 課程列表、詳情、報名、退選 |
| `app/services/leave_service.py` | 請假申請 CRUD、審核、補課管理、請假規範 |
| `app/services/communication_service.py` | 聯絡簿查詢、週曆、家長回饋、老師建立紀錄 |

### API 路由 (Routers) - 13 個模組（含 admin 內 branch CRUD）

| 路由前綴 | 檔案 | 主要端點 |
|----------|------|---------|
| `/api/auth` | `routers/auth.py` | POST register, POST login, POST refresh, POST logout |
| `/api/student` | `routers/student.py` | GET me, PUT me, GET progress, GET courses, GET exams, GET homework |
| `/api/teachers` | `routers/teacher.py` | GET list (搜尋/篩選), GET featured, GET :id, POST create, PUT :id, DELETE :id |
| `/api/courses` | `routers/course.py` | GET list (類別/科目/早鳥), GET :id, POST enroll, POST drop |
| `/api/leave` | `routers/leave.py` | CRUD applications, GET rules, GET pending, POST review, GET/POST makeup |
| `/api/communication` | `routers/communication.py` | GET entries, GET weekly, GET :id, POST feedback, POST create entry |
| `/api/honors` | `routers/honor.py` | GET list (年度篩選), GET years, POST create, PUT :id, DELETE :id (上限40名) |
| `/api/announcements` | `routers/announcement.py` | GET list (角色篩選), GET :id, POST create |
| `/api/banners` | `routers/banner.py` | GET list, GET :id, POST create, PUT :id, PUT reorder, DELETE :id (上限6張) |
| `/api/about-cards` | `routers/about_card.py` | GET list, GET :id, POST create, PUT :id, PUT reorder, DELETE :id (上限5張) |
| `/api/upload` | `routers/upload.py` | POST image/{category} (avatars/teachers/banners/honors/general) |
| `/api/homepage` | `routers/homepage.py` | GET 首頁聚合資料 (Banner + About Cards + 公告 + 師資 + 榜單 + 早鳥課程) |

---

## 待開發功能

### 高優先級
- [x] Dockerfile (GCP Cloud Run 部署, e2-micro 1G RAM 優化)
- [x] `.env.example` 環境變數範例檔
- [x] `.dockerignore` 檔案
- [x] 資料庫初始化種子資料 (Seed Data)
- [x] 全域例外處理 Middleware
- [x] API 請求 Logging 中介層
- [x] `docker-compose.yml` 容器化啟動
- [x] `app/main.py` FastAPI 入口 (CORS, Router 註冊, 生命週期, 健康檢查)
- [x] 前端 API 串接測試
- [x] 修復 auth_service.py `_generate_tokens` bug（day out of range）
- [x] 取得 domain name → 設定 HTTPS（nginx + Let's Encrypt）
- [x] CORS origins 加入新的 HTTPS domain 後重啟 container
- [x] 修復 auth_service.py lazy load MissingGreenlet bug（加入 selectinload）
- [x] Student model 補上遺漏欄位（性別/班級/家長2/住家電話/身分證字號）
- [x] RegisterRequest Schema 更新（加入新欄位）
- [x] register_user service 儲存新欄位
- [x] StudentResponse / StudentUpdateRequest 更新（加入新欄位）
- [x] student_service get_student_response / update_student 更新
- [x] 資料庫 migration（_add_missing_columns 自動 ALTER TABLE）
- [x] 修復 communication router MissingGreenlet（lazy loading 改直接查詢）
- [x] `due_date` / `entry_date` 字串轉 Python `date.fromisoformat()`
- [x] `UNIQUE constraint` 回傳 409 友善提示
- [x] 新增 `GET /admin/students`（`require_teacher_or_admin`）
- [x] admin router 註冊至 `routers/__init__.py`

### 中優先級
- [ ] Firebase Auth 第三方登入整合
- [ ] 檔案上傳功能 (老師照片、學生頭像、Banner 圖片)
- [ ] 分頁 (Pagination) 通用支援
- [ ] API 速率限制 (Rate Limiting)
- [ ] 單元測試 (pytest + pytest-asyncio)
- [ ] API 文件自動生成 (Swagger UI 客製化)

### 低優先級
- [ ] 資料庫遷移工具 (Alembic)
- [ ] Redis 快取層
- [ ] 背景任務 (Background Tasks) - 排課通知
- [ ] 資料庫備份排程
- [ ] 從 SQLite 遷移到 PostgreSQL (視需求)

---

## 資料庫關聯圖

```
branches (1) ──── (N) courses
branches (1) ──── (N) students
branches (1) ──── (N) teachers

users (1) ──── (1) students
users (1) ──── (1) teachers
users (1) ──── (N) refresh_tokens

students (1) ──── (N) enrollments ──── (1) courses
students (1) ──── (N) leave_applications
students (1) ──── (N) makeup_classes
students (1) ──── (N) communication_book_entries
students (1) ──── (N) exam_scores

teachers (1) ──── (N) courses
teachers (1) ──── (N) communication_book_entries

courses (1) ──── (N) enrollments
courses (1) ──── (N) leave_applications
courses (1) ──── (N) makeup_classes

communication_book_entries (1) ──── (N) homework_records
communication_book_entries (1) ──── (N) reminders
communication_book_entries (1) ──── (1) parent_feedback
```

---

## API 角色權限矩陣

| 端點群組 | 未登入 | Student | Teacher | Admin |
|----------|--------|---------|---------|-------|
| Auth (register/login) | ✅ | ✅ | ✅ | ✅ |
| Teachers (瀏覽) | ✅ | ✅ | ✅ | ✅ |
| Courses (瀏覽) | ✅ | ✅ | ✅ | ✅ |
| Honors (瀏覽) | ✅ | ✅ | ✅ | ✅ |
| Homepage | ✅ | ✅ | ✅ | ✅ |
| Student (個人資料/進度) | ❌ | ✅ | ❌ | ❌ |
| Leave (學生端) | ❌ | ✅ | ❌ | ❌ |
| Communication (學生端) | ❌ | ✅ | ❌ | ❌ |
| Leave (審核) | ❌ | ❌ | ✅ | ✅ |
| Communication (建立) | ❌ | ❌ | ✅ | ✅ |
| Announcements (建立) | ❌ | ❌ | ✅ | ✅ |
| Banners (管理) | ❌ | ❌ | ✅ | ✅ |

---

## 執行指令

```bash
# 進入後端目錄
cd backend

# 建立虛擬環境
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 安裝依賴
pip install -r requirements.txt

# 啟動開發伺服器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 訪問 API 文件
# Swagger UI: http://localhost:8000/docs
# ReDoc:      http://localhost:8000/redoc

# 執行測試
pytest
```

---

## 版本紀錄

### v0.1.0 (2026-04-26) - 後端 API 基礎架構完成
- 建立 FastAPI 專案結構與核心設定
- 完成 16 張資料表 SQLAlchemy ORM 模型
- 完成 10 組 Pydantic Schema 驗證
- 完成 JWT 認證工具 (Access + Refresh Token)
- 完成角色權限中介層 (student/teacher/admin)
- 完成 6 個 Service 商業邏輯模組
- 完成 10 個 API Router (共 30+ 端點)
- 完成首頁聚合 API

### v0.2.0 (2026-05-01) - 首頁資訊管理 API 補完
- 新增 `about_cards` 資料表與 ORM 模型 (關於我們卡片)
- 新增 `schemas/about_card.py` Pydantic Schema
- 新增 `routers/about_card.py` 完整 CRUD + 排序 (上限 5 張)
- 修復 `routers/honor.py` 欄位名稱損毀問題
- 補完 `routers/banner.py`：新增 PUT /{id} 更新端點、6 張上限檢查、GET /all 管理端點
- 更新 `routers/homepage.py`：加入 about_cards 區塊
- 更新 `backend_api_sqlite_design.md`：補完 honors 管理端點、新增 about_cards 模組
- 更新 `todolist_backend.md`：反映 17 張表、12 個 Router 模組

### v0.3.0 (2026-05-16) - Docker 部署 & 基礎設施補完
- 新增 `Dockerfile` (Python 3.11-slim, 多階段建置, Cloud Run e2-micro 優化)
- 新增 `.env.example` 環境變數範例檔
- 新增 `.dockerignore` 檔案
- 新增 `docker-compose.yml` 容器化啟動 (專案根目錄)
- 新增 `app/main.py` FastAPI 應用入口 (CORS, Router 註冊, 生命週期, 健康檢查)
- 新增 `app/middleware/exception_handler.py` 全域例外處理 (統一錯誤回應格式)
- 新增 `app/middleware/logging_middleware.py` API 請求日誌中介層
- 新增 `app/seed.py` 資料庫種子資料腳本 (教師、課程、Banner、榜單、關於卡片、公告、管理員)

### v0.4.0 (2026-05-16) - 前端 API 串接 & Bug 修正
- 前端 Angular 串接所有後端 API：
  - 登入 `POST /api/v1/auth/login` → JWT token + role 判斷跳轉
  - Banner CRUD (`GET/POST/PUT/DELETE /api/v1/banners` + reorder)
  - About Cards CRUD (`GET/POST/PUT/DELETE /api/v1/about-cards` + reorder)
  - Teachers CRUD (`GET/POST/PUT/DELETE /api/v1/teachers`)
  - Honors CRUD (`GET/POST/PUT/DELETE /api/v1/honors`)
  - 圖片上傳 (`POST /api/v1/upload/image/{category}`)
- 新增前端 `AuthService` / `ApiService` / `authInterceptor` (JWT Bearer token)
- 更新 `app/main.py`：啟動時自動執行 `seed_database()` 建立預設 admin 帳號
- 更新 `app/main.py`：掛載 `/uploads` 靜態目錄，讓上傳的圖片可被存取
- 更新 `app/seed.py`：只保留 admin 帳號 (`admin@cramschool.com` / `admin`)，移除測試資料
- 更新 `app/routers/upload.py`：上傳後回傳完整 URL (含 backend host)
- 更新 `app/config.py`：CORS 加入 Firebase 網域
- 修復 `requirements.txt`：`passlib` 改為直接使用 `bcrypt`，解決相容性問題
- 部署前端至 Firebase Hosting：https://cramschool-b4d52.web.app

---

### v0.7.0 (2026-06-06) - 多分校管理系統
- 新增 `branches` 表（name/phone/address/is_active/display_order）
- Branch ORM model + Pydantic schema（BranchResponse/CreateRequest/UpdateRequest）
- 自動 migration 建立 branches 表、courses/students/teachers 補 branch_id
- `GET/POST/PUT/DELETE /admin/branches` CRUD 端點
- `courses` model 新增 branch_id FK + relationship
- `students` model 新增 branch_id FK
- `teachers` model 新增 branch_id FK
- `course`/`teacher` routers 新增 `branch_id` query param 篩選
- `admin.py` `_format_course` 新增 branch_id/branch_name
- `course-filters` 新增 branches 下拉資料
- `course_service.get_courses`/`teacher_service.get_teachers` 新增 `branch_id` 參數

### v0.6.0 (2026-05-23) - 註冊欄位擴充 + MissingGreenlet 修復 + Admin API
- Student model 補上性別、班級、家長2、住家電話、身分證字號欄位
- 自動 ALTER TABLE migration（不砍 DB）
- RegisterRequest / StudentResponse / StudentUpdateRequest 同步更新
- 修復 communication router MissingGreenlet（所有 `current_user.student` / `current_user.teacher` lazy loading 改直接查詢）
- `due_date`、`entry_date` 字串 → `date.fromisoformat()` 轉換
- `UNIQUE(entry_date, student_id)` 回傳 409 友善提示（非 500）
- 新增 `GET /api/admin/students` 端點（`require_teacher_or_admin`）
- 新增 admin router 註冊至 `routers/__init__.py`

### v0.5.0 (2026-05-16) - Bug 修復 & HTTPS 上線
- 修復 `auth_service.py` `_generate_tokens` 中 `expires_at` 計算錯誤
  - 原因：`.replace(day=day+30)` 超出當月天數 → `ValueError: day out of range`
  - 修正：改用 `timedelta(days=...)` 並補上 import
- 修復 `auth_service.py` lazy load `MissingGreenlet` bug
  - 原因：`user.student` / `user.teacher` 在 async 模式 lazy loading
  - 修正：查詢時加入 `selectinload(User.student, User.teacher)`
- 確認 admin 帳號 seed 正常（container startup 自動建立）
- 解決混合內容阻擋問題（Firebase HTTPS → backend HTTP）
- VM 安裝 nginx + Let's Encrypt（certbot），domain: `gateway2go.cc.cd`
- 前端 `www.gateway2go.cc.cd` → Firebase（CNAME）
- 後端 `api.gateway2go.cc.cd` → VM（A record）
- 修復 nginx proxy_pass 預設 HTTP/1.0 導致 CORS preflight 400
- 修復 `.env` CORS_ORIGINS 未完整設定問題
- 更新 `config.py` CORS origins 加入新 HTTPS 網域

---

*最後更新：2026-06-07*

### v0.8.0 (2026-06-06) - 學生個人資料編輯支援
- `StudentUpdateRequest` 新增 `birth_date` 欄位
- `update_student` service 欄位迴圈加入 `birth_date`，支援修改出生日期

### v0.9.0 (2026-06-07) - 聯絡簿 handout 欄位型別變更 + 輔導課手動調整
- `communication_session_students` 表 `handout_completed`(bool) → `handout_status`(varchar(10))
- 自動 migration 加入 `handout_status` 欄位 + `_drop_old_columns` 移除舊 `handout_completed` 欄位
- Session schemas（StudentSessionData / StudentSessionResponse）更新欄位型別
- admin router 所有 `handout_completed` 參照改為 `handout_status`
- communication_service student-facing 也同步更新
- 修復 `Boolean` import 誤刪導致 NameError 無法啟動

### v0.10.0 (2026-06-27) - 0622 客戶需求後端修改 (CP4, CP5, CP7, CP9)
- `models/communication_session.py`: 新增 `reschedule_date` (Date) 欄位
- `schemas/communication_session.py`: SessionUpdateRequest 加入 reschedule_date
- `routers/admin.py`:
  - 學生列表排序改為 `created_at ASC` (CP9)
  - 選課學生查詢只回傳「在籍」學生 (CP6)
  - 新增 `POST /admin/enrollments/batch-copy` 整批複製端點 (CP7)
  - `_format_course_student_data` 加入 `followup_status`、`reschedule_date`
- `schemas/course.py`: 新增 `BatchCopyEnrollmentsRequest` schema (CP7)
- `database.py`: 自動 migration 加入 `reschedule_date` 欄位 (CP5)

### v0.11.0 (2026-06-27) - 聯絡簿模板：新增 homework_material / homework_workbook 欄位
- `models/communication_session.py`: 新增 `homework_material` (VARCHAR(10))、`homework_workbook` (VARCHAR(10)) 欄位
- `schemas/communication_session.py`: StudentSessionData / StudentSessionResponse 加入新欄位
- `routers/admin.py`: CRUD create/update/response 傳入 `homework_material`、`homework_workbook`
- `services/communication_service.py`: `_format_student_entry` 回傳新欄位供學生端顯示
- `database.py`: 自動 migration 加入 `homework_material` / `homework_workbook` 欄位
