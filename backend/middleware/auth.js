const jwt = require('jsonwebtoken');

// Read JWT secret from .env with fallback for development safety
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_ramkhamhaeng_asset_2026';

/**
 * Middleware: Verify JWT Token from Authorization Header
 */
function verifyJwt(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'ไม่พบ Access Token กรุณาเข้าสู่ระบบ'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'รูปแบบ Token ไม่ถูกต้อง (Bearer Token required)'
    });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check Flag: Inactive accounts are blocked (403 Forbidden)
    if (!decoded.isActive) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีนี้ถูกระงับสิทธิ์หรือพ้นสภาพการทำงานแล้ว (Flag: Inactive)'
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token หมดอายุหรือไม่ถูกต้อง (อายุการใช้งาน 8 ชั่วโมง) กรุณาเข้าสู่ระบบใหม่'
    });
  }
}

/**
 * Middleware: Require Admin Role
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (ต้องเป็น Admin เท่านั้น)'
    });
  }
  next();
}

/**
 * Generate JWT Token helper (Expires in 8 hours)
 */
function generateToken(userPayload) {
  return jwt.sign(
    {
      id: userPayload.id,
      username: userPayload.username,
      name: userPayload.name,
      role: userPayload.role,
      department: userPayload.department,
      isActive: userPayload.isActive,
      position: userPayload.position,
      avatar: userPayload.avatar
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

module.exports = {
  JWT_SECRET,
  verifyJwt,
  requireAdmin,
  generateToken
};
