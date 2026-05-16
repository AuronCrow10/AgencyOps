import type { LeadStatus } from '@agencyops/shared';

const statusTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: ['analyzing', 'qualified', 'contacted', 'lost', 'archived'],
  analyzing: ['qualified', 'contacted', 'lost', 'archived'],
  qualified: ['contacted', 'won', 'lost', 'archived'],
  contacted: ['won', 'lost', 'archived'],
  won: ['archived'],
  lost: ['archived'],
  archived: []
};

export function canTransitionStatus(current: LeadStatus, next: LeadStatus) {
  return current === next || statusTransitions[current].includes(next);
}
