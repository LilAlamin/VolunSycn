<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $event_id
 * @property int|null $coordinator_id
 * @property string $name
 * @property string|null $description
 * @property string|null $announcements
 * @property int $quota
 */
class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'coordinator_id',
        'name',
        'description',
        'announcements',
        'quota',
    ];

    protected function casts(): array
    {
        return [
            'quota' => 'integer',
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
     * @return BelongsTo<User, $this>
     */
    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function acceptedApplications(): HasMany
    {
        return $this->hasMany(Application::class)->where('status', Application::STATUS_ACCEPTED);
    }

    /**
     * @return HasMany<Shift, $this>
     */
    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * @return HasMany<Document, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * @return HasMany<Announcement, $this>
     */
    public function announcementPosts(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }
}
