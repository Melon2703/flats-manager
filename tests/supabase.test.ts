import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Supabase Client Helper (lib/supabase.ts)', () => {
  it('exports a valid supabase client object', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });
});
