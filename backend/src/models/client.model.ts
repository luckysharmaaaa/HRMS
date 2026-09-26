import BaseModel from '../core/BaseModel';
import { Client } from '../types';

class ClientModel extends BaseModel {
    constructor() {
        super({
            tableName: 'clients',
            fillable: ['parent_client_id', 'name', 'slug', 'client_type', 'status', 'contact_email', 'contact_phone', 'address', 'logo_url', 'subscription_plan', 'settings'],
            searchable: ['name', 'slug', 'contact_email'],
            casts: { settings: 'json' },
            softDelete: true,
        });
    }

    async findBySlug(slug: string): Promise<Client | null> {
        return this.findOne<Client>({ slug });
    }
}

export default new ClientModel();
