<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request){

        $username = $request->input('username');
        $password = $request->input('password');

        if($username == config('auth.admin_username') && Hash::check($password, config('auth.admin_password_hash'))){
            $response = Http::post(config('app.login_url'), [
                'username'=>config('app.uname_param'),
                'password'=>config('app.pass_param')
            ]);

            return $response;
        }
        else if($username == config('auth.admin_username') && Hash::check($password, config('auth.admin_password_hash'))){
            return response()->json(['status'=>'error', 'message'=> 'Wrong credentials.'], 401);
        }

        return response()->json(['status'=>'error', 'message'=> 'Something went wrong.'], 500);
    }
}