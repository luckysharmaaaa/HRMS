import BaseModel from '../core/BaseModel';
import { Action } from '../types';

class ActionModel extends BaseModel {
    constructor() {
        super({
            tableName: 'actions',
            fillable: ['name', 'slug', 'description'],
            searchable: ['name', 'slug'],
        });
    }
}

export default new ActionModel();
