import React, { useEffect, useRef, useState } from "react";
import { beep as beepNow } from "@/helpers/audioHelper";
import { CodeType } from "@/transformers/base";
import "@/assets/css/scan.css";
import DataMatrixTransformer from "@/transformers/DataMatrixTransformer";
import Code128Transformer from "@/transformers/Code128Transformer";
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

const BTN_TXT = { START: "START", STOP: "STOP" };

export default function Scan({
  onChange = (_: string) => {},
}: {
  onChange?: (value: string) => void;
}) {
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [btnText, setBtnText] = useState(BTN_TXT.START);
  const [resultOpen, setResultOpen] = useState(false);
  const [transformToggle, setTransformToggle] = useState(true);
  const [rawCode, setRawCode] = useState<string | null>(null);
  const [codeType, setCodeType] = useState<CodeType>(CodeType.RAW);
  const [barcode, setBarcode] = useState<string | null>(null);

  const contextRef = useRef<DataCaptureContext | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const barcodeCaptureRef = useRef<BarcodeCapture | null>(null);

  const stopScan = async () => {
    setScanning(false);
    setBtnText(BTN_TXT.START);
    await barcodeCaptureRef.current?.setEnabled(false);
    await cameraRef.current?.switchToDesiredState(FrameSourceState.Off);
  };

  const startScan = async () => {
    try {
      setBarcode(null);
      setResultOpen(false);
      setTransformToggle(true);
      setRawCode(null);
      setCodeType(CodeType.RAW);

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
            const raw = res;
            let currentCodeType = CodeType.RAW;

            const code128 = new Code128Transformer();
            if (code128.identified(res)) {
              currentCodeType = code128.codeType();
              res = await code128.transform(res);
            }

            const dataMatrix = new DataMatrixTransformer();
            if (dataMatrix.identified(res)) {
              currentCodeType = dataMatrix.codeType();
              res = await dataMatrix.transform(res);
            }

            onChange(res);
            setBarcode(res);
            setResultOpen(true);
            setRawCode(raw);
            setCodeType(currentCodeType);
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
      setBtnText(BTN_TXT.STOP);
      setScanning(true);
    } catch (err) {
      console.error(err);
      await stopScan();
      alert(err);
    }
  };

  const onBtnClick: React.MouseEventHandler = async (e) => {
    e.preventDefault();
    if (scanning) await stopScan();
    else await startScan();
  };

  useEffect(() => {
    return () => {
      cameraRef.current?.switchToDesiredState(FrameSourceState.Off);
      contextRef.current?.dispose();
    };
  }, []);

  const startStyle = (): React.CSSProperties => ({
    width: 80,
    textAlign: "center",
    backgroundColor: scanning ? "red" : "",
  });

  const transformToggleStyle = () => ({
    backgroundColor: transformToggle ? "green" : "",
    padding: 12,
  });

  const onClickBack: React.MouseEventHandler = (e) => {
    e.preventDefault();
    setResultOpen(false);
  };

  const onTransformToggle: React.MouseEventHandler = (e) => {
    e.preventDefault();
    setTransformToggle(!transformToggle);
    setBarcode(rawCode);
    setRawCode(barcode);
  };

  const renderTransformToggle = () => {
    if (codeType === CodeType.RAW) return null;
    return (
      <a href="!#" className="myHref" style={transformToggleStyle()} onClick={onTransformToggle}>
        {transformToggle ? codeType : "RAW"}
      </a>
    );
  };

  const renderResult = () => {
    if (!resultOpen) return null;
    return (
      <div className="resultModal">
        <div className="result">{barcode}</div>
        <div style={{ marginTop: 40 }}>
          <a href="!#" style={{ padding: 12 }} className="myHref" onClick={onClickBack}>BACK</a>
          {renderTransformToggle()}
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
        <div className="scanBtn">
          <a href="!#" className="myHref" onClick={onBtnClick} style={startStyle()}>{btnText}</a>
        </div>
      </div>
      {renderResult()}
    </div>
  );
}
