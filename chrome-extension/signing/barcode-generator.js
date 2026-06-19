/**
 * TrustLessSign Barcode Signature Generator
 * Composes the signature frame using Canvas API.
 * Adheres to Zero-Trust architecture and Bio-Digital Minimalism.
 */

async function generateSignatureFrame(signerName, shortId, verifyUrl, uploadedImageBase64 = null, isQrCode = true, textSignedBy = "Signed by:", textVerifyAt = "Verifikasi di:", hideFrame = false) {
    // Zero-Trust Validation is handled by Sanctum tokens in the Web Dashboard.

    // 2. Set up Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Define logical dimensions (Compact 300x200)
    const logicalWidth = 300;
    const logicalHeight = 200; 
    const scaleFactor = 4;
    
    // Set actual canvas size (4x larger for high DPI)
    canvas.width = logicalWidth * scaleFactor;
    canvas.height = logicalHeight * scaleFactor;
    
    ctx.scale(scaleFactor, scaleFactor);

    // 3. Draw Main Background
    // Made transparent as per user request
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 6; 
    const width = logicalWidth;
    const height = logicalHeight;

    // If hideFrame, use tight layout without any decoration
    const bodyStartX = hideFrame ? 4 : 12;
    const rightPadding = 6;

    if (!hideFrame) {
        // Artistic Green Border (Left)
        ctx.strokeStyle = '#3B935D';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        // Top left curve
        ctx.moveTo(padding + 6, padding);
        ctx.quadraticCurveTo(padding, padding, padding, padding + 6);
        // Line down
        ctx.lineTo(padding, height - padding - 6);
        // Bottom left curve
        ctx.quadraticCurveTo(padding, height - padding, padding + 6, height - padding);
        ctx.stroke();

        // Header: Check icon + "Signed by: [signerName]"
        // Check mark
        ctx.beginPath();
        ctx.moveTo(bodyStartX, padding + 5);
        ctx.lineTo(bodyStartX + 5, padding + 10);
        ctx.lineTo(bodyStartX + 12, padding + 1);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3B935D';
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${textSignedBy} ${signerName}`, bodyStartX + 16, padding + 5);
    }

    // Body: Image or Cursive Text
    const bodyStartY = hideFrame ? padding : padding + 14; 
    // Give image more vertical space but keep it away from meta
    const bodyHeight = hideFrame ? height - padding * 2 : height - padding - 14 - (isQrCode ? 0 : 50); 
    const maxImgWidth = width - rightPadding - bodyStartX; 
    
    if (uploadedImageBase64) {
        const img = new Image();
        img.src = uploadedImageBase64;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        
        const scale = Math.min(
            maxImgWidth / img.width,
            bodyHeight / img.height
        );
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        
        // Center horizontally in the available space
        const drawX = bodyStartX + (maxImgWidth - drawWidth) / 2;
        // Center vertically
        const drawY = bodyStartY + (bodyHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Cursive fallback
        ctx.fillStyle = '#111111';
        ctx.font = 'italic 30px cursive, serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const drawX = bodyStartX + maxImgWidth / 2;
        ctx.fillText(signerName, drawX, bodyStartY + bodyHeight / 2);
    }

    if (!isQrCode && !hideFrame) {
        // Meta Info
        const metaY = height - padding - 32; 
        
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#3B935D';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText("TrustLessSign Zero Trust", bodyStartX, metaY);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#111111';
        ctx.textAlign = 'right';
        ctx.fillText(shortId, width - rightPadding, metaY);

        // Barcode 1D
        if (typeof JsBarcode !== 'undefined') {
            const barcodeCanvas = document.createElement('canvas');
            JsBarcode(barcodeCanvas, shortId, {
                format: "CODE128",
                displayValue: false,
                margin: 0,
                width: 2,
                height: 18, 
                lineColor: "#111111"
            });
            const barcodeWidth = width - rightPadding - bodyStartX;
            ctx.drawImage(barcodeCanvas, bodyStartX, metaY + 2, barcodeWidth, 18);
        }

        // Footer
        const footerY = height - padding; 
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        const t1 = `${textVerifyAt} `;
        const t2 = verifyUrl;
        
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(t1, bodyStartX, footerY);
        
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = '#3B935D';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(t2, bodyStartX + w1, footerY);
    }

    return canvas.toDataURL('image/png');
}

const TSIGN_LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTggNDIiIHdpZHRoPSIxMTgiIGhlaWdodD0iNDIiPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJ0U2lnbkdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjM0I5MzVEIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyYTY5NDIiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICAKICA8dGV4dCB4PSIwIiB5PSIzMyIgZm9udC1mYW1pbHk9IidDb3VyaWVyIE5ldycsIG1vbm9zcGFjZSIgZm9udC1zaXplPSI0NCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9InVybCgjdFNpZ25HcmFkKSI+dDwvdGV4dD4KICAKICA8dGV4dCB4PSIyNCIgeT0iMzMiIGZvbnQtZmFtaWx5PSInSW50ZXInLCAnQXJpYWwnLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjM4IiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjMTExMTExIiBsZXR0ZXItc3BhY2luZz0iLTEiPlNpZ248L3RleHQ+CiAgCiAgPGNpcmNsZSBjeD0iMTEzIiBjeT0iMzMiIHI9IjQuNSIgZmlsbD0iIzNCOTM1RCIgLz4KPC9zdmc+Cg==";

/**
 * Generate a standalone modern QR Code using qr-code-styling.
 * Contains no external borders, text, or meta info.
 */
async function generateModernTSignQR(verifyUrl, hideFrame = false) {
    const qrCode = new QRCodeStyling({
        width: 600,
        height: 600,
        type: "canvas",
        data: verifyUrl,
        image: hideFrame ? null : TSIGN_LOGO_BASE64,
        margin: hideFrame ? 4 : 0,
        qrOptions: {
            typeNumber: 0,
            mode: "Byte",
            errorCorrectionLevel: "H"
        },
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: 0.3,
            margin: 10,
            crossOrigin: "anonymous"
        },
        dotsOptions: {
            color: "#000000",
            type: "rounded"
        },
        backgroundOptions: {
            color: "transparent"
        },
        cornersSquareOptions: {
            color: "#000000",
            type: "extra-rounded"
        },
        cornersDotOptions: {
            color: "#000000",
            type: "dot"
        }
    });

    const blob = await qrCode.getRawData("png");
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Generate a Marginal Page Stamp (Horizontal Ribbon)
 * to be placed vertically on the PDF to prevent page swapping.
 */
async function generatePageStamp(shortId, pageNum, totalPages, timestamp) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const width = 800;
    const height = 40;
    canvas.width = width;
    canvas.height = height;

    // Background: transparent
    ctx.clearRect(0, 0, width, height);

    const barcodeData = `${shortId}-P${String(pageNum).padStart(2, '0')}`;
    
    // Draw Barcode using JsBarcode
    // Create a temporary canvas for the barcode since JsBarcode replaces canvas sizes sometimes
    const barcodeCanvas = document.createElement("canvas");
    JsBarcode(barcodeCanvas, barcodeData, {
        format: "CODE128",
        width: 1.5, // Explicitly set width to prevent overflow
        height: 30,
        displayValue: false,
        margin: 0,
        background: "rgba(0,0,0,0)",
        lineColor: "#000000"
    });

    // Draw the barcode onto the main canvas, vertically centered
    ctx.drawImage(barcodeCanvas, 0, 5);

    // Draw Metadata Text
    const textX = barcodeCanvas.width + 20; // 20px padding after barcode
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const textContent = `tSign ID: ${shortId} | Page ${pageNum} of ${totalPages} | Time: ${timestamp}`;
    ctx.fillText(textContent, textX, height / 2);

    return canvas.toDataURL('image/png');
}

// Export for module systems or global window
if (typeof window !== 'undefined') {
    window.generateSignatureFrame = generateSignatureFrame;
    window.generateModernTSignQR = generateModernTSignQR;
    window.generatePageStamp = generatePageStamp;
}
