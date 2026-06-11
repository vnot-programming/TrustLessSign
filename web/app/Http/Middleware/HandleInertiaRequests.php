<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\File;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        if ($request->has('locale')) {
            session(['locale' => $request->query('locale')]);
        }
        
        $locale = session('locale', config('app.locale'));
        app()->setLocale($locale);

        $messagesPath = resource_path("messages/{$locale}.json");
        $messages = [];
        
        if (File::exists($messagesPath)) {
            $messages = json_decode(File::get($messagesPath), true);
        }

        // Web version from web/package.json
        $webPackageJsonPath = base_path('package.json');
        $versionName = '1.0.0-dev';
        if (File::exists($webPackageJsonPath)) {
            $packageData = json_decode(File::get($webPackageJsonPath), true);
            $versionName = $packageData['version_name'] ?? $packageData['version'] ?? '1.0.0-dev';
        }

        // Extension minimum required version from chrome-extension/package.json
        // (same as the latest released extension version — the web always tracks the latest)
        $extPackageJsonPath = base_path('../chrome-extension/package.json');
        $extensionMinVersion = '1.0.0';
        if (File::exists($extPackageJsonPath)) {
            $extPackageData = json_decode(File::get($extPackageJsonPath), true);
            $extensionMinVersion = $extPackageData['version_name'] ?? $extPackageData['version'] ?? '1.0.0';
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],
            'locale' => $locale,
            'messages' => $messages,
            'versionName' => $versionName,
            'extensionMinVersion' => $extensionMinVersion,
        ]);
    }
}
