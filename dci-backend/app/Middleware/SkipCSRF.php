<?php

namespace App\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;

class SkipCSRF extends BaseVerifier
{
    protected $except = [
        'api/*',
    ];
}