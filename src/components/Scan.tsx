import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, FormControlLabel, Switch, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { beep as beepNow } from "@/helpers/audioHelper";
import { validateBelgianNationalNumber } from "@/helpers/belgian-validator";
import "@/assets/css/scan.css";
import DataMatrixTransformer from "@/transformers/DataMatrixTransformer";
import Code128Transformer from "@/transformers/Code128Transformer";
import TeamSelect, { type Team } from "@/components/TeamSelect";
import type { ScanRecord } from "@/types/ScanRecord";
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
const LIBRARY_LOCATION = new URL('./scandit-lib/', document.baseURI).href;

const localISOString = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
};

type SubmitData = Omit<ScanRecord, 'id' | 'status' | 'latitude' | 'longitude'>;

export default function Scan({
  onSubmit = (_: SubmitData) => {},
}: {
  onSubmit?: (data: SubmitData) => void;
}) {
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualNiss, setManualNiss] = useState("");
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);
  const [niss, setNiss] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamRequired, setTeamRequired] = useState(true);
  const teamRequiredRef = useRef(true);

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
      setInvalidMessage(null);

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

            const validation = validateBelgianNationalNumber(res);
            if (!validation.isValid) showInvalid(`Ongeldige NISS: ${validation.error}`);

            setNiss(res);
            setBarcode(res);
            if (teamRequiredRef.current) {
              setTeamSelectOpen(true);
            } else {
              setResultOpen(true);
            }
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
  };

  const handleTeamCancel = () => startScan();

  const showInvalid = (msg: string) => setInvalidMessage(msg);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = manualNiss.trim();
    if (!value) return;
    const validation = validateBelgianNationalNumber(value);
    if (!validation.isValid) showInvalid(`Ongeldige NISS: ${validation.error}`);
    await stopScan();
    setNiss(value);
    setBarcode(value);
    setManualNiss("");
    if (teamRequired) {
      setTeamSelectOpen(true);
    } else {
      setResultOpen(true);
    }
    beepNow();
  };

  const handleValidate = () => {
    if (!niss) return;
    onSubmit({
      niss,
      teamKey: selectedTeam?.key,
      teamName: selectedTeam?.name,
      moment: localISOString(),
    });
    startScan();
  };

  useEffect(() => {
    startScan();
    return () => {
      cameraRef.current?.switchToDesiredState(FrameSourceState.Off);
      contextRef.current?.dispose();
    };
  }, []);

  const renderValidateButton = () => (
    <a
      href="!#"
      className="myHref"
      style={{ padding: 12 }}
      onClick={(e) => { e.preventDefault(); handleValidate() }}
    >
      VALIDEREN
    </a>
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
        {teamRequired && (
          <div style={{ marginTop: 32 }}>
            <a
              href="!#"
              className="myHref back-btn"
              onClick={(e) => { e.preventDefault(); setResultOpen(false); setTeamSelectOpen(true); }}
            >
              ← Ploeg wijzigen
            </a>
          </div>
        )}
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
        <Accordion disableGutters elevation={0} sx={{ background: 'transparent' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" color="text.secondary">Opties</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Switch
                  checked={teamRequired}
                  onChange={(e) => {
                    teamRequiredRef.current = e.target.checked;
                    setTeamRequired(e.target.checked);
                  }}
                />
              }
              label="Ploeg selecteren"
            />
          </AccordionDetails>
        </Accordion>
        <form className="manual-entry" onSubmit={handleManualSubmit}>
          <input
            className="manual-input"
            type="text"
            inputMode="numeric"
            placeholder="NISS manueel invoeren"
            value={manualNiss}
            onChange={(e) => setManualNiss(e.target.value)}
          />
          <button className="manual-submit" type="submit">OK</button>
        </form>
      </div>
      {teamSelectOpen && barcode && (
        <TeamSelect niss={barcode} warning={invalidMessage} onSelect={handleTeamSelect} onCancel={handleTeamCancel} />
      )}
      {renderResult()}
    </div>
  );
}
