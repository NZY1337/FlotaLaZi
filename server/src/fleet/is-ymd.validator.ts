import { registerDecorator, ValidationOptions } from 'class-validator';
import { isNotAfter, isYmd, todayYmd } from './dates';

/** A real calendar date as `YYYY-MM-DD` (no time part). */
export function IsYmd(options?: ValidationOptions) {
    return (object: object, propertyName: string) =>
        registerDecorator({
            name: 'isYmd',
            target: object.constructor,
            propertyName,
            options: { message: `${propertyName} must be a date in YYYY-MM-DD format`, ...options },
            validator: { validate: (value: unknown) => isYmd(value) },
        });
}

/**
 * A date that has already happened (oil change, transaction): not after today
 * in Romania. Pair with @IsYmd(); a non-date is left to it.
 */
export function NotInFuture(options?: ValidationOptions) {
    return (object: object, propertyName: string) =>
        registerDecorator({
            name: 'notInFuture',
            target: object.constructor,
            propertyName,
            options: { message: 'Data nu poate fi în viitor.', ...options },
            validator: { validate: (value: unknown) => !isYmd(value) || isNotAfter(value, todayYmd()) },
        });
}
