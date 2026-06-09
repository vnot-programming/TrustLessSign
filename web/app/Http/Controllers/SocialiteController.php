<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialiteController extends Controller
{
    public function redirect($provider, Request $request)
    {
        if ($request->has('redirect_to_extension')) {
            session(['redirect_to_extension' => $request->query('redirect_to_extension')]);
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
                ]);
            } else {
                // Update their avatar and provider id just in case
                $user->update([
                    $provider . '_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'gdrive_token' => $provider === 'google' ? $socialUser->token : $user->gdrive_token,
                ]);
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
}
