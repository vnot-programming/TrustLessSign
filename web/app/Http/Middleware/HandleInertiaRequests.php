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

        // Extension versions from dynamic config (which reads from .env)
        // Fallback to package.json only if not set
        $extensionLatestVersion = config('trustlesssign.extension_latest_version', '1.0.0');
        $extensionMinVersion = config('trustlesssign.extension_min_version', '1.0.0');

        if ($extensionLatestVersion === '1.0.0' || $extensionMinVersion === '1.0.0') {
            $extPackageJsonPath = base_path('../chrome-extension/package.json');
            if (File::exists($extPackageJsonPath)) {
                $extPackageData = json_decode(File::get($extPackageJsonPath), true);
                $fallbackVersion = $extPackageData['version_name'] ?? $extPackageData['version'] ?? '1.0.0';
                if ($extensionLatestVersion === '1.0.0') $extensionLatestVersion = $fallbackVersion;
                if ($extensionMinVersion === '1.0.0') $extensionMinVersion = $fallbackVersion;
            }
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],
            'locale' => $locale,
            'messages' => $messages,
            'versionName' => $versionName,
            'extensionLatestVersion' => $extensionLatestVersion,
            'extensionMinVersion' => $extensionMinVersion,
        ]);
    }
}
