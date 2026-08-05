<?php

namespace App\Services\Payments\MeSomb;

use RuntimeException;

/**
 * Thrown when the MeSomb API answers with a non-2xx status.
 */
class MeSombApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $httpStatus,
        public readonly string $apiCode = '',
    ) {
        parent::__construct($message);
    }
}
