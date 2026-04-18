import { Button, Card, CardHeader, List, ListItem, ListItemText } from "@mui/material";
import type { ScanRecord } from "@/types/ScanRecord";

interface LastScansProps {
  scans: ScanRecord[];
  onRetry: (id: string) => void;
}

const statusIcon = (status: ScanRecord['status']) => {
  if (status === 'pending') return '⏳';
  if (status === 'success') return '✓';
  return '✗';
};

const LastScans = ({ scans = [], onRetry }: LastScansProps) => {
  return (
    <Card>
      <CardHeader title="Last Scans" />
      <List dense>
        {scans.map((scan) => (
          <ListItem
            key={scan.id}
            secondaryAction={
              scan.status === 'failed' ? (
                <Button size="small" color="error" onClick={() => onRetry(scan.id)}>
                  Retry
                </Button>
              ) : null
            }
          >
            <ListItemText
              primary={`${statusIcon(scan.status)} ${scan.niss}`}
              secondary={`${scan.teamName ?? '—'} — ${scan.moment}`}
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
};

export default LastScans;
