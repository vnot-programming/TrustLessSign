<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;

class SocialiteController extends Controller
{
    public function redirect($provider, Request $request)
    {
        if ($request->has('redirect_to_extension')) {
            session(['redirect_to_extension' => $request->query('redirect_to_extension')]);
        }
        if ($provider === 'google') {
            return Socialite::driver($provider)
                ->scopes(['https://www.googleapis.com/auth/drive.file'])
                ->with(['access_type' => 'offline', 'prompt' => 'consent'])
                ->redirect();
        }
        return Socialite::driver($provider)->redirect();
    }

    public function callback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->user();
            
            $user = User::where($provider . '_id', $socialUser->getId())
                        ->orWhere('email', $socialUser->getEmail())
                        ->first();

            if (!$user) {
                // Register a new user
                $user = User::create([
                    'name' => $socialUser->getName() ?? $socialUser->getNickname(),
                    'email' => $socialUser->getEmail(),
                    $provider . '_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'gdrive_token' => $provider === 'google' ? $socialUser->token : null,
                    'gdrive_refresh_token' => ($provider === 'google' && $socialUser->refreshToken) ? $socialUser->refreshToken : null,
                ]);
            } else {
                // Update their avatar and provider id just in case
                $updateData = [
                    $provider . '_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'gdrive_token' => $provider === 'google' ? $socialUser->token : $user->gdrive_token,
                ];

                if ($provider === 'google' && $socialUser->refreshToken) {
                    $updateData['gdrive_refresh_token'] = $socialUser->refreshToken;
                }

                $user->update($updateData);
            }

            Auth::login($user, true);

            $redirectToExtension = session()->pull('redirect_to_extension');
            if ($redirectToExtension) {
                $token = $user->createToken('ChromeExtensionToken')->plainTextToken;
                $gdriveToken = $user->gdrive_token ?? '';
                return redirect($redirectToExtension . '?token=' . urlencode($token) . '&gdrive_token=' . urlencode($gdriveToken));
            }

            return redirect()->intended(route('dashboard'));

        } catch (\Exception $e) {
            return redirect(route('home'))->withErrors(['error' => 'Unable to login using ' . ucfirst($provider) . '. Please try again.']);
        }
    }

    public function refreshGdriveToken(Request $request)
    {
        $user = $request->user();

        if (!$user->gdrive_refresh_token) {
            return response()->json(['message' => 'No refresh token available. Please reconnect your Google account.'], 400);
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $user->gdrive_refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->successful()) {
            $newToken = $response->json('access_token');
            $user->update(['gdrive_token' => $newToken]);
            
            return response()->json([
                'status' => 'success',
                'gdrive_token' => $newToken
            ]);
        }

        return response()->json(['message' => 'Failed to refresh token from Google.'], 401);
    }
}
