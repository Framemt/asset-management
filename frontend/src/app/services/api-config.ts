/**
 * ==============================================================================
 * จุดตั้งค่าเชื่อมต่อ Backend API (API Configuration for Backend Handover)
 * ==============================================================================
 * คำแนะนำสำหรับพี่เลี้ยง / ผู้พัฒนาระบบ Backend:
 * - หากต้องการเชื่อมต่อกับ Backend จริง (เช่น Spring Boot, Node.js, Python หรือ Oracle API)
 *   สามารถระบุ URL ของเซิร์ฟเวอร์จริงในตัวแปร CUSTOM_BACKEND_URL ด้านล่างนี้ได้ทันที
 * - หากปล่อยเป็น null ระบบจะใช้อัตโนมัติ: http://{hostname}:3000/api
 */
export const CUSTOM_BACKEND_URL: string | null = null; 
// ตัวอย่าง: export const CUSTOM_BACKEND_URL: string | null = 'http://192.168.1.100:8080/api';

export function getApiBaseUrl(): string {
  if (CUSTOM_BACKEND_URL) {
    return CUSTOM_BACKEND_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:3002/api`;
  }
  
  return 'http://localhost:3002/api';
}
