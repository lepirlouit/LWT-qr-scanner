import { Card, CardHeader, Typography } from "@mui/material";

interface LastScansProps {
  previousScans: string[];
}

const LastScans = ({ previousScans = [] }: LastScansProps) => {

  return (
    <Card>
      <CardHeader title={"Last Scans"} />
      {previousScans.map(previousScan => <Typography>{previousScan}</Typography>)}
    </Card>
  )
}

export default LastScans;