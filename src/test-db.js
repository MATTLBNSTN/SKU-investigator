const { Client } = require('pg');
const dns = require('dns');
const url = require('url');

// The string provided by the user
const connectionString = 'postgresql://postgres:JCUHZCikbSaS3cLA@db.mcfjycpozrnheztdsaih.supabase.co:5432/postgres';

console.log('--- DIAGNOSTIC START ---');
console.log('Testing specific connection string provided...');

try {
    const parsed = new url.URL(connectionString);
    console.log(`Hostname: ${parsed.hostname}`);
    console.log(`Port: ${parsed.port}`);
    console.log(`User: ${parsed.username}`);
    console.log('Password: [HIDDEN]');

    // 1. Test DNS Resolution
    console.log('\nSTEP 1: Testing DNS Resolution...');
    dns.lookup(parsed.hostname, (err, address, family) => {
        if (err) {
            console.error('❌ DNS LOOKUP FAILED');
            console.error(`Error: ${err.message}`);
            console.error('Possible Causes:');
            console.error('  - The hostname is incorrect (typo in Usage Ref ID?)');
            console.error('  - No internet connection');
            console.error('  - Firewall blocking DNS');
            console.log('--- DIAGNOSTIC END ---');
            return;
        }
        console.log(`✅ DNS Resolved: ${address} (IPv${family})`);

        // 2. Test TCP/PG Connection
        console.log('\nSTEP 2: Attempting Database Connection...');
        const client = new Client({ connectionString });

        client.connect()
            .then(async () => {
                console.log('✅ Connected to database socket!');
                const res = await client.query('SELECT NOW() as time, current_user, version()');
                console.log('\nSTEP 3: Query Execution Success');
                console.log('Server Time:', res.rows[0].time);
                console.log('User:', res.rows[0].current_user);
                console.log('Version:', res.rows[0].version);
                await client.end();
                console.log('\n🎉 SUCCESS: Connection is working perfectly.');
            })
            .catch(dbErr => {
                console.error('❌ DATABASE CONNECTION FAILED');
                console.error('Error Name:', dbErr.name);
                console.error('Error Message:', dbErr.message);
                if (dbErr.code) console.error('Error Code:', dbErr.code);
                if (dbErr.detail) console.error('Detail:', dbErr.detail);
                if (dbErr.hint) console.error('Hint:', dbErr.hint);
                console.log('--- DIAGNOSTIC END ---');
            });
    });

} catch (parseErr) {
    console.error('❌ CRITICAL: Could not parse connection string URL.');
    console.error(parseErr.message);
}
