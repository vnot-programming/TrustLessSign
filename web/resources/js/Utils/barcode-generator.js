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
    
    // Define dimensions
    const width = 600;
    const height = 350; 
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#FAFAFA'; 
    ctx.fillRect(0, 0, width, height);

    const padding = 24;

    // Artistic Green Border (Left)
    ctx.strokeStyle = '#3B935D';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Top left curve
    ctx.moveTo(padding + 20, padding);
    ctx.quadraticCurveTo(padding, padding, padding, padding + 20);
    // Line down
    ctx.lineTo(padding, height - padding - 20);
    // Bottom left curve
    ctx.quadraticCurveTo(padding, height - padding, padding + 20, height - padding);
    ctx.stroke();

    // Header: Check icon + "Signed by: [signerName]"
    // Draw Checkmark
    ctx.beginPath();
    ctx.moveTo(padding + 30, padding + 15);
    ctx.lineTo(padding + 40, padding + 25);
    ctx.lineTo(padding + 60, padding + 5);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3B935D';
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Signed by: ${signerName}`, padding + 75, padding + 15);

    // Body: Image or Cursive Text
    const bodyStartY = padding + 40;
    const bodyHeight = height - padding - 40 - (isQrCode ? 0 : 100); 
    
    if (uploadedImageBase64) {
        const img = new Image();
        img.src = uploadedImageBase64;
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        
        // maintain aspect ratio
        const scale = Math.min(
            (width - padding * 4) / img.width,
            (bodyHeight - 20) / img.height
        );
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = (width - drawWidth) / 2 + padding; // shift slightly right
        const drawY = bodyStartY + (bodyHeight - drawHeight) / 2;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } else {
        // Cursive fallback
        ctx.fillStyle = '#111111';
        // Use generic cursive fallback or an elegant serif
        ctx.font = 'italic 72px cursive, serif'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(signerName, width / 2 + padding, bodyStartY + bodyHeight / 2);
    }

    if (!isQrCode) {
        // Meta Info
        const metaY = height - padding - 70;
        
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#3B935D';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText("TrustLessSign Zero Trust", padding + 30, metaY);

        ctx.font = 'bold 18px monospace';
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
                height: 40,
                lineColor: "#111111"
            });
            // draw barcode stretching from left text to right text
            const barcodeX = padding + 30;
            const barcodeWidth = width - padding * 2 - 30;
            ctx.drawImage(barcodeCanvas, barcodeX, metaY + 5, barcodeWidth, 35);
        }

        // Footer
        const footerY = height - padding;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        
        const t1 = "Untuk verifikasi, kunjungi ";
        const t2 = verifyUrl;
        const t3 = " dan masukkan kode di atas.";
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(t1, padding + 30, footerY);
        
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = '#3B935D';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(t2, padding + 30 + w1, footerY);
        
        const w2 = ctx.measureText(t2).width;
        ctx.fillStyle = '#111111';
        ctx.font = '14px sans-serif';
        ctx.fillText(t3, padding + 30 + w1 + w2, footerY);
    }

    return canvas.toDataURL("image/png");
}

// Export for module systems or global window
if (typeof window !== 'undefined') {
    window.generateSignatureFrame = generateSignatureFrame;
}
