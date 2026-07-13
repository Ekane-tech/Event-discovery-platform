<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'user', 'label' => 'Registered User'],
            ['name' => 'organizer', 'label' => 'Organizer'],
            ['name' => 'admin', 'label' => 'Administrator'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['name' => $role['name']], $role);
        }
    }
}
