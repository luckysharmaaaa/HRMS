import mysql from 'mysql2/promise';
import config from '../config';
import logger from '../utils/logger';

const db = config.database;

const pool = mysql.createPool({
    host:               db.host,
    port:               db.port,
    database:           db.database,
    user:               db.user,
    password:           db.password,
    connectionLimit:    db.poolMax,
    waitForConnections: true,
    queueLimit:         0,
    // Allow multiple SQL statements per query (needed for migration files)
    multipleStatements: true,
    // Return JS Date objects for DATETIME columns
    dateStrings:        true,
    // Parse JSON columns automatically
    typeCast: (field, next) => {
        if (field.type === 'JSON') {
            const val = field.string();
            if (val === null) return null;
            try { return JSON.parse(val); } catch { return val; }
        }
        if (field.type === 'TINY' && field.length === 1) {
            // Map TINYINT(1) → boolean
            const val = field.string();
            return val === null ? null : val !== '0';
        }
        return next();
    },
});

export const testConnection = async (): Promise<boolean> => {
    try {
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
            'SELECT NOW() AS now, DATABASE() AS `database`'
        );
        const row = rows[0];
        logger.info('✓ Database connected [MySQL]');
        logger.info(`  Database: ${row.database}`);
        logger.info(`  Server time: ${row.now}`);
        return true;
    } catch (error) {
        logger.error('✗ Database connection failed:', (error as Error).message);
        throw error;
    }
};

export const closeConnection = async (): Promise<void> => {
    try {
        await pool.end();
        logger.info('Database connection pool closed');
    } catch (error) {
        logger.error('Error closing database connection:', (error as Error).message);
    }
};

export { pool };
