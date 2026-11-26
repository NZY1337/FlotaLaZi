import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum VehicleKind {
    TRUCK = 'TRUCK',
    TRAILER = 'TRAILER',
    // A personal car (accounts of type PERSONAL): like a truck for km, oil and
    // documents, but never coupled to a trailer.
    CAR = 'CAR',
}

/** Vehicles with an engine: they have km and oil changes. */
export const hasEngine = (kind: VehicleKind) => kind !== VehicleKind.TRAILER;

export enum TrailerType {
    SEMIREMORCA = 'SEMIREMORCA',
    REMORCA = 'REMORCA',
}

// Trucks, trailers and cars share one table: same lifecycle, same documents
// and transactions. Engine columns (km, oil) stay null on trailers;
// attachedTrailerId is for trucks only; trailerType for trailers only.
@Entity('vehicles')
@Index(['ownerId', 'kind'])
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    ownerId: string;

    @Column({ type: 'enum', enum: VehicleKind })
    kind: VehicleKind;

    @Column({ type: 'varchar', length: 20 })
    plate: string;

    @Column({ type: 'varchar', length: 100, default: '' })
    name: string;

    @Column({ type: 'varchar', length: 17, default: '' })
    vin: string;

    @Column({ type: 'text', default: '' })
    notes: string;

    @Column({ type: 'enum', enum: TrailerType, nullable: true })
    trailerType: TrailerType | null;

    // A trailer is coupled to at most one truck.
    @Index({ unique: true, where: '"attachedTrailerId" IS NOT NULL' })
    @Column({ type: 'uuid', nullable: true })
    attachedTrailerId: string | null;

    @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'attachedTrailerId' })
    attachedTrailer?: Vehicle | null;

    @Column({ type: 'int', nullable: true })
    km: number | null;

    @Column({ type: 'int', nullable: true })
    lastOilKm: number | null;

    @Column({ type: 'int', nullable: true })
    oilIntervalKm: number | null;

    @Column({ type: 'date', nullable: true })
    lastOilDate: string | null;

    @Column({ type: 'int', nullable: true })
    oilIntervalMonths: number | null;

    // Reminder bookkeeping (CLAUDE.md §7).
    @Column({ type: 'date', nullable: true })
    lastOilAlertOn: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
