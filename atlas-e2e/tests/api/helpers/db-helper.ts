import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

let client: Client | null = null;

export async function getDbClient(): Promise<Client> {
    if (client) {
        return client;
    }

    console.log(`[DB Helper] Connecting to database: ${DATABASE_URL}`);
    client = new Client({
        connectionString: DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('[DB Helper] Connected to database');
        return client;
    } catch (error) {
        console.error('[DB Helper] Failed to connect to database:', error);
        client = null;
        throw error;
    }
}

export async function closeDbClient(): Promise<void> {
    if (client) {
        await client.end();
        console.log('[DB Helper] Disconnected from database');
        client = null;
    }
}

export async function query(text: string, params?: any[]): Promise<any> {
    const db = await getDbClient();
    return db.query(text, params);
}

/**
 * Finds the latest audit event for a specific entity ID.
 */
export async function getLatestAuditEventForEntity(entityId: string): Promise<any> {
    const result = await query(
        `SELECT * FROM audit_events WHERE object_id = $1::uuid ORDER BY occurred_at DESC LIMIT 1`,
        [entityId]
    );
    return result.rows[0];
}

/**
 * Finds the latest audit event for a specific entity ID and Action.
 */
export async function getLatestAuditEventForEntityAndAction(entityId: string, action: string): Promise<any> {
    const result = await query(
        `SELECT * FROM audit_events WHERE object_id = $1::uuid AND action = $2 ORDER BY occurred_at DESC LIMIT 1`,
        [entityId, action]
    );
    return result.rows[0];
}
