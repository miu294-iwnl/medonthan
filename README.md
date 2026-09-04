# Medonthan - Game Backlog & Spotify Music Sanctuary

Medonthan là ứng dụng web cá nhân cao cấp dùng để quản lý danh sách trò chơi (Game Backlog Tracker), đồng bộ thời gian chơi và dữ liệu từ Steam / Xbox, kết hợp không gian nghe nhạc thư giãn tích hợp Spotify với hiệu ứng bầu trời đêm động.

---

## 1. Tính năng nổi bật

### Quản lý Game Backlog chuyên sâu
- **Phân loại trạng thái:** Chia theo các nhóm rõ ràng: *Chưa chơi (Backlog), Chuẩn bị chơi (Next), Đang chơi (Playing), Đã hoàn thành (Beaten)*.
- **Mức độ ưu tiên:** Gán nhãn *High, Medium, Low* với phối màu trực quan.
- **Thông tin chi tiết đa dạng:** Studio phát triển, nhà phát hành, thể loại, năm phát hành, giá bán, phần trăm giảm giá, số giờ đã chơi, thẻ tags, đánh giá cộng đồng (Steam Review).
- **Chế độ hiển thị:** Hỗ trợ chuyển đổi mượt mà giữa chế độ Danh sách (List) và Lưới thẻ (Grid).
- **Lọc và tìm kiếm:** Tìm kiếm theo tên game thời gian thực, lọc theo danh mục trạng thái.

### Tích hợp Steam & Xbox Storefront API
- **Tìm kiếm game trực tiếp:** Tìm kiếm tự động gợi ý từ Steam Store và Xbox Marketplace.
- **Tự động trích xuất metadata:** Tự động nạp ảnh bìa chất lượng cao, thư viện ảnh chụp màn hình (screenshots), trailer video chất lượng cao (HLS / MP4), ngày ra mắt, trạng thái Early Access, link mua game.
- **Đồng bộ thời gian chơi thực tế:** Kết nối trực tiếp tài khoản Steam thông qua Steam Web API để tự động cập nhật số giờ chơi thực tế của toàn bộ thư viện game.

### Không gian nghe nhạc Spotify (Music Sanctuary)
- **Bầu trời sao đêm động (Starry Night):** Hệ thống tạo sao ngẫu nhiên bằng thuật toán, dải ngân hà Milky Way đa tầng với ánh sáng lung linh và bóng núi phản chiếu mặt hồ. Có nút bật/tắt hiệu ứng linh hoạt.
- **Đồng bộ Spotify Playlist:** Tự động lấy danh sách bài hát, tên playlist, ảnh bìa, mô tả từ URL Spotify được cấu hình.
- **Trải nghiệm mượt mà không độ trễ (0ms):** Cơ chế lưu bộ nhớ đệm hai tầng (In-Memory & LocalStorage) kết hợp tải trước ngầm (Prefetch) giúp trang Music mở ngay lập tức, không bị chớp hay nhảy nội dung giả.
- **Trình phát nhạc toàn diện:** Phát / Dừng, bài tiếp theo / bài trước, phát ngẫu nhiên (Shuffle), lặp lại (Repeat), thanh trượt tiến trình tương tác, điều chỉnh âm lượng, hỗ trợ giao diện tối ưu riêng cho Desktop và Mobile.

### Trình phát nhạc nền Mini (Mini Music Player)
- Trình phát nhạc nổi góc màn hình tại trang chính, cho phép bật/tắt bài nhạc thư giãn khi đang duyệt kho game.
- Lưu trạng thái phát/dừng, âm lượng, tắt tiếng (mute) qua Cookie và LocalStorage.

### Bảo mật thêm game bằng mật khẩu & Cookie (Admin Authentication)
- **Popup xác thực khi thêm game:** Yêu cầu mật khẩu quản trị viên khi người dùng bấm `+ THÊM GAME`.
- **Ghi nhớ đăng nhập qua Cookie:** Hỗ trợ checkbox "Lưu mật khẩu trên thiết bị này (lưu vào cookie)", lưu token an toàn vào Cookie trình duyệt (hạn 365 ngày). Sau khi đã lưu, các lần sau bấm thêm game sẽ mở trực tiếp mà không cần hỏi lại mật khẩu.
- **Mã hóa an toàn trong Database:** Mật khẩu được mã hóa một chiều bằng thuật toán `scrypt` với muối ngẫu nhiên (salt 16-byte) và lưu trữ trong bảng `AdminAuth` của PostgreSQL.
- **Tự động khởi tạo:** Lần đầu sử dụng popup sẽ tự động chuyển sang giao diện tạo mật khẩu chủ nếu DB chưa có mật khẩu. Ngoài ra cũng hỗ trợ cấu hình sẵn qua biến môi trường `ADMIN_PASSWORD` trong `server/.env`.

### Cơ chế chống can thiệp (Anti-DevTools Protection)
- Vô hiệu hóa menu chuột phải (Context Menu).
- Chặn toàn bộ tổ hợp phím tắt mở công cụ nhà phát triển (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S).
- Bẫy thời gian thực thi (Debugger timing trap) phát hiện mở Console / DevTools và tự động chuyển hướng sang trang cảnh báo chuyên dụng `/nodevtools.html`.

### Đa ngôn ngữ (Bilingual Support)
- Hỗ trợ song ngữ Tiếng Việt và Tiếng Anh trên toàn bộ giao diện và mô tả nội dung.

---

## 2. Công nghệ sử dụng

| Tầng | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Thư viện UI phiên bản mới nhất |
| | TypeScript 5.7 | An toàn kiểu dữ liệu |
| | Tailwind CSS v4 | Công cụ tạo kiểu giao diện thế hệ mới (`@tailwindcss/vite`) |
| | Vite 8 | Build tool tốc độ cao, hỗ trợ HMR |
| | Hls.js | Phát video trailer định dạng HLS mượt mà |
| | devtools-detector | Thư viện phát hiện Developer Tools |
| **Backend** | Node.js 22 LTS | Runtime JavaScript môi trường máy chủ (ES Modules) |
| | Express.js 4.21 | Web framework xây dựng RESTful API |
| | Prisma ORM 6.4 | Trình quản lý và truy vấn cơ sở dữ liệu |
| | PostgreSQL | Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ |
| | Axios | Client HTTP gọi Steam Store API, Steam Web API, Spotify API |
| | howlongtobeat | Thư viện tra cứu thời lượng hoàn thành game |

---

## 3. Cấu trúc thư mục dự án

```
medonthan/
├── src/                        # Mã nguồn Frontend (React + TypeScript)
│   ├── components/             # Các component giao diện
│   │   ├── AdminAuthModal.tsx  # Popup nhập & khởi tạo mật khẩu thêm game (kèm cookie)
│   │   ├── MusicPlayer.tsx     # Trình phát nhạc mini nổi góc màn hình
│   │   └── NoDevTools.tsx      # Giao diện cảnh báo chặn DevTools dạng component
│   ├── imports/                # Icon SVG tĩnh (Steam, Xbox...)
│   ├── lib/                    # Tiện ích phía client
│   │   └── auth.ts             # Quản lý Cookie token xác thực & API auth client
│   ├── App.tsx                 # Component điều phối chính (Game Backlog & điều hướng)
│   ├── MusicPage.tsx           # Trang nghe nhạc Spotify & Bầu trời sao đêm
│   ├── nodevtools.tsx          # Điểm gắn kết cho trang nodevtools.html
│   ├── main.tsx                # Entrypoint React
│   ├── index.css               # Định nghĩa Tailwind CSS v4, theme tokens & animation
│   └── vite-env.d.ts           # Khai báo TypeScript cho Vite
├── server/                     # Mã nguồn Backend (Node.js + Express)
│   ├── controllers/            # Bộ điều khiển xử lý logic API
│   │   ├── authController.js   # Xác thực, cấp token & middleware kiểm tra mật khẩu
│   │   ├── gameController.js   # Quản lý game, tìm kiếm, đồng bộ Steam
│   │   └── musicController.js  # Lấy & cập nhật playlist Spotify
│   ├── routes/                 # Định tuyến API
│   │   ├── authRoutes.js       # Định tuyến nhóm xác thực (/api/auth)
│   │   ├── gameRoutes.js       # Định tuyến nhóm game (được bảo vệ bởi requireAdminAuth)
│   │   └── musicRoutes.js      # Định tuyến nhóm music
│   ├── services/               # Tích hợp dịch vụ & thuật toán
│   │   ├── authService.js      # Băm mật khẩu scrypt, ký token HMAC, lưu trữ DB
│   │   ├── steamService.js     # Tích hợp Steam Storefront API & Steam Web API
│   │   ├── xboxService.js      # Tích hợp Xbox Marketplace API
│   │   └── spotifyPlaylistService.js # Lấy metadata & danh sách bài hát Spotify
│   ├── prisma/                 # Cơ sở dữ liệu Prisma
│   │   ├── schema.prisma       # Định nghĩa bảng Game và AdminAuth (PostgreSQL)
│   │   └── seed.js             # Dữ liệu khởi tạo mẫu khi DB trống
│   ├── lib/
│   │   └── prisma.js           # Khởi tạo singleton PrismaClient
│   ├── .env.example            # Mẫu biến môi trường backend
│   └── index.js                # Server chính Express, CORS & phục vụ static dist/
├── index.html                  # HTML Shell chính, tích hợp kịch bản chặn DevTools
├── nodevtools.html             # Trang cảnh báo hạn chế truy cập khi mở DevTools
├── package.json                # Dependencies & script quản lý dự án
├── pnpm-lock.yaml              # Lockfile quản lý package của pnpm
├── vite.config.ts              # Cấu hình Vite, Tailwind CSS v4, Multi-page input
├── .mise.toml                  # Khai báo phiên bản Node.js 22 và pnpm 10
├── AGENTS.md                   # Tài liệu chi tiết hướng dẫn dành riêng cho AI Agents
└── README.md                   # Tài liệu hướng dẫn sử dụng và triển khai dự án
```

---

## 4. Hướng dẫn chạy cục bộ (Local Development)

### Yêu cầu tiên quyết
- **Node.js:** Phiên bản 22 LTS trở lên (khuyên dùng Node 22).
- **Trình quản lý gói:** `pnpm` (phiên bản 10.x) hoặc `npm`.
- **Cơ sở dữ liệu:** PostgreSQL (cục bộ hoặc cloud như Neon, Supabase, Render PostgreSQL).

### Bước 1: Cài đặt Dependencies
Cài đặt thư viện cho cả root (Frontend) và thư mục `server/` (Backend):
```bash
# Cài đặt frontend
pnpm install

# Cài đặt backend
cd server
pnpm install
cd ..
```

### Bước 2: Cấu hình biến môi trường
Tạo file `server/.env` từ file mẫu `server/.env.example`:
```bash
cd server
cp .env.example .env
```
Nội dung file `server/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/medonthan
STEAM_API_KEY=your_steam_web_api_key_here
STEAM_VANITY_URL=mused29
MUSIC_API_SPOTIFYPLAYLIST=https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M

# Tùy chọn: Spotify Developer API (lấy mô tả chi tiết & ảnh playlist độ phân giải cao)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# Tùy chọn: Mật khẩu quản trị viên (có thể đặt trước tại đây hoặc tạo trực tiếp qua popup UI)
ADMIN_PASSWORD=
```
> **Gợi ý:** Để dùng tính năng đồng bộ giờ chơi từ tài khoản Steam cá nhân, bạn có thể tạo API Key miễn phí tại [Steam Community Developer](https://steamcommunity.com/dev/apikey).

### Bước 3: Khởi tạo Cơ sở dữ liệu
Đồng bộ schema lên PostgreSQL và khởi tạo Prisma Client:
```bash
cd server
npx prisma db push
npx prisma generate
cd ..
```
*(Nếu cơ sở dữ liệu mới tinh, hệ thống sẽ tự động chạy seed danh sách game tuyển chọn ban đầu khi server khởi động lần đầu).*

### Bước 4: Khởi chạy dự án
Mở 2 cửa sổ terminal:

- **Terminal 1: Khởi động Backend**
  ```bash
  cd server
  pnpm run dev
  ```
  Backend lắng nghe tại: `http://localhost:3001`

- **Terminal 2: Khởi động Frontend Vite Dev Server**
  ```bash
  pnpm run dev
  ```
  Frontend hoạt động tại: `http://localhost:8443` (hoặc cổng được hiển thị trong terminal).

---

## 5. Danh sách API Backend

| Nhóm | Phương thức | Endpoint | Chức năng |
| :--- | :--- | :--- | :--- |
| **Games** | `GET` | `/api/games` | Lấy danh sách toàn bộ game trong kho lưu trữ |
| | `POST` | `/api/games` | Thêm game mới (tự động nạp chi tiết từ Steam/Xbox) |
| | `PUT` | `/api/games/:id` | Cập nhật thông tin game (trạng thái, độ ưu tiên, giờ chơi...) |
| | `DELETE` | `/api/games/:id` | Xóa game khỏi kho lưu trữ |
| | `GET` | `/api/search?q={keyword}&platform={platform}` | Tìm kiếm trò chơi từ kho Steam Store hoặc Xbox |
| | `POST` | `/api/games/sync-playtime` | Đồng bộ thời gian chơi từ Steam Web API vào cơ sở dữ liệu |
| | `GET` | `/api/steam/stats` | Lấy tổng giờ chơi và thông tin hồ sơ tài khoản Steam |
| **Music** | `GET` | `/api/music/playlist` | Lấy thông tin playlist và danh sách bài hát Spotify hiện tại |
| | `POST` | `/api/music/playlist` | Cập nhật URL playlist Spotify mới vào hệ thống |
| **Hệ thống**| `GET` | `/health` | Kiểm tra trạng thái hoạt động (Health Check) của server |

---

## 6. Hướng dẫn Triển khai trên Render.com

Dự án hỗ trợ kiến trúc phân tách độc lập 3 dịch vụ trên **Render.com**:

### Dịch vụ 1: Cơ sở dữ liệu (PostgreSQL)
1. Trên Render Dashboard, chọn **New +** -> **PostgreSQL**.
2. Đặt tên database (ví dụ: `medonthan-db`).
3. Chọn gói (Free hoặc Starter).
4. Sau khi tạo xong, sao chép chuỗi **Internal Database URL**.

### Dịch vụ 2: Web Service (Backend Express)
1. Chọn **New +** -> **Web Service**, liên kết với kho lưu trữ GitHub `medonthan`.
2. **Cấu hình:**
   - **Name:** `medonthan-api`
   - **Root Directory:** Để trống `.`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     cd server && pnpm install && npx prisma db push && npx prisma generate
     ```
   - **Start Command:**
     ```bash
     node server/index.js
     ```
3. **Biến môi trường (Tab Environment):**
   - `NODE_VERSION`: `22.14.0`
   - `DATABASE_URL`: Dán chuỗi *Internal Database URL* vừa copy từ Dịch vụ 1.
   - `STEAM_API_KEY`: Key Steam của bạn.
   - `STEAM_VANITY_URL`: `mused29`
   - `MUSIC_API_SPOTIFYPLAYLIST`: URL playlist Spotify của bạn.

### Dịch vụ 3: Static Site (Frontend React)
1. Chọn **New +** -> **Static Site**, liên kết với kho lưu trữ GitHub `medonthan`.
2. **Cấu hình:**
   - **Name:** `medonthan`
   - **Build Command:**
     ```bash
     pnpm run build
     ```
   - **Publish Directory:** `dist`
3. **Cấu hình Chuyển tiếp API (Tab Redirects/Rewrites - BẮT BUỘC):**
   - **Quy tắc 1 (Proxy API sang Web Service):**
     - Type: `Rewrite`
     - Source: `/api/*`
     - Destination: `https://medonthan-api.onrender.com/api/*` *(thay bằng domain thật của Web Service ở Dịch vụ 2)*
   - **Quy tắc 2 (SPA Fallback cho React):**
     - Type: `Rewrite`
     - Source: `/*`
     - Destination: `/index.html`
