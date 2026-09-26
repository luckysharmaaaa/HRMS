import * as fs from 'fs';
import * as path from 'path';
import { pool, testConnection } from './connection';
import logger from '../utils/logger';

const runRollback = async (prefix: string | null = null): Promise<void> => {
    try {
        await testConnection();
        const migrationsDir = path.join(__dirname, 'migrations');

        let files = fs.readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.rollback.sql'))
            .sort()
            .reverse();

        if (prefix) files = files.filter((f) => f.startsWith(prefix));
        if (!files.length) { logger.warn('No rollback files found'); return; }

        for (const file of files) {
            logger.info(`Rolling back: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
            await pool.query(sql);
            logger.info(`✓ ${file} rolled back`);
        }
        logger.info('Rollback complete');
    } catch (error) {
        logger.error('Rollback failed:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    const prefix = process.argv[2] ?? null;
    runRollback(prefix).then(() => process.exit(0)).catch(() => process.exit(1));
}

export default runRollback;
