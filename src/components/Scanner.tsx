import { Card } from "@mui/material";
import Scan from "./Scan"

const Scanner = ({ onChange = (_stringValue: string) => { } }) => {

  return (
    <Card>
      <Scan onChange={onChange} />
    </Card>
  );
}

export default Scanner