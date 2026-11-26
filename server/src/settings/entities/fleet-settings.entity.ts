import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../fleet/transformers';

export const DEFAULT_EUR_RATE = 4.97;

/** What the account is for: a transport firm or one person's car(s). */
export enum AccountType {
    FIRM = 'FIRM',
    PERSONAL = 'PERSONAL',
}

/** How a document of the account itself (no vehicle, no driver) is named. */
export const ownDocumentsLabel = (accountType: AccountType | null | undefined) =>
    accountType === AccountType.PERSONAL ? 'Personal' : 'Firmă';

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

    // null = not chosen yet; the app treats it as FIRM (every account created
    // before this existed) and asks on an empty dashboard.
    @Column({ type: 'enum', enum: AccountType, nullable: true })
    accountType: AccountType | null;

    @UpdateDateColumn()
    updatedAt: Date;
}
