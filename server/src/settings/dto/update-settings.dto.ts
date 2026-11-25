import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0.0001)
    @Max(100)
    eurRate?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100_000)
    oilAlertKm?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(365)
    docAlertDays?: number;

    @IsOptional()
    @IsBoolean()
    emailAlerts?: boolean;
}
