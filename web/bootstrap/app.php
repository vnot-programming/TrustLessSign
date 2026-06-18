<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'certificates/sync-check',
        ]);
        $middleware->encryptCookies(except: [
            'tsign_api_token',
            'tsign_gdrive_token',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
