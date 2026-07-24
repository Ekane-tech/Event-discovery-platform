<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Ekane Bryan', 'email' => 'ekanebryan5@gmail.com', 'role' => 'admin', 'password' => 'myadminpass123', 'city' => 'Douala', 'region' => 'Littoral'],
            ['name' => 'Maurice Nympha', 'email' => 'mauricenympha@gmail.com', 'role' => 'user', 'password' => 'maurice123', 'city' => 'Douala', 'region' => 'Littoral'],
            ['name' => 'Ekane Bryan', 'email' => 'ekanebryan618@gmail.com', 'role' => 'organizer', 'password' => 'myadminpass123', 'city' => 'Douala', 'region' => 'Littoral'],
        ];

        foreach ($users as $demo) {
            $role = Role::where('name', $demo['role'])->first();

            $user = User::updateOrCreate(
                ['email' => $demo['email']],
                [
                    'name' => $demo['name'],
                    'password' => Hash::make($demo['password']),
                    'role_id' => $role?->id,
                ]
            );

            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'city' => $demo['city'],
                    'region' => $demo['region'],
                    'preferred_language' => 'en',
                    'bio' => 'Demo account for development.',
                ]
            );
        }
    }
}
