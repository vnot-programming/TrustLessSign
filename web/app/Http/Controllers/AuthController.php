<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Exception;

class AuthController extends Controller
{
    /**
     * Web Login (Session-based)
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    /**
     * Web Register
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);

        return redirect('/dashboard');
    }

    /**
     * Web Logout
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    /**
     * Issue Sanctum token for Extension (Email/Password)
     */
    public function issueToken(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 422);
        }

        $deviceName = $request->input('device_name', 'Chrome Extension');
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
            ]
        ]);
    }

    /**
     * Issue Sanctum token for Extension using Social Access Token (Google/Facebook)
     */
    public function socialToken(Request $request)
    {
        $request->validate([
            'provider' => 'required|string|in:google,facebook',
            'access_token' => 'required|string',
            'device_name' => 'nullable|string',
        ]);

        $provider = $request->provider;
        $accessToken = $request->access_token;

        try {
            $socialUser = null;
            if ($provider === 'google') {
                // Verify Google access token or id token
                $response = Http::get('https://www.googleapis.com/oauth2/v3/userinfo', [
                    'access_token' => $accessToken
                ]);

                if (!$response->successful()) {
                    // Try verifying as ID token
                    $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                        'id_token' => $accessToken
                    ]);
                }

                if ($response->successful()) {
                    $data = $response->json();
                    $socialUser = [
                        'id' => $data['sub'] ?? null,
                        'email' => $data['email'] ?? null,
                        'name' => $data['name'] ?? null,
                        'avatar' => $data['picture'] ?? null,
                    ];
                }
            } elseif ($provider === 'facebook') {
                // Verify Facebook access token
                $response = Http::get('https://graph.facebook.com/me', [
                    'fields' => 'id,name,email,picture',
                    'access_token' => $accessToken
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $socialUser = [
                        'id' => $data['id'] ?? null,
                        'email' => $data['email'] ?? null,
                        'name' => $data['name'] ?? null,
                        'avatar' => $data['picture']['data']['url'] ?? null,
                    ];
                }
            }

            if (!$socialUser || !$socialUser['email']) {
                return response()->json(['message' => 'Failed to verify social credentials.'], 422);
            }

            // Find or create user
            $user = User::where('email', $socialUser['email'])->first();

            if (!$user) {
                $user = User::create([
                    'name' => $socialUser['name'],
                    'email' => $socialUser['email'],
                    'avatar' => $socialUser['avatar'],
                    $provider . '_id' => $socialUser['id'],
                    'gdrive_token' => $provider === 'google' ? $accessToken : null,
                ]);
            } else {
                // Link account if not linked
                $user->update([
                    $provider . '_id' => $socialUser['id'],
                    'avatar' => $user->avatar ?: $socialUser['avatar'],
                    'gdrive_token' => $provider === 'google' ? $accessToken : $user->gdrive_token,
                ]);
            }

            $deviceName = $request->input('device_name', 'Chrome Extension (' . ucfirst($provider) . ')');
            $token = $user->createToken($deviceName)->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ]
            ]);

        } catch (Exception $e) {
            return response()->json(['message' => 'Social login failed: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Socialite Redirect
     */
    public function redirectToProvider($provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Socialite Callback
     */
    public function handleProviderCallback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (Exception $e) {
            return redirect('/login')->withErrors(['oauth' => 'OAuth authentication failed.']);
        }

        $user = User::where('email', $socialUser->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name' => $socialUser->getName() ?: $socialUser->getNickname(),
                'email' => $socialUser->getEmail(),
                'avatar' => $socialUser->getAvatar(),
                $provider . '_id' => $socialUser->getId(),
            ]);
        } else {
            $user->update([
                $provider . '_id' => $socialUser->getId(),
                'avatar' => $user->avatar ?: $socialUser->getAvatar(),
            ]);
        }

        Auth::login($user);

        return redirect('/dashboard');
    }
}
