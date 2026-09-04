import {
  getStoredAdminPassword,
  saveAdminPassword,
  hashPassword,
  verifyPassword,
  createAuthToken,
  verifyAuthToken,
} from "../services/authService.js";

/**
 * Extract auth token from headers or cookies
 */
function extractToken(req) {
  const customHeader = req.headers["x-admin-token"];
  if (customHeader) return String(customHeader).trim();

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split("; ");
    for (const c of cookies) {
      const [k, ...v] = c.split("=");
      if (k === "medonthan_admin_token") {
        return decodeURIComponent(v.join("=")).trim();
      }
    }
  }

  return null;
}

/**
 * GET /api/auth/status
 * Check if password has been configured, and whether caller's token is valid
 */
export async function getAuthStatus(req, res) {
  try {
    const storedHash = await getStoredAdminPassword();
    const isSetup = Boolean(storedHash);

    if (!isSetup) {
      return res.json({
        isSetup: false,
        isAuthenticated: false,
      });
    }

    const token = extractToken(req);
    const isAuthenticated = token ? verifyAuthToken(token, storedHash) : false;

    return res.json({
      isSetup: true,
      isAuthenticated,
    });
  } catch (err) {
    console.error("Error in getAuthStatus:", err);
    return res.status(500).json({ error: "Lỗi kiểm tra trạng thái xác thực", details: err.message });
  }
}

/**
 * POST /api/auth/verify
 * Validate entered password and issue signed auth token
 */
export async function verifyAdminPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, error: "Vui lòng nhập mật khẩu" });
    }

    const storedHash = await getStoredAdminPassword();
    if (!storedHash) {
      return res.status(400).json({
        success: false,
        isSetupRequired: true,
        error: "Chưa có mật khẩu nào được thiết lập. Vui lòng tạo mật khẩu mới.",
      });
    }

    const isValid = verifyPassword(password, storedHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Mật khẩu không chính xác" });
    }

    const token = createAuthToken(storedHash);
    return res.json({
      success: true,
      token,
      message: "Xác thực thành công",
    });
  } catch (err) {
    console.error("Error in verifyAdminPassword:", err);
    return res.status(500).json({ success: false, error: "Lỗi hệ thống khi kiểm tra mật khẩu" });
  }
}

/**
 * POST /api/auth/setup
 * Initialize master password on first launch
 */
export async function setupAdminPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || typeof password !== "string" || password.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu phải có độ dài từ 4 ký tự trở lên",
      });
    }

    const existingHash = await getStoredAdminPassword();
    if (existingHash) {
      // If already set, verify current token before allowing change
      const token = extractToken(req);
      if (!token || !verifyAuthToken(token, existingHash)) {
        return res.status(403).json({
          success: false,
          error: "Mật khẩu đã tồn tại. Cần quyền quản trị viên để thay đổi.",
        });
      }
    }

    const hashedPassword = hashPassword(password.trim());
    await saveAdminPassword(hashedPassword);

    const token = createAuthToken(hashedPassword);
    return res.json({
      success: true,
      token,
      message: "Khởi tạo mật khẩu thành công",
    });
  } catch (err) {
    console.error("Error in setupAdminPassword:", err);
    return res.status(500).json({ success: false, error: "Không thể lưu mật khẩu vào cơ sở dữ liệu" });
  }
}

/**
 * Middleware: Protect routes (e.g. POST /api/games)
 */
export async function requireAdminAuth(req, res, next) {
  try {
    const storedHash = await getStoredAdminPassword();
    // If no password configured in DB yet, allow by default
    if (!storedHash) {
      return next();
    }

    const token = extractToken(req);
    if (!token || !verifyAuthToken(token, storedHash)) {
      return res.status(401).json({
        error: "Cần xác thực mật khẩu quản trị viên để thực hiện thao tác này",
        requireAuth: true,
      });
    }

    next();
  } catch (err) {
    console.error("Error in requireAdminAuth middleware:", err);
    return res.status(500).json({ error: "Lỗi kiểm tra quyền hạn" });
  }
}
