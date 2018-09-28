import * as escapeRegExp from 'escape-string-regexp';

namespace Hash {
  export const DELIMITER = '#';

  const escapedDelimiter = escapeRegExp(DELIMITER);
  export const START_DELIMITER_PATTERN = RegExp(`^[${escapedDelimiter}]*`);

  export function normalize(hash: string) {
    return `${DELIMITER}${hash.replace(START_DELIMITER_PATTERN, '')}`;
  }
}

export default Hash;
