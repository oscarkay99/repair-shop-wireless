import { useState, useEffect } from 'react';
import { getSales } from '@/services/sales';
import type { Sale } from '@/types/sale';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSales().then(setSales).finally(() => setLoading(false));
  }, []);

  return { sales, loading };
}
