import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Driver } from '../../drivers/entities/driver.entity';

// An expiring document. Belongs to a vehicle, a driver, or (both null) the firm.
@Entity('documents')
@Index(['ownerId', 'expiresOn'])
@Check(`NOT ("vehicleId" IS NOT NULL AND "driverId" IS NOT NULL)`)
export class FleetDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    ownerId: string;

    @Column({ type: 'uuid', nullable: true })
    vehicleId: string | null;

    @ManyToOne(() => Vehicle, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'vehicleId' })
    vehicle?: Vehicle | null;

    @Column({ type: 'uuid', nullable: true })
    driverId: string | null;

    @ManyToOne(() => Driver, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'driverId' })
    driver?: Driver | null;

    @Column({ type: 'varchar', length: 100 })
    type: string;

    @Column({ type: 'date' })
    expiresOn: string;

    @Column({ type: 'int', default: 30 })
    alertDays: number;

    @Column({ type: 'text', default: '' })
    notes: string;

    // Reminder bookkeeping (CLAUDE.md §7).
    @Column({ type: 'date', nullable: true })
    lastAlertedOn: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
