import * as fs from 'fs';
import * as path from 'path';
import { pool, testConnection } from './connection';
import logger from '../utils/logger';

interface MigrationResult { success: boolean; file: string; error?: string; }

const runMigrations = async (): Promise<void> => {
    try {
        await testConnection();

        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            logger.warn('Migrations directory not found. Creating...');
            fs.mkdirSync(migrationsDir, { recursive: true });
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql') && !f.endsWith('.rollback.sql'))
            .sort();
        if (!files.length) { logger.warn('No migration files found.'); return; }

        logger.info(`Found ${files.length} migration(s)`);
        const results: MigrationResult[] = [];

        for (const file of files) {
            logger.info(`\n${'─'.repeat(50)}\nExecuting: ${file}`);
            try {
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
                await pool.query(sql);
                logger.info(`✓ ${file}`);
                results.push({ success: true, file });
            } catch (error) {
                logger.error(`✗ ${file}:`, (error as Error).message);
                results.push({ success: false, file, error: (error as Error).message });
                throw error;
            }
        }

        logger.info(`\nMigrations: ${results.filter((r) => r.success).length}/${results.length} completed`);
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default runMigrations;
