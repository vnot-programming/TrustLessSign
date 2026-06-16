# Marginal Page Stamp (Page Swapping Protection)

A Marginal Page Stamp will be generated for every page of the PDF and injected vertically on the left margin. This ensures every page is cryptographically tied to the document ID and its specific page number.

## Open Questions

> [!WARNING]
> You mentioned `stampBase64Image` in singular for the injection function, but since the requirement states that the barcode and text include the specific `pageNum` (e.g., `Page 1 of 5`), we must generate a unique stamp image for **each** page. 
> 
> My proposed approach: The Web UI (which has access to `JsBarcode` and `Canvas`) will loop through all pages (from `1` to `numPages`), generate an array of Base64 stamps, and send this array to the Extension. The Extension will then inject each corresponding stamp into its respective page. Does this approach sound good to you?

## Proposed Changes

### Web Application (Laravel/React)

#### [MODIFY] `web/resources/js/Utils/barcode-generator.js`
- Create a new exported function `generatePageStamp(shortId, pageNum, totalPages, timestamp)`.
- Use `OffscreenCanvas` or a hidden `<canvas>` to create an 800x40 image.
- Set background to transparent.
- Draw the Barcode 128 using `JsBarcode` at `x=0`.
- Draw the metadata text at `x=150` (or beside the barcode) with font `12px Courier New`, color `#555555`.
- Format: `tSign ID: [shortId] | Page [pageNum] of [totalPages] | Time: [timestamp]`.
- Return the Base64 PNG.

#### [MODIFY] `web/resources/js/Pages/SignDocument.jsx`
- In `handleSign`, right before sending the `TRUSTLESS_SIGN_REQUEST` to the extension, create an array `pageStamps`.
- Loop `i` from 1 to `numPages`.
- Call `await generatePageStamp(shortId, i, numPages, timestamp)` and push to `pageStamps`.
- Add `pageStamps` to the payload sent to the extension.

### Chrome Extension

#### [MODIFY] `chrome-extension/signing/signer.js`
- Modify the signing process to accept `metadata.pageStamps`.
- Create a function `stampAllPages(pdfDoc, pageStamps)`.
- Iterate through `pdfDoc.getPages()`.
- For each page index `i`, embed the `pageStamps[i]` PNG.
- Draw the embedded image on the page at `x: 15, y: 50` with `rotate: degrees(90)`.
- This function will be called before `pdfDoc.save()`.

#### [MODIFY] `chrome-extension/package.json`
- Bump version to indicate the new feature (e.g., `1.1.0` or next patch).
- Ensure synchronization with manifest versions.

## Verification Plan
- Build the web UI using `npm run build`.
- Load the unpacked extension in the browser.
- Sign a multi-page PDF.
- Verify the signed PDF has the vertical ribbon on the left margin of **every** page, with the correct page numbers and barcode.
