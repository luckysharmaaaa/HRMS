import mysql from 'mysql2/promise';
import config from '../config';
import logger from '../utils/logger';

const db = config.database;

const pool = mysql.createPool({
    host: db.host,
    port: db.port,
    database: db.database,
    user: db.user,
    password: db.password,
    connectionLimit: db.poolMax,
    waitForConnections: true,
    queueLimit: 0,

    // Allow multiple SQL statements per query
    multipleStatements: true,

    // Return DATETIME values as strings
    dateStrings: true,

    // Parse JSON columns and TINYINT(1) values
    typeCast: (field, next) => {
        if (field.type === 'JSON') {
            const val = field.string();

            if (val === null) {
                return null;
            }

            try {
                return JSON.parse(val);
            } catch {
                return val;
            }
        }

        if (field.type === 'TINY' && field.length === 1) {
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
        logger.info(`Database: ${row.database}`);
        logger.info(`Server time: ${row.now}`);

        return true;
    } catch (error) {
        console.error('DATABASE CONNECTION ERROR:', error);

        logger.error(
            `Database connection failed: ${
                error instanceof Error ? error.message : String(error)
            }`
        );

        throw error;
    }
};

export const closeConnection = async (): Promise<void> => {
    try {
        await pool.end();
        logger.info('Database connection pool closed');
    } catch (error) {
        console.error('DATABASE CLOSE ERROR:', error);

        logger.error(
            `Error closing database connection: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};

export { pool };