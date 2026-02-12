<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        DB::table('users')->insert([
            'name' => 'IDA Admin',
            'username' => 'IDA_admin',
            'password' => Hash::make('IDA12345admin'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

    }
}
