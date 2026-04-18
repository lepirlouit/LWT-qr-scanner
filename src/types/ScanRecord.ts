export type ScanStatus = 'pending' | 'success' | 'failed';

export interface ScanRecord {
  id: string;
  niss: string;
  teamKey: number;
  teamName: string;
  moment: string;
  latitude: number;
  longitude: number;
  status: ScanStatus;
}
