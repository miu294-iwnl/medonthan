# Medonthan - Game Backlog & Library Tracker

Medonthan là ứng dụng web quản lý danh sách game (backlog), theo dõi thời gian chơi, trạng thái hoàn thành và đồng bộ thông tin trò chơi từ Steam và HowLongToBeat.

---

## Tính năng chính

- **Quản lý danh sách game (Backlog):** Phân loại theo trạng thái (*Backlog, Next, Playing, Beaten*), mức độ ưu tiên (*High, Medium, Low*), thể loại, nền tảng.
- **Tích hợp Steam:**
  - Tìm kiếm game trên Steam Store và tự động lấy metadata (ảnh bìa, ảnh chụp màn hình, trailer video, ngày phát hành, giá bán, thẻ tag).
  - Đồng bộ thời gian chơi thực tế từ tài khoản Steam cá nhân.
- **Tích hợp HowLongToBeat:** Tự động lấy ước tính thời lượng hoàn thành game.
- **Trình phát Media:** Hỗ trợ xem video trailer chất lượng cao (HLS / MP4) và bộ sưu tập ảnh chụp màn hình trong game.
- **Đa ngôn ngữ:** Hỗ trợ giao diện và nội dung song ngữ Tiếng Việt / Tiếng Anh.
- **Giao diện hiện đại:** Thiết kế Dark Mode tối ưu với Tailwind CSS v4, hỗ trợ chế độ xem dạng lưới (Grid) và danh sách (List).

---

## Công nghệ sử dụng

### Frontend
- **Framework:** React 19, TypeScript
- **Bundler / Tooling:** Vite 8, oxfmt
- **Styling:** Tailwind CSS v4
- **Media:** Hls.js

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **ORM & Database:** Prisma ORM, SQLite
- **APIs & Thư viện:** Axios, howlongtobeat, cors, dotenv

---

## Cấu trúc thư mục

```
medonthan/
├── src/                # Mã nguồn Frontend (React + TypeScript)
│   ├── components/     # Các UI Component
│   ├── imports/        # Assets, biểu tượng SVG
│   ├── App.tsx         # Component chính của ứng dụng
│   └── index.css       # Tailwind CSS v4 & Global CSS
├── server/             # Mã nguồn Backend (Node.js + Express)
│   ├── controllers/    # Xử lý logic nghiệp vụ API
│   ├── routes/         # Định tuyến API
│   ├── services/       # Dịch vụ gọi API ngoài (Steam, HLTB)
│   ├── prisma/         # Prisma schema, database migrations & seed data
│   ├── .env.example    # Mẫu cấu hình biến môi trường backend
│   └── index.js        # Điểm khởi chạy server Express
├── public/             # Static files
├── package.json        # Dependencies & scripts cho frontend
├── vite.config.ts      # Cấu hình Vite & Proxy
└── README.md
```

---

## Hướng dẫn cài đặt & Chạy cục bộ

### 1. Yêu cầu hệ thống
- Node.js version 18 trở lên
- Trình quản lý gói: `npm` hoặc `pnpm`

### 2. Cài đặt dependencies

Cài đặt package cho cả thư mục gốc (Frontend) và thư mục `server` (Backend):

```bash
# Cài đặt frontend dependencies
npm install

# Cài đặt backend dependencies
cd server
npm install
cd ..
```

### 3. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `server/`:

```bash
cd server
cp .env.example .env
```

Chỉnh sửa nội dung file `server/.env`:
```env
PORT=3001
STEAM_API_KEY=your_steam_api_key_here
STEAM_VANITY_URL=your_steam_vanity_or_id
```

> **Ghi chú:** Để sử dụng tính năng đồng bộ thời gian chơi Steam, bạn có thể lấy API Key tại [Steam Community Dev](https://steamcommunity.com/dev/apikey).

### 4. Khởi tạo cơ sở dữ liệu

Chạy lệnh sau để khởi tạo cấu trúc SQLite database thông qua Prisma:

```bash
cd server
npm run db:push
npm run db:generate
cd ..
```

*Lưu ý: Backend có sẵn cơ chế tự động nạp dữ liệu mẫu ban đầu (Seed data) khi chạy lần đầu nếu cơ sở dữ liệu trống.*

### 5. Chạy ứng dụng

Mở 2 terminal riêng biệt:

- **Terminal 1: Chạy Backend server**
  ```bash
  # Cách 1: chạy từ root
  npm run server:dev

  # Cách 2: chạy trong thư mục server
  cd server
  npm run dev
  ```
  Backend chạy tại: `http://localhost:3001`

- **Terminal 2: Chạy Frontend dev server**
  ```bash
  npm run dev
  ```
  Frontend chạy tại: `http://localhost:8443` (hoặc cổng hiển thị trên terminal).

---

## Build cho Production

Build frontend tĩnh:
```bash
npm run build
```
Thư mục xuất bản sau khi build sẽ nằm tại `dist/`.

---

## Danh sách API chính

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/api/games` | Lấy danh sách toàn bộ game |
| `POST` | `/api/games` | Thêm mới game vào backlog |
| `PUT` | `/api/games/:id` | Cập nhật thông tin / trạng thái game |
| `DELETE` | `/api/games/:id` | Xóa game khỏi backlog |
| `GET` | `/api/search?q={keyword}&platform={platform}` | Tìm kiếm thông tin game từ Steam Store |
| `POST` | `/api/games/sync-playtime` | Đồng bộ số giờ chơi từ tài khoản Steam |
| `GET` | `/health` | Kiểm tra trạng thái hoạt động của backend |

---

## Hướng dẫn Triển khai (Deployment)

- **Frontend:** Có thể deploy lên **Vercel**, **Cloudflare Pages**, hoặc **Netlify** bằng cách kết nối Git repo và cấu hình lệnh build `npm run build`, output dir `dist`.
- **Backend:** Triển khai lên **Render**, **Railway**, **Fly.io** hoặc **VPS** (Node.js service). Cần cấu hình biến môi trường `STEAM_API_KEY`, `STEAM_VANITY_URL`, và `PORT`.
- **Database:** Nếu deploy lên serverless / cloud container, nên sử dụng Persistent Volume hoặc kết nối database ngoài (PostgreSQL qua Supabase / Neon / Render) bằng cách cập nhật provider trong [`server/prisma/schema.prisma`](file:///h:/Antigravity/medonthan/medonthan/server/prisma/schema.prisma).
