import { useEffect, useState } from 'react'
import './App.css'
import { AppBar, Box, Card, CardHeader, Toolbar, Typography } from '@mui/material'
import LastScans from './components/LastScans'
import Scanner from './components/Scanner'
import type { ScanRecord } from './types/ScanRecord'

const SCANNING_API = "https://leeuwsewielertoeristen.be/scanner-api/public/api/scannings";
const STORAGE_KEY = 'lwt-scans';

const loadScans = (): ScanRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};
const MAX_RETRIES = 3;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const getGeolocation = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );

function App() {
  const [scans, setScans] = useState<ScanRecord[]>(loadScans);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans.filter(s => s.status !== 'success')));
  }, [scans]);

  const updateScan = (id: string, patch: Partial<ScanRecord>) =>
    setScans(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const submitWithRetry = async (record: ScanRecord) => {
    let latitude = 0;
    let longitude = 0;
    try {
      const pos = await getGeolocation();
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      // proceed with 0,0
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(SCANNING_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niss: record.niss.substring(0, 11),
            team: record.teamName,
            moment: record.moment,
            latitude,
            longitude,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        updateScan(record.id, { status: 'success' });
        return;
      } catch {
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
        } else {
          updateScan(record.id, { status: 'failed' });
        }
      }
    }
  };

  // Resubmit records that were pending or failed when the page was last closed
  useEffect(() => {
    const toRetry = scans.filter(s => s.status === 'pending' || s.status === 'failed');
    if (toRetry.length === 0) return;
    setScans(prev => prev.map(s => toRetry.some(r => r.id === s.id) ? { ...s, status: 'pending' } : s));
    toRetry.forEach(s => submitWithRetry({ ...s, status: 'pending' }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScanSubmit = (data: Omit<ScanRecord, 'id' | 'status' | 'latitude' | 'longitude'>) => {
    const record: ScanRecord = { ...data, id: crypto.randomUUID(), status: 'pending', latitude: 0, longitude: 0 };
    setScans(prev => [record, ...prev].slice(0, 20));
    submitWithRetry(record);
  };

  const handleRetry = (id: string) => {
    setScans(prev => {
      const record = prev.find(s => s.id === id);
      if (!record) return prev;
      const updated = { ...record, status: 'pending' as const };
      submitWithRetry(updated);
      return prev.map(s => s.id === id ? updated : s);
    });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="absolute">
        <Toolbar sx={{ pr: '24px' }}>
          <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            LWT Scanner
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
            gap: 2,
          }}
        >
          <Card>
            <CardHeader title="LWT Scanner" />
          </Card>

          <Scanner onSubmit={handleScanSubmit} />
          <LastScans scans={scans} onRetry={handleRetry} />
        </Box>
      </Box>
    </Box>
  )
}

export default App
