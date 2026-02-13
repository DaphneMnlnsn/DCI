<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request){
        $users = User::orderBy('created_at', 'desc')->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    public function store(Request $request){
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'username' => 'required|string|max:50',
            'password' => 'required|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([ 'message' => 'User added successfully', 'user' => $user], 201);
    }

    public function update(Request $request, $id){
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'username' => 'required|string|max:50',
        ]);

        $user->update([
            'name' => $validated['name'],
            'username' => $validated['username'],
        ]);

        return response()->json(['message' => 'User updated successfully', 'user' => $user], 200);
    }

    public function destroy(Request $request, $id){
        $user = User::find($id);

        if(!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message', 'User deleted successfully', 'user' => $user], 200);
    }
}
