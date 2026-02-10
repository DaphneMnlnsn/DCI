<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchemaController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/read/schema', [SchemaController::class, 'readSchema']);
Route::get('/scan', [SchemaController::class, 'scanSchema']);
Route::get('/fix', [SchemaController::class, 'fixSchema']);
Route::get('/read/all', [SchemaController::class, 'readAllDatabases']);