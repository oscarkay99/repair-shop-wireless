import QRCode from 'qrcode';

const logoDataUrlPromises = new Map<string, Promise<string>>();

/**
 * Fetches a logo image once per URL and caches it for reuse across PDF
 * builders. Pass the business's uploaded `settings.logo_url` when available;
 * falls back to the bundled light-background lockup otherwise.
 */
export function loadWirelessLogo(overrideUrl?: string | null): Promise<string> {
  const url = overrideUrl || '/wireless-logo-light.png';
  if (!logoDataUrlPromises.has(url)) {
    logoDataUrlPromises.set(url, fetch(url)
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })));
  }
  return logoDataUrlPromises.get(url)!;
}

/** Scales to fit within a maxW x maxH box without distorting the image's own aspect ratio (like CSS object-fit: contain). */
export function fitLogoBox(ratio: number, maxW: number, maxH: number): { w: number; h: number } {
  let w = maxW;
  let h = w * ratio;
  if (h > maxH) { h = maxH; w = h / ratio; }
  return { w, h };
}

export function fmtGHS(n: number): string {
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Repair-service terms (warranty, liability, payment) — lives on the
// customer portal, distinct from that site's own terms for using the
// tracking tool itself. Shared by invoice and ticket-receipt PDFs/pages.
export const SERVICE_TERMS_URL = 'https://user.wirelesscares.com/service-terms';

// Same customer-portal domain's tracker home — lets a customer scan the
// printed receipt/invoice straight into the "enter your ticket + phone"
// form instead of having to type the site address into a browser by hand.
export const TRACKER_URL = 'https://user.wirelesscares.com';

const qrDataUrlPromises = new Map<string, Promise<string>>();

/** Generates (and caches) a scannable QR code as a PNG data URL for embedding via doc.addImage(). */
export function loadTrackerQrCode(url: string = TRACKER_URL): Promise<string> {
  if (!qrDataUrlPromises.has(url)) {
    qrDataUrlPromises.set(url, QRCode.toDataURL(url, { margin: 1, width: 240 }));
  }
  return qrDataUrlPromises.get(url)!;
}

/** Pre-fills the tracker's ticket-number field so the customer only has to
 *  type their phone — still required, same as searching manually, just one
 *  less field. Falls back to the plain tracker home when no ticket number
 *  is known (e.g. a non-ticket-linked invoice). */
export function trackerUrlFor(ticketNumber?: string | null): string {
  return ticketNumber ? `${TRACKER_URL}/?ticket=${encodeURIComponent(ticketNumber)}` : TRACKER_URL;
}
