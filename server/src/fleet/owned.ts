import { NotFoundException } from '@nestjs/common';

/** Throws the ownership 404 (CLAUDE.md §8) when a lookup came back empty. */
export function found<T>(entity: T | null | undefined, what: string): T {
    if (!entity) throw new NotFoundException(`${what} not found`);
    return entity;
}

export type AuthRequest = { user: { id: string; email?: string; name?: string } };
