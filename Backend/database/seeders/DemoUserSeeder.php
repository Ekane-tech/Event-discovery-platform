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
            ['name' => 'Demo User', 'email' => 'user@example.com', 'role' => 'user', 'city' => 'Douala', 'region' => 'Littoral'],
            ['name' => 'Demo Organizer', 'email' => 'organizer@example.com', 'role' => 'organizer', 'city' => 'Douala', 'region' => 'Littoral'],
            ['name' => 'Demo Admin', 'email' => 'admin@example.com', 'role' => 'admin', 'city' => 'Yaoundé', 'region' => 'Centre'],
        ];

        foreach ($users as $demo) {
            $role = Role::where('name', $demo['role'])->first();

            $user = User::updateOrCreate(
                ['email' => $demo['email']],
                [
                    'name' => $demo['name'],
                    'password' => Hash::make('password1'),
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
