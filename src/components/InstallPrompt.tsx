import { useEffect, useState } from 'react';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';

const DISMISSED_KEY = 'lwt-install-dismissed';

// Non-standard event, only fired by Chromium-based browsers
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// Only Chrome gets a Google-signed WebAPK; other Android browsers build their own APK,
// which Play Protect blocks as "ontwikkeld voor een oudere versie van Android".
const isAndroidNonChrome = () =>
  /android/i.test(navigator.userAgent) &&
  (/SamsungBrowser|EdgA|OPR|OPT\/|YaBrowser|MiuiBrowser|HuaweiBrowser|HeyTapBrowser|Firefox/i.test(navigator.userAgent) ||
    'brave' in navigator);

const chromeIntentUrl = () =>
  `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;

function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showChromeHint, setShowChromeHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    if (isAndroidNonChrome()) {
      setShowChromeHint(true);
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setShowIosHint(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // iOS never fires beforeinstallprompt; the only option is manual instructions
    if (isIos()) setShowIosHint(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setInstallEvent(null);
    setShowIosHint(false);
    setShowChromeHint(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'dismissed') localStorage.setItem(DISMISSED_KEY, '1');
    setInstallEvent(null);
  };

  return (
    <Snackbar
      open={installEvent !== null || showIosHint || showChromeHint}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        icon={false}
        action={
          <>
            {showChromeHint && (
              <Button
                color="inherit"
                size="small"
                href={chromeIntentUrl()}
                startIcon={<OpenInBrowserIcon />}
              >
                Openen in Chrome
              </Button>
            )}
            {installEvent !== null && (
              <Button color="inherit" size="small" onClick={install}>
                Installeren
              </Button>
            )}
            <IconButton size="small" color="inherit" onClick={dismiss} aria-label="sluiten">
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        {showChromeHint ? (
          'Open deze pagina in Google Chrome om LWT Scanner veilig als app te installeren.'
        ) : installEvent !== null ? (
          'Installeer LWT Scanner als app op je toestel.'
        ) : (
          <>
            Installeer deze app: tik op{' '}
            <IosShareIcon fontSize="inherit" sx={{ verticalAlign: 'text-bottom' }} /> Delen en kies
            “Zet op beginscherm”.
          </>
        )}
      </Alert>
    </Snackbar>
  );
}

export default InstallPrompt;
