import type { Command } from 'prosemirror-state';
import { describe, expect, it, vi } from 'vitest';
import { Quote } from './chars';
import { buildAutopairKeyBindings, KeyboardKey } from './keymap';

describe('buildAutopairKeyBindings', () => {
  it('returns an empty object when no bindings are provided', () => {
    const result = buildAutopairKeyBindings({});
    expect(result).toEqual({});
  });

  it('invokes the factory for each key with the correct argument', () => {
    const quoteFactory = vi.fn().mockImplementation((): Command => () => true);
    const backspaceFactory = vi
      .fn()
      .mockImplementation((): Command => () => false);

    const result = buildAutopairKeyBindings({
      [Quote.Double]: quoteFactory,
      [KeyboardKey.Backspace]: backspaceFactory,
    });

    expect(quoteFactory).toHaveBeenCalledWith(Quote.Double);
    expect(backspaceFactory).toHaveBeenCalledWith(KeyboardKey.Backspace);
    expect(typeof result[Quote.Double]).toBe('function');
    expect(typeof result[KeyboardKey.Backspace]).toBe('function');

    // test the resulting commands
    const state = {} as never;
    const dispatch = vi.fn();
    expect(result[Quote.Double]?.(state, dispatch)).toBe(true);
    expect(result[KeyboardKey.Backspace]?.(state, dispatch)).toBe(false);
  });

  it('overwrites previous values if duplicate keys are present', () => {
    const firstFactory = vi.fn().mockImplementation((): Command => () => false);
    const secondFactory = vi.fn().mockImplementation((): Command => () => true);

    const result = buildAutopairKeyBindings({
      [Quote.Single]: firstFactory,
      [Quote.Single as never]: secondFactory,
    });

    // Only the second factory should have been called
    expect(firstFactory).not.toHaveBeenCalled();
    expect(secondFactory).toHaveBeenCalled();
    expect(result[Quote.Single]?.({} as never, vi.fn())).toBe(true);
  });
});
