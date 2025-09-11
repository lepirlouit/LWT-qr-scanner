import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { AppBar, Box, Card, CardContent, CardHeader, Toolbar, Typography } from '@mui/material'
import LastScans from './components/LastScans'
import Scanner from './components/Scanner'

function App() {
  const [niss, setNiss] = useState("");
  const [previousScans, setPreviousScans] = useState<string[]>([]);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="absolute">
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
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
            <CardHeader title={"LWT Scanner"} />
            <CardContent>
              <Typography>WebAssembly Barcode Scanner</Typography>
              <p className="text-sm text-muted-foreground">Belgish rijksregisternummer Scanner</p>
            </CardContent>
          </Card>

          <Scanner onChange={(value) => { console.log("onChange", value); setPreviousScans([value, ...previousScans].slice(0, 10)) }} />
          <LastScans previousScans={previousScans} />
        </Box>
      </Box>

    </Box>
  )
}

export default App
