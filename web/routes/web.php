<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SocialiteController;

// Public UI Routes
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/login', function () {
    return Inertia::render('Welcome', [
        'autoOpenLogin' => true
    ]);
})->name('login');

Route::get('/verify/{token}', function ($token) {
    return Inertia::render('Verify', ['token' => $token]);
})->name('verify.page');

// Authenticated UI Routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard', function () {
        $certificates = \App\Models\Certificate::where('user_id', auth()->id())
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->orderBy('issued_at', 'desc')
            ->get();

        return Inertia::render('Dashboard', [
            // Kirimkan semua sertifikat aktif (multi-device)
            'activeCertificates' => $certificates,
            // Backward compatibility: sertifikat terbaru
            'activeCertificate'  => $certificates->first(),
        ]);
    })->name('dashboard');
    
    Route::get('/sign', function () {
        return Inertia::render('SignDocument');
    })->name('sign.document');

    Route::get('/user/credentials', function (\Illuminate\Http\Request $request) {
        $token = $request->user()->createToken('ChromeExtensionToken')->plainTextToken;
        return response()->json([
            'token' => $token,
            'gdrive_token' => $request->user()->gdrive_token,
        ]);
    });

    Route::get('/reasons/categories', function () {
        return response()->json(
            \App\Models\ReasonCategory::with('subCategories')->orderBy('sort_order')->get()
        );
    });

    Route::get('/certificates/me', function (\Illuminate\Http\Request $request) {
        $certs = \App\Models\Certificate::where('user_id', $request->user()->id)
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->orderBy('issued_at', 'desc')
            ->get();

        if ($certs->isEmpty()) {
            return response()->json(['message' => 'No active certificate found.', 'has_certificate' => false, 'certificates' => []], 200);
        }

        return response()->json(['has_certificate' => true, 'certificates' => $certs], 200);
    });

    // User self-service: cabut sertifikat milik sendiri berdasarkan serial
    Route::post('/certificates/{serial}/revoke', [\App\Http\Controllers\CertificateController::class, 'revokeOwn']);

    Route::post('/logout', function (\Illuminate\Http\Request $request) {
        \Illuminate\Support\Facades\Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return \Inertia\Inertia::location('/');
    })->name('logout');
});

// Social Login Routes
Route::get('/auth/{provider}/redirect', [SocialiteController::class, 'redirect'])->name('social.redirect');
Route::get('/auth/{provider}/callback', [SocialiteController::class, 'callback'])->name('social.callback');
