/**
 * Community content moderation (App Store guideline 1.2).
 *
 * Deliberately conservative: this is a first-pass filter that stops the obvious
 * slurs and sexual content from ever reaching the feed. It is not a substitute
 * for the report/block/admin-hide flow, which handles everything a word list
 * cannot (harassment, spam, context).
 */

/** A tip hidden automatically once this many distinct travellers report it. */
export const TIP_REPORT_HIDE_THRESHOLD = 3;

// Kept short and unambiguous — false positives silently block real travellers.
const BLOCKED_TERMS = [
  'anal', 'anus', 'arsehole', 'asshole', 'bastard', 'bitch', 'blowjob', 'bollocks',
  'boner', 'chink', 'clit', 'cock', 'coon', 'cum', 'cunt', 'dick', 'dildo', 'dyke',
  'fag', 'faggot', 'fuck', 'gook', 'handjob', 'jizz', 'kike', 'motherfucker', 'nigga',
  'nigger', 'paki', 'pedo', 'paedo', 'penis', 'porn', 'prick', 'pussy', 'rape',
  'retard', 'rimjob', 'shit', 'slut', 'spic', 'tits', 'twat', 'vagina', 'wank', 'whore',
];

// Undo common letter/number substitutions so "sh1t" still matches, then delete
// (rather than split on) any remaining punctuation so "f.u.c.k" collapses to
// "fuck". Word boundaries survive because whitespace is preserved.
function canonicalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z\s]/g, '');
}

/**
 * Inflections we treat as the same word ("fuck" -> "fucking", "shit" -> "shithole").
 *
 * Deliberately conservative. Bare prefix matching would catch these too, but it
 * also flags "analysis", "cocktail", "cumin" and — for a travel app, fatally —
 * "Pakistan". Matching stem + one of these endings, as a whole word, does not.
 * We accept that a few oddities ("shitting", "fuckin") slip past to the report
 * flow rather than censor real place names.
 */
const SUFFIXES = ['', 's', 'es', 'ed', 'ing', 'er', 'ers', 'ies', 'ty', 'head', 'face', 'hole'];

const BLOCKED_WORDS: ReadonlySet<string> = new Set(
  BLOCKED_TERMS.flatMap((term) => SUFFIXES.map((suffix) => term + suffix)),
);

/**
 * Returns the offending word, or null when the text is clean. Whole words only,
 * so "Scunthorpe", "Pakistan" and "analysis" are safe.
 */
export function findBlockedTerm(text: string): string | null {
  for (const word of canonicalize(text).split(/\s+/)) {
    if (word && BLOCKED_WORDS.has(word)) return word;
  }
  return null;
}

export function isClean(text: string): boolean {
  return findBlockedTerm(text) === null;
}
