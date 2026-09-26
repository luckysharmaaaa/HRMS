import BaseModel from '../core/BaseModel';
import { Role } from '../types';

class RoleModel extends BaseModel {
    constructor() {
        super({
            tableName: 'roles',
            fillable: ['name', 'slug', 'description', 'level', 'is_system', 'parent_role_id', 'client_id'],
            searchable: ['name', 'slug'],
        });
    }

    async findBySlug(slug: string): Promise<Role | null> {
        return this.findOne<Role>({ slug });
    }
}

export default new RoleModel();
