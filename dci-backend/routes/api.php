<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchemaController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DatabaseController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/read/schema', [SchemaController::class, 'readSchema']);
Route::get('/scan', [SchemaController::class, 'scanSchema']);
Route::get('/fix', [SchemaController::class, 'fixSchema']);
Route::get('/read/all', [SchemaController::class, 'readAllDatabases']);
Route::get('/activity-logs', [ActivityLogController::class, 'index']);
Route::post('/set-database', [DatabaseController::class, 'setDatabase']);