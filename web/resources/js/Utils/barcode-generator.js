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
    const logicalWidth = 400;
    const logicalHeight = 300; 
    const scaleFactor = 4;
    
    // Set actual canvas size (4x larger for high DPI)
    canvas.width = logicalWidth * scaleFactor;
    canvas.height = logicalHeight * scaleFactor;

    // Scale the context so drawing commands remain exactly the same
    ctx.scale(scaleFactor, scaleFactor);

    // Background
    ctx.fillStyle = '#FAFAFA'; 
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    const padding = 12; // Tighter global padding
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
    ctx.moveTo(padding + 12, padding + 5);
    ctx.lineTo(padding + 18, padding + 11);
    ctx.lineTo(padding + 28, padding + 1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3B935D';
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Signed by: ${signerName}`, padding + 35, padding + 6);

    // Body: Image or Cursive Text (Super Compact)
    const bodyStartY = padding + 18; // Start right under the header
    const bodyHeight = height - padding - 18 - (isQrCode ? 0 : 70); // 70px reserved for meta+barcode+footer
    const maxImgWidth = width - padding * 2 - 15; // available width inside border
    
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
        // Center horizontally
        const drawX = padding + 12 + (maxImgWidth - drawWidth) / 2;
        // Center vertically
        const drawY = bodyStartY + (bodyHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Cursive fallback
        ctx.fillStyle = '#111111';
        ctx.font = 'italic 36px cursive, serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const drawX = padding + 12 + maxImgWidth / 2;
        ctx.fillText(signerName, drawX, bodyStartY + bodyHeight / 2);
    }

    if (!isQrCode) {
        // Meta Info
        const metaY = height - padding - 40; // Tighter vertical spacing
        
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#3B935D';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText("TrustLessSign Zero Trust", padding + 12, metaY);

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
                height: 28, // compact barcode height
                lineColor: "#111111"
            });
            const barcodeX = padding + 12;
            const barcodeWidth = width - padding * 2 - 12;
            ctx.drawImage(barcodeCanvas, barcodeX, metaY + 2, barcodeWidth, 28);
        }

        // Footer
        const footerY = height - padding + 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        const t1 = "Verifikasi di: ";
        const t2 = verifyUrl;
        
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(t1, padding + 12, footerY);
        
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = '#3B935D';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(t2, padding + 12 + w1, footerY);
    }

    return canvas.toDataURL("image/png");
}

// Export for module systems or global window
if (typeof window !== 'undefined') {
    window.generateSignatureFrame = generateSignatureFrame;
}
