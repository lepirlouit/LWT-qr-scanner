import { useCallback, useEffect, useState } from 'react';
import { Alert, Button } from '@mui/material';
import { GEO_OPTIONS } from '@/helpers/geolocation';

type PermState = 'unknown' | 'granted' | 'prompt' | 'denied' | 'unsupported';

const LocationStatus = () => {
  const [state, setState] = useState<PermState>('unknown');

  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) {
      setState('unsupported');
      return;
    }
    let perm: PermissionStatus | undefined;
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((p) => {
        perm = p;
        setState(p.state as PermState);
        p.onchange = () => setState(p.state as PermState);
      })
      .catch(() => setState('unsupported'));
    return () => {
      if (perm) perm.onchange = null;
    };
  }, []);

  const requestLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      () => setState('granted'),
      (err) => setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'prompt'),
      GEO_OPTIONS
    );
  }, []);

  if (state === 'unknown' || state === 'granted' || state === 'unsupported') return null;

  return (
    <Alert
      severity="warning"
      sx={{ m: 2 }}
      action={
        <Button color="inherit" size="small" onClick={requestLocation}>
          {state === 'denied' ? 'Opnieuw proberen' : 'Locatie toestaan'}
        </Button>
      }
    >
      {state === 'denied'
        ? 'Locatie is geblokkeerd. Sta locatie toe in de browserinstellingen en klik daarna op "Opnieuw proberen".'
        : 'Locatie is niet toegestaan. Scans worden zonder locatie verstuurd.'}
    </Alert>
  );
};

export default LocationStatus;
