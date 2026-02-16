<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientTableController;
use App\Http\Controllers\SchemaController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DatabaseController;
use App\Http\Controllers\UserController;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/read/schema', [SchemaController::class, 'readSchema']);
Route::get('/scan', [SchemaController::class, 'scanSchema']);
Route::get('/fix', [SchemaController::class, 'fixSchema']);
Route::get('/read/all', [SchemaController::class, 'readAllDatabases']);
Route::get('/activity-logs', [ActivityLogController::class, 'index']);
Route::post('/set-database', [DatabaseController::class, 'setDatabase']);
Route::get('/users', [UserController::class, 'index']);
Route::post('/users/create', [UserController::class, 'store']);
Route::put('/users/update/{id}', [UserController::class, 'update']);
Route::delete('/users/delete/{id}', [UserController::class, 'destroy']);
Route::get('/conflicted-tables', [ClientTableController::class, 'getTables']);
Route::delete('/conflicted-tables/delete-all', [ClientTableController::class, 'deleteAllData']);
Route::delete('/conflicted-tables/delete-some', [ClientTableController::class, 'deleteIncompatibleData']);