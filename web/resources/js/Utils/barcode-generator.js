/**
 * TrustLessSign Barcode Signature Generator
 * Composes the signature frame using Canvas API.
 * Adheres to Zero-Trust architecture and Bio-Digital Minimalism.
 */

export async function generateSignatureFrame(signerName, shortId, verifyUrl, uploadedImageBase64, isQrCode) {
    // Zero-Trust Validation is handled by Sanctum tokens in the Web Dashboard.

    // 2. Set up Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Define logical dimensions (4:3 Compact Center-Focused)
    const logicalWidth = 300;
    const logicalHeight = 200; 
    const scaleFactor = 4;
    
    // Set actual canvas size (4x larger for high DPI)
    canvas.width = logicalWidth * scaleFactor;
    canvas.height = logicalHeight * scaleFactor;

    // Scale the context so drawing commands remain exactly the same
    ctx.scale(scaleFactor, scaleFactor);

    // Background
    ctx.fillStyle = '#FAFAFA'; 
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    const padding = 8; // Tighter global padding
    const width = logicalWidth;
    const height = logicalHeight;

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
    // Draw Checkmark
    ctx.beginPath();
    ctx.moveTo(padding + 8, padding + 5);
    ctx.lineTo(padding + 14, padding + 11);
    ctx.lineTo(padding + 22, padding + 1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3B935D';
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Signed by: ${signerName}`, padding + 28, padding + 6);

    // Body: Image or Cursive Text (Super Compact)
    const bodyStartY = padding + 16; // Start right under the header
    const bodyHeight = height - padding - 16 - (isQrCode ? 0 : 55); // 55px reserved for meta+barcode+footer
    const maxImgWidth = width - padding * 2 - 10; // available width inside border
    
    if (uploadedImageBase64) {
        const img = new Image();
        img.src = uploadedImageBase64;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        
        // Let the image grow as much as possible inside the body area (No artificial max-height limitation!)
        const scale = Math.min(
            maxImgWidth / img.width,
            bodyHeight / img.height
        );
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        // Left aligned to hug the green line closely!
        const drawX = padding + 8;
        // Center vertically
        const drawY = bodyStartY + (bodyHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Cursive fallback
        ctx.fillStyle = '#111111';
        ctx.font = 'italic 30px cursive, serif'; 
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const drawX = padding + 8;
        ctx.fillText(signerName, drawX, bodyStartY + bodyHeight / 2);
    }

    if (!isQrCode) {
        // Meta Info
        const metaY = height - padding - 35; // Tighter vertical spacing
        
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#3B935D';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText("TrustLessSign Zero Trust", padding + 8, metaY);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#111111';
        ctx.textAlign = 'right';
        ctx.fillText(shortId, width - padding, metaY);

        // Barcode 1D
        if (typeof JsBarcode !== 'undefined') {
            const barcodeCanvas = document.createElement('canvas');
            JsBarcode(barcodeCanvas, shortId, {
                format: "CODE128",
                displayValue: false,
                margin: 0,
                width: 2,
                height: 22, // compact barcode height
                lineColor: "#111111"
            });
            const barcodeX = padding + 8;
            const barcodeWidth = width - padding * 2 - 8;
            ctx.drawImage(barcodeCanvas, barcodeX, metaY + 2, barcodeWidth, 22);
        }

        // Footer
        const footerY = height - padding + 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        const t1 = "Verifikasi di: ";
        const t2 = verifyUrl;
        
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(t1, padding + 8, footerY);
        
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = '#3B935D';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(t2, padding + 8 + w1, footerY);
    }

    return canvas.toDataURL("image/png");
}

// Export for module systems or global window
if (typeof window !== 'undefined') {
    window.generateSignatureFrame = generateSignatureFrame;
}
