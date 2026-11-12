export type AssetStatus = 'ใช้งาน' | 'ชำรุด' | 'จำหน่าย';

export interface InspectionRecord {
  date: string;
  inspectorName: string;
  oldStatus: AssetStatus;
  newStatus: AssetStatus;
  notes?: string;
}

export interface Asset {
  id: string;
  image: string;                    // รูปภาพ (URL หรือ Data URL หรือ default image)
  name: string;                     // รายการ เช่น เครื่องคอมพิวเตอร์ประมวลผล All-in-One, เครื่องปรับอากาศ
  brand: string;                    // ยี่ห้อ เช่น Dell, HP, Epson
  model: string;                    // รุ่น เช่น OptiPlex 7020, EcoTank L3250
  assetNumber: string;              // เลขครุภัณฑ์ เช่น พณ.6601-002-0012/67
  serialNumber: string;             // Serial number (ห้ามซ้ำ)
  assignedPersonnelId?: string;     // ID บุคลากรผู้ใช้งาน
  assignedPersonnelName: string;    // ผู้ใช้งาน (ชื่อบุคลากร)
  department: string;               // ฝ่าย เช่น ฝ่ายเทคโนโลยีสารสนเทศ
  location: string;                 // สถานที่ เช่น อาคาร 1, อาคารปฏิบัติการ
  room: string;                     // ห้อง เช่น 402, IT Lab 1
  status: AssetStatus;              // สถานะ: ใช้งาน | ชำรุด | จำหน่าย
  disposedDate?: string;            // วันที่จำหน่าย (ถ้าสถานะเป็นจำหน่าย)
  disposedReason?: string;          // เหตุผลที่จำหน่าย
  lastInspectedDate?: string;       // วันที่ตรวจสอบล่าสุด
  inspectionHistory?: InspectionRecord[];
  createdAt: string;
  updatedAt: string;
}
