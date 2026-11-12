export interface Personnel {
  id: string;
  name: string;        // ชื่อ-สกุล
  position: string;    // ตำแหน่ง
  room: string;        // ห้อง เช่น 401, 502
  floor: string;       // ชั้น เช่น ชั้น 4, ชั้น 5
  department: string;  // ฝ่าย เช่น ฝ่ายเทคโนโลยีสารสนเทศ
  isDeleted: boolean;  // ลบออกแค่หน้าเว็บ แต่เก็บข้อมูลเอาไว้ด้วย (Soft delete)
  deletedAt?: string;
}
