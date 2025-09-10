import { Card } from "@mui/material";
import Scan from "./Scan"

const Scanner = () => {

  return (
    <Card>
      <Scan scanRate={250} />
    </Card>
  );
}

export default Scanner