import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TransactionType } from '../entities/transaction.entity';
import { CURRENCIES, MAX_AMOUNT, type Currency } from '../../fleet/money';
import { IsYmd } from '../../fleet/is-ymd.validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateTransactionDto {
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsYmd()
    date: string;

    // Major units (e.g. 1250.50). The backend converts to minor units.
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(MAX_AMOUNT)
    amount: number;

    @IsIn(CURRENCIES)
    currency: Currency;

    @Transform(trim)
    @IsString()
    @Length(1, 60)
    category: string;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsUUID()
    vehicleId?: string | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100_000)
    liters?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) { }

export class TransactionQueryDto {
    @IsOptional()
    @IsYmd()
    from?: string;

    @IsOptional()
    @IsYmd()
    to?: string;

    @IsOptional()
    @IsUUID()
    vehicleId?: string;

    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;
}
