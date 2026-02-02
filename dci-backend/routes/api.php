<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchemaController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/read', [SchemaController::class, 'readSchema']);