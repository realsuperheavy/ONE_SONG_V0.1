export interface Event {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: number;
  updatedAt: number;
  // Additional event properties
} 