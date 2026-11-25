import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { IsYmd } from '../../fleet/is-ymd.validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDocumentDto {
    // At most one of vehicleId / driverId; neither = a firm-level document.
    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsUUID()
    vehicleId?: string | null;

    @IsOptional()
    @ValidateIf((_, v) => v !== null)
    @IsUUID()
    driverId?: string | null;

    @Transform(trim)
    @IsString()
    @Length(1, 100)
    type: string;

    @IsYmd()
    expiresOn: string;

    // Defaults to the owner's docAlertDays setting.
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(365)
    alertDays?: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) { }
