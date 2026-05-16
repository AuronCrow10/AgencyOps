import { describe, expect, it } from 'vitest';
import { publicLeadInputSchema } from '@agencyops/shared';

describe('public lead validation', () => {
  it('accepts a valid lead', () => {
    const result = publicLeadInputSchema.parse({
      name: 'Jordan Reeves',
      email: 'jordan@example.com',
      company: 'Northwind Studio',
      website: 'https://northwind.example',
      budgetRange: '$10k - $20k',
      serviceNeeded: 'CRM automation',
      deadline: '6 weeks',
      message: 'We need to automate intake and pipeline handoff.'
    });

    expect(result.company).toBe('Northwind Studio');
  });

  it('rejects an invalid lead payload', () => {
    expect(() =>
      publicLeadInputSchema.parse({
        name: 'J',
        email: 'not-an-email',
        company: '',
        budgetRange: '',
        serviceNeeded: '',
        deadline: '',
        message: 'short'
      })
    ).toThrow();
  });
});
