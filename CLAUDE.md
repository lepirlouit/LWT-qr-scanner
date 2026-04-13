# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (also copies Scandit engine to public/scandit-lib/)
npm run build    # Type-check + build (tsc -b && vite build)
npm run lint     # ESLint
npm run preview  # Preview production build
```

There are no tests.

## Environment

Copy `.env` and fill in your Scandit license key:
```
VITE_SCANDIT_LICENSE_KEY=your_key_here
```

## Architecture

Single-page React + TypeScript + Vite app. No routing — one view. Purpose: scan Belgian national identification numbers (NISS/rijksregisternummer) via device camera.

**Scanning pipeline:**
1. User clicks START in `Scan.tsx`
2. `DataCaptureContext.forLicenseKey(...)` initialises the Scandit SDK (once — context is reused on subsequent scans via a ref)
3. Scandit's `DataCaptureView` renders the camera feed inside a div; `BarcodeCaptureOverlay` adds the built-in viewfinder UI
4. When a barcode is recognised, `didScan` fires with a `BarcodeCaptureSession`; the result is in `session.newlyRecognizedBarcode.data`
5. The raw string is passed through a **Transformer** (see `src/transformers/`) to extract the NISS
6. `src/helpers/belgian-validator.ts` validates the 11-digit NISS (check digit, century detection, gender derivation)
7. On success: camera stops, audio beep plays, result shown in a modal, added to `previousScans` in `App.tsx`

**Supported barcode formats:**
- `DataMatrix` (2D): format `###;NISS;###;###;###` — extracts the second segment
- `Code128` (1D): 11 or 20 digits — extracts last 11 digits

**Scandit SDK (v8):**
- Packages: `@scandit/web-datacapture-core`, `@scandit/web-datacapture-barcode`
- Engine WASM/JS files live in `node_modules/@scandit/web-datacapture-barcode/sdc-lib/`; the custom Vite plugin in `vite.config.ts` copies them to `public/scandit-lib/` on every dev/build start
- `public/scandit-lib/` is gitignored — it is regenerated automatically
- Key API: `DataCaptureContext.forLicenseKey(key, { libraryLocation: '/scandit-lib/', moduleLoaders: [barcodeCaptureLoader()] })`

**Key files:**
- `src/components/Scan.tsx` — all scanning logic: SDK init, camera, listener, result modal
- `src/transformers/base.ts` — `Transformer` interface and `CodeType` enum
- `src/helpers/belgian-validator.ts` — NISS validation, formatting, century/gender derivation

**Path alias:** `@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`).

**UI:** Material-UI v7 with Emotion. No custom theme beyond Roboto font.
