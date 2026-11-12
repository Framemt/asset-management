const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test_sys',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

class MySQLDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async init() {
    try {
      this.pool = mysql.createPool(DB_CONFIG);
      const [rows] = await this.pool.query('SELECT 1 + 1 AS result');
      this.isConnected = true;

      // Check if users table exists, if not, auto-seed
      const [tables] = await this.pool.query("SHOW TABLES LIKE 'users'");
      if (tables.length === 0) {
        console.log('[MySQL DB] Tables missing in test_sys. Running initial seeding...');
        const { seedDatabase } = require('./seed');
        await seedDatabase();
      }

      console.log('----------------------------------------------------');
      console.log(`[MySQL DB] Connected successfully to "${DB_CONFIG.database}" on ${DB_CONFIG.host}:${DB_CONFIG.port} ✅`);
      console.log('----------------------------------------------------');
      return true;
    } catch (err) {
      this.isConnected = false;
      console.warn(`[MySQL DB] Could not connect to MySQL (${err.code || err.message}). Fallback to Mock DB enabled.`);
      return false;
    }
  }

  // ----------------------------------------------------
  // USERS
  // ----------------------------------------------------
  async getUsers() {
    const [rows] = await this.pool.query('SELECT * FROM users ORDER BY role ASC, id ASC');
    return rows.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      department: u.department,
      isActive: Boolean(u.is_active),
      position: u.position,
      avatar: u.avatar
    }));
  }

  async findUserByUsername(username) {
    const trimmed = (username || '').trim().toLowerCase();
    const [rows] = await this.pool.query('SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1', [trimmed]);
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role,
      department: u.department,
      isActive: Boolean(u.is_active),
      position: u.position,
      avatar: u.avatar
    };
  }

  async findUserById(id) {
    const [rows] = await this.pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      role: u.role,
      department: u.department,
      isActive: Boolean(u.is_active),
      position: u.position,
      avatar: u.avatar
    };
  }

  async updateUserPassword(id, passwordHash) {
    const [result] = await this.pool.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
    return result.affectedRows > 0;
  }

  async toggleUserFlag(id) {
    const user = await this.findUserById(id);
    if (!user) return null;
    const newActive = user.isActive ? 0 : 1;
    await this.pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newActive, id]);
    return { ...user, isActive: !user.isActive };
  }

  // ----------------------------------------------------
  // ASSETS
  // ----------------------------------------------------
  async getAssets(role, department) {
    let sql = 'SELECT * FROM assets';
    const params = [];
    if (role !== 'admin' && department && department !== 'ทุกฝ่าย') {
      sql += ' WHERE department = ?';
      params.push(department);
    }
    sql += ' ORDER BY created_at DESC, id DESC';

    const [assets] = await this.pool.query(sql, params);
    if (assets.length === 0) return [];

    // Attach inspection history
    const assetIds = assets.map(a => a.id);
    const [histories] = await this.pool.query(
      `SELECT * FROM inspection_history WHERE asset_id IN (${assetIds.map(() => '?').join(',')}) ORDER BY id DESC`,
      assetIds
    );

    const historyMap = {};
    for (const h of histories) {
      if (!historyMap[h.asset_id]) historyMap[h.asset_id] = [];
      historyMap[h.asset_id].push({
        date: h.date,
        inspectorName: h.inspector_name,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        notes: h.notes
      });
    }

    return assets.map(a => ({
      id: a.id,
      image: a.image,
      name: a.name,
      brand: a.brand,
      model: a.model,
      assetNumber: a.asset_number || '',
      serialNumber: a.serial_number,
      assignedPersonnelId: a.assigned_personnel_id || '',
      assignedPersonnelName: a.assigned_personnel_name || '',
      department: a.department,
      location: a.location,
      room: a.room,
      status: a.status,
      disposedDate: a.disposed_date || undefined,
      disposedReason: a.disposed_reason || undefined,
      lastInspectedDate: a.last_inspected_date || undefined,
      createdAt: a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : '',
      updatedAt: a.updated_at ? new Date(a.updated_at).toISOString().split('T')[0] : '',
      inspectionHistory: historyMap[a.id] || []
    }));
  }

  async getAssetById(id) {
    const [rows] = await this.pool.query('SELECT * FROM assets WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;
    const a = rows[0];

    const [histories] = await this.pool.query(
      'SELECT * FROM inspection_history WHERE asset_id = ? ORDER BY id DESC',
      [id]
    );

    return {
      id: a.id,
      image: a.image,
      name: a.name,
      brand: a.brand,
      model: a.model,
      assetNumber: a.asset_number || '',
      serialNumber: a.serial_number,
      assignedPersonnelId: a.assigned_personnel_id || '',
      assignedPersonnelName: a.assigned_personnel_name || '',
      department: a.department,
      location: a.location,
      room: a.room,
      status: a.status,
      disposedDate: a.disposed_date || undefined,
      disposedReason: a.disposed_reason || undefined,
      lastInspectedDate: a.last_inspected_date || undefined,
      createdAt: a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : '',
      updatedAt: a.updated_at ? new Date(a.updated_at).toISOString().split('T')[0] : '',
      inspectionHistory: histories.map(h => ({
        date: h.date,
        inspectorName: h.inspector_name,
        oldStatus: h.old_status,
        newStatus: h.new_status,
        notes: h.notes
      }))
    };
  }

  async isSerialDuplicate(serial, excludeId) {
    const trimmed = (serial || '').trim().toLowerCase();
    let sql = 'SELECT id FROM assets WHERE LOWER(serial_number) = ?';
    const params = [trimmed];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await this.pool.query(sql, params);
    return rows.length > 0;
  }

  async addAsset(data) {
    const duplicate = await this.isSerialDuplicate(data.serialNumber);
    if (duplicate) {
      throw new Error(`Serial Number "${data.serialNumber}" มีอยู่ในระบบแล้ว ห้ามซ้ำ!`);
    }

    const id = 'ast-' + Date.now().toString(36);
    const image = data.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80';
    const name = data.name.trim();
    const brand = data.brand.trim();
    const model = data.model.trim();
    const serialNumber = data.serialNumber.trim();
    const assetNumber = data.assetNumber ? data.assetNumber.trim() : '';
    const assignedPersonnelId = data.assignedPersonnelId || '';
    const assignedPersonnelName = data.assignedPersonnelName ? data.assignedPersonnelName.trim() : 'ยังไม่ได้ระบุผู้ใช้งาน (พัสดุคงคลังสถาบัน)';
    const department = data.department || 'ฝ่ายบริการคอมพิวเตอร์และเครือข่าย';
    const location = data.location || 'อาคารสถาบันคอมพิวเตอร์ ม.รามคำแหง';
    const room = data.room || 'ห้องพัสดุ 105';
    const status = 'ใช้งาน';

    await this.pool.query(
      `INSERT INTO assets 
       (id, image, name, brand, model, asset_number, serial_number, assigned_personnel_id, assigned_personnel_name, department, location, room, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, image, name, brand, model, assetNumber, serialNumber, assignedPersonnelId, assignedPersonnelName, department, location, room, status]
    );

    return await this.getAssetById(id);
  }

  async updateAsset(id, fields) {
    const asset = await this.getAssetById(id);
    if (!asset) return null;

    if (fields.serialNumber && (await this.isSerialDuplicate(fields.serialNumber, id))) {
      throw new Error(`Serial Number "${fields.serialNumber}" ซ้ำกับครุภัณฑ์อื่นในระบบ!`);
    }

    const newStatus = fields.status || asset.status;
    let disposedDate = asset.disposedDate || null;
    let disposedReason = asset.disposedReason || null;

    if (newStatus === 'จำหน่าย' && asset.status !== 'จำหน่าย') {
      disposedDate = new Date().toISOString().split('T')[0];
      disposedReason = fields.disposedReason || 'อนุมัติจำหน่ายตามสภาพ';
    } else if (newStatus !== 'จำหน่าย') {
      disposedDate = null;
      disposedReason = null;
    }

    const updates = {
      image: fields.image !== undefined ? fields.image : asset.image,
      name: fields.name !== undefined ? fields.name : asset.name,
      brand: fields.brand !== undefined ? fields.brand : asset.brand,
      model: fields.model !== undefined ? fields.model : asset.model,
      asset_number: fields.assetNumber !== undefined ? fields.assetNumber : asset.assetNumber,
      serial_number: fields.serialNumber !== undefined ? fields.serialNumber : asset.serialNumber,
      assigned_personnel_id: fields.assignedPersonnelId !== undefined ? fields.assignedPersonnelId : asset.assignedPersonnelId,
      assigned_personnel_name: fields.assignedPersonnelName !== undefined ? fields.assignedPersonnelName : asset.assignedPersonnelName,
      department: fields.department !== undefined ? fields.department : asset.department,
      location: fields.location !== undefined ? fields.location : asset.location,
      room: fields.room !== undefined ? fields.room : asset.room,
      status: newStatus,
      disposed_date: disposedDate,
      disposed_reason: disposedReason
    };

    const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ');
    const values = [...Object.values(updates), id];

    await this.pool.query(`UPDATE assets SET ${setClauses} WHERE id = ?`, values);
    return await this.getAssetById(id);
  }

  async verifyAssetStatus(id, newStatus, notes, disposedReason, inspectorName) {
    const asset = await this.getAssetById(id);
    if (!asset) return null;

    const today = new Date().toISOString().split('T')[0];
    const inspector = inspectorName || 'เจ้าหน้าที่ผู้ตรวจสอบ';
    const noteText = notes || 'ตรวจสอบสภาพประจำงวด';

    // Insert inspection history log
    await this.pool.query(
      `INSERT INTO inspection_history (asset_id, date, inspector_name, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, today, inspector, asset.status, newStatus, noteText]
    );

    let disposedDate = asset.disposedDate || null;
    let dispReason = asset.disposedReason || null;
    if (newStatus === 'จำหน่าย') {
      disposedDate = disposedDate || today;
      dispReason = disposedReason || notes || 'เสื่อมสภาพตามการใช้งาน';
    } else {
      disposedDate = null;
      dispReason = null;
    }

    await this.pool.query(
      `UPDATE assets SET status = ?, last_inspected_date = ?, disposed_date = ?, disposed_reason = ? WHERE id = ?`,
      [newStatus, today, disposedDate, dispReason, id]
    );

    return await this.getAssetById(id);
  }

  async requisitionAsset(id, payload) {
    const asset = await this.getAssetById(id);
    if (!asset) return null;

    const today = new Date().toISOString().split('T')[0];
    const reqId = 'req-' + Date.now().toString(36);

    // Record requisition history
    await this.pool.query(
      `INSERT INTO requisitions 
       (id, asset_id, asset_number, asset_name, brand, model, serial_number, personnel_id, personnel_name, department, location, room, requisition_date, requisition_by, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reqId,
        id,
        payload.assetNumber.trim(),
        asset.name,
        asset.brand,
        asset.model,
        asset.serialNumber,
        payload.assignedPersonnelId,
        payload.assignedPersonnelName,
        payload.department,
        payload.location.trim(),
        payload.room.trim(),
        today,
        'เจ้าหน้าที่พัสดุ',
        payload.notes || 'เบิกจ่ายใช้งานประจำฝ่าย'
      ]
    );

    // Update asset
    await this.pool.query(
      `UPDATE assets SET assigned_personnel_id = ?, assigned_personnel_name = ?, department = ?, asset_number = ?, location = ?, room = ? WHERE id = ?`,
      [
        payload.assignedPersonnelId,
        payload.assignedPersonnelName,
        payload.department,
        payload.assetNumber.trim(),
        payload.location.trim(),
        payload.room.trim(),
        id
      ]
    );

    return await this.getAssetById(id);
  }

    async deleteAsset(id) {
    await this.pool.query('DELETE FROM inspection_history WHERE asset_id = ?', [id]);
    await this.pool.query('DELETE FROM requisitions WHERE asset_id = ?', [id]);
    const [result] = await this.pool.query('DELETE FROM assets WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // ----------------------------------------------------
  // PERSONNEL
  // ----------------------------------------------------
  async getPersonnel(includeDeleted = false) {
    let sql = 'SELECT * FROM personnel';
    if (!includeDeleted) {
      sql += ' WHERE is_deleted = 0';
    }
    sql += ' ORDER BY id ASC';

    const [rows] = await this.pool.query(sql);
    return rows.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      room: p.room,
      floor: p.floor,
      department: p.department,
      isDeleted: Boolean(p.is_deleted),
      deletedAt: p.deleted_at || undefined
    }));
  }

  async addPersonnel(data) {
    const id = 'p-' + Date.now().toString(36);
    await this.pool.query(
      `INSERT INTO personnel (id, name, position, room, floor, department, is_deleted) VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, data.name.trim(), data.position.trim(), data.room.trim(), data.floor.trim(), data.department.trim()]
    );
    return {
      id,
      name: data.name.trim(),
      position: data.position.trim(),
      room: data.room.trim(),
      floor: data.floor.trim(),
      department: data.department.trim(),
      isDeleted: false
    };
  }

  async updatePersonnel(id, data) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name.trim()); }
    if (data.position !== undefined) { updates.push('position = ?'); values.push(data.position.trim()); }
    if (data.room !== undefined) { updates.push('room = ?'); values.push(data.room.trim()); }
    if (data.floor !== undefined) { updates.push('floor = ?'); values.push(data.floor.trim()); }
    if (data.department !== undefined) { updates.push('department = ?'); values.push(data.department.trim()); }

    if (updates.length === 0) return null;
    values.push(id);

    await this.pool.query(`UPDATE personnel SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await this.pool.query('SELECT * FROM personnel WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const p = rows[0];
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      room: p.room,
      floor: p.floor,
      department: p.department,
      isDeleted: Boolean(p.is_deleted),
      deletedAt: p.deleted_at || undefined
    };
  }

  async softDeletePersonnel(id) {
    const today = new Date().toISOString().split('T')[0];
    await this.pool.query('UPDATE personnel SET is_deleted = 1, deleted_at = ? WHERE id = ?', [today, id]);
    const [rows] = await this.pool.query('SELECT * FROM personnel WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const p = rows[0];
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      room: p.room,
      floor: p.floor,
      department: p.department,
      isDeleted: true,
      deletedAt: today
    };
  }

  async restorePersonnel(id) {
    await this.pool.query('UPDATE personnel SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [id]);
    const [rows] = await this.pool.query('SELECT * FROM personnel WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const p = rows[0];
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      room: p.room,
      floor: p.floor,
      department: p.department,
      isDeleted: false,
      deletedAt: undefined
    };
  }
}

module.exports = new MySQLDatabase();
