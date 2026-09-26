import BaseModel from '../core/BaseModel';
import { Module } from '../types';

class ModuleModel extends BaseModel {
    constructor() {
        super({
            tableName: 'modules',
            fillable: ['name', 'slug', 'description', 'is_active', 'sort_order'],
            searchable: ['name', 'slug'],
        });
    }
}

export default new ModuleModel();
