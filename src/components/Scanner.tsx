import { Card } from "@mui/material";
import Scan from "./Scan"

const Scanner = ({ onChange = (_stringValue: string) => { } }) => {

  return (
    <Card>
      <Scan scanRate={250} onChange={onChange} />
    </Card>
  );
}

export default Scanner