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

    // Define logical dimensions (Compact 300x200)
    const logicalWidth = 300;
    const logicalHeight = 200; 
    const scaleFactor = 4;
    
    // Set actual canvas size (4x larger for high DPI)
    canvas.width = logicalWidth * scaleFactor;
    canvas.height = logicalHeight * scaleFactor;
    
    ctx.scale(scaleFactor, scaleFactor);

    // Background
    ctx.fillStyle = '#FAFAFA'; 
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    const padding = 6; 
    const width = logicalWidth;
    const height = logicalHeight;

    const bodyStartX = 12; // super tight to the green line
    const rightPadding = 6;

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
    ctx.fillText(`Signed by: ${signerName}`, bodyStartX + 16, padding + 5);

    // Body: Image or Cursive Text
    const bodyStartY = padding + 14; 
    // Give image more vertical space
    const bodyHeight = height - padding - 14 - (isQrCode ? 0 : 45); 
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

    if (!isQrCode) {
        // Meta Info
        const metaY = height - padding - 28; 
        
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
        
        const t1 = "Verifikasi di: ";
        const t2 = verifyUrl;
        
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(t1, bodyStartX, footerY);
        
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = '#3B935D';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(t2, bodyStartX + w1, footerY);
    }

    return canvas.toDataURL("image/png");
}

// Export for module systems or global window
if (typeof window !== 'undefined') {
    window.generateSignatureFrame = generateSignatureFrame;
}
