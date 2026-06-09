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
        $certificate = \App\Models\Certificate::where('user_id', auth()->id())
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->first();

        return Inertia::render('Dashboard', [
            'activeCertificate' => $certificate
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
