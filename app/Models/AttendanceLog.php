<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $shift_id
 * @property int $user_id
 * @property Carbon|null $checked_in_at
 * @property Carbon|null $checked_out_at
 * @property float|null $checkin_lat
 * @property float|null $checkin_lng
 * @property string $verification_method
 * @property float $verified_hours
 * @property string $status
 */
class AttendanceLog extends Model
{
    use HasFactory;

    public const STATUS_CHECKED_IN = 'checked_in';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FLAGGED = 'flagged';

    public const METHOD_QR = 'qr';
    public const METHOD_GEO = 'geolocation';
    public const METHOD_QR_AND_GEO = 'qr_and_geo';

    protected $fillable = [
        'shift_id',
        'user_id',
        'checked_in_at',
        'checked_out_at',
        'checkin_lat',
        'checkin_lng',
        'verification_method',
        'verified_hours',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'checkin_lat' => 'float',
            'checkin_lng' => 'float',
            'verified_hours' => 'float',
        ];
    }

    /**
     * @return BelongsTo<Shift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
