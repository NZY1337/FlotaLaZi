import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { numericTransformer } from '../../fleet/transformers';
import type { Currency } from '../../fleet/money';

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

// Amounts are integers in minor units. `eurRate` is captured when the row is
// saved, so changing the current rate never rewrites past months' totals.
@Entity('transactions')
@Index(['ownerId', 'date'])
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    ownerId: string;

    @Column({ type: 'enum', enum: TransactionType })
    type: TransactionType;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'int' })
    amount: number;

    @Column({ type: 'varchar', length: 3 })
    currency: Currency;

    @Column({ type: 'numeric', precision: 10, scale: 4, transformer: numericTransformer })
    eurRate: number;

    // Computed by the backend: amount converted to RON at eurRate.
    @Column({ type: 'int' })
    amountRon: number;

    @Column({ type: 'varchar', length: 60 })
    category: string;

    @Column({ type: 'uuid', nullable: true })
    vehicleId: string | null;

    @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'vehicleId' })
    vehicle?: Vehicle | null;

    @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numericTransformer })
    liters: number | null;

    @Column({ type: 'text', default: '' })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
