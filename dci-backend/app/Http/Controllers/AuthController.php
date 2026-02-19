<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use App\Services\ActivityLogService;

class AuthController extends Controller
{
    public function login(Request $request){

        $credentials = $request->only('username', 'password');

        if(Auth::attempt($credentials)){

            $user = Auth::user();

            ActivityLogService::log(
                'LOGIN', 
                "User {$user->username} logged in",
            );

            $request->session()->regenerate();

            return response()->json([
                'status' => 'success',
                'user_id' => $user->id,
                'message' => 'Logged in successfully'
            ]);

        }

        return response()->json(['status'=>'error','message'=>'Invalid credentials'], 401);
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}