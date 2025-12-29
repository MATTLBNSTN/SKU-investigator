const { Client } = require('pg');

const connectionString = 'postgresql://postgres:JCUHZCikbSaS3cLA@db.supabase.co:5432/postgres';

console.log('Testing connection to:', connectionString);

const client = new Client({
    connectionString: connectionString,
});

async function test() {
    try {
        console.log('Attempting to connect...');
        await client.connect();
        console.log('Successfully connected!');
        const res = await client.query('SELECT NOW()');
        console.log('Server time:', res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error('Connection FAILED.');
        console.error('Error:', err.message);
        if (err.code) console.error('Code:', err.code);
        process.exit(1);
    }
}

test();
