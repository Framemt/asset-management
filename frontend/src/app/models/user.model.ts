export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; // รหัสผ่านกำหนดที่นี่
  name: string;
  role: Role;
  department: string;
  isActive: boolean; // Flag to check access permissions
  position: string;
  avatar?: string;
}
