// src: https://github.com/maslick/koder/blob/master/public/wasmWorker.js

importScripts("wasm/zxing-wasm@2.2.1_reader.js");


const readerOptions = {
  tryHarder: true,
  formats: ["DataMatrix", "Code128"],
  maxNumberOfSymbols: 1,
};


(async () => {
  // Listen for messages from JS main thread containing raw image data
  self.addEventListener('message', event => {

    const {imageData, width, height} = event.data;
    if (!imageData) return;

    const t0 = new Date().getTime();
    (async () => {
      const imageFileReadResults = await ZXingWASM.readBarcodes(new ImageData(imageData, width, height), readerOptions);
      const t1 = new Date().getTime();
      if (imageFileReadResults[0]) {
        postMessage({
          data: imageFileReadResults[0].text,
          type: imageFileReadResults[0].contentType,
          ms: t1-t0
        });
      }
    })();
  });
})();