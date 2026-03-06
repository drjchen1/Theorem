import { AccessibilityAudit } from '../types';

export const runAccessibilityAudit = (html: string): AccessibilityAudit => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const checks = [];

  // Check 1: Alt text for all images/figures (1.1.1)
  const images = Array.from(doc.querySelectorAll('img'));
  const allImagesHaveAlt = images.length === 0 || images.every(img => {
    const alt = img.getAttribute('alt');
    return alt && alt.trim().length > 0;
  });
  checks.push({
    title: 'Alt Text (1.1.1)',
    passed: allImagesHaveAlt,
    description: 'All visual figures must have descriptive alternative text for screen readers.',
    suggestion: allImagesHaveAlt ? undefined : 'Use the Figure Editor to add descriptive alt text to all images.'
  });

  // Check 2: Heading Structure (1.3.1) - Sequential Order
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let headingOrderValid = true;
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1]);
    if (level > lastLevel + 1 && lastLevel !== 0) {
      headingOrderValid = false;
      break;
    }
    lastLevel = level;
  }
  const hasH1 = headings.some(h => h.tagName === 'H1');
  
  checks.push({
    title: 'Heading Order (1.3.1)',
    passed: headingOrderValid && headings.length > 0 && hasH1,
    description: 'Headings should follow a logical nested order (e.g., h1 followed by h2) without skipping levels.',
    suggestion: !headings.length ? 'Add at least one <h1> heading.' : 
                !hasH1 ? 'Ensure the document starts with an <h1>.' :
                !headingOrderValid ? 'Fix skipped heading levels (e.g., don\'t jump from <h1> to <h3>).' : undefined
  });

  // Check 3: ARIA Landmarks (1.3.1)
  const hasLandmarks = doc.querySelector('article, section, main, nav, header, footer') !== null;
  checks.push({
    title: 'Landmarks (1.3.1)',
    passed: hasLandmarks,
    description: 'Content is organized within semantic landmarks like <article> or <section> for easier navigation.',
    suggestion: hasLandmarks ? undefined : 'Wrap main content in <article> or <section> tags.'
  });

  // Check 4: Color Contrast (1.4.3) - Simulation
  const hasInlineColors = html.includes('style="color:') || html.includes('style="background:');
  const hasLowContrastClasses = html.includes('text-slate-300') || html.includes('text-gray-300') || html.includes('text-zinc-300') || html.includes('text-slate-400');
  const contrastPassed = !hasInlineColors && !hasLowContrastClasses;
  
  checks.push({
    title: 'Contrast (1.4.3)',
    passed: contrastPassed,
    description: 'Text must have a contrast ratio of at least 4.5:1 against its background.',
    suggestion: !contrastPassed ? 'Avoid light gray text or inline color styles that might be hard to read.' : undefined
  });

  // Check 5: Keyboard Navigation (2.1.1)
  const interactive = Array.from(doc.querySelectorAll('a, button, details, [tabindex]'));
  const noTabindexMinusOne = interactive.every(el => el.getAttribute('tabindex') !== '-1');
  const allHaveLabels = interactive.every(el => {
    const text = el.textContent?.trim();
    const ariaLabel = el.getAttribute('aria-label');
    const title = el.getAttribute('title');
    return (text && text.length > 0) || (ariaLabel && ariaLabel.length > 0) || (title && title.length > 0);
  });
  
  checks.push({
    title: 'Keyboard (2.1.1)',
    passed: noTabindexMinusOne && allHaveLabels,
    description: 'All interactive elements must be reachable via keyboard and have descriptive labels.',
    suggestion: !noTabindexMinusOne ? 'Remove tabindex="-1" from interactive elements.' :
                !allHaveLabels ? 'Add text or aria-labels to all buttons and links.' : undefined
  });

  // Check 6: Screen Reader (4.1.2)
  const hasGroupRoles = doc.querySelectorAll('figure[role="group"]').length > 0;
  checks.push({
    title: 'Screen Reader (4.1.2)',
    passed: images.length === 0 || hasGroupRoles,
    description: 'Complex components like figures should use ARIA roles to describe their purpose.',
    suggestion: (images.length > 0 && !hasGroupRoles) ? 'Ensure figures are wrapped in <figure role="group">.' : undefined
  });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return { score, checks };
};
