# python C:\Users\Server\.ssh\utils\secure_pdf.py "G:\My Drive\~local1\~ngajar2022\Teknik Komputer\TA 2025-2026 Genap\Penilai Buku Teks Pendamping (BTP)\KKA_Feri Febria Laksana.pdf" "G:\My Drive\~local1\~ngajar2022\Teknik Komputer\TA 2025-2026 Genap\Penilai Buku Teks Pendamping (BTP)\KKA_Feri Febria Laksana-locked.pdf" Wya#WIf@0U9!C3p

import sys
import pikepdf
from pikepdf import Permissions

def secure_pdf(input_path, output_path, owner_password):
    try:
        # Buka PDF asli
        pdf = pikepdf.Pdf.open(input_path)
        
        # Tentukan permission (hak akses)
        # Di sini kita mematikan opsi print dan modify (editing)
        # Kita juga bisa mengatur hal lain seperti ekstrak teks (copy)
        perms = Permissions(
            print_highres=False,     # Tidak bisa di-print resolusi tinggi
            print_lowres=False,      # Tidak bisa di-print resolusi rendah
            modify_other=False,      # Tidak bisa mengedit isi utama
            modify_annotation=False, # Tidak bisa diberi anotasi/komentar
            modify_assembly=False,   # Tidak bisa menyusun ulang halaman
            modify_form=False,       # Tidak bisa mengisi form
            extract=False             # Bisa di-copy teksnya
        )
        
        # Modifikasi Document Properties (Metadata)
        # Kosongkan metadata standar dan timpa Creator/Producer
        pdf.docinfo.update({
            '/Title': '',
            '/Author': '',
            '/Subject': '',
            '/Keywords': '',
            '/Creator': 'TrustlessSign Zero-Trust',
            '/Producer': 'TrustlessSign Crypto-Engine (Web3)'
        })
        
        # Simpan dengan enkripsi
        # user="" artinya tidak perlu password untuk membuka (membaca)
        # owner=owner_password artinya butuh password untuk mengubah hak akses / mencetak
        pdf.save(
            output_path,
            encryption=pikepdf.Encryption(
                user="",
                owner=owner_password,
                allow=perms
            )
        )
        
        print(f"[SUCCESS] Berhasil! File PDF yang dilindungi telah disimpan di: {output_path}")
        
    except FileNotFoundError:
        print(f"[ERROR] File '{input_path}' tidak ditemukan.")
    except Exception as e:
        print(f"[ERROR] Terjadi kesalahan: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Penggunaan: python secure_pdf.py <input.pdf> <output.pdf> <owner_password>")
        print("Contoh: python secure_pdf.py dokumen.pdf dokumen_aman.pdf password123")
    else:
        in_pdf = sys.argv[1]
        out_pdf = sys.argv[2]
        pwd = sys.argv[3]
        secure_pdf(in_pdf, out_pdf, pwd)
