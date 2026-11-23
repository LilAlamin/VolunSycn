<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $event_id
 * @property int $division_id
 * @property string $title
 * @property string|null $description
 * @property Carbon $start_time
 * @property Carbon $end_time
 * @property string|null $location
 * @property string $qr_token
 */
class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'division_id',
        'title',
        'description',
        'start_time',
        'end_time',
        'location',
        'qr_token',
    ];

    protected static function booted(): void
    {
        static::creating(function (Shift $shift): void {
            if (empty($shift->qr_token)) {
                $shift->qr_token = 'VS-'.strtoupper(Str::random(12));
            }
        });
    }

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * @return BelongsTo<Division, $this>
     */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function volunteers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shift_user')
            ->withPivot('assigned_at');
    }

    /**
     * @return HasMany<AttendanceLog, $this>
     */
    public function attendanceLogs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class);
    }
}
