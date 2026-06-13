<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\AuthController;
use App\Models\ReasonCategory;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Auth Endpoints (Chrome Extension Login)
Route::post('/auth/token', [AuthController::class, 'issueToken']);
Route::post('/auth/social', [AuthController::class, 'socialToken']);

// Public PKI and Verification endpoints (throttle: api rate limit applied globally or via route middleware)
Route::prefix('pki')->group(function () {
    Route::get('/root-cert', [CertificateController::class, 'downloadRootCert']);
    Route::get('/crl', [CertificateController::class, 'downloadCrl']);
});

Route::get('/verify/{token}', [VerificationController::class, 'getVerificationData']);
Route::get('/certificates/{serial}/download', [CertificateController::class, 'downloadUserCert']);

// Authenticated extension endpoints (Sanctum Bearer Token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
    
    Route::post('/certificates/issue', [CertificateController::class, 'issue']);
    Route::get('/certificates/me', [CertificateController::class, 'myCertificate']);
    
    Route::post('/documents/register', [DocumentController::class, 'register']);
    Route::get('/documents', [DocumentController::class, 'index']);
    
    Route::get('/reasons/categories', function () {
        return response()->json(
            ReasonCategory::with('subCategories')->orderBy('sort_order')->get()
        );
    });

    Route::post('/gdrive/refresh', [App\Http\Controllers\SocialiteController::class, 'refreshGdriveToken']);

    // Image Signature Endpoints (v1)
    Route::prefix('v1/signatures')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\SignatureController::class, 'upload']);
        Route::get('/', [\App\Http\Controllers\Api\SignatureController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\Api\SignatureController::class, 'show']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\SignatureController::class, 'destroy']);
        Route::post('/{id}/set-default', [\App\Http\Controllers\Api\SignatureController::class, 'setDefault']);
        Route::get('/{id}/image', [\App\Http\Controllers\Api\SignatureController::class, 'getImage'])->name('api.signatures.image');
    });

    // Admin-only endpoints (Admin authorization checked in controller methods)
    Route::post('/pki/bootstrap', [CertificateController::class, 'bootstrapCA']);
    Route::post('/certificates/revoke/{serial}', [CertificateController::class, 'revoke']);
});
