import { type ReactNode, useEffect } from 'react';
import { usePageTitle } from '@/context/PageTitleContext';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle({ title, subtitle, hideDefaultAction: true });
  }, [title, subtitle, setPageTitle]);

  return <>{children}</>;
}
