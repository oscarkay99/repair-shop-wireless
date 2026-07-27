let logoDataUrlPromise: Promise<string> | null = null;

/** Fetches the light-background logo lockup once and caches it for reuse across PDF builders. */
export function loadWirelessLogo(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch('/wireless-logo-light.png')
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }
  return logoDataUrlPromise;
}

export function fmtGHS(n: number): string {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Repair-service terms (warranty, liability, payment) — lives on the
// customer portal, distinct from that site's own terms for using the
// tracking tool itself. Shared by invoice and ticket-receipt PDFs/pages.
export const SERVICE_TERMS_URL = 'https://user.wirelesscares.com/service-terms';
