# AGENTS.md - Tài liệu Kỹ thuật Chi tiết Dự án Medonthan

Tài liệu này được biên soạn đầy đủ và chi tiết nhất nhằm giúp các AI Agent (hoặc kỹ sư mới) nắm bắt toàn diện kiến trúc, các luồng dữ liệu, từng hàm xử lý và quy tắc phát triển của dự án **Medonthan**.

---

## 1. Tổng quan Dự án & Kiến trúc (High-Level Architecture)

**Medonthan** là ứng dụng web toàn diện gồm 2 chức năng chính:
1. **Quản lý kho game cá nhân (Game Backlog Tracker):** Theo dõi trạng thái chơi game, độ ưu tiên, danh mục, thời gian chơi, giá bán, trailer video HLS, và tự động đồng bộ giờ chơi thực tế từ tài khoản Steam cá nhân.
2. **Không gian nghe nhạc Spotify (Music Sanctuary):** Trình phát nhạc tích hợp playlist Spotify, giao diện bầu trời đêm đầy sao lấp lánh (Starry Night dynamic background) với thuật toán sinh sao ngẫu nhiên, dải ngân hà Milky Way đa tầng và mặt hồ phản chiếu. Có cơ chế tải trước ngầm (Prefetch) và lưu cache 2 tầng (In-Memory + LocalStorage) đạt tốc độ mở tức thì (0ms).

### Kiến trúc Monorepo
Dự án được tổ chức theo cấu trúc phân tách rõ ràng giữa Client và Server trong cùng một kho lưu trữ:
- **Thư mục gốc (`/` và `src/`):** Ứng dụng Frontend SPA xây dựng bằng **React 19**, **TypeScript 5.7**, **Vite 8**, **Tailwind CSS v4**.
- **Thư mục `server/`:** Ứng dụng Backend RESTful API xây dựng bằng **Node.js 22 (ES Modules)**, **Express 4.21**, **Prisma ORM 6.4**, kết nối cơ sở dữ liệu **PostgreSQL**.

### Kiến trúc Triển khai (Deployment) trên Render.com
Hệ thống được thiết kế để triển khai thành **3 dịch vụ độc lập** trên Render:
1. **PostgreSQL Database:** Lưu trữ bảng `Game`.
2. **Web Service (Backend Node.js):** Chạy code trong thư mục `server/`, kết nối DB qua chuỗi `DATABASE_URL` nội bộ.
3. **Static Site (Frontend Vite):** Build thư mục `dist/` từ thư mục gốc. Sử dụng tính năng **Rewrites** trên Render Dashboard để chuyển tiếp `/api/*` sang domain của Web Service.

---

## 2. Chi tiết Frontend (`src/`)

### 2.1. `src/main.tsx`
- **Nhiệm vụ:** Điểm khởi chạy của React, nạp file CSS toàn cục `src/index.css` và gắn kết component `App` vào thẻ DOM `#root`.
- **Thư viện:** `react-dom/client` (`createRoot`).

### 2.2. `src/App.tsx`
Component trung tâm điều phối toàn bộ luồng trang chính (Games Backlog):

#### State Management & Định tuyến (Routing & Persistence)
- `PAGE_STORAGE_KEY = "medonthan_active_page"`: Key lưu trữ trạng thái trang hiện tại trong `localStorage`.
- `page` (`"games" | "music"`): Trạng thái trang hiện tại. Khởi tạo qua hàm `getInitialPage()`:
  - Ưu tiên 1: Đọc từ đường dẫn `window.location.pathname` (`/music` -> mở music, `/games` hoặc `/app/...` -> mở games).
  - Ưu tiên 2: Nếu đường dẫn là root `/` hoặc `/index.html` (do CDN / máy chủ tĩnh phục vụ khi F5), đọc từ `localStorage.getItem("medonthan_active_page")` để giữ nguyên trang người dùng đang xem, chống việc bị văng về trang mặc định khi F5.
- Tự động chuẩn hóa URL (Clean URL): `useEffect` theo dõi `page`, nếu URL đang là `/` hoặc `/index.html`, ngay lập tức dùng `window.history.replaceState` cập nhật thành `/games` (hoặc `/music`), giúp thanh địa chỉ trình duyệt luôn hiển thị `/games` thay vì `/index.html`.
- `exiting` (`boolean`): Cờ kích hoạt animation chuyển trang mượt mà trước khi component unmount.
- `games` (`Game[]`): Danh sách các bản ghi game nạp từ backend.
- `loadingGames` (`boolean`): Trạng thái đang tải dữ liệu danh sách game ban đầu.
- `steamTotalHours` (`number | null`): Tổng số giờ chơi trên tài khoản Steam cá nhân lấy từ Steam Web API.
- `filter` (`Status | "all"`): Bộ lọc danh mục (`backlog`, `next`, `playing`, `beaten` hoặc `all`).
- `query` (`string`): Từ khóa tìm kiếm game thời gian thực trong danh sách hiện có.
- `adding` (`boolean`): Trạng thái mở modal thêm game mới.
- `authModalOpen` (`boolean`): Trạng thái mở modal yêu cầu nhập / khởi tạo mật khẩu quản trị viên khi bấm thêm game.
- `viewMode` (`"grid" | "list"`): Chế độ hiển thị dạng lưới hoặc danh sách.
- `selectedId` (`string | null`): ID của game đang được chọn để hiển thị modal chi tiết (ảnh lớn, video trailer, review, liên kết cửa hàng).
- `syncing` (`boolean`): Cờ đánh dấu tiến trình đồng bộ giờ chơi từ Steam Web API đang chạy.
- `toastInfo` (`{ message: string; type: "success" | "error" } | null`): Thông báo Toast góc dưới màn hình.
- `lang` (`"vi" | "en"`): Ngôn ngữ giao diện (lưu và đọc từ `localStorage` key `game-wishlist-lang`).

#### Các hàm xử lý nghiệp vụ chính
- `switchPage(next: "games" | "music", updateHistory = true)`:
  - Lưu trạng thái vào `localStorage.setItem(PAGE_STORAGE_KEY, next)`.
  - Thiết lập `setExiting(true)` để kích hoạt CSS animation thoát trang `page-exiting`.
  - Chờ timeout 240ms để animation chạy xong, sau đó đổi state `page`, đặt lại `exiting = false`.
  - Cập nhật URL trên thanh địa chỉ trình duyệt bằng `window.history.pushState` (`/music` hoặc `/games`).
- `fetchGames()`:
  - Gửi request `GET /api/games`.
  - Cập nhật state `games` và tắt cờ `loadingGames`.
- `fetchSteamStats()`:
  - Gửi request `GET /api/steam/stats` để lấy tổng giờ chơi tài khoản Steam và cập nhật `steamTotalHours`.
- `handleSyncPlaytime()`:
  - Gửi request `POST /api/games/sync-playtime`.
  - Nhận về danh sách game đã được cập nhật số giờ chơi thực tế từ Steam Web API.
  - Hiển thị Toast thông báo số lượng game được cập nhật.
- `addGame(title, platform, storeId, storeType, lndLink, hours)` & `commitAddGame(gameData)`:
  - Khi người dùng bấm `+ THÊM GAME`, modal nhập thông tin game (`AddModal`) sẽ mở ngay lập tức để nhập tên game, nền tảng và số giờ dự kiến.
  - Khi bấm **"Thêm vào danh sách"**:
    - Nếu cookie token đã có (`getAdminToken()` hợp lệ): Ngay lập tức gọi `commitAddGame` gửi kèm header `x-admin-token` tới `POST /api/games`.
    - Nếu chưa có cookie token: Lưu tạm thông tin game vào `pendingGameData` và mở popup `AdminAuthModal` đè lên trên. Khi xác thực thành công, tự động thực thi thêm game và đóng cả hai modal.
  - Nếu backend trả mã `409 Conflict` (game đã tồn tại trong danh sách), hiển thị thông báo lỗi tương ứng.
  - Nếu thành công, đưa game mới lên đầu mảng `setGames((prev) => [created, ...prev])`.
- `handleUpdateGame(id, updates)`:
  - Gửi request `PUT /api/games/:id` để cập nhật trạng thái (`status`), mức độ ưu tiên (`priority`), số giờ chơi (`hoursPlayed`), v.v.
- `handleDeleteGame(id)`:
  - Gửi request `DELETE /api/games/:id`.
  - Lọc bỏ game khỏi state `games`.

#### Các hàm tiện ích (Helpers)
- `fmtVnd(amount, freeLabel)`: Định dạng tiền tệ VND (ví dụ: `150.000 ₫` hoặc nhãn `Miễn phí`).
- `isGameUnreleased(game)`: Kiểm tra xem game đã phát hành hay chưa (dựa trên các chuỗi `TBA`, `Coming soon`, năm tương lai).
- `getGamePriceLabel(game, t)`: Trả về chuỗi hiển thị giá, cờ chưa ra mắt, và class màu sắc (`text-ice`, `text-lime`, `text-fg/80`).
- `slugify(text)`: Chuyển tiêu đề game thành slug URL thân thiện.
- `getGameUrlPath(game)` / `getGameStoreLink(game)`: Tạo đường dẫn trang chi tiết và link mở trực tiếp trên Steam Store hoặc Xbox Marketplace.

---

### 2.3. `src/MusicPage.tsx`
Component không gian âm nhạc Spotify và bầu trời sao đêm:

#### Định nghĩa kiểu dữ liệu
- `interface Track`:
  - `id`: Định danh duy nhất bài hát.
  - `index`: Số thứ tự bài trong playlist.
  - `title`: Tên bài hát.
  - `artist`: Nghệ sĩ biểu diễn.
  - `album`: Tên album chứa bài hát.
  - `duration`: Thời lượng định dạng `m:ss`.
  - `durationSec?`: Thời lượng tính bằng giây.
  - `cover`: Link ảnh bìa bài hát.
  - `audioSrc?`: Link file âm thanh MP3 nghe thử (preview URL).
  - `spotifyUrl?`: Link mở bài hát trực tiếp trên Spotify.
- `interface PlaylistData`:
  - `cover`: Ảnh bìa playlist.
  - `title`: Tên playlist.
  - `description`: Mô tả playlist (hoặc `null`).
  - `owner`: Tên chủ sở hữu playlist.
  - `playlistUrl`: Link Spotify của playlist.
  - `tracks`: Mảng danh sách bài hát (`Track[]`).

#### Hệ thống Cache & Tải trước ngầm (Prefetching)
- `PLAYLIST_CACHE_KEY`: Key lưu trữ trong `localStorage` (`medonthan_music_playlist_cache`).
- `inMemoryPlaylist`: Biến phạm vi module lưu trữ cache trong RAM giúp truy xuất ngay lập tức trong phiên làm việc.
- `getCachedPlaylist()`:
  - Ưu tiên 1: Đọc từ `inMemoryPlaylist` (RAM).
  - Ưu tiên 2: Đọc từ `localStorage`.
  - Trả về `PlaylistData | null`.
- `setCachedPlaylist(data)`:
  - Lưu vào `inMemoryPlaylist` và ghi đồng thời vào `localStorage`.
- `prefetchMusicPlaylist()`:
  - Kiểm tra nếu đã có `inMemoryPlaylist` thì trả về ngay.
  - Nếu đang có request chạy dở (`prefetchPromise`), tái sử dụng Promise đó tránh gửi lặp.
  - Gọi `fetch("/api/music/playlist")`. Khi có dữ liệu hợp lệ, tự động cập nhật cache và trả về dữ liệu.
  - Hàm này được gọi tự động ở `App.tsx` khi vừa mở ứng dụng và khi người dùng rê chuột qua nút "♫ MUSIC".

#### Cơ chế chống giật giao diện (Zero Latency / Anti-Flicker)
- Khởi tạo state bằng lazy initializer:
  - `tracks`: Khởi tạo bằng `initialCache?.tracks ?? []`.
  - `playlistTitle`: Khởi tạo bằng `initialCache?.title ?? ""`.
  - `loadingPlaylist`: Khởi tạo bằng `!initialCache`.
- **Trường hợp 1 (Đã có cache):** Giao diện nạp bài hát thật ngay lập tức (0ms), không xuất hiện bất kỳ bài hát giả nào. `useEffect` chạy ngầm để revalidate dữ liệu mới nhất mà không làm nhảy layout.
- **Trường hợp 2 (Cold start - Lần đầu tiên chưa có cache):** Component render giao diện **Skeleton Loader** (ảnh bìa, tiêu đề, các hàng bài hát skeleton với hiệu ứng `animate-pulse`). Tuyệt đối không render 12 bài hát mẫu ("NIGHT DRIVE") rồi 0.5s sau mới giật sang bài thật. Khi API trả về, bài hát thật lập tức thay thế khung skeleton một cách tự nhiên.

#### Hiệu ứng Bầu trời sao đêm (`StarryBackground`)
- `mkStars(count, seed)`: Sử dụng thuật toán LCG PRNG với seed cố định để tạo tọa độ `x`, `y`, bán kính `r`, độ trong suốt `o`, thời gian nhấp nháy `d`, và màu sắc pha ánh xanh (cyan tint) cho 320 ngôi sao ngẫu nhiên.
- Component vẽ các tầng:
  1. Gradient bầu trời xanh thẫm (`#000818` -> `#001240` -> `#001f6b`).
  2. Vệt sáng dải ngân hà Milky Way chéo góc.
  3. Lớp lõi phát sáng mờ của ngân hà (`filter: blur(8px)`).
  4. 320 điểm sao với hiệu ứng CSS animation `sky-twinkle`.
  5. Đồ họa SVG bóng dãy núi hai tầng mờ ảo ở chân trời.
  6. Lớp phản chiếu mờ của mặt nước hồ ở dưới cùng.

#### Điều khiển Trình phát nhạc
- Quản lý thẻ âm thanh `HTMLAudioElement` qua `audioRef`.
- Các hàm:
  - `play(id)`: Phát bài hát theo ID, reset tiến trình.
  - `togglePause()`: Bật / tạm dừng phát.
  - `prev()` / `next()`: Chuyển bài trước / bài sau (tự động tính toán khi bật chế độ Shuffle hoặc Repeat).
  - Tương tác thanh tiến trình (Seek bar): Tính toán phần trăm vị trí click chuột / chạm tay để tua bài hát tức thì.

---

### 2.4. `src/components/MusicPlayer.tsx`
- **Nhiệm vụ:** Trình phát nhạc mini cố định ở góc màn hình tại trang chính (Games).
- **Lưu trữ trạng thái:** Sử dụng cookie và `localStorage` với các key:
  - `medonthan_music_user_state`: Trạng thái `"playing"` hoặc `"paused"`.
  - `medonthan_music_volume`: Mức âm lượng từ `0` đến `1`.
  - `medonthan_music_muted`: `"true"` hoặc `"false"`.
  - `medonthan_music_loop`: `"true"` hoặc `"false"`.
  - `medonthan_music_mobile_docked`: Thu nhỏ thanh dock trên màn hình điện thoại.
- Phát nhạc nền thư giãn kèm đĩa xoay vinyl khi đang nghe.

---

### 2.5. `src/lib/auth.ts`
- **Nhiệm vụ:** Quản lý Cookie xác thực phía Client và giao tiếp với các API bảo mật.
- **Hằng số Cookie:**
  - `ADMIN_TOKEN_COOKIE = "medonthan_admin_token"`
  - `ADMIN_REMEMBER_COOKIE = "medonthan_admin_remember"`
- **Các hàm xử lý:**
  - `setCookie(name, value, days)`: Ghi cookie với cờ `SameSite=Lax` và `path=/`. Nếu có `days`, đặt thời hạn tính bằng ngày; nếu không, tạo session cookie (hết hạn khi đóng trình duyệt).
  - `getCookie(name)`: Đọc giá trị cookie tương ứng từ `document.cookie`.
  - `deleteCookie(name)`: Xóa cookie bằng cách đặt ngày hết hạn về quá khứ.
  - `getAdminToken()`: Lấy token từ cookie `medonthan_admin_token` (fallback sang `localStorage` nếu cookie bị trình duyệt chặn).
  - `saveAdminToken(token, remember)`: Nếu `remember === true`, lưu cookie 365 ngày và ghi vào `localStorage`. Nếu `false`, lưu session cookie.
  - `clearAdminToken()`: Đăng xuất và dọn dẹp sạch token khỏi Cookie và `localStorage`.
  - `checkAuthStatus()`: Gọi `GET /api/auth/status` kiểm tra xem DB đã có mật khẩu khởi tạo chưa (`isSetup`) và token hiện tại có hợp lệ không (`isAuthenticated`).
  - `verifyAdminPasswordOnline(password)`: Gửi `POST /api/auth/verify` xác thực mật khẩu.
  - `setupAdminPasswordOnline(password)`: Gửi `POST /api/auth/setup` tạo mật khẩu chủ ban đầu nếu DB chưa có.

---

### 2.6. `src/components/AdminAuthModal.tsx`
- **Nhiệm vụ:** Hộp thoại popup bảo vệ thao tác thêm game.
- **Tính năng:**
  - Tự động nhận diện chế độ: Nếu DB chưa có mật khẩu, tự động hiển thị giao diện **Khởi tạo mật khẩu quản trị** (có trường xác nhận mật khẩu). Nếu đã có mật khẩu, hiển thị giao diện **Xác thực quản trị viên**.
  - Nút bật/tắt hiển thị mật khẩu (Ẩn / Hiện).
  - Checkbox **"Lưu mật khẩu trên thiết bị này (lưu vào cookie)"** (mặc định được tích chọn).
  - Khi người dùng xác thực thành công, lưu token vào Cookie và kích hoạt callback `onSuccess()` để mở form thêm game ngay lập tức.
  - Các lần sau khi người dùng bấm "+ THÊM GAME", hàm `getAdminToken()` kiểm tra thấy cookie hợp lệ sẽ mở thẳng form mà không cần hỏi lại mật khẩu.

---

### 2.7. Hệ thống Chống DevTools & Bảo vệ Mã nguồn
Dự án được tích hợp cơ chế bảo vệ nâng cao nhằm ngăn chặn người dùng mở DevTools hoặc Inspect mã nguồn:

1. **`index.html`:**
   - Lắng nghe sự kiện `contextmenu`: Ngăn chặn chuột phải.
   - Lắng nghe sự kiện `keydown`: Chặn các phím `F12`, `Ctrl+Shift+I/J/C`, `Meta+Alt+I/J/C`, `Ctrl+U`, `Ctrl+S`.
   - **Debugger Timing Trap:** Vòng lặp `setInterval(..., 120)` thực thi câu lệnh `debugger;` và tính thời gian thực thi:
     ```javascript
     var t0 = performance.now();
     debugger;
     var t1 = performance.now();
     if (t1 - t0 > 80) blockAccess();
     ```
     Nếu DevTools đang mở, câu lệnh `debugger` sẽ làm tạm dừng JavaScript khiến `t1 - t0 > 80ms`, hàm `blockAccess()` sẽ ngay lập tức xóa trắng DOM (`document.documentElement.innerHTML = ''`) và chuyển hướng sang `/nodevtools.html`.
2. **`nodevtools.html`:**
   - Trang HTML tĩnh độc lập (được khai báo trong `vite.config.ts` mục `rollupOptions.input`).
   - Giao diện phong cách Hacker Terminal cảnh báo vi phạm, hiển thị đồng hồ thời gian thực và trạng thái phát hiện DevTools mở/đóng.
3. **`src/nodevtools.tsx`:**
   - Mã nguồn TSX tích hợp thư viện `devtools-detector` với phương thức `addListener` để lắng nghe khi DevTools được đóng lại sẽ tự động chuyển hướng người dùng về trang chủ `/`.

---

### 2.8. `src/index.css` & Thiết kế Giao diện (Tailwind CSS v4)
- Sử dụng **Tailwind CSS v4** với cú pháp `@import 'tailwindcss';` (không dùng file cấu hình `tailwind.config.js`).
- Khối `@theme` định nghĩa bảng màu chuẩn:
  - `--color-ink: #07080a`: Nền tối sâu.
  - `--color-panel: #101317`: Nền thẻ và thanh điều hướng.
  - `--color-panel-2: #171b21`: Nền cấp 2 khi hover.
  - `--color-line: #262c35`: Đường viền phân cách.
  - `--color-fg: #e8ecf1`: Màu chữ chính.
  - `--color-muted: #8b95a3`: Màu chữ phụ / chú thích.
  - `--color-lime: #c6ff3f`: Màu nhấn xanh neon chủ đạo.
  - `--color-flame: #ff5a3c`: Màu đỏ cam cảnh báo / accent.
  - `--color-ice: #4cc9f0`: Màu xanh băng giá.
- Hệ thống hiệu ứng hoạt họa chuyển trang (Page Transitions):
  - `.page-enter-header`: Trượt từ trên xuống.
  - `.page-enter-hero`: Trượt từ trái qua kèm mờ dần.
  - `.page-enter-filter`: Trượt từ phải qua.
  - `.page-enter-list`: Trượt từ dưới lên.
  - `.page-exiting`: Chạy các keyframe thoát mượt mà trước khi đổi view.

---

## 3. Chi tiết Backend (`server/`)

### 3.1. `server/index.js`
- **Khởi tạo:** Express application, cổng lắng nghe cấu hình từ `process.env.PORT || 3001`.
- **Middleware:**
  - `cors()`: Cho phép gọi API cross-origin từ các domain khác nhau.
  - `express.json()`: Phân tích cú pháp body dạng JSON.
  - `express.static(distPath)`: Phục vụ thư mục static build `dist/` khi chạy ở chế độ production nguyên khối.
- **Khởi tạo dữ liệu:** Gọi `await seedDatabaseIfEmpty()` ngay khi server khởi động thành công để đảm bảo cơ sở dữ liệu luôn có dữ liệu mẫu nếu bảng đang trống.
- **Fallback SPA:** Route `app.get("*")` trả về file `dist/index.html` (loại trừ các route bắt đầu bằng `/api`).

---

### 3.2. `server/lib/prisma.js`
- Khởi tạo đối tượng `PrismaClient` dạng singleton và gắn vào `globalThis` ở môi trường dev để tránh cạn kiệt connection pool khi reload server nhiều lần.

---

### 3.3. `server/prisma/schema.prisma`
- **Datasource:** PostgreSQL, liên kết qua `DATABASE_URL`.
- **Model `Game`:**
  - `id` (`String @id @default(uuid())`): UUID khóa chính.
  - `title` (`String`): Tên trò chơi.
  - `studio` (`String @default("Unknown Studio")`): Nhà phát triển.
  - `publisher` (`String @default("Unknown Publisher")`): Nhà phát hành.
  - `genre` / `genreEn` (`String`): Thể loại tiếng Việt và tiếng Anh.
  - `year` (`Int @default(2025)`): Năm phát hành.
  - `hours` (`Int @default(0)`): Thời lượng ước tính hoặc giờ chơi.
  - `platform` (`String @default("Steam")`): Nền tảng (Steam, Xbox, PC...).
  - `priority` (`String @default("medium")`): Mức ưu tiên (`low`, `medium`, `high`).
  - `status` (`String @default("backlog")`): Trạng thái (`backlog`, `next`, `playing`, `beaten`).
  - `cover` (`String`): URL ảnh bìa dọc chất lượng cao.
  - `screenshots` (`String @default("[]")`): Chuỗi JSON mảng link ảnh chụp màn hình.
  - `videos` (`String? @default("[]")`): Chuỗi JSON mảng video trailer (chứa link HLS / MP4).
  - `description` / `descriptionEn` (`String`): Mô tả nội dung game.
  - `releaseDate` / `releaseDateEn` (`String`): Ngày phát hành dạng chuỗi hiển thị.
  - `reviewRecent` / `reviewAll` (`String?`): Tóm tắt đánh giá người dùng trên Steam.
  - `tags` / `tagsEn` (`String @default("[]")`): Chuỗi JSON danh sách thẻ tag thể loại.
  - `addedAt` (`Float`): Timestamp thời điểm thêm game.
  - `price` / `originalPrice` / `discountPercent` (`Int?`): Giá hiện tại, giá gốc và % giảm giá.
  - `hoursPlayed` (`Int? @default(0)`): Số giờ đã chơi thực tế từ Steam API.
  - `isOwned` (`Boolean? @default(false)`): Cờ đánh dấu đã sở hữu trong thư viện Steam.
  - `isEarlyAccess` (`Boolean? @default(false)`): Cờ game Early Access.
  - `lndLink` (`String?`): Liên kết ngoài tải game hoặc website chính thức.
  - `storeId` (`String?`): Steam AppID hoặc Xbox ProductID.
  - `storeType` (`String?`): Loại cửa hàng (`steam` hoặc `xbox`).
- **Model `AdminAuth`:**
  - `id` (`String @id @default("admin_single_key")`): Định danh duy nhất cho bản ghi khóa mật khẩu chủ.
  - `password` (`String`): Chuỗi mật khẩu đã được băm an toàn theo chuẩn `scrypt` kèm salt ngẫu nhiên dạng `salt:hash`.
  - `createdAt` / `updatedAt` (`DateTime`): Thời điểm khởi tạo và cập nhật gần nhất.

---

### 3.4. `server/controllers/gameController.js`

- `getEnvConfig()`: Đọc tươi biến môi trường `STEAM_API_KEY` và `STEAM_VANITY_URL` mỗi lần hàm được gọi.
- `parseGameDate(str)`: Bộ phân tích cú pháp ngày phát hành đa năng: nhận diện chuỗi `unreleased`, `TBA`, năm 4 chữ số, định dạng quý `Q1 2026`, tháng năm tiếng Việt (`tháng 10, 2025`), ngày tháng năm (`25 tháng 10 2025`), và ISO string.
- `getGames(req, res)`: Truy vấn toàn bộ game trong database thông qua Prisma, sắp xếp theo thời gian thêm mới nhất hoặc tùy biến.
- `addGame(req, res)`:
  - Kiểm tra xem game đã tồn tại theo `title` hoặc `storeId` chưa. Nếu đã có thì trả về mã `409 Conflict`.
  - Nếu là game Steam (`storeId` là AppID hợp lệ): Tự động gọi `getSteamGameDetails` từ `steamService.js` để nạp toàn bộ ảnh bìa, screenshots, videos trailer, đánh giá, giá tiền, mô tả song ngữ.
  - Nếu là game Xbox: Gọi `getXboxGameDetails` từ `xboxService.js`.
  - Lưu vào database và trả về bản ghi game mới tạo.
- `updateGame(req, res)`: Cập nhật thông tin game dựa theo `req.params.id`.
- `deleteGame(req, res)`: Xóa bản ghi game khỏi database theo ID.
- `searchGames(req, res)`:
  - Nhận query `q` và `platform`.
  - Nếu platform là Xbox: Gọi `searchXbox(q)`.
  - Nếu platform là Steam: Gọi `searchSteam(q)` trả về gợi ý danh sách kèm AppID, ảnh bìa và giá.
- `syncPlaytime(req, res)`:
  - Lấy `vanityUrl` và `apiKey`.
  - Chuyển `vanityUrl` sang SteamID64 bằng hàm `resolveVanityUrl`.
  - Lấy toàn bộ game đã mua trên tài khoản qua Steam Web API `IPlayerService/GetOwnedGames`.
  - Duyệt qua từng game trong database của Medonthan, nếu AppID hoặc tên game trùng khớp thì cập nhật trường `hours` thành số giờ chơi thực tế trên Steam.
- `getSteamStats(req, res)`: Lấy thông tin tóm tắt tài khoản Steam (avatar, tên hiển thị, tổng giờ chơi của tài khoản).

---

### 3.5. `server/controllers/musicController.js`

- `getSpotifyPlaylist(req, res)`:
  - Nhận URL từ `req.query.url` hoặc mặc định lấy từ biến môi trường `MUSIC_API_SPOTIFYPLAYLIST`.
  - Gọi `fetchSpotifyPlaylist(url)` và trả về đối tượng `PlaylistData` cho client.
- `updateSpotifyPlaylistUrl(req, res)`:
  - Nhận `{ url }` trong request body, kiểm tra tính hợp lệ bằng `extractPlaylistId`.
  - Ghi đè biến môi trường `process.env.MUSIC_API_SPOTIFYPLAYLIST`.
  - Tự động tìm và cập nhật giá trị mới vào file `server/.env` để duy trì sau khi restart.

---

### 3.6. `server/controllers/authController.js`
- `extractToken(req)`: Trích xuất token xác thực từ:
  1. Header tùy biến `x-admin-token`.
  2. Header tiêu chuẩn `Authorization: Bearer <token>`.
  3. Cookie `medonthan_admin_token` trong request.
- `getAuthStatus(req, res)`: Kiểm tra DB đã thiết lập mật khẩu chưa (`isSetup`) và token có hợp lệ không (`isAuthenticated`).
- `verifyAdminPassword(req, res)`: Xác thực mật khẩu gửi lên qua hàm `verifyPassword`, cấp token HMAC 30 ngày cho client.
- `setupAdminPassword(req, res)`: Khởi tạo mật khẩu quản trị viên lần đầu trong DB (yêu cầu tối thiểu 4 ký tự).
- `requireAdminAuth(req, res, next)`: Middleware chặn các request chỉnh sửa trái phép (áp dụng cho `POST /api/games`). Nếu chưa cấu hình mật khẩu thì bỏ qua, nếu đã cấu hình mà token không hợp lệ thì trả mã `401 Unauthorized`.

---

### 3.7. `server/services/authService.js`
- `hashPassword(password)`: Tạo salt 16-byte ngẫu nhiên và băm bằng thuật toán mật mã `crypto.scryptSync(..., 64)`, lưu dạng `salt:hash`.
- `verifyPassword(password, storedHash)`: Tách `salt` và `hash`, băm lại và so sánh bằng `crypto.timingSafeEqual` nhằm chống tấn công phân tích thời gian (Timing Attack).
- `createAuthToken(storedHash)`: Tạo token dạng `timestamp.signature` bằng HMAC-SHA256 với khóa bí mật chính là hash của mật khẩu.
- `verifyAuthToken(token, storedHash)`: Kiểm tra chữ ký HMAC và hạn sử dụng 30 ngày. Token tự động mất hiệu lực nếu mật khẩu trong DB bị đổi.
- `getStoredAdminPassword()` / `saveAdminPassword(hashed)`: Truy vấn và lưu trữ an toàn trong bảng `AdminAuth` của PostgreSQL qua Prisma ORM, có fallback raw SQL và tự động nhận diện `ADMIN_PASSWORD` từ file `.env` nếu có.

---

### 3.8. `server/routes/authRoutes.js`
- Khai báo các endpoint:
  - `GET /api/auth/status`
  - `POST /api/auth/verify`
  - `POST /api/auth/setup`

---

### 3.9. `server/services/steamService.js`

- `searchSteam(keyword)`: Gửi request đến `https://store.steampowered.com/api/storesearch/?term={keyword}&l=vietnamese&cc=VN` để lấy danh sách kết quả gợi ý.
- `getSteamGameDetails(appId)`:
  - Gọi đồng thời 2 lần API Steam Store: một lần với ngôn ngữ Tiếng Việt (`l=vietnamese`) và một lần Tiếng Anh (`l=english`).
  - Trích xuất: tiêu đề, mô tả tóm tắt, nhà phát triển, nhà phát hành, ảnh bìa (`header_image`), screenshots.
  - Xử lý video trailer: Tìm kiếm định dạng stream HLS (`.m3u8`) và file MP4 chất lượng cao (`max` / `480`).
  - Lấy thông tin đánh giá người dùng (Reviews) gần đây và tổng thể.
  - Lấy giá tiền và phần trăm giảm giá theo đồng VND.
- `resolveVanityUrl(vanityUrl, apiKey)`: Gọi Steam Web API `ISteamUser/ResolveVanityURL/v0001/` để lấy `steamid` dạng 64-bit.
- `getSteamOwnedGames(steamId, apiKey)`: Gọi `IPlayerService/GetOwnedGames/v0001/` với tùy chọn `include_appinfo=1` và `include_played_free_games=1` để lấy danh sách game và số phút chơi (`playtime_forever`).
- `getSteamAccountStats()`: Gọi `ISteamUser/GetPlayerSummaries/v0002/` kết hợp tổng giờ chơi để trả về hồ sơ tổng quan.

---

### 3.10. `server/services/xboxService.js`
- `searchXbox(keyword)`: Tìm kiếm game thông qua API của Microsoft Xbox Store.
- `getXboxGameDetails(productId)`: Lấy thông tin chi tiết game Xbox: tên, ảnh bìa dọc/ngang, giá tiền, ngày phát hành.

---

### 3.11. `server/services/spotifyPlaylistService.js`
- `extractPlaylistId(input)`: Phân tích chuỗi URL dạng web (`https://open.spotify.com/playlist/...`), URI (`spotify:playlist:...`) hoặc ID nguyên bản để lấy ra Spotify Playlist ID 22 ký tự.
- `getSpotifyApiToken()`:
  - Kiểm tra biến môi trường `SPOTIFY_CLIENT_ID` và `SPOTIFY_CLIENT_SECRET`.
  - Gửi request `POST https://accounts.spotify.com/api/token` theo chuẩn OAuth2 Client Credentials để lấy token có hiệu lực trong 1 giờ.
- `fetchOfficialPlaylistMetadata(playlistId)`: Gọi `https://api.spotify.com/v1/playlists/{playlistId}` bằng token chính thức để lấy mô tả đầy đủ nhất và ảnh cover gốc độ phân giải cao.
- `fetchSpotifyPlaylist(url)`:
  - Sử dụng cơ chế in-memory cache với `playlistCache` Map và thời gian sống `CACHE_TTL_MS = 10 phút`. Nếu URL đã có trong cache và chưa hết hạn, trả về ngay lập tức.
  - Tự động cào dữ liệu từ trang Spotify Embed (`https://open.spotify.com/embed/playlist/{playlistId}`) kết hợp phân tích HTML để trích xuất danh sách bài hát (tên bài, ca sĩ, album, ảnh cover, thời lượng, audio preview link, link spotify).
  - Kết hợp với dữ liệu từ Spotify Web API nếu có token để tạo ra đối tượng dữ liệu hoàn chỉnh nhất.

---

## 4. Các Quy tắc Phát triển Bắt buộc cho AI Agents

Khi làm việc trên codebase này, mọi AI Agent **BẮT BUỘC** phải tuân thủ các quy tắc sau:

1. **Phạm vi chỉnh sửa:**
   - Tuyệt đối không xóa hoặc sửa đổi bất kỳ file nào nằm ngoài thư mục workspace của dự án.
2. **Sử dụng Emoji:**
   - Hạn chế sử dụng emoji ở mức tối thiểu. Tuyệt đối không lạm dụng emoji trừ khi thật sự cần thiết hoặc trong log mang tính nhận diện.
3. **Quy tắc về Tailwind CSS v4:**
   - Dự án dùng Tailwind CSS v4 qua plugin `@tailwindcss/vite`.
   - **KHÔNG ĐƯỢC TẠO** file `tailwind.config.js` hay `postcss.config.js`.
   - Tất cả các biến theme, màu sắc, font chữ phải được khai báo trong `@theme` tại file [src/index.css](file:///h:/Antigravity/medonthan/medonthan/medonthan/src/index.css).
4. **Quy tắc Chuỗi trong JSX:**
   - Trong JSX, các chuỗi có dấu nháy đơn (`'`) phải dùng dấu ngoặc kép bọc ngoài (ví dụ: `"We're ready"`) hoặc escape (`\'`). Dấu nháy đơn không escape sẽ làm gãy trình biên dịch Vite/Rollup.
5. **Cú pháp JSX Ternary & Map:**
   - Khi viết biểu thức ternary điều kiện lồng với `map(...)`, phải kiểm tra thật kỹ các cặp dấu ngoặc đóng `)` của nhánh ternary và `}` của biểu thức JSX. Tránh lỗi `Expected ',' or ')' but found '}'`.
6. **Cấu hình Script Build trong `package.json`:**
   - Lệnh `"build": "vite build"` dùng riêng để đóng gói Frontend tĩnh cho dịch vụ Static Site trên Render (hoặc Vercel/Netlify).
   - Lệnh `"build:server": "cd server && pnpm install && npx prisma generate"` dùng cho môi trường server backend.
   - Không được chèn các lệnh của server (`cd server && npm install`) vào lệnh `build` của frontend vì sẽ làm crash hoặc treo tiến trình deploy của Static Site trên Render.
7. **Cơ chế Proxy API khi triển khai riêng biệt:**
   - Tất cả các lệnh gọi API từ client đều dùng đường dẫn tương đối `/api/...`.
   - Khi Frontend chạy dạng Static Site trên Render, phải luôn nhắc người dùng cấu hình quy tắc **Rewrite** (`/api/*` -> `https://<backend-service>.onrender.com/api/*`) trên Render Dashboard thay vì sửa code cứng thành absolute URL.
