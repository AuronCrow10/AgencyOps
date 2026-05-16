import { describe, expect, it } from 'vitest';
import { canTransitionStatus } from '../src/leads/lead-status.js';

describe('lead status transitions', () => {
  it('allows valid transitions', () => {
    expect(canTransitionStatus('new', 'qualified')).toBe(true);
    expect(canTransitionStatus('qualified', 'contacted')).toBe(true);
    expect(canTransitionStatus('contacted', 'won')).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(canTransitionStatus('new', 'won')).toBe(false);
    expect(canTransitionStatus('archived', 'new')).toBe(false);
  });
});
