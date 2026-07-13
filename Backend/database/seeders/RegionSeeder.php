<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Division;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RegionSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Adamawa' => ['Vina' => ['Ngaoundéré']],
            'Centre' => ['Mfoundi' => ['Yaoundé'], 'Lékié' => ['Monatélé']],
            'East' => ['Lom-et-Djerem' => ['Bertoua']],
            'Far North' => ['Diamaré' => ['Maroua']],
            'Littoral' => ['Wouri' => ['Douala', 'Bonanjo', 'Akwa'], 'Moungo' => ['Nkongsamba']],
            'North' => ['Bénoué' => ['Garoua']],
            'North-West' => ['Mezam' => ['Bamenda']],
            'South' => ['Ocean' => ['Kribi'], 'Mvila' => ['Ebolowa']],
            'South-West' => ['Fako' => ['Buea', 'Limbe'], 'Manyu' => ['Mamfe']],
            'West' => ['Mifi' => ['Bafoussam'], 'Noun' => ['Foumban']],
        ];

        foreach ($data as $regionName => $divisions) {
            $region = Region::updateOrCreate(
                ['name' => $regionName],
                [
                    'slug' => Str::slug($regionName),
                    'is_active' => true,
                ]
            );

            foreach ($divisions as $divisionName => $cities) {
                $division = Division::updateOrCreate(
                    ['region_id' => $region->id, 'name' => $divisionName],
                    [
                        'slug' => Str::slug($divisionName),
                        'is_active' => true,
                    ]
                );

                foreach ($cities as $cityName) {
                    City::updateOrCreate(
                        ['region_id' => $region->id, 'name' => $cityName],
                        [
                            'division_id' => $division->id,
                            'slug' => Str::slug($cityName),
                            'is_active' => true,
                        ]
                    );
                }
            }
        }
    }
}
