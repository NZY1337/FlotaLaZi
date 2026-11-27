import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDriverDto {
    @Transform(trim)
    @IsString()
    @Length(1, 100)
    name: string;

    // Empty = no phone. Otherwise digits with the usual separators: 0745 123 456, +40 745-123-456.
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(30)
    @ValidateIf((_, v) => v !== '')
    @Matches(/^\+?[0-9][0-9 ()./-]{5,}$/, { message: 'Numărul de telefon nu e bun. Scrie-l cu cifre, de exemplu 0745 123 456.' })
    phone?: string;

    // Empty = no email.
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(200)
    @ValidateIf((_, v) => v !== '')
    @IsEmail({}, { message: 'Adresa de email nu e bună.' })
    email?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

export class UpdateDriverDto extends PartialType(CreateDriverDto) { }
