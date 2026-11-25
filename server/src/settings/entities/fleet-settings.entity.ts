import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../fleet/transformers';

export const DEFAULT_EUR_RATE = 4.97;

// One row per owner (= per firm, CLAUDE.md §6). Created with defaults on first read.
@Entity('fleet_settings')
export class FleetSettings {
    @PrimaryColumn({ type: 'uuid' })
    ownerId: string;

    // RON per 1 EUR, used for new transactions. No DB default: TypeORM can't
    // diff numeric defaults reliably, so SettingsService sets DEFAULT_EUR_RATE.
    @Column({ type: 'numeric', precision: 10, scale: 4, transformer: numericTransformer })
    eurRate: number;

    @Column({ type: 'int', default: 5000 })
    oilAlertKm: number;

    @Column({ type: 'int', default: 30 })
    docAlertDays: number;

    @Column({ type: 'boolean', default: true })
    emailAlerts: boolean;

    @UpdateDateColumn()
    updatedAt: Date;
}
