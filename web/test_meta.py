import pikepdf
import sys

pdf = pikepdf.Pdf.new()
pdf.docinfo['/Author'] = 'Original Author Yoke'
pdf.save('test_meta.pdf')

pdf2 = pikepdf.Pdf.open('test_meta.pdf')
print("Before:", pdf2.docinfo.get('/Author'))
pdf2.docinfo.update({
    '/Creator': 'TrustlessSign Zero-Trust',
    '/Producer': 'TrustlessSign Crypto-Engine (Web3)'
})
pdf2.save('test_meta2.pdf')

pdf3 = pikepdf.Pdf.open('test_meta2.pdf')
print("After:", pdf3.docinfo.get('/Author'))
