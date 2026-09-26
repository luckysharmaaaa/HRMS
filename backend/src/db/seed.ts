import userModel from '../models/user.model';
import roleModel from '../models/role.model';
import userClientRoleModel from '../models/userClientRole.model';
import permissionModel from '../models/permission.model';
import authService from '../services/auth.service';
import { pool, testConnection } from './connection';
import logger from '../utils/logger';
import { DatabaseRecord } from '../types';

const runSeed = async (): Promise<void> => {
    try {
        await testConnection();
        logger.info('🌱 Running RBAC and Super Admin seed...');

        // ─────────────────────────────────────────────────────────
        // 1. Ensure Super Admin user exists
        // ─────────────────────────────────────────────────────────
        const adminEmail = 'admin@example.com';
        const adminPassword = 'AdminPassword123!';
        let admin = await userModel.findByEmail(adminEmail);

        if (!admin) {
            const hashedPassword = await authService.hashPassword(adminPassword);
            admin = await userModel.create<import('../types').User>({
                email: adminEmail,
                password_hash: hashedPassword,
                name: 'Super Administrator',
                is_verified: true,
                is_active: true,
            });
            logger.info(`✓ Created Super Admin user: ${adminEmail}`);
        } else {
            logger.info(`  Super Admin user already exists: ${adminEmail}`);
        }

        if (!admin) {
            throw new Error('Failed to create or retrieve admin user');
        }

        // ─────────────────────────────────────────────────────────
        // 2. Ensure super_admin role exists
        // ─────────────────────────────────────────────────────────
        const superAdminRole = await roleModel.findBySlug('super_admin');
        if (!superAdminRole) {
            throw new Error('super_admin role not found. Ensure migrations have run first.');
        }

        // ─────────────────────────────────────────────────────────
        // 3. Link Admin to Role (Global access, client_id = NULL)
        // ─────────────────────────────────────────────────────────
        const existingRole = await userClientRoleModel.findOne({
            user_id: admin.id,
            role_id: superAdminRole.id,
        });

        if (!existingRole) {
            await userClientRoleModel.create({
                user_id: admin.id,
                role_id: superAdminRole.id,
                client_id: null,
                is_default: true,
            });
            logger.info('✓ Linked Admin user to super_admin role');
        } else {
            logger.info('  Admin already linked to super_admin role');
        }

        // ─────────────────────────────────────────────────────────
        // 4. Seed Super Admin permissions for all modules & actions
        //    (replaces the PL/pgSQL DO $$ block from the SQL file)
        // ─────────────────────────────────────────────────────────
        logger.info('🔑 Seeding Super Admin permissions...');

        const [moduleRows] = await pool.query<any[]>('SELECT id FROM modules');
        const [actionRows] = await pool.query<any[]>('SELECT id FROM actions');

        let created = 0;
        let skipped = 0;

        for (const mod of moduleRows) {
            for (const action of actionRows) {
                const exists = await permissionModel.findOne({
                    role_id: superAdminRole.id,
                    module_id: mod.id,
                    action_id: action.id,
                });

                if (!exists) {
                    await permissionModel.create({
                        role_id: superAdminRole.id,
                        module_id: mod.id,
                        action_id: action.id,
                        scope: 'all',
                    });
                    created++;
                } else {
                    skipped++;
                }
            }
        }

        logger.info(`✓ Permissions — ${created} created, ${skipped} already existed`);
        logger.info('✨ Seed completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error('✗ Seed failed:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default runSeed;
