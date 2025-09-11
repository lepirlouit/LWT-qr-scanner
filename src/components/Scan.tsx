// src: https://github.com/maslick/koder/blob/master/public/wasmWorker.js

import React, { useEffect, useRef } from "react";
import useState from 'react-usestateref';
import { beep as beepNow } from "@/helpers/audioHelper";
import { CodeType } from "@/transformers/base";
import "@/assets/css/scan.css";
import WorkerType from "@/types/WorkerType";
import DataMatrixTransformer from "@/transformers/DataMatrixTransformer";
import Code128Transformer from "@/transformers/Code128Transformer";

const BTN_TXT = {
  START: "START",
  STOP: "STOP"
};

const CANVAS_SIZE = {
  WIDTH: 320,
  HEIGHT: 430
};

const CAPTURE_OPTIONS = {
  audio: false,
  video: { facingMode: "environment" }
}

const sw = CANVAS_SIZE.WIDTH;
const sh = CANVAS_SIZE.HEIGHT;
const dw = sw;
const dh = sh;
const dx = 0;
const dy = 0;
let sx = 0;
let sy = 0;

const crossHairSvg = "M77.125 148.02567c0-3.5774 2.73862-6.27567 6.37076-6.27567H119V117H84.0192C66.50812 117 52 130.77595 52 148.02567V183h25.125v-34.97433zM237.37338 117H202v24.75h35.18494c3.63161 0 6.69006 2.69775 6.69006 6.27567V183H269v-34.97433C269 130.77595 254.88446 117 237.37338 117zM243.875 285.4587c0 3.5774-2.73863 6.27567-6.37076 6.27567H202V317h35.50424C255.01532 317 269 302.70842 269 285.4587V251h-25.125v34.4587zM83.49576 291.73438c-3.63213 0-6.37076-2.69776-6.37076-6.27568V251H52v34.4587C52 302.70842 66.50812 317 84.0192 317H119v-25.26563H83.49576z";

export default function Scan({
  decode = true,
  worker = WorkerType.WASM,
  scanRate = 250,
  onChange = (_stringValue: string) => { },
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Component state
  const [btnText, setBtnText] = useState(BTN_TXT.START);
  const [scanning, setScanning] = useState(false);

  const [resultOpen, setResultOpen] = useState(false);
  const [transformToggle, setTransformToggle] = useState(true);
  const [rawCode, setRawCode] = useState<string | null>();
  const [codeType, setCodeType] = useState<CodeType>();

  const [video] = useState(document.createElement("video"));
  const [barcode, setBarcode] = useState<string | null>();
  const [milliseconds, setMilliseconds] = useState();

  // Constants
  let qrworker: null | Worker = null;
  let canvasElement: HTMLCanvasElement | null = null;
  let canvas: CanvasRenderingContext2D | null = null;
  let oldTime = 0;

  video.onplaying = () => {
    sx = (video.videoWidth - CANVAS_SIZE.WIDTH) / 2;
    sy = (video.videoHeight - CANVAS_SIZE.HEIGHT) / 2;
  };

  const initWorker = () => {
    qrworker = new Worker(worker + "Worker.js");
    qrworker.onmessage = async ev => {
      if (ev.data != null) {
        qrworker?.terminate();
        const result = ev.data;
        await stopScan();

        // eslint-disable-next-line prefer-const
        let res = result.data;
        const millis = ev.data.ms;
        const rawCode = res;
        // eslint-disable-next-line prefer-const
        let codeType = CodeType.RAW;

        // Transform raw 1D BarCode (Code128)
        const code128Transformer = new Code128Transformer();
        if (code128Transformer.identified(res)) {
          codeType = code128Transformer.codeType();
          res = await code128Transformer.transform(res);
        }


        // Transform raw 2D BarCode (DataMatrix)
        const dataMatrixTransformer = new DataMatrixTransformer();
        if (dataMatrixTransformer.identified(res)) {
          codeType = dataMatrixTransformer.codeType();
          res = await dataMatrixTransformer.transform(res);
        }

        onChange(res);
        setBarcode(res);
        setResultOpen(true);
        setRawCode(rawCode);
        setCodeType(codeType);
        setMilliseconds(millis);
        beepNow();
      }
    };
  };

  const startScan = async () => {
    console.log("Start Scan")
    initWorker();
    canvasElement = canvasRef.current!;
    canvas = canvasElement.getContext("2d", { willReadFrequently: true });

    setBtnText(BTN_TXT.STOP);
    setBarcode(null);
    setResultOpen(false);
    setTransformToggle(true);
    setRawCode(null);
    setCodeType(CodeType.RAW);

    try {
      video.srcObject = await navigator.mediaDevices.getUserMedia(CAPTURE_OPTIONS);
      video.setAttribute("playsinline", "true");
      await video.play();
      setScanning(true);

      requestAnimationFrame(tick);
    } catch (err) {
      console.log(err)
      stopScan().then();
      console.log("stopped by the user");
      alert(err);
    }
  };

  const stopScan = async () => {
    console.log("Stop Scanning")
    setScanning(false);
    setBtnText(BTN_TXT.START);
    await video.pause();
    if (video.srcObject) {
      (video.srcObject as MediaStream).getVideoTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  const tick: FrameRequestCallback = (time) => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas?.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);

      drawCrosshair();
      if (scanning) requestAnimationFrame(tick);
      if (decode) recogniseQRcode(time);
    }
    requestAnimationFrame(tick);
  };

  const drawCrosshair = () => {
    if (canvas) {
      canvas.fillStyle = "rgba(255,255,255,0.4)";
      const shape = new Path2D(crossHairSvg);
      canvas.fill(shape);
    }
  };

  const recogniseQRcode: FrameRequestCallback = (time) => {
    if (canvas && canvasElement && qrworker && (time - oldTime) > scanRate) {
      oldTime = time;
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

      qrworker.postMessage({ imageData: imageData.data, width: imageData.width, height: imageData.height });
      // qrworker.postMessage(imageData, [imageData.data.buffer]);
    }
  };

  const onBtnClickHandler: React.MouseEventHandler = async (e) => {
    e.preventDefault();
    if (scanning) await stopScan(); else await startScan();
  };

  const startStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = { width: 80, textAlign: "center" };
    if (scanning) return { backgroundColor: "red", ...style };
    else return { backgroundColor: "", ...style };
  };

  const transformToggleStyle = () => {
    if (transformToggle) return { backgroundColor: "green", padding: 12 };
    else return { backgroundColor: "", padding: 12 };
  }

  useEffect(() => { }, []);

  const renderCanvas = () => {
    return <canvas id="canvas" className="scanCanvas" ref={canvasRef} width={CANVAS_SIZE.WIDTH} height={CANVAS_SIZE.HEIGHT} />
  };

  const renderButtons = () => {
    return <div className="scanBtn">
      <a href="!#" className="myHref" onClick={onBtnClickHandler} style={startStyle()}>{btnText}</a>
    </div>;
  };

  const renderScan = () => {
    return (
      <div className="scan">
        {renderCanvas()}
        {renderButtons()}
      </div>
    );
  };

  const renderQrCodeResult = () => {
    return barcode;
  }

  const onClickBackHandler: React.MouseEventHandler = (e) => {
    e.preventDefault();
    setResultOpen(false);
  };

  const onTransformToggleHandler: React.MouseEventHandler = (e) => {
    e.preventDefault();
    setTransformToggle(!transformToggle);
    const rc = rawCode;
    const bc = barcode;
    setBarcode(rc);
    setRawCode(bc);
  };

  const renderTransformToggle = () => {
    if (codeType === CodeType.RAW) return "";
    return (
      <a href="!#"
        className="myHref"
        style={transformToggleStyle()}
        onClick={onTransformToggleHandler}>
        {transformToggle === true ? codeType : "RAW"}
      </a>
    );
  };

  const renderResult = () => {
    if (resultOpen) {
      return (
        <div className="resultModal">
          <div className="result">
            {renderQrCodeResult()}
          </div>
          <div style={{ paddingTop: 10, alignItems: "right" }}>
            Decoding took {milliseconds} ms
          </div>
          <div style={{ marginTop: 40 }}>
            <a href="!#" style={{ padding: 12 }} className="myHref" onClick={onClickBackHandler}>BACK</a>
            {renderTransformToggle()}
          </div>
        </div>);
    }
  };

  return (
    <div>
      {renderScan()}
      {renderResult()}
    </div>
  )
}
