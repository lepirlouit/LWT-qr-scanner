import { Card } from "@mui/material";
import Scan from "./Scan"
import type { ScanRecord } from "@/types/ScanRecord";

type SubmitData = Omit<ScanRecord, 'id' | 'status' | 'latitude' | 'longitude'>;

const Scanner = ({ onSubmit = (_: SubmitData) => {} }: { onSubmit?: (data: SubmitData) => void }) => {
  return (
    <Card>
      <Scan onSubmit={onSubmit} />
    </Card>
  );
}

export default Scanner
