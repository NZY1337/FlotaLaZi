import { IsString, IsIn, MaxLength } from 'class-validator';
import { type NotificationType } from '../../utils/constants';

export class CreateNotificationDto {
    @IsString()
    @IsIn(['info', 'warning', 'error'])
    type: NotificationType;

    @IsString()
    @MaxLength(500)
    message: string;
}

