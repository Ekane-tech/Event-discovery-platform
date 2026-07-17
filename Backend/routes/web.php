<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/', function () {
    return view('welcome');
});

// ROUTE TEMPORAIRE DE SECOURS POUR FORCER L'ENVOI DES MAILS
Route::get('/run-my-queue', function () {
    // Cette commande va forcer Laravel à vider la table 'jobs' en envoyant les mails vers l'API Brevo
    Artisan::call('queue:work', [
        '--once' => true,
        '--tries' => 3,
        '--timeout' => 90
    ]);
    return "Le Queue Worker s'est exécuté ! Vérifiez votre table jobs et vos logs Brevo.";
});
