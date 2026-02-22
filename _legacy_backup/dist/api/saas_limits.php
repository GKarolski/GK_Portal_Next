<?php
/**
 * GK Portal SaaS - Business Limits Enforcer
 * Handles logic for Storage Quotas, AI Token Limits, and Plan Tiers.
 */

class SaaS_Limits {
    
    // Plan Definitions
    const PLANS = [
        'STARTER' => [
            'storage_mb' => 1024,       // 1 GB
            'tokens_monthly' => 100000, // 100k
            'smart_context' => false    // No PDF RAG
        ],
        'STANDARD' => [
            'storage_mb' => 5120,       // 5 GB
            'tokens_monthly' => 500000, // 500k
            'smart_context' => true
        ],
        'AGENCY' => [
            'storage_mb' => 102400,     // 100 GB
            'tokens_monthly' => 2000000,// 2M
            'smart_context' => true
        ]
    ];

    private $masterPdo;
    private $tenantId;
    private $tenantData;

    public function __construct($masterPdo, $tenantInstanceId) {
        $this->masterPdo = $masterPdo;
        
        // Fallback: If Master PDO is missing, try to connect using constants
        if (!$this->masterPdo && defined('MASTER_DB_HOST')) {
            try {
                $this->masterPdo = new PDO("mysql:host=".MASTER_DB_HOST.";dbname=".MASTER_DB_NAME.";charset=utf8mb4", MASTER_DB_USER, MASTER_DB_PASS);
                $this->masterPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (Exception $e) {
                error_log('[SaaS Limits] Failed to connect to Master DB: ' . $e->getMessage());
            }
        }

        $this->loadTenantData($tenantInstanceId);
    }

    private function loadTenantData($instanceId) {
        if (!$instanceId) {
            error_log('[SaaS Limits] No Instance ID provided.');
            return;
        }

        if (!$this->masterPdo) {
             error_log('[SaaS Limits] Master PDO is null during loadTenantData.');
             return;
        }
        
        try {
            $stmt = $this->masterPdo->prepare("SELECT t.id, plan_tier, storage_limit_mb, storage_used_mb, token_limit_monthly, tokens_used_month FROM saas_tenants t JOIN saas_instances i ON t.id = i.tenant_id WHERE i.instance_id = ?");
            $stmt->execute([$instanceId]);
            $this->tenantData = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->tenantId = $this->tenantData['id'] ?? null;

            if (!$this->tenantData) {
                error_log("[SaaS Limits] Tenant not found for Instance ID: $instanceId");
            } else {
                 // Loaded successfully — no need to log in production
            }
        } catch (Exception $e) {
            error_log('[SaaS Limits] Query Error: ' . $e->getMessage());
        }
    }

    /**
     * STORAGE LIMITS
     */
    public function checkStorage($newFileSizeBytes) {
        if (!$this->tenantData) return false; // Fail-closed: deny if tenant not found

        $newSizeMB = $newFileSizeBytes / 1048576; // Bytes -> MB
        $limit = $this->tenantData['storage_limit_mb'] ?? self::PLANS['STARTER']['storage_mb'];
        $used = $this->tenantData['storage_used_mb'] ?? 0;

        if (($used + $newSizeMB) > $limit) {
            return false;
        }
        return true;
    }

    public function updateStorageUsage($fileSizeBytes) {
        if (!$this->tenantId) return;
        
        $sizeMB = $fileSizeBytes / 1048576;
        $stmt = $this->masterPdo->prepare("UPDATE saas_tenants SET storage_used_mb = storage_used_mb + ? WHERE id = ?");
        $stmt->execute([$sizeMB, $this->tenantId]);
    }

    /**
     * AI TOKEN LIMITS
     */
    public function checkTokens($buffer = 0) {
        if (!$this->tenantData) return false; // Fail-closed
        
        $limit = $this->tenantData['token_limit_monthly'] ?? self::PLANS['STARTER']['tokens_monthly'];
        $used = $this->tenantData['tokens_used_month'] ?? 0;
        
        return ($used + $buffer) < $limit;
    }
    
    public function updateTokenUsage($tokensConsumed) {
        if (!$this->tenantId) return;
        
        $stmt = $this->masterPdo->prepare("UPDATE saas_tenants SET tokens_used_month = tokens_used_month + ? WHERE id = ?");
        $stmt->execute([$tokensConsumed, $this->tenantId]);
    }

    /**
     * SMART CONTEXT (RAG) ACCESS
     */
    public function canUseSmartContext() {
        if (!$this->tenantData) return false;
        
        // Check Plan Tier features directly from Code constants or DB if we stored 'features_json'
        // For now, based on Plan Tier Name
        $tier = $this->tenantData['plan_tier'] ?? 'STARTER';
        return self::PLANS[$tier]['smart_context'] ?? false;
    }
    
    public function getPlanName() {
        return $this->tenantData['plan_tier'] ?? 'STARTER';
    }
    
    public function getStorageInfo() {
        return [
            'used' => round($this->tenantData['storage_used_mb'] ?? 0, 2),
            'limit' => $this->tenantData['storage_limit_mb'] ?? 0
        ];
    }

    public function getUsageStats() {
        if (!$this->tenantData) return null;

        $plan = $this->tenantData['plan_tier'] ?? 'STARTER';
        $limits = self::PLANS[$plan] ?? self::PLANS['STARTER'];

        $storageLimit = $this->tenantData['storage_limit_mb'] ?? $limits['storage_mb'];
        $storageUsed = $this->tenantData['storage_used_mb'] ?? 0;
        
        $tokenLimit = $this->tenantData['token_limit_monthly'] ?? $limits['tokens_monthly'];
        $tokensUsed = $this->tenantData['tokens_used_month'] ?? 0;

        return [
            'plan' => $plan,
            'storage' => [
                'used_mb' => round($storageUsed, 2),
                'limit_mb' => round($storageLimit, 2),
                'percent' => $storageLimit > 0 ? round(($storageUsed / $storageLimit) * 100, 1) : 0
            ],
            'ai' => [
                'used_tokens' => (int)$tokensUsed,
                'limit_tokens' => (int)$tokenLimit,
                'percent' => $tokenLimit > 0 ? round(($tokensUsed / $tokenLimit) * 100, 1) : 0
            ],
            'features' => [
                'smart_context' => $limits['smart_context']
            ]
        ];
    }
}
?>
