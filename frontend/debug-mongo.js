const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function main() {
    const envPath = path.join(__dirname, '.env.local');
    let uri = '';

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/MONGODB_URI=(.*)/);
        if (match) {
            uri = match[1].trim();
            if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
                uri = uri.slice(1, -1);
            }
        }
    }

    if (!uri) {
        console.error("Could not find MONGODB_URI in .env.local");
        return;
    }

    console.log("Attempting to connect to MongoDB...");

    const client = new MongoClient(uri, { family: 4 });

    try {
        await client.connect();
        console.log("SUCCESS: Connected to MongoDB!");
        await client.db("admin").command({ ping: 1 });
        console.log("Ping success.");
    } catch (e) {
        console.error("CONNECTION FAILED:", e);
    } finally {
        await client.close();
    }
}

main();
