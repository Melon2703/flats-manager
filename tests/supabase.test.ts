import { describe, it, expect } from 'vitest';
import { supabase, getSupabaseClient } from '../lib/supabase';

describe('Supabase Client Helper (lib/supabase.ts)', () => {
  it('exports a valid supabase client object', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('getSupabaseClient creates a client with configured or fallback parameters', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
