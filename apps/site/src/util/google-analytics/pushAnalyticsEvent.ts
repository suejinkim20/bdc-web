export type AnalyticsParams = Record<
  string,
  string | number | boolean | Array<string> | null | undefined
>;

export type DataLayerEvent = AnalyticsParams & { event: string };

type AnalyticsWindow = Window & {
  gtag?: (
    command: 'event',
    eventName: string,
    params?: AnalyticsParams,
  ) => void;
};

export function pushAnalyticsEvent(event: DataLayerEvent) {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as AnalyticsWindow;

  if (typeof analyticsWindow.gtag === 'function') {
    const { event: eventName, ...params } = event;
    console.log('[analytics] gtag():', eventName, params);
    analyticsWindow.gtag('event', eventName, params);
    return;
  }

  console.log('[analytics] gtag not found, event not sent:', event);
}