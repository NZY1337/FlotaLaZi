import { registerDecorator, ValidationOptions } from 'class-validator';
import { isYmd } from './dates';

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
