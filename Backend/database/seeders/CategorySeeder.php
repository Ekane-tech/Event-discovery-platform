<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Music', 'Technology', 'Education', 'Business', 'Agriculture', 'Conference',
            'Workshop', 'Festival', 'Concert', 'Religious', 'Sports', 'Comedy', 'Health',
            'Food', 'Culture', 'Fashion', 'Movies', 'Art', 'Networking', 'Children', 'Politics',
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['name' => $category],
                [
                    'slug' => Str::slug($category),
                    'description' => $category.' events and activities.',
                    'is_active' => true,
                ]
            );
        }
    }
}
