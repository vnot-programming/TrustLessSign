<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UploadSignatureRequest;
use App\Models\ImageSignature;
use App\Services\ImageSignatureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SignatureController extends Controller
{
    protected ImageSignatureService $signatureService;

    public function __construct(ImageSignatureService $signatureService)
    {
        $this->signatureService = $signatureService;
    }

    public function upload(UploadSignatureRequest $request)
    {
        try {
            $signature = $this->signatureService->upload(
                $request->file('signature_image'),
                $request->user(),
                $request->input('signature_name')
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $signature->id,
                    'signature_name' => $signature->signature_name,
                    'is_default' => $signature->is_default,
                    // In a real scenario with S3, this would be a signed URL
                    'thumbnail_url' => route('api.signatures.image', $signature->id), 
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function index(Request $request)
    {
        $signatures = ImageSignature::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Map to include thumbnail URLs
        $signatures->getCollection()->transform(function ($sig) {
            $sig->thumbnail_url = route('api.signatures.image', $sig->id);
            return $sig;
        });

        return response()->json([
            'success' => true,
            'data' => $signatures
        ]);
    }

    public function show(Request $request, $id)
    {
        $signature = ImageSignature::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->findOrFail($id);
            
        $signature->thumbnail_url = route('api.signatures.image', $signature->id);

        return response()->json([
            'success' => true,
            'data' => $signature
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $signature = ImageSignature::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $this->signatureService->delete($signature);

        return response()->json([
            'success' => true,
            'message' => 'Signature deleted successfully.'
        ]);
    }

    public function setDefault(Request $request, $id)
    {
        $signature = ImageSignature::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->findOrFail($id);

        // Unset any existing defaults
        ImageSignature::where('user_id', $request->user()->id)
            ->update(['is_default' => false]);

        // Set new default
        $signature->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Signature set as default.'
        ]);
    }

    // Helper endpoint to serve the image securely since it's stored locally for now
    public function getImage(Request $request, $id)
    {
        $signature = ImageSignature::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $path = $signature->optimized_path ?: $signature->file_path;
        
        if (!Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($path), [
            'Content-Type' => $signature->mime_type
        ]);
    }
}
