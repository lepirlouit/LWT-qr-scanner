import { useEffect, useRef, useState } from "react";
import { beep as beepNow } from "@/helpers/audioHelper";
import "@/assets/css/scan.css";
import DataMatrixTransformer from "@/transformers/DataMatrixTransformer";
import Code128Transformer from "@/transformers/Code128Transformer";
import TeamSelect, { type Team } from "@/components/TeamSelect";
import {
  DataCaptureContext,
  DataCaptureView,
  Camera,
  CameraPosition,
  FrameSourceState,
} from "@scandit/web-datacapture-core";
import {
  barcodeCaptureLoader,
  BarcodeCapture,
  BarcodeCaptureOverlay,
  BarcodeCaptureSettings,
  Symbology,
} from "@scandit/web-datacapture-barcode";

const LICENSE_KEY = import.meta.env.VITE_SCANDIT_LICENSE_KEY ?? "";
const LIBRARY_LOCATION = "/scandit-lib/";
const SCANNING_API = "https://leeuwsewielertoeristen.be/scanner-api/public/api/scannings";

const localISOString = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
};

const getGeolocation = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );

export default function Scan({
  onChange = (_: string) => {},
}: {
  onChange?: (value: string) => void;
}) {
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [niss, setNiss] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const contextRef = useRef<DataCaptureContext | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const barcodeCaptureRef = useRef<BarcodeCapture | null>(null);

  const stopScan = async () => {
    await barcodeCaptureRef.current?.setEnabled(false);
    await cameraRef.current?.switchToDesiredState(FrameSourceState.Off);
  };

  const startScan = async () => {
    try {
      setBarcode(null);
      setNiss(null);
      setTeamSelectOpen(false);
      setResultOpen(false);
      setSelectedTeam(null);
      setValidating(false);
      setValidationError(null);

      if (!contextRef.current) {
        const context = await DataCaptureContext.forLicenseKey(LICENSE_KEY, {
          libraryLocation: LIBRARY_LOCATION,
          moduleLoaders: [barcodeCaptureLoader()],
        });

        const settings = new BarcodeCaptureSettings();
        settings.enableSymbologies([Symbology.DataMatrix, Symbology.Code128]);
        const barcodeCapture = await BarcodeCapture.forContext(context, settings);
        barcodeCaptureRef.current = barcodeCapture;

        barcodeCapture.addListener({
          didScan: async (_bc, session) => {
            const scanned = session.newlyRecognizedBarcode;
            if (!scanned?.data) return;

            await stopScan();

            let res = scanned.data;

            const code128 = new Code128Transformer();
            if (code128.identified(res)) res = await code128.transform(res);

            const dataMatrix = new DataMatrixTransformer();
            if (dataMatrix.identified(res)) res = await dataMatrix.transform(res);

            setNiss(res);
            setBarcode(res);
            setTeamSelectOpen(true);
            beepNow();
          },
        });

        const camera = Camera.pickBestGuessForPosition(CameraPosition.WorldFacing);
        await camera.applySettings(BarcodeCapture.recommendedCameraSettings);
        await context.setFrameSource(camera);
        cameraRef.current = camera;

        const view = await DataCaptureView.forContext(context);
        if (viewContainerRef.current) {
          view.connectToElement(viewContainerRef.current);
        }
        await BarcodeCaptureOverlay.withBarcodeCaptureForView(barcodeCapture, view);

        contextRef.current = context;
      }

      await barcodeCaptureRef.current?.setEnabled(true);
      await cameraRef.current?.switchToDesiredState(FrameSourceState.On);
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setTeamSelectOpen(false);
    setResultOpen(true);
    onChange(`${niss} (${team.name})`);
  };

  const handleTeamCancel = () => startScan();

  const handleValidate = async () => {
    if (!niss) return;
    setValidating(true);
    setValidationError(null);
    try {
      let latitude = 0;
      let longitude = 0;
      try {
        const position = await getGeolocation();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // proceed without coordinates
      }

      const response = await fetch(SCANNING_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, niss, moment: localISOString() }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await startScan();
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : String(err));
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    startScan();
    return () => {
      cameraRef.current?.switchToDesiredState(FrameSourceState.Off);
      contextRef.current?.dispose();
    };
  }, []);

  const renderValidateButton = () => (
    <>
      <a
        href="!#"
        className="myHref"
        style={{ padding: 12, opacity: validating ? 0.6 : 1, pointerEvents: validating ? "none" : "auto" }}
        onClick={(e) => { e.preventDefault(); handleValidate(); }}
      >
        {validating ? "..." : "VALIDEREN"}
      </a>
      {validationError && <div className="validate-error">{validationError}</div>}
    </>
  );

  const renderResult = () => {
    if (!resultOpen) return null;
    return (
      <div className="resultModal">
        {selectedTeam && (
          <div className="team-badge">
            <span className="team-badge__num">{selectedTeam.key}</span>
            <span className="team-badge__name">{selectedTeam.name}</span>
          </div>
        )}
        <div className="result">{barcode}</div>
        <div style={{ marginTop: 16 }}>
          {renderValidateButton()}
        </div>
        <div style={{ marginTop: 32 }}>
          <a
            href="!#"
            className="myHref back-btn"
            onClick={(e) => { e.preventDefault(); setResultOpen(false); setTeamSelectOpen(true); }}
          >
            ← Ploeg wijzigen
          </a>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="scan">
        <div
          ref={viewContainerRef}
          className="scanCanvas"
          style={{ width: 320, height: 430, position: "relative" }}
        />
      </div>
      {teamSelectOpen && barcode && (
        <TeamSelect niss={barcode} onSelect={handleTeamSelect} onCancel={handleTeamCancel} />
      )}
      {renderResult()}
    </div>
  );
}
