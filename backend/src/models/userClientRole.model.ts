import BaseModel from '../core/BaseModel';

class UserClientRoleModel extends BaseModel {
    constructor() {
        super({
            tableName: 'user_client_roles',
            fillable: ['user_id', 'client_id', 'role_id', 'is_default'],
        });
    }
}

export default new UserClientRoleModel();
