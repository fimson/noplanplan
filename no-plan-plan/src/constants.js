export const guideTopics = {
  'history': { title: 'History Overview', emoji: '📜' },
  'religion-culture': { title: 'Religion & Culture', emoji: '🧘‍♀️' },
  'modern-japan': { title: 'Modern Life', emoji: '💸' },
  'etiquette': { title: 'Etiquette & Behavior', emoji: '🍣' },
  'fun-facts': { title: 'Fun Facts & Family Pre-Reading', emoji: '🧠' },
  'food': { title: 'Cuisine', emoji: '🍱' },
  'dictionary': { title: 'Dictionary', emoji: '📖' }
};

export const slugify = (raw) => {
  if (!raw) return '';
  // Handle potential React elements passed directly (e.g., from headings)
  const toPlainText = (node) => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(toPlainText).join('');
    if (typeof node === 'object' && node.props && node.props.children) {
        // Recursively process children if it's a React element
        return toPlainText(node.props.children);
    }
    return ''; // ignore other types
  };
  const text = toPlainText(raw);

  return text
    .toLocaleLowerCase()
    // First replace any whitespace sequence with single hyphen
    .replace(/\s+/g, '-')
    // Remove everything except letters (any script), numbers and hyphens
    // Added underscore to allow it in slugs
    .replace(/[^\p{L}\p{N}_-]+/gu, '')
    // Trim trailing hyphens (keep leading ones to maintain anchor consistency)
    .replace(/-+$/g, '')
    // Replace multiple hyphens with a single one
    .replace(/-{2,}/g, '-');
}; 