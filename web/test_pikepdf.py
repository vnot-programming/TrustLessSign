import pikepdf
import sys

pdf = pikepdf.Pdf.open('test_pdflib2.pdf')
print("Author before save:", pdf.docinfo.get('/Author'))
pdf.save('test_pdflib3.pdf', encryption=pikepdf.Encryption(owner="test", allow=pikepdf.Permissions(extract=False)))
pdf2 = pikepdf.Pdf.open('test_pdflib3.pdf')
print("Author after save:", pdf2.docinfo.get('/Author'))
