<?php

namespace App\Services\Payments\MeSomb;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Minimal MeSomb Payment client for the Mboa Events 237 platform.
 *
 * Implements the same wire protocol as the official PHP SDK
 * (https://github.com/hachther/mesomb-php, MIT) so credentials issued for
 * that SDK work unchanged:
 *
 *   - every request carries the X-MeSomb-Application / X-MeSomb-Date /
 *     X-MeSomb-Nonce / X-MeSomb-OperationMode headers plus an
 *     Authorization header signed with the access/secret keys (HMAC-SHA1,
 *     AWS-style canonical request — see signRequest()).
 *   - bodies are JSON-encoded with JSON_UNESCAPED_SLASHES and the exact
 *     bytes sent over the wire are the exact bytes signed.
 *
 * Only the operations this app needs are implemented: makeCollect (initiate
 * a mobile-money collection, asynchronous mode) and getTransactions
 * (poll the status of previously created transactions).
 */
class MeSombClient
{
    public const API_VERSION = 'v1.1';

    public const ALGORITHM = 'HMAC-SHA1';

    public function __construct(
        private readonly string $applicationKey,
        private readonly string $accessKey,
        private readonly string $secretKey,
        private readonly string $baseUrl = 'https://mesomb.hachther.com',
        private readonly int $timeout = 60,
    ) {
    }

    /**
     * Collect money from a customer's mobile-money account.
     *
     * With mode 'asynchronous' the API returns immediately with the
     * transaction in PENDING state (the prompt is pushed to the phone by the
     * operator) — the final status arrives via webhook. With mode
     * 'synchronous' the call blocks until the user answers the prompt.
     *
     * @param  array<string, mixed>  $params  amount, service (MTN|ORANGE),
     *                                        payer, trxID, customer, ...
     * @return array<string, mixed> decoded JSON response
     *
     * @throws MeSombApiException|ConnectionException|RuntimeException
     */
    public function makeCollect(array $params): array
    {
        $body = [
            'amount' => $params['amount'],
            'service' => $params['service'],
            'payer' => $params['payer'],
            'country' => $params['country'] ?? 'CM',
            'currency' => $params['currency'] ?? 'XAF',
            'amount_currency' => $params['currency'] ?? 'XAF',
            'fees' => $params['fees'] ?? true,
            'conversion' => $params['conversion'] ?? false,
        ];

        if (! empty($params['trxID'])) {
            $body['trxID'] = $params['trxID'];
        }
        if (! empty($params['location'])) {
            $body['location'] = $params['location'];
        }
        if (! empty($params['customer'])) {
            $body['customer'] = $params['customer'];
        }
        if (! empty($params['products'])) {
            $body['products'] = $params['products'];
        }
        if (! empty($params['extra'])) {
            $body = array_merge($body, $params['extra']);
        }

        return $this->request(
            'POST',
            'payment/collect/',
            [],
            $body,
            $params['mode'] ?? 'synchronous'
        );
    }

    /**
     * Fetch transactions by their MeSomb ids (pk values).
     *
     * @param  array<int, string>  $ids
     * @return array<int, array<string, mixed>> list of transaction objects
     *
     * @throws MeSombApiException|ConnectionException|RuntimeException
     */
    public function getTransactions(array $ids, string $source = 'MESOMB'): array
    {
        $query = implode('&', array_map(fn (string $id) => 'ids='.$id, $ids)).'&source='.$source;

        return $this->request('GET', 'payment/transactions/?'.$query);
    }

    // -------------------------------------------------------------------
    // HTTP + signing (mirrors hachther/mesomb-php exactly)
    // -------------------------------------------------------------------

    /**
     * @param  array<string, string>  $query
     * @param  array<string, mixed>|null  $body
     * @return array<string, mixed>
     */
    private function request(string $method, string $endpoint, array $query = [], ?array $body = null, ?string $mode = null): array
    {
        $timestamp = time();
        $nonce = $method === 'GET' ? '' : $this->nonce();

        $headers = [
            'x-mesomb-date' => (string) $timestamp,
            'x-mesomb-nonce' => $nonce,
            'Content-Type' => 'application/json',
            'X-MeSomb-OperationMode' => (string) $mode,
            'X-MeSomb-Source' => 'MeSombPHP/v2.2.1',
            'Accept-Language' => 'en',
            'X-MeSomb-Application' => $this->applicationKey,
        ];

        if ($body !== null && array_key_exists('trxID', $body) && $body['trxID'] !== null) {
            $headers['X-MeSomb-TrxID'] = (string) $body['trxID'];
            unset($body['trxID']);
        }

        $url = rtrim($this->baseUrl, '/').'/api/'.self::API_VERSION.'/'.$endpoint;

        $headers['Authorization'] = $this->signRequest(
            $method,
            $url,
            $timestamp,
            $nonce,
            $method !== 'GET' ? ['content-type' => 'application/json'] : [],
            $body
        );

        if ($method === 'GET') {
            $response = Http::withHeaders($headers)
                ->timeout($this->timeout)
                ->connectTimeout(10)
                ->get($url);
        } else {
            $bodyString = json_encode($body ?? [], JSON_UNESCAPED_SLASHES);
            $response = Http::withHeaders($headers)
                ->withBody((string) $bodyString, 'application/json')
                ->timeout($this->timeout)
                ->connectTimeout(10)
                ->post($url);
        }

        $payload = $response->json() ?? [];

        if ($response->status() >= 300) {
            $message = is_array($payload)
                ? (string) ($payload['detail'] ?? $payload['message'] ?? 'MeSomb API error')
                : 'MeSomb API error';
            $code = is_array($payload) ? (string) ($payload['code'] ?? '') : '';

            throw new MeSombApiException($message, $response->status(), $code);
        }

        return $payload;
    }

    /**
     * AWS-style request signing used by MeSomb (identical to
     * MeSomb\Signature::signRequest in hachther/mesomb-php).
     *
     * @param  array<string, string>  $extraHeaders
     * @param  array<string, mixed>|null  $body
     */
    private function signRequest(string $method, string $url, int $timestamp, string $nonce, array $extraHeaders = [], ?array $body = null): string
    {
        $parse = parse_url($url);
        $canonicalQuery = (string) ($parse['query'] ?? '');

        $headers = $extraHeaders;
        $headers['host'] = $parse['scheme'].'://'.$parse['host'].(isset($parse['port']) ? ':'.$parse['port'] : '');
        $headers['x-mesomb-date'] = (string) $timestamp;
        $headers['x-mesomb-nonce'] = $nonce;
        // NOTE: deliberately NOT sorted — the SDK keeps insertion order and
        // MeSomb's server verifies against that exact ordering.

        $canonicalHeaders = implode("\n", array_map(
            fn ($key, $value) => strtolower((string) $key).':'.$value,
            array_keys($headers),
            array_values($headers)
        ));

        $signedHeaders = implode(';', array_keys($headers));

        $bodyString = $body === null ? '{}' : json_encode($body, JSON_UNESCAPED_SLASHES);
        $payloadHash = sha1((string) $bodyString);

        $path = implode('/', array_map('rawurlencode', explode('/', (string) $parse['path'])));

        $canonicalRequest = strtoupper($method)."\n".$path."\n".$canonicalQuery."\n"
            .$canonicalHeaders."\n".$signedHeaders."\n".$payloadHash;

        $scope = gmdate('Ymd', $timestamp).'/payment/mesomb_request';
        $stringToSign = self::ALGORITHM."\n".$timestamp."\n".$scope."\n".sha1($canonicalRequest);

        $signature = hash_hmac('sha1', $stringToSign, $this->secretKey);

        return self::ALGORITHM.' Credential='.$this->accessKey.'/'.$scope
            .', SignedHeaders='.$signedHeaders.', Signature='.$signature;
    }

    /**
     * 40-character random alphanumeric nonce (same generator as the SDK).
     */
    private function nonce(): string
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

        return implode('', array_map(
            fn () => $characters[random_int(0, strlen($characters) - 1)],
            range(1, 40)
        ));
    }
}
