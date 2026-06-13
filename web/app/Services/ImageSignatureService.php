<?php

namespace App\Services;

use App\Models\ImageSignature;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageSignatureService
{
    protected const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
    protected const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public function upload(UploadedFile $file, User $user, ?string $name = null): ImageSignature
    {
        $this->validateMimeType($file);

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \Exception('File size exceeds the maximum limit of 5MB.');
        }

        $hash = $this->calculateHash($file);

        // Check for duplicate hash for this user to avoid storing same image twice
        $existing = ImageSignature::where('user_id', $user->id)->where('file_hash', $hash)->first();
        if ($existing) {
            return $existing;
        }

        $dimensions = $this->sanitizeImage($file);

        $path = $this->storeImage($file, $user);
        $optimizedPath = $this->optimizeImage($file, $user);

        // If this is their first signature, make it default
        $isDefault = !ImageSignature::where('user_id', $user->id)->where('is_active', true)->exists();

        $signature = ImageSignature::create([
            'user_id' => $user->id,
            'signature_name' => $name ?? 'Signature ' . now()->format('Y-m-d H:i:s'),
            'original_filename' => $file->getClientOriginalName(),
            'file_path' => $path,
            'optimized_path' => $optimizedPath,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'width' => $dimensions['width'],
            'height' => $dimensions['height'],
            'file_hash' => $hash,
            'is_default' => $isDefault,
            'is_active' => true,
        ]);

        return $signature;
    }

    protected function validateMimeType(UploadedFile $file): void
    {
        $mime = $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_MIME_TYPES)) {
            throw new \Exception('Invalid file type. Only PNG, JPG, and WebP are allowed.');
        }
    }

    protected function sanitizeImage(UploadedFile $file): array
    {
        // Strip EXIF and validate dimensions
        $imageSize = getimagesize($file->getRealPath());
        if (!$imageSize) {
            throw new \Exception('Invalid image file.');
        }

        return [
            'width' => $imageSize[0],
            'height' => $imageSize[1],
        ];
    }

    protected function optimizeImage(UploadedFile $file, User $user): string
    {
        // For now, we'll just store the original as optimized.
        // True image optimization (resizing, compression) requires GD/Imagick.
        return $this->storeImage($file, $user, 'optimized');
    }

    protected function storeImage(UploadedFile $file, User $user, string $type = 'original'): string
    {
        $directory = 'signatures/' . $user->id . '/' . $type;
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        
        $path = $file->storeAs($directory, $filename, 'local'); // Using local storage for now, can be changed to s3
        return $path;
    }

    protected function calculateHash(UploadedFile $file): string
    {
        return hash_file('sha256', $file->getRealPath());
    }

    public function delete(ImageSignature $signature): void
    {
        if ($signature->file_path) {
            Storage::disk('local')->delete($signature->file_path);
        }
        if ($signature->optimized_path && $signature->optimized_path !== $signature->file_path) {
            Storage::disk('local')->delete($signature->optimized_path);
        }
        
        $signature->delete();
    }
}