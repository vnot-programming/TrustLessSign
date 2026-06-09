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

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
            ],
            'locale' => $locale,
            'messages' => $messages,
        ]);
    }
}
