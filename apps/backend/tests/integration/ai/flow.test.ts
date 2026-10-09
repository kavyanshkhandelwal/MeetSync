import { describe, expect, it } from 'vitest';
import { tryImportBackend } from '../../helpers/ai.probe';

describe('AI recommendation required flow (integration)', () => {
  it('recommendation service exists', async () => {
    const rec = await tryImportBackend('services/recommendation.service.ts');
    expect(rec).toBeTruthy();
  });

  it('AI input validation exists', async () => {
    const validator = await tryImportBackend('validators/ai.validator.ts');
    expect(validator).toBeTruthy();
  });
});
