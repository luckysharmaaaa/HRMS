import BaseModel from '../core/BaseModel';
import { Permission, DatabaseRecord, DbConnection } from '../types';

class PermissionModel extends BaseModel {
    constructor() {
        super({
            tableName: 'permissions',
            fillable: ['role_id', 'user_id', 'module_id', 'action_id', 'scope', 'conditions'],
            casts: { conditions: 'json' },
        });
    }

    /**
     * Gets all permissions for a specific role or user
     */
    async getEffectivePermissions(roleId?: number, userId?: number, transaction?: DbConnection): Promise<DatabaseRecord[]> {
        const where = roleId ? 'p.role_id = ?' : 'p.user_id = ?';
        const id = roleId ?? userId;

        const sql = `
            SELECT p.*, m.slug as module_slug, a.slug as action_slug
            FROM permissions p
            JOIN modules m ON p.module_id = m.id
            JOIN actions a ON p.action_id = a.id
            WHERE ${where}
        `;
        return this.raw<DatabaseRecord[]>(sql, [id], { method: 'any', transaction });
    }
}

export default new PermissionModel();
