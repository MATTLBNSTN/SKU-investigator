-- 1. Enable UUID extension for secure IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table (Synced from Clerk)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY, -- This will match the Clerk Org ID (e.g., "org_2b...")
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    credits_balance INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. APIs Table (The "Blueprints")
CREATE TABLE IF NOT EXISTS apis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    org_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL, -- e.g., "get-sneaker-info"
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    
    -- THE MAGIC COLUMN: Stores the user's dynamic Input/Output definition
    schema_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure an Org cannot have two APIs with the same slug
    UNIQUE(org_id, slug)
);

-- 4. Audit Log (Optional but recommended for billing)
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    api_id UUID REFERENCES apis(id),
    org_id TEXT,
    status TEXT CHECK (status IN ('success', 'error')),
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
