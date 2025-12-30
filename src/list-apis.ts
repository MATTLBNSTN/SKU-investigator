import { db } from './lib/db';

async function main() {
    console.log('Listing APIs...');
    try {
        const res = await db.query('SELECT * FROM apis ORDER BY created_at DESC');
        console.table(res.rows.map(r => ({
            id: r.id,
            org_id: r.org_id,
            name: r.name,
            slug: r.slug,
            schema_summary: JSON.stringify(r.schema_config).slice(0, 50) + '...'
        })));
    } catch (err) {
        console.error('Error listing APIs:', err);
    } finally {
        process.exit();
    }
}

main();
