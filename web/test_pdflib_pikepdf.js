const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function main() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  pdfDoc.setAuthor('Original Author Yoke');
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test_pdflib.pdf', pdfBytes);

  const pdfDoc2 = await PDFDocument.load(fs.readFileSync('test_pdflib.pdf'));
  pdfDoc2.setAuthor('TrustlessSign User');
  pdfDoc2.setTitle('My Title');
  const pdfBytes2 = await pdfDoc2.save();
  fs.writeFileSync('test_pdflib2.pdf', pdfBytes2);
}
main();
