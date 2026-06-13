<?php

namespace App\Console\Commands;

use App\Models\ImageSignature;
use App\Services\ImageSignatureService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CleanupUnusedSignatures extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'signatures:cleanup {--days=90}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cleanup unused image signatures older than specified days';

    /**
     * Execute the console command.
     */
    public function handle(ImageSignatureService $service)
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("Looking for unused signatures older than {$days} days ({$cutoffDate})...");

        // Find signatures that are NOT default, NOT active, or haven't been used recently
        // AND haven't been attached to any document recently.
        // For simplicity based on requirements, we'll just check last_used_at and created_at
        
        $signatures = ImageSignature::where('is_default', false)
            ->where(function ($query) use ($cutoffDate) {
                $query->whereNull('last_used_at')
                      ->where('created_at', '<', $cutoffDate)
                      ->orWhere('last_used_at', '<', $cutoffDate);
            })->get();

        $count = $signatures->count();
        
        if ($count === 0) {
            $this->info("No unused signatures found to clean up.");
            return;
        }

        foreach ($signatures as $signature) {
            try {
                $service->delete($signature);
                Log::info("Cleaned up unused signature ID: {$signature->id}");
            } catch (\Exception $e) {
                Log::error("Failed to clean up signature ID: {$signature->id}. Error: " . $e->getMessage());
            }
        }

        $this->info("Successfully cleaned up {$count} unused signatures.");
    }
}

}
