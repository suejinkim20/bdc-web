import { useEffect } from 'react';

type AnalyticsWindow = Window & {
  dataLayer?: Array<unknown>;
  gtag?: (...args: unknown[]) => void;
  __bdcGaInitialized?: boolean;
  __bdcLastTrackedPath?: string;
};

function gtag(...args: unknown[]) {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.dataLayer.push(args);
}

function initGa(gaId: string) {
  const analyticsWindow = window as AnalyticsWindow;

  if (analyticsWindow.__bdcGaInitialized) return;

  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.gtag = gtag;

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-ga-id="${gaId}"]`,
  );

  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.dataset.gaId = gaId;
    document.head.appendChild(script);
  }

  gtag('js', new Date());
  gtag('config', gaId, { send_page_view: false });

  analyticsWindow.__bdcGaInitialized = true;
}

function trackPageView() {
  const analyticsWindow = window as AnalyticsWindow;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (analyticsWindow.__bdcLastTrackedPath === path) return;

  analyticsWindow.__bdcLastTrackedPath = path;
  analyticsWindow.gtag?.('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_search: window.location.search,
  });
}

interface Props {
  gaId: string;
}

export function AnalyticsController({ gaId }: Props) {
  useEffect(() => {
    if (!gaId) return;

    initGa(gaId);
    trackPageView();

    const handleNavigation = () => {
      trackPageView();
    };

    document.addEventListener('astro:after-swap', handleNavigation);

    return () => {
      document.removeEventListener('astro:after-swap', handleNavigation);
    };
  }, [gaId]);

  return null;
}
