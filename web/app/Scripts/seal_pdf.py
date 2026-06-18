#!/usr/bin/env python3
"""
seal_pdf.py — TrustlessSign PDF Permissions Sealer
Usage: python3 seal_pdf.py <json_config_stdin>

Reads a JSON payload from stdin:
{
  "pdf_base64": "<base64-encoded PDF bytes>",
  "owner_password": "<derived SHA256 hex>",
  "permissions": {
    "print_highres": true|false,
    "print_lowres": true|false,
    "modify_other": false,
    "modify_annotation": false,
    "modify_assembly": false,
    "modify_form": false,
    "extract": false,
    "sign": false
  }
}

Outputs JSON to stdout:
{
  "status": "success",
  "pdf_base64": "<sealed PDF base64>"
}
or on error:
{
  "status": "error",
  "message": "..."
}
"""

import sys
import json
import base64
import io
import pikepdf
from pikepdf import Permissions

def seal_pdf(pdf_bytes: bytes, owner_password: str, perms_dict: dict, metadata_dict: dict = None) -> bytes:
    """Apply AES-256 permission restrictions to a PDF in memory."""

    if metadata_dict is None:
        metadata_dict = {}

    # Map request permissions to pikepdf.Permissions
    perms = Permissions(
        print_highres=bool(perms_dict.get('print_highres', False)),
        print_lowres=bool(perms_dict.get('print_lowres', False)),
        modify_other=bool(perms_dict.get('modify_other', False)),
        modify_annotation=bool(perms_dict.get('modify_annotation', False)),
        modify_assembly=bool(perms_dict.get('modify_assembly', False)),
        modify_form=bool(perms_dict.get('modify_form', False)),
        extract=bool(perms_dict.get('extract', False)),
        # Note: accessibility extract is always allowed for screen readers
        accessibility=True,
    )

    # Open PDF from bytes
    pdf_stream = io.BytesIO(pdf_bytes)
    pdf = pikepdf.Pdf.open(pdf_stream)

    # Set Custom Metadata if provided
    new_docinfo = {
        '/Creator': 'TrustlessSign Zero-Trust',
        '/Producer': 'TrustlessSign Crypto-Engine (Web3)'
    }
    
    metadata = metadata_dict
    if metadata:
        if metadata.get('original_filename'):
            new_docinfo['/Title'] = metadata['original_filename']
        if metadata.get('author'):
            new_docinfo['/Author'] = metadata['author']
        if metadata.get('reason'):
            new_docinfo['/Subject'] = metadata['reason']
        new_docinfo['/Keywords'] = 'TrustlessSign, Digital Signature, Zero-Trust'
        
        if metadata.get('verifyUrlShort') and metadata.get('verify_token'):
            shortcode = metadata['verify_token'][:8].upper()
            verify_url = f"{metadata['verifyUrlShort']}/{shortcode}"
            if '/URI' not in pdf.Root:
                pdf.Root['/URI'] = pikepdf.Dictionary()
            pdf.Root['/URI']['/Base'] = verify_url

    # Overwrite docinfo to mark as TrustlessSign-sealed
    pdf.docinfo.update(new_docinfo)

    # Save with AES-256 encryption:
    # user="" → anyone can open/read (no password required)
    # owner=owner_password → required to change permissions
    out_stream = io.BytesIO()
    pdf.save(
        out_stream,
        encryption=pikepdf.Encryption(
            user="",               # Open without password ✓
            owner=owner_password,  # Owner key = SHA256(verify_token::cert_serial)
            allow=perms,
            aes=True,              # Use AES (not RC4)
            R=6                    # PDF 2.0 level (AES-256)
        )
    )
    return out_stream.getvalue()


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            raise ValueError("Empty input from stdin")

        config = json.loads(raw)

        pdf_b64 = config.get('pdf_base64', '')
        owner_password = config.get('owner_password', '')
        perms_dict = config.get('permissions', {})
        metadata_dict = config.get('metadata', {})

        if not pdf_b64:
            raise ValueError("Missing pdf_base64 in input")
        if not owner_password:
            raise ValueError("Missing owner_password in input")

        # Fix incorrect padding just in case
        missing_padding = len(pdf_b64) % 4
        if missing_padding:
            pdf_b64 += '=' * (4 - missing_padding)

        # Decode the input PDF
        pdf_bytes = base64.b64decode(pdf_b64)

        # Seal it
        sealed_bytes = seal_pdf(pdf_bytes, owner_password, perms_dict, metadata_dict)

        # Encode output
        sealed_b64 = base64.b64encode(sealed_bytes).decode('utf-8')

        result = {
            'status': 'success',
            'pdf_base64': sealed_b64
        }
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            'status': 'error',
            'message': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == '__main__':
    main()
