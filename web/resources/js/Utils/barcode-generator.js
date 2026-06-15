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
    
    // Define logical dimensions
    const logicalWidth = 350;
    const logicalHeight = 180; 
    const scaleFactor = 4;
    
    // Set actual canvas size (4x larger for high DPI)
    canvas.width = logicalWidth * scaleFactor;
    canvas.height = logicalHeight * scaleFactor;

    // Scale the context so drawing commands remain exactly the same
    ctx.scale(scaleFactor, scaleFactor);

    // Background
    ctx.fillStyle = '#FAFAFA'; 
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    const padding = 16;
    const width = logicalWidth;
    const height = logicalHeight;

    // Artistic Green Border (Left)
    ctx.strokeStyle = '#3B935D';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Top left curve
    ctx.moveTo(padding + 10, padding);
    ctx.quadraticCurveTo(padding, padding, padding, padding + 10);
    // Line down
    ctx.lineTo(padding, height - padding - 10);
    // Bottom left curve
    ctx.quadraticCurveTo(padding, height - padding, padding + 10, height - padding);
    ctx.stroke();

    // Header: Check icon + "Signed by: [signerName]"
    // Draw Checkmark
    ctx.beginPath();
    ctx.moveTo(padding + 15, padding + 6);
    ctx.lineTo(padding + 20, padding + 11);
    ctx.lineTo(padding + 28, padding + 1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3B935D';
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Signed by: ${signerName}`, padding + 35, padding + 6);

    // Body: Image or Cursive Text
    const bodyStartY = padding + 16;
    const bodyHeight = height - padding - 16 - (isQrCode ? 0 : 50); 
    
    if (uploadedImageBase64) {
        const img = new Image();
        img.src = uploadedImageBase64;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        
        // maintain aspect ratio
        const scale = Math.min(
            (width - padding * 2 - 20) / img.width,
            70 / img.height, // max height 70px
            (bodyHeight - 10) / img.height
        );
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = padding + 15; // align slightly left
        const drawY = bodyStartY + (bodyHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Cursive fallback
        ctx.fillStyle = '#111111';
        // Use generic cursive fallback or an elegant serif
        ctx.font = 'italic 32px cursive, serif'; 
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(signerName, padding + 20, bodyStartY + bodyHeight / 2);
    }

    if (!isQrCode) {
        // Meta Info
        const metaY = height - padding - 40;
        
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#3B935D';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText("TrustLessSign Zero Trust", padding + 15, metaY);

        ctx.font = 'bold 12px monospace';
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
                height: 24, // reduced height
                lineColor: "#111111"
            });
            // draw barcode stretching from left text to right text
            const barcodeX = padding + 15;
            const barcodeWidth = width - padding * 2 - 15;
            ctx.drawImage(barcodeCanvas, barcodeX, metaY + 2, barcodeWidth, 24);
        }

        // Footer
        const footerY = height - padding;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        const t1 = "Verifikasi di: ";
        const t2 = verifyUrl;
        
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(t1, padding + 15, footerY);
        
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = '#3B935D';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(t2, padding + 15 + w1, footerY);
    }

    return canvas.toDataURL("image/png");
}

// Export for module systems or global window
if (typeof window !== 'undefined') {
    window.generateSignatureFrame = generateSignatureFrame;
}
