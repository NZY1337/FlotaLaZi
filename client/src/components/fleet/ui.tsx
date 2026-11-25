import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Modal } from '../ui/modal';
import type { Level } from '../../services/vehicles';
import { LEVEL_STYLES, formatNumberInput, parseNumberInput } from '../../helpers/fleet';

// Small building blocks shared by the fleet screens. Styling follows the
// existing TailAdmin-based shell (Card = the dashboard's rounded-2xl panels).

export const cardClasses = 'rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]';

const inputClasses =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={`${cardClasses} p-5 ${className}`}>
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    {title && <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h2>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'success';

const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300',
    outline: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]',
    danger: 'bg-error-500 text-white hover:bg-error-600',
    success: 'bg-success-500 text-white hover:bg-success-600',
};

export function ActionButton({ children, onClick, variant = 'primary', size = 'md', type = 'button', disabled, className = '' }: {
    children: ReactNode;
    onClick?: () => void;
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
}) {
    const sizes = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm';
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium shadow-theme-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${sizes} ${buttonVariants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

export function LevelBadge({ level, children }: { level: Level; children: ReactNode }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEVEL_STYLES[level].badge}`}>
            {children}
        </span>
    );
}

export function Pills<T extends string>({ value, options, onChange, label }: {
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    label: string;
}) {
    return (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={label}>
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${value === o.value
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-500/10">{icon}</div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
            {text && <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">{text}</p>}
            {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
        </div>
    );
}

export function ErrorText({ error }: { error: unknown }) {
    if (!error) return null;
    const message = error instanceof Error ? error.message : 'A apărut o eroare.';
    return <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700 dark:bg-error-500/15 dark:text-error-400">{message}</p>;
}

// Without bounds, a native date input lets the year run to 6 digits (202788).
// Same range the server accepts.
const DATE_MIN = '2000-01-01';
const DATE_MAX = '2099-12-31';

export function TextField({ label, value, onChange, type = 'text', required, placeholder, hint, min, max, step, uppercase }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'number' | 'date' | 'email' | 'tel';
    required?: boolean;
    placeholder?: string;
    hint?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    uppercase?: boolean;
}) {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {label}{required && ' *'}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                required={required}
                placeholder={placeholder}
                min={min ?? (type === 'date' ? DATE_MIN : undefined)}
                max={max ?? (type === 'date' ? DATE_MAX : undefined)}
                step={step}
                inputMode={type === 'number' ? 'decimal' : undefined}
                onChange={(e) => onChange(e.target.value)}
                className={`${inputClasses} ${uppercase ? 'uppercase placeholder:normal-case' : ''}`}
            />
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

/**
 * A number typed the Romanian way ("1.500", "1.500,50", "12,5"). A native
 * number input reads "1.500" as 1.5, so this is a text input that parses it
 * with parseNumberInput, shows how it read the number under the field, and
 * blocks the form (the browser's own message) while it is unclear or too small.
 */
export function NumberField({ label, value, onChange, decimals = 0, unit, min, max, required, placeholder, hint }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    decimals?: number;
    unit?: string;
    min?: number;
    max?: number;
    required?: boolean;
    placeholder?: string;
    hint?: string;
}) {
    const id = useId();
    const ref = useRef<HTMLInputElement>(null);
    const parsed = parseNumberInput(value, decimals);
    const filled = value.trim() !== '';
    const problem = !filled ? ''
        : parsed === null
            ? (decimals > 0 ? 'Sumă neclară. Scrie de exemplu 1500, 1.500 sau 1.500,50.' : 'Număr neclar. Scrie de exemplu 450000 sau 450.000.')
            : min !== undefined && parsed < min ? `Minimum ${formatNumberInput(min, decimals)}.`
            : max !== undefined && parsed > max ? `Maximum ${formatNumberInput(max, decimals)}.` : '';
    useEffect(() => { ref.current?.setCustomValidity(problem); }, [problem]);
    const reading = filled && parsed !== null ? `= ${formatNumberInput(parsed, decimals)}${unit ? ` ${unit}` : ''}` : null;
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {label}{required && ' *'}
            </label>
            <input
                ref={ref}
                id={id}
                type="text"
                inputMode={decimals > 0 ? 'decimal' : 'numeric'}
                autoComplete="off"
                value={value}
                required={required}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={inputClasses}
            />
            {problem && <p className="mt-1 text-xs text-error-500">{problem}</p>}
            {!problem && reading && <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-300">{reading}</p>}
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

export function SelectField({ label, value, onChange, options, required }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
}) {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {label}{required && ' *'}
            </label>
            <select id={id} value={value} required={required} onChange={(e) => onChange(e.target.value)} className={inputClasses}>
                {options.map((o) => (
                    <option key={o.value} value={o.value} className="dark:bg-gray-900">{o.label}</option>
                ))}
            </select>
        </div>
    );
}

export function DateShortcuts({ onPick }: { onPick: (months: number) => void }) {
    return (
        <div className="mt-1.5 flex gap-1.5">
            {[[1, '+1 lună'], [6, '+6 luni'], [12, '+1 an']].map(([months, label]) => (
                <button key={months} type="button" onClick={() => onPick(months as number)}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300">
                    {label}
                </button>
            ))}
        </div>
    );
}

export function FormModal({ title, isOpen, onClose, onSubmit, submitLabel = 'Salvează', pending, error, children }: {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    submitLabel?: string;
    pending?: boolean;
    error?: unknown;
    children: ReactNode;
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-[560px] p-5 sm:p-7">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
                className="flex max-h-[80vh] flex-col"
            >
                <h2 className="mb-5 pr-12 text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h2>
                <div className="-mx-1 flex flex-col gap-4 overflow-y-auto px-1 pb-1">{children}</div>
                <div className="mt-5 flex flex-col gap-3">
                    <ErrorText error={error} />
                    <ActionButton type="submit" disabled={pending} className="w-full">
                        {pending ? 'Se salvează…' : submitLabel}
                    </ActionButton>
                </div>
            </form>
        </Modal>
    );
}

export function Row({ children }: { children: ReactNode }) {
    return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
