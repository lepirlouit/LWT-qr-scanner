import { Card } from "@mui/material";
import Scan from "./Scan"
import type { ScanRecord } from "@/types/ScanRecord";

type SubmitData = Omit<ScanRecord, 'id' | 'status' | 'latitude' | 'longitude'>;

const Scanner = ({
  onSubmit = (_: SubmitData) => {},
  teamRequired = true,
}: {
  onSubmit?: (data: SubmitData) => void;
  teamRequired?: boolean;
}) => {
  return (
    <Card>
      <Scan onSubmit={onSubmit} teamRequired={teamRequired} />
    </Card>
  );
}

export default Scanner
