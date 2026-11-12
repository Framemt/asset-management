# 🏛️ ระบบบริหารจัดการครุภัณฑ์ สถาบันคอมพิวเตอร์ มหาวิทยาลัยรามคำแหง
> **CIRU Digital Asset Management System**  
> เว็บแอปพลิเคชันบริหารจัดการครุภัณฑ์และสินทรัพย์ดิจิทัล สถาบันคอมพิวเตอร์ มหาวิทยาลัยรามคำแหง เต็มรูปแบบตามข้อกำหนดทางราชการ (Angular 20 Standalone + Node.js Express + MySQL + JWT Security)

---

## 📑 สารบัญ
1. [ภาพรวมระบบ (Overview)](#-ภาพรวมระบบ-overview)
2. [สถาปัตยกรรมระบบและเทคโนโลยี (Architecture & Tech Stack)](#-สถาปัตยกรรมระบบและเทคโนโลยี-architecture--tech-stack)
3. [ฟังก์ชันการทำงานหลักตามบทบาท (Key Features by Role)](#-ฟังก์ชันการทำงานหลักตามบทบาท-key-features-by-role)
4. [โครงสร้างฐานข้อมูล MySQL (Database Schema)](#-โครงสร้างฐานข้อมูล-mysql-database-schema)
5. [โครงสร้างโปรเจกต์ (Directory Structure)](#-โครงสร้างโปรเจกต์-directory-structure)
6. [การติดตั้งและเริ่มใช้งาน (Installation & Setup)](#-การติดตั้งและเริ่มใช้งาน-installation--setup)
7. [บัญชีผู้ใช้งานสำหรับทดสอบ (Test Accounts)](#-บัญชีผู้ใช้งานสำหรับทดสอบ-test-accounts)
8. [API Endpoints Reference](#-api-endpoints-reference)

---

## 🌟 ภาพรวมระบบ (Overview)
ระบบบริหารจัดการครุภัณฑ์ สถาบันคอมพิวเตอร์ มหาวิทยาลัยรามคำแหง ออกแบบตามมาตรฐานงานพัสดุและสินทรัพย์ดิจิทัลภาครัฐ มุ่งเน้น:
- **Role-Based Access Control (RBAC):** แบ่งสิทธิ์ระหว่างผู้ดูแลระบบส่วนกลาง (Admin) และเจ้าหน้าที่ผู้ใช้งานประจำฝ่าย (User)
- **Real Database Integration:** เชื่อมต่อฐานข้อมูล MySQL (`test_sys`) 100% เต็มทุกส่วน ไม่มีการใช้ Mock Data
- **Security & Integrity:** มีระบบ Token-based JWT (อายุ 8 ชั่วโมงตามรอบเวลาทำงาน) พร้อมตรวจสอบ Flag การใช้งานจริง (`is_active`) ของบุคลากร
- **UX & Institutional Theme:** คุมโทนสีทางการของมหาวิทยาลัยรามคำแหง (น้ำเงิน `#002d62`, ทอง `#f59e0b`, ขาว `#ffffff`) พร้อมลูกเล่น Micro-interactions, Toast Notification, คีย์ลัดแป้นพิมพ์, Lightbox พรีวิวรูปภาพ และระบบสลับมุมมองตาราง/การ์ด

---

## 🛠️ สถาปัตยกรรมระบบและเทคโนโลยี (Architecture & Tech Stack)

### **Frontend**
- **Framework:** Angular 20 (Standalone Components, Signals API)
- **Styling:** Bootstrap 5.3 + Bootstrap Icons + Custom SCSS
- **HTTP & Security:** Angular `HttpClient` + Functional Interceptor แนบ Bearer JWT Token อัตโนมัติ และตรวจจับ Token หมดอายุ

### **Backend**
- **Runtime:** Node.js + Express
- **Database Driver:** `mysql2/promise` (รองรับ Connection Pool และ Transaction)
- **Security:**
  - `jsonwebtoken` (JWT) อายุ 8 ชั่วโมง
  - รหัสผ่านรองรับการเข้ารหัส `scrypt` พร้อมระบบ Auto-upgrade hash
- **Uploads:** รองรับการอัปโหลดไฟล์รูปภาพครุภัณฑ์จริง แปลงและบีบอัดภาพเพื่อประสิทธิภาพสูงสุด

### **Database**
- **RDBMS:** MySQL / MariaDB (ชื่อฐานข้อมูล: `test_sys`, Charset: `utf8mb4`)

---

## 🎯 ฟังก์ชันการทำงานหลักตามบทบาท (Key Features by Role)

### 👑 1. ผู้ดูแลระบบ (Admin)
- **สิทธิ์การมองเห็น:** เข้าถึงและมองเห็นรายการครุภัณฑ์ของทุกฝ่ายในสถาบันคอมพิวเตอร์
- **เพิ่มครุภัณฑ์ใหม่ (Add Asset):** 
  - บันทึกชื่อ, ยี่ห้อ, รุ่น, ฝ่าย, สถานที่จัดเก็บ
  - ตรวจสอบความซ้ำซ้อนของ Serial Number แบบ Real-time ผ่าน API ก่อนบันทึก
  - รองรับการอัปโหลดรูปภาพครุภัณฑ์จริงจากอุปกรณ์
- **เบิกจ่ายครุภัณฑ์ (Asset Requisition):**
  - ค้นหาและระบุบุคลากรผู้รับผิดชอบการใช้งานจากฐานข้อมูล
  - กำหนดเลขทะเบียนครุภัณฑ์ (มร.สค...)
  - มีปุ่มสุ่มรหัสครุภัณฑ์อัตโนมัติ (⚡ สุ่มรหัส)
  - บันทึกตัดสต็อก พร้อมระบุสถานที่และห้องปฏิบัติการ
- **จัดการข้อมูลบุคลากร (Personnel Management):**
  - เพิ่ม/แก้ไขรายชื่อ ตำแหน่ง ห้อง ชั้น และสังกัดฝ่าย
  - ระบบ Soft Delete ซ่อนรายชื่อจากหน้าแสดงผลปกติเพื่อเก็บบันทึกประวัติการเบิกจ่ายย้อนหลัง และสามารถกู้คืน (Restore) ได้ตลอดเวลา
- **ลบครุภัณฑ์ (Delete Asset):** สามารถลบรายการครุภัณฑ์ที่บันทึกผิดพลาดออกจากฐานข้อมูลได้อย่างปลอดภัย พร้อมระบบยืนยันความปลอดภัย

### 👤 2. เจ้าหน้าที่ประจำฝ่าย (User)
- **Scoped View:** เข้าถึงและมองเห็นเฉพาะครุภัณฑ์ที่อยู่ในฝ่ายที่ตนเองสังกัดเท่านั้น
- **ตรวจสอบสภาพครุภัณฑ์ (Inspect Status):**
  - บันทึกผลการตรวจสภาพ: `ใช้งานปกติ`, `ชำรุด / รอซ่อม`, `จำหน่าย`
  - บันทึกบันทึกหมายเหตุการตรวจสอบลงตารางประวัติ (`inspection_history`)
- **จัดการแก้ไขข้อมูล (Manage Asset):** สามารถแก้ไขข้อมูลครุภัณฑ์ รายละเอียด และสถานที่จัดวางได้
- **ดูทำเนียบบุคลากร:** ดูรายชื่อ ตำแหน่ง ห้อง และชั้นของบุคลากรในสถาบันฯ
- **ดูรายการครุภัณฑ์จำหน่ายแล้ว:** ดูรายละเอียดและประวัติสาเหตุการตัดจำหน่าย (Read-only ตามระเบียบพัสดุ)

### ⚡ 3. ลูกเล่นและฟังก์ชันเสริมการใช้งาน (UX Micro-interactions)
- **Floating Toast Notification:** แจ้งเตือนสถานะการกระทำต่างๆ มุมบนขวาแบบลอยตัว Slide-in & Backdrop Blur
- **Interactive Status Cards:** การ์ดสรุปยอดด้านบน (ทั้งหมด, ใช้งาน, ชำรุด, จำหน่าย) คลิกเพื่อกรองรายการในตารางได้ทันที พร้อม Hover Lift Effect
- **Keyboard Shortcut:** กดคีย์ลัด `/` หรือ `Ctrl+K` เพื่อโฟกัสช่องค้นหาได้สะดวกรวดเร็ว
- **One-click Copy:** คลิกไอคอนคลิปบอร์ดข้าง Serial Number, เลขห้อง หรือชื่อบุคลากรเพื่อ Copy ได้ทันที
- **Image Lightbox:** คลิกที่รูปภาพขนาดเล็กเพื่อดูรูปขยายใหญ่ความละเอียดสูง
- **View Switcher:** หน้าทำเนียบบุคลากรสลับดูได้ทั้งแบบ "ตาราง (Table View)" และ "การ์ดบัตรประจำตัว (Card Grid View)"
- **Real-time Live Clock & Caps Lock Warning:** นาฬิกาดิจิทัลสดบน Navbar และระบบแจ้งเตือนกรณีเผลอเปิดปุ่ม Caps Lock ในหน้า Login

---

## 🗄️ โครงสร้างฐานข้อมูล MySQL (Database Schema)

ฐานข้อมูลชื่อ `test_sys` ประกอบด้วย 5 ตารางหลักที่มีความสัมพันธ์กัน:

```text
┌──────────────┐       ┌────────────────────┐
│    users     │       │     personnel      │
│ (บัญชีผู้ใช้)  │       │ (ทำเนียบบุคลากร)   │
└──────┬───────┘       └─────────┬──────────┘
       │                         │
       │                         │ (ถือครอง)
       │                         ▼
       │               ┌────────────────────┐
       │               │       assets       │
       │               │    (ทะเบียนครุภัณฑ์) │
       │               └────┬──────────┬────┘
       │                    │          │
       ▼                    ▼          ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│     inspection_history      │   │        requisitions         │
│     (ประวัติตรวจสภาพ)         │   │       (ประวัติการเบิกจ่าย)   │
└─────────────────────────────┘   └─────────────────────────────┘
```

1. **`users`:** บัญชีผู้ใช้งานระบบ (Admin / User), แฮชรหัสผ่าน, บทบาท, ฝ่ายที่สังกัด และ Flag `is_active`
2. **`personnel`:** ข้อมูลบุคลากรสถาบันคอมพิวเตอร์, ชื่อ-สกุล, ตำแหน่ง, ห้อง, ชั้น, ฝ่าย, และ Flag Soft Delete (`is_deleted`)
3. **`assets`:** ข้อมูลครุภัณฑ์, รูปภาพ, ชื่อ, ยี่ห้อ, รุ่น, Serial Number, เลขครุภัณฑ์, ผู้ถือครอง, ฝ่าย, สถานที่, ห้อง, สถานะ (`ใช้งาน`, `ชำรุด`, `จำหน่าย`)
4. **`inspection_history`:** บันทึกประวัติการตรวจสอบสภาพครุภัณฑ์ย้อนหลัง
5. **`requisitions`:** บันทึกประวัติการทำรายการเบิกจ่ายครุภัณฑ์

> 💾 ไฟล์ SQL Dump ข้อมูลทั้งหมดจัดเก็บอยู่ที่ [`backend/database.sql`](backend/database.sql)

---

## 📁 โครงสร้างโปรเจกต์ (Directory Structure)

```text
asset-management-app/
├── backend/                       # Backend REST API Server (Node.js + Express)
│   ├── middleware/
│   │   └── auth.js                # JWT Verification & Role-based Guards
│   ├── database.sql               # โครงสร้างฐานข้อมูลและชุดข้อมูลทดสอบจริง (SQL Dump)
│   ├── db-mysql.js                # Data Access Layer เชื่อมต่อ MySQL ด้วย Connection Pool
│   ├── db.js                      # DB Export Interface
│   ├── password.js                # Password hashing / verification logic (scrypt)
│   ├── seed.js                    # สคริปต์รัน Seed ข้อมูลเข้า MySQL อัตโนมัติ
│   ├── server.js                  # Express API Server (พอร์ต 3002)
│   ├── package.json               # Backend Dependencies
│   └── .env.example               # ตัวอย่างไฟล์ Environment Variables
│
├── frontend/                      # Frontend Application (Angular 20 Standalone)
│   ├── public/                    # ไฟล์ Static Assets, โลโก้มหาวิทยาลัย, Uploads
│   │   ├── ru-logo.png            # ตราสัญลักษณ์มหาวิทยาลัยรามคำแหง
│   │   └── uploads/               # รูปภาพครุภัณฑ์ที่อัปโหลดเข้าสู่ระบบ
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Angular Standalone Components
│   │   │   │   ├── asset-list/            # หน้าจอทะเบียนครุภัณฑ์
│   │   │   │   ├── disposed-assets/       # หน้าจอครุภัณฑ์ตัดจำหน่าย
│   │   │   │   ├── login/                 # หน้าจอเข้าสู่ระบบ
│   │   │   │   ├── modal-add-asset/       # ป๊อปอัปเพิ่มครุภัณฑ์ใหม่
│   │   │   │   ├── modal-edit-asset/      # ป๊อปอัปแก้ไขข้อมูลครุภัณฑ์
│   │   │   │   ├── modal-inspect-asset/   # ป๊อปอัปตรวจสอบสภาพ
│   │   │   │   ├── modal-personnel/       # ป๊อปอัปเพิ่ม/แก้ไขบุคลากร
│   │   │   │   ├── modal-requisition/     # ป๊อปอัปทำรายการเบิกจ่าย
│   │   │   │   ├── navbar/                # แถบนำทางด้านบนและนาฬิกา Real-time
│   │   │   │   ├── personnel-list/        # หน้าจอทำเนียบบุคลากร
│   │   │   │   ├── requisition/           # หน้าระบบงานเบิกจ่าย
│   │   │   │   ├── sidebar/               # เมนูด้านข้างและสถิติภาพรวม
│   │   │   │   ├── status-badge/          # ป้ายแสดงสถานะพร้อมไฟกระพริบ
│   │   │   │   └── toast/                 # กล่องข้อความแจ้งเตือน Toast ลอยตัว
│   │   │   ├── guards/                    # Angular Route Guards (authGuard, adminGuard)
│   │   │   ├── interceptors/              # HTTP Interceptor แนบ Token อัตโนมัติ
│   │   │   ├── models/                    # TypeScript Interfaces & Types
│   │   │   └── services/                  # Angular Services (Asset, Auth, Personnel, Toast)
│   │   └── styles.scss            # ธีมหลักของสถาบันคอมพิวเตอร์ มหาวิทยาลัยรามคำแหง
│   ├── angular.json               # การตั้งค่า Angular CLI
│   └── package.json               # Frontend Dependencies
│
├── .env.example                   # ตัวอย่างไฟล์ Environment Variables สำหรับ Root
├── .gitignore                     # กำหนดไฟล์ที่ไม่ต้องติดตามใน Git
├── package.json                   # Root package.json สำหรับสั่งการแบบ Concurrently
└── README.md                      # คู่มือการติดตั้งและใช้งานระบบฉบับสมบูรณ์
```

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Installation & Setup)

### 📋 ข้อกำหนดเบื้องต้น (Prerequisites)
- **Node.js:** เวอร์ชั่น 18.x หรือใหม่กว่า
- **MySQL / MariaDB Server:** เช่น XAMPP, WampServer, Docker หรือ MySQL Community Server (เปิดใช้งานที่พอร์ต `3306`)

---

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์หลักของโปรเจกต์ แล้วติดตั้งแพ็กเกจ:

```bash
# ติดตั้ง root dependencies
npm install

# ติดตั้ง backend dependencies
cd backend && npm install && cd ..

# ติดตั้ง frontend dependencies
cd frontend && npm install && cd ..
```

---

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables (`.env`)
คัดลอกไฟล์ตัวอย่างคอนฟิกทั้งใน root และ backend:

```bash
# คัดลอกไฟล์ .env
cp .env.example .env
cp backend/.env.example backend/.env
```

ตรวจสอบค่าในไฟล์ `backend/.env`:
```env
PORT=3002
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=test_sys
JWT_SECRET=super_secret_jwt_key_ramkhamhaeng_asset_2026
```

---

### ขั้นตอนที่ 3: นำเข้าฐานข้อมูลและ Seed Data
คุณสามารถนำเข้าฐานข้อมูลได้ 2 วิธี:

#### วิธีที่ 3.1: สั่งรัน Seed Script อัตโนมัติ (แนะนำ)
สคริปต์จะสร้างฐานข้อมูล `test_sys` พร้อมสร้างตารางและใส่ชุดข้อมูลตั้งต้นให้อัตโนมัติ:
```bash
npm run seed
```

#### วิธีที่ 3.2: นำเข้าผ่าน phpMyAdmin หรือ MySQL CLI
นำเข้าไฟล์ [`backend/database.sql`](backend/database.sql) เข้าสู่ MySQL โดยตรง:
```bash
mysql -u root -p < backend/database.sql
```

---

### ขั้นตอนที่ 4: สั่งรันระบบ (Run Application)

#### รันพร้อมกันทั้งระบบ (Frontend + Backend):
```bash
npm start
```

#### หรือเลือกรันแยกหน้าต่าง Terminal:
```bash
# Terminal 1: Backend API (พอร์ต 3002)
npm run backend

# Terminal 2: Frontend Angular (พอร์ต 4201)
npm run frontend
```

เมื่อระบบเริ่มทำงานเรียบร้อย:
* 🌐 **Frontend Web App:** [http://localhost:4201](http://localhost:4201)
* 🔌 **Backend REST API:** [http://localhost:3002](http://localhost:3002)

---

## 🔐 บัญชีผู้ใช้งานสำหรับทดสอบ (Test Accounts)

> 💡 **รหัสผ่านของทุกบัญชีในระบบคือ:** `1234`

| บัญชี (Username) | รหัสผ่าน (Password) | บทบาท (Role) | สังกัดฝ่าย (Department) | ขอบเขตสิทธิ์ (Permission Scope) |
| :--- | :---: | :---: | :--- | :--- |
| **`admin`** | **`1234`** | **Admin** | ทุกฝ่าย (ส่วนกลาง) | ดูได้ทุกฝ่าย, เพิ่มครุภัณฑ์, เบิกจ่าย, จัดการบุคลากร, ลบครุภัณฑ์ |
| **`user`** | **`1234`** | **User** | ฝ่ายบริการคอมพิวเตอร์และเครือข่าย | ดูเฉพาะฝ่ายบริการฯ, บันทึกตรวจสภาพ, จัดการข้อมูลครุภัณฑ์ |
| **`theeraphat`** | **`1234`** | **User** | ฝ่ายพัฒนาระบบสารสนเทศ | ดูเฉพาะฝ่ายพัฒนาระบบฯ, บันทึกตรวจสภาพ, จัดการข้อมูลครุภัณฑ์ |
| **`pimpa`** | **`1234`** | **User** | ฝ่ายบริหารทั่วไปและธุรการ | ดูเฉพาะฝ่ายบริหารทั่วไปฯ, บันทึกตรวจสภาพ, จัดการข้อมูลครุภัณฑ์ |
| **`inactive_user`** | **`1234`** | User *(พ้นสภาพ)* | ฝ่ายบริการคอมพิวเตอร์ฯ | **ถูกระงับสิทธิ์** (ทดสอบระบบความปลอดภัย Flag `is_active = 0`) |

---

## 📡 API Endpoints Reference

### 1. ระบบยืนยันตัวตน (Authentication)
- `POST /api/auth/login` - เข้าสู่ระบบ รับ Access Token (JWT 8 ชั่วโมง) และข้อมูลผู้ใช้
- `GET /api/auth/me` - ตรวจสอบความถูกต้องของ Token ปัจจุบัน

### 2. ระบบครุภัณฑ์ (Asset Management)
- `GET /api/assets` - ดึงรายการครุภัณฑ์ (ระบบกรองตามสิทธิ์ Role/Department ใน Token อัตโนมัติ)
- `GET /api/assets/check-serial` - ตรวจสอบความซ้ำซ้อนของ Serial Number
- `POST /api/assets` - เพิ่มรายการครุภัณฑ์ใหม่ (เฉพาะ Admin)
- `PUT /api/assets/:id` - แก้ไขข้อมูลครุภัณฑ์
- `DELETE /api/assets/:id` - ลบรายการครุภัณฑ์ออกจากระบบ (เฉพาะ Admin)
- `PUT /api/assets/:id/status` - ตรวจสอบและอัปเดตสถานะการตรวจสภาพครุภัณฑ์
- `POST /api/assets/:id/requisition` - บันทึกการทำรายการเบิกจ่ายครุภัณฑ์ (เฉพาะ Admin)
- `POST /api/assets/upload-image` - อัปโหลดไฟล์รูปภาพครุภัณฑ์

### 3. ระบบบุคลากร (Personnel Management)
- `GET /api/personnel` - ดึงรายชื่อบุคลากร (รองรับ query parameter `?includeDeleted=true` สำหรับ Admin)
- `POST /api/personnel` - เพิ่มข้อมูลบุคลากรใหม่ (เฉพาะ Admin)
- `PUT /api/personnel/:id` - แก้ไขข้อมูลบุคลากร (เฉพาะ Admin)
- `DELETE /api/personnel/:id` - Soft Delete ซ่อนบุคลากรออกจากระบบ (เฉพาะ Admin)
- `PUT /api/personnel/:id/restore` - กู้คืนสถานะบุคลากรกลับสู่ระบบ (เฉพาะ Admin)

---

## 🏛️ ผู้รับผิดชอบและสังกัด
- **หน่วยงาน:** งานพัสดุและสินทรัพย์ดิจิทัล สถาบันคอมพิวเตอร์ มหาวิทยาลัยรามคำแหง
- **ที่อยู่:** อาคารสถาบันคอมพิวเตอร์ มหาวิทยาลัยรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240
