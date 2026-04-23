import { withClientCache, invalidateClientCache } from '@/lib/clientCache';
import { supabase } from '@/lib/supabase';

export interface CustomerProfile {
  id: string;
  name: string | null;
  email: string | null;
}

const CUSTOMER_CACHE_TTL_MS = 2 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getCustomerByEmailCached(email: string): Promise<CustomerProfile | null> {
  const normalizedEmail = normalizeEmail(email);

  return withClientCache<CustomerProfile | null>(
    `customer:${normalizedEmail}`,
    CUSTOMER_CACHE_TTL_MS,
    async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error) {
        console.error('Failed to load customer profile:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name ?? null,
        email: data.email ?? normalizedEmail,
      };
    }
  );
}

export function invalidateCustomerCache(email?: string) {
  if (!email) {
    invalidateClientCache('customer:');
    return;
  }

  invalidateClientCache(`customer:${normalizeEmail(email)}`);
}
