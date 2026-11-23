<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $event_id
 * @property int|null $division_id
 * @property int $uploaded_by
 * @property string $title
 * @property string $file_path
 * @property string $mime_type
 * @property int $file_size
 * @property string $visibility
 */
class Document extends Model
{
    use HasFactory;

    public const VISIBILITY_EVENT_ALL = 'event_all';
    public const VISIBILITY_DIVISION_ONLY = 'division_only';
    public const VISIBILITY_ORGANIZERS_ONLY = 'organizers_only';

    protected $fillable = [
        'event_id',
        'division_id',
        'uploaded_by',
        'title',
        'file_path',
        'mime_type',
        'file_size',
        'visibility',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
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
     * @return BelongsTo<User, $this>
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
