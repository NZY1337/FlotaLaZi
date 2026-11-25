import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BillingType } from '../../utils/constants';

// A sellable package. Admin-managed, rarely changes at runtime.
// Prices are integers in minor units (cents) — never floats, and `int` (unlike
// `numeric`) comes back from Postgres as a number, not a string.
@Entity('services')
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ type: 'varchar', unique: true })
    slug: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar' })
    shortDescription: string;

    // Setup price, in cents.
    @Column({ type: 'int' })
    price: number;

    @Column({ type: 'varchar', length: 3, default: 'EUR' })
    currency: string;

    @Column({ type: 'enum', enum: BillingType, default: BillingType.ONE_TIME })
    billingType: BillingType;

    // Only set when billingType is SUBSCRIPTION (e.g. 4900 = €49/month).
    // type must be explicit: TypeORM can't infer it from `number | null`.
    @Column({ type: 'int', nullable: true })
    recurringPrice: number | null;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
