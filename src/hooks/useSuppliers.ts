import { useState } from 'react';
export function useSuppliers() {
  const [suppliers] = useState([]);
  return { suppliers, loading: false };
}
