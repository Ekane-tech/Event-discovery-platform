<?php

namespace Database\Seeders;

use App\Models\Interest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InterestSeeder extends Seeder
{
    public function run(): void
    {
        $interests = [
            'Music', 'Business', 'Technology', 'Education', 'Health', 'Religion', 'Sports',
            'Agriculture', 'Politics', 'Comedy', 'Art', 'Movies', 'Networking', 'Fashion',
            'Children', 'Food', 'Culture',
        ];

        foreach ($interests as $interest) {
            Interest::updateOrCreate(
                ['name' => $interest],
                [
                    'slug' => Str::slug($interest),
                    'description' => 'Receive notifications and recommendations for '.$interest.' events.',
                    'is_active' => true,
                ]
            );
        }
    }
}
