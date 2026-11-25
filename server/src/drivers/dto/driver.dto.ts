import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDriverDto {
    @Transform(trim)
    @IsString()
    @Length(1, 100)
    name: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(30)
    phone?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(200)
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

export class UpdateDriverDto extends PartialType(CreateDriverDto) { }
