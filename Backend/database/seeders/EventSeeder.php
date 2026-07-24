<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\City;
use App\Models\Event;
use App\Models\EventTicketType;
use App\Models\Region;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $organizer = User::where('email', 'ekanebryan618@gmail.com')->first();
        
        if (! $organizer) {
            $this->command->warn('Organizer user not found. Please run DemoUserSeeder first.');
            return;
        }

        $now = now();

        $events = [
            // Event 1 — Mboa Startup Networking Night (Free Flow)
            [
                'title' => 'Mboa Startup Networking Night',
                'description' => 'Join entrepreneurs, founders, freelancers and young professionals for an evening of networking, idea sharing and business opportunities. This free event is designed to connect people building the next generation of projects in Cameroon.',
                'category' => 'Business',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Akwa Business Center',
                'start_date' => $now->copy()->addDay()->setTime(18, 0),
                'end_date' => $now->copy()->addDay()->setTime(21, 0),
                'registration_deadline' => $now->copy()->addDay()->setTime(16, 0),
                'maximum_participants' => 100,
                'tickets' => [
                    ['name' => 'Free', 'price' => 0, 'quantity' => 100, 'description' => 'Standard free access to the networking event.'],
                ],
            ],

            // Event 2 — Douala Tech Summit 2026 (Paid Multi-Tickets & CamPay Flow)
            [
                'title' => 'Douala Tech Summit 2026',
                'description' => 'Douala Tech Summit 2026 brings together software engineers, startup founders, product designers, students and technology leaders for a full day of talks, workshops, networking and innovation showcases.',
                'category' => 'Technology',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Sawa Hotel Conference Hall',
                'start_date' => $now->copy()->addDays(5)->setTime(9, 0),
                'end_date' => $now->copy()->addDays(5)->setTime(18, 0),
                'registration_deadline' => $now->copy()->addDays(4)->setTime(23, 0),
                'maximum_participants' => 300,
                'tickets' => [
                    ['name' => 'Classic', 'price' => 5000, 'quantity' => 200, 'description' => 'Access to talks, exhibitions and networking area.'],
                    ['name' => 'VIP', 'price' => 15000, 'quantity' => 70, 'description' => 'Classic access plus reserved seating and coffee break.'],
                    ['name' => 'VVIP', 'price' => 30000, 'quantity' => 30, 'description' => 'VIP access plus speaker lunch, front row seating and private networking.'],
                ],
            ],

            // Event 3 — VIP Product Design Workshop (Limited Capacity / Sold-out Flow)
            [
                'title' => 'VIP Product Design Workshop',
                'description' => 'A practical workshop for designers, product managers and startup teams who want to improve user experience, prototyping and product thinking. Seats are limited to ensure personalized coaching.',
                'category' => 'Education',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Bonapriso Innovation Lab',
                'start_date' => $now->copy()->addDays(3)->setTime(10, 0),
                'end_date' => $now->copy()->addDays(3)->setTime(15, 0),
                'registration_deadline' => $now->copy()->addDays(2)->setTime(20, 0),
                'maximum_participants' => 10,
                'tickets' => [
                    ['name' => 'Workshop Seat', 'price' => 10000, 'quantity' => 5, 'description' => 'Full workshop access with learning materials.'],
                    ['name' => 'Premium Seat', 'price' => 25000, 'quantity' => 2, 'description' => 'Workshop access plus one-on-one review session.'],
                ],
            ],

            // Event 4 — Mboa Culture and Food Festival (Regional Filters & General Public)
            [
                'title' => 'Mboa Culture and Food Festival',
                'description' => 'Celebrate Cameroonian culture through traditional food, music, dance, art exhibitions and local brand showcases. A family-friendly experience for people who love culture and community.',
                'category' => 'Culture',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Centre',
                'city' => 'Yaoundé',
                'venue' => 'Palais des Congrès Garden',
                'start_date' => $now->copy()->addDays(10)->setTime(12, 0),
                'end_date' => $now->copy()->addDays(10)->setTime(22, 0),
                'registration_deadline' => $now->copy()->addDays(9)->setTime(23, 0),
                'maximum_participants' => 500,
                'tickets' => [
                    ['name' => 'Classic', 'price' => 2000, 'quantity' => 350, 'description' => 'Festival entry and access to public exhibitions.'],
                    ['name' => 'Family Pass', 'price' => 7000, 'quantity' => 80, 'description' => 'Entry for up to four people.'],
                    ['name' => 'VIP', 'price' => 12000, 'quantity' => 70, 'description' => 'Entry plus reserved seating and tasting coupons.'],
                ],
            ],

            // Event 5 — Private Corporate Leadership Forum (Draft / Private)
            [
                'title' => 'Private Corporate Leadership Forum',
                'description' => 'A private leadership forum for company executives and team managers focused on strategy, communication and organizational performance.',
                'category' => 'Business',
                'visibility' => 'private',
                'status' => 'draft',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Bonanjo Executive Hall',
                'start_date' => $now->copy()->addDays(15)->setTime(9, 0),
                'end_date' => $now->copy()->addDays(15)->setTime(16, 0),
                'registration_deadline' => $now->copy()->addDays(14)->setTime(18, 0),
                'maximum_participants' => 50,
                'tickets' => [
                    ['name' => 'Invite Only', 'price' => 0, 'quantity' => 50, 'description' => 'Private access for invited participants.'],
                ],
            ],

            // Event 6 — AI and Web Development Bootcamp (Recommendations & Interests Flow)
            [
                'title' => 'AI and Web Development Bootcamp',
                'description' => 'A practical bootcamp for students and junior developers who want to learn artificial intelligence tools, React, Laravel, API integration and modern web development workflows.',
                'category' => 'Technology',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Tameri Cohort Training Space',
                'start_date' => $now->copy()->addDays(7)->setTime(9, 0),
                'end_date' => $now->copy()->addDays(7)->setTime(17, 0),
                'registration_deadline' => $now->copy()->addDays(6)->setTime(20, 0),
                'maximum_participants' => 40,
                'tickets' => [
                    ['name' => 'Student', 'price' => 3000, 'quantity' => 25, 'description' => 'Discounted access for students and beginners.'],
                    ['name' => 'Professional', 'price' => 10000, 'quantity' => 15, 'description' => 'Full access with project review and certificate.'],
                ],
            ],

            // Event 7 — Saturday Fitness and Wellness Meetup (Cancellation & Re-registration Flow)
            [
                'title' => 'Saturday Fitness and Wellness Meetup',
                'description' => 'A morning wellness session with group fitness, stretching, health tips and networking for people interested in active lifestyles.',
                'category' => 'Sports',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Parcours Vita Bonamoussadi',
                'start_date' => $now->copy()->addDays(4)->setTime(7, 0),
                'end_date' => $now->copy()->addDays(4)->setTime(10, 0),
                'registration_deadline' => $now->copy()->addDays(3)->setTime(22, 0),
                'maximum_participants' => 80,
                'tickets' => [
                    ['name' => 'Free Access', 'price' => 0, 'quantity' => 80, 'description' => 'Free access to the wellness meetup.'],
                ],
            ],

            // Event 8 — Mboa Creators Meetup (QR Scan & Check-in Flow)
            [
                'title' => 'Mboa Creators Meetup',
                'description' => 'A meetup for content creators, photographers, designers, musicians and digital storytellers to connect, share experiences and collaborate.',
                'category' => 'Art',
                'visibility' => 'public',
                'status' => 'published',
                'region' => 'Littoral',
                'city' => 'Douala',
                'venue' => 'Bonamoussadi Creative Hub',
                'start_date' => $now->copy()->addDays(2)->setTime(15, 0),
                'end_date' => $now->copy()->addDays(2)->setTime(19, 0),
                'registration_deadline' => $now->copy()->addDay()->setTime(22, 0),
                'maximum_participants' => 120,
                'tickets' => [
                    ['name' => 'Classic', 'price' => 1000, 'quantity' => 100, 'description' => 'Standard access to the meetup.'],
                    ['name' => 'VIP Creator', 'price' => 5000, 'quantity' => 20, 'description' => 'Access plus creator spotlight and networking priority.'],
                ],
            ],
        ];

        DB::beginTransaction();
        try {
            foreach ($events as $eventData) {
                $category = Category::where('name', $eventData['category'])->first();
                $region = Region::where('name', $eventData['region'])->first();
                $city = City::where('name', $eventData['city'])->where('region_id', $region->id)->first();

                if (! $category || ! $region || ! $city) {
                    $this->command->warn("Skipping event '{$eventData['title']}' due to missing category, region, or city.");
                    continue;
                }

                $event = Event::updateOrCreate(
                    [
                        'title' => $eventData['title'],
                        'organizer_id' => $organizer->id,
                    ],
                    [
                        'category_id' => $category->id,
                        'region_id' => $region->id,
                        'city_id' => $city->id,
                        'description' => $eventData['description'],
                        'venue' => $eventData['venue'],
                        'start_date' => $eventData['start_date'],
                        'end_date' => $eventData['end_date'],
                        'registration_deadline' => $eventData['registration_deadline'],
                        'maximum_participants' => $eventData['maximum_participants'],
                        'status' => $eventData['status'],
                        'visibility' => $eventData['visibility'],
                        'price' => collect($eventData['tickets'])->min('price'),
                    ]
                );

                foreach ($eventData['tickets'] as $index => $ticketData) {
                    EventTicketType::updateOrCreate(
                        [
                            'event_id' => $event->id,
                            'name' => $ticketData['name'],
                        ],
                        [
                            'description' => $ticketData['description'],
                            'price' => $ticketData['price'],
                            'quantity' => $ticketData['quantity'],
                            'is_active' => true,
                            'sort_order' => $index,
                        ]
                    );
                }

                $this->command->info("Created/updated event: {$event->title}");
            }

            DB::commit();
            $this->command->info('Event seeding completed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error during event seeding: {$e->getMessage()}");
            throw $e;
        }
    }
}
