import { testConnection } from './src/db/connection';

async function run() {
    try {
        console.log('Testing connection...');
        await testConnection();
        console.log('Test passed!');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

run();
