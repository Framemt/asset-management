require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { verifyJwt, requireAdmin, generateToken } = require('./middleware/auth');
const { hashPassword, verifyPassword, isHashed } = require('./password');

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory (linked to frontend/public/uploads)
const uploadsPath = path.join(__dirname, '../frontend/public/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// ----------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS (JWT 8 Hours)
// ----------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' });
    }

    const user = await db.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' });
    }

    // Verify Password
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Upgrade legacy plain-text password to scrypt hash on successful login
    if (!isHashed(user.password)) {
      await db.updateUserPassword(user.id, hashPassword(password));
    }

    // Check Access Flag: Inactive accounts are blocked (403 Forbidden)
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีนี้ถูกระงับสิทธิ์หรือพ้นสภาพการทำงาน (Flag: Inactive) ไม่สามารถเข้าสู่ระบบได้'
      });
    }

    // Issue JWT with 8-Hour Lifetime
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: publicUser(user)
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', verifyJwt, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// ----------------------------------------------------
// 2. ASSET ENDPOINTS (MySQL)
// ----------------------------------------------------

// GET /api/assets (Role-scoped by JWT: Admin sees all; User sees own department)
app.get('/api/assets', verifyJwt, async (req, res) => {
  try {
    const { role, department } = req.user;
    const assets = await db.getAssets(role, department);
    res.json({
      success: true,
      assets
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/assets/check-serial
app.get('/api/assets/check-serial', verifyJwt, async (req, res) => {
  try {
    const { serial, excludeId } = req.query;
    if (!serial) {
      return res.json({ isDuplicate: false });
    }
    const isDuplicate = await db.isSerialDuplicate(serial, excludeId);
    res.json({ isDuplicate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/upload (Image Upload Endpoint)
app.post('/api/upload', verifyJwt, (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลไฟล์รูปภาพ' });
    }

    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const safeName = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const destPath = path.join(uploadsPath, safeName);
    fs.writeFileSync(destPath, buffer);

    const fileUrl = `uploads/${safeName}`;
    res.json({
      success: true,
      message: 'อัปโหลดรูปภาพสำเร็จ',
      url: fileUrl
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกรูปภาพ' });
  }
});

// POST /api/assets (Admin only: duplicate serial check)
app.post('/api/assets', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const { name, brand, model, serialNumber } = req.body;
    if (!name || !brand || !model || !serialNumber) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    const newAsset = await db.addAsset(req.body);
    res.status(201).json({
      success: true,
      message: 'เพิ่มรายการครุภัณฑ์สำเร็จ',
      asset: newAsset
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/assets/:id (Full edit)
app.put('/api/assets/:id', verifyJwt, async (req, res) => {
  try {
    const updated = await db.updateAsset(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการแก้ไข' });
    }
    res.json({
      success: true,
      message: 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว',
      asset: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/assets/:id/status (Verify status: ใช้งาน, ชำรุด, จำหน่าย)
app.patch('/api/assets/:id/status', verifyJwt, async (req, res) => {
  try {
    const { status, notes, disposedReason } = req.body;
    if (!status || !['ใช้งาน', 'ชำรุด', 'จำหน่าย'].includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
    }

    const inspectorName = req.user ? req.user.name : 'เจ้าหน้าที่ผู้ตรวจสอบ';
    const updated = await db.verifyAssetStatus(req.params.id, status, notes, disposedReason, inspectorName);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
    }

    res.json({
      success: true,
      message: `อัปเดตสถานะเป็น "${status}" สำเร็จ`,
      asset: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/assets/:id/requisition (Admin Requisition)
app.post('/api/assets/:id/requisition', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const { assignedPersonnelName, assetNumber, location, room } = req.body;
    if (!assignedPersonnelName || !assetNumber || !location || !room) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลการเบิกจ่ายให้ครบถ้วน' });
    }

    const updated = await db.requisitionAsset(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
    }

    res.json({
      success: true,
      message: `เบิกครุภัณฑ์ให้ ${assignedPersonnelName} เรียบร้อยแล้ว`,
      asset: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/assets/:id (Admin only: Delete asset)
app.delete('/api/assets/:id', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteAsset(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์ที่ต้องการลบ' });
    }
    res.json({
      success: true,
      message: 'ลบรายการครุภัณฑ์สำเร็จ'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// 3. PERSONNEL ENDPOINTS (MySQL)
// ----------------------------------------------------

// GET /api/personnel
app.get('/api/personnel', verifyJwt, async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true' && req.user.role === 'admin';
    const personnel = await db.getPersonnel(includeDeleted);
    res.json({
      success: true,
      personnel
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/personnel (Admin)
app.post('/api/personnel', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const { name, position, room, floor, department } = req.body;
    if (!name || !position || !room || !floor || !department) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const newPerson = await db.addPersonnel(req.body);
    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลบุคลากรสำเร็จ',
      personnel: newPerson
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/personnel/:id (Admin edit)
app.put('/api/personnel/:id', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const updated = await db.updatePersonnel(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบบุคลากร' });
    }
    res.json({
      success: true,
      message: 'แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว',
      personnel: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/personnel/:id (Admin Soft Delete)
app.delete('/api/personnel/:id', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const deleted = await db.softDeletePersonnel(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'ไม่พบบุคลากร' });
    }
    res.json({
      success: true,
      message: `ลบข้อมูล ${deleted.name} เรียบร้อยแล้ว`,
      personnel: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/personnel/:id/restore (Admin Restore)
app.post('/api/personnel/:id/restore', verifyJwt, requireAdmin, async (req, res) => {
  try {
    const restored = await db.restorePersonnel(req.params.id);
    if (!restored) {
      return res.status(404).json({ success: false, message: 'ไม่พบบุคลากร' });
    }
    res.json({
      success: true,
      message: `กู้คืนข้อมูล ${restored.name} เรียบร้อยแล้ว`,
      personnel: restored
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// 4. SYSTEM HEALTH
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'asset-management-api',
    database: 'MySQL (test_sys)',
    time: new Date()
  });
});

// Start server
db.init().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Database] Connected to MySQL (test_sys)`);
  });
}).catch(err => {
  console.error('[Fatal Error] Failed to connect to MySQL database:', err.message);
  process.exit(1);
});
