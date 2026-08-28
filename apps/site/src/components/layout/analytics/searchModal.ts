import { pushAnalyticsEvent } from '../../../util/google-analytics/pushAnalyticsEvent';
import { getElementText } from './shared';

const RESULT_SELECTOR = '.pf-result';
const RESULT_LINK_SELECTOR = '.pf-result-link';
const SUBRESULT_LINK_SELECTOR = '.pf-heading-link';
const TRACKED_LINK_SELECTOR = `${RESULT_LINK_SELECTOR}, ${SUBRESULT_LINK_SELECTOR}`;

type PagefindSearchInstance = {
  searchTerm?: string;
};

type PagefindComponentsApi = {
  getInstanceManager?: () => {
    getInstance?: (instanceName: string) => PagefindSearchInstance | undefined;
  };
};

type PagefindWindow = Window & {
  PagefindComponents?: PagefindComponentsApi;
};

// Analytics expects one-based result positions, while DOM arrays are zero-based.
function getRank(elements: Element[], element: Element): number | undefined {
  const rank = elements.indexOf(element);
  return rank >= 0 ? rank + 1 : undefined;
}

// The controller routes any click inside the modal here, so narrow that down to
// the Pagefind links we actually want to track.
function getSearchModalLink(target: Element): HTMLAnchorElement | null {
  const link = target.closest(TRACKED_LINK_SELECTOR);
  return link instanceof HTMLAnchorElement ? link : null;
}

// Prefer the live Pagefind instance state because it reflects the active search
// term even if the input DOM lags behind. Fall back to the visible input value.
function getSearchModalQuery(modal: ParentNode, instanceName: string): string | undefined {
  const instance = (window as PagefindWindow).PagefindComponents
    ?.getInstanceManager?.()
    ?.getInstance?.(instanceName);
  const instanceQuery = instance?.searchTerm?.trim();
  if (instanceQuery) return instanceQuery;

  const input = modal.querySelector('input');
  if (!(input instanceof HTMLInputElement)) return undefined;

  const inputQuery = input.value.trim();
  return inputQuery || undefined;
}

export function trackSearchModalInteraction(target: Element) {
  const link = getSearchModalLink(target);
  if (!link) return;

  // Search results are rendered inside the Pagefind modal custom element.
  const modal = link.closest('pagefind-modal');
  if (!modal) return;

  // Every tracked link should belong to a top-level result card so we can
  // report both overall result rank and optional subresult rank.
  const result = link.closest(RESULT_SELECTOR);
  if (!result) return;

  const searchResultRank = getRank(
    Array.from(modal.querySelectorAll(RESULT_SELECTOR)),
    result,
  );
  if (!searchResultRank) return;

  // Subresult chips report an additional nested rank. Top-level results leave
  // this undefined so the event type remains the distinguishing signal.
  const searchSubresultRank = link.matches(SUBRESULT_LINK_SELECTOR)
    ? getRank(Array.from(result.querySelectorAll(SUBRESULT_LINK_SELECTOR)), link)
    : undefined;

  const elementText = getElementText(link);

  pushAnalyticsEvent({
    event: searchSubresultRank
      ? 'search_modal_subresult_click'
      : 'search_modal_result_click',
    site_section: 'search_modal',
    element_type: 'a',
    element_text: elementText,
    element_url: link.href,
    page_path: window.location.pathname,
    search_query: getSearchModalQuery(modal, 'site-modal'),
    search_result_rank: searchResultRank,
    search_subresult_rank: searchSubresultRank,
  });
}
