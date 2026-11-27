import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { TrailerType, VehicleKind } from '../entities/vehicle.entity';
import { IsYmd, NotInFuture } from '../../fleet/is-ymd.validator';
import { CURRENCIES, type Currency, MAX_AMOUNT } from '../../fleet/money';

const upperTrim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateVehicleDto {
    @IsEnum(VehicleKind)
    kind: VehicleKind;

    @Transform(upperTrim)
    @IsString()
    @Length(2, 20)
    plate: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @Transform(upperTrim)
    @IsString()
    @MaxLength(17)
    vin?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;

    @IsOptional()
    @IsEnum(TrailerType)
    trailerType?: TrailerType;

    // null detaches the trailer.
    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsUUID()
    attachedTrailerId?: string | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsInt()
    @Min(0)
    @Max(10_000_000)
    km?: number | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsInt()
    @Min(0)
    @Max(10_000_000)
    lastOilKm?: number | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsInt()
    @Min(1000)
    @Max(500_000)
    oilIntervalKm?: number | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsYmd()
    @NotInFuture({ message: 'Data ultimului schimb de ulei nu poate fi în viitor.' })
    lastOilDate?: string | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsInt()
    @Min(1)
    @Max(60)
    oilIntervalMonths?: number | null;
}

// The kind of a vehicle never changes; delete and re-create instead.
export class UpdateVehicleDto extends PartialType(OmitType(CreateVehicleDto, ['kind'] as const)) { }

export class OilChangeDto {
    @IsInt()
    @Min(0)
    @Max(10_000_000)
    km: number;

    @IsYmd()
    @NotInFuture({ message: 'Data schimbului de ulei nu poate fi în viitor.' })
    date: string;

    // Optional cost, in major units (e.g. 2500.50); recorded as an expense.
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(MAX_AMOUNT)
    cost?: number;

    @IsOptional()
    @IsIn(CURRENCIES)
    currency?: Currency;
}
