import { createContext, useContext, useState, type ReactNode } from 'react';

interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface PageTitle {
  title: string;
  subtitle?: string;
  action?: ActionItem;
  secondaryAction?: ActionItem;
  extraActions?: ActionItem[];
  hideDefaultAction?: boolean;
}

interface PageTitleContextValue {
  pageTitle: PageTitle;
  setPageTitle: (t: PageTitle) => void;
}

const PageTitleContext = createContext<PageTitleContextValue>({
  pageTitle: { title: '' },
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState<PageTitle>({ title: '' });
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export const usePageTitle = () => useContext(PageTitleContext);
