<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchemaController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/read/master', [SchemaController::class, 'readMasterSchema']);
Route::get('/read/client', [SchemaController::class, 'readClientSchema']);
Route::get('/scan', [SchemaController::class, 'scanSchema']);
Route::get('/fix', [SchemaController::class, 'fixSchema']);