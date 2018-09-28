import * as escapeRegExp from 'escape-string-regexp';

namespace Path {
  export const DELIMITER = '/';

  const escapedDelimiter = escapeRegExp(DELIMITER);
  export const END_DELIMITER_PATTERN = RegExp(`[${escapedDelimiter}]*$`);
  export const START_DELIMITER_PATTERN = RegExp(`^[${escapedDelimiter}]*`);

  export function join(lhs: string, rhs: string) {
    const lhsPath = lhs.trim().replace(END_DELIMITER_PATTERN, '');
    const rhsPath = rhs.trim().replace(START_DELIMITER_PATTERN, '');

    return normalize(`${lhsPath}${lhsPath && rhsPath ? DELIMITER : ''}${rhsPath}`);
  }

  export function normalize(path: string) {
    return `${DELIMITER}${path.replace(START_DELIMITER_PATTERN, '').replace(END_DELIMITER_PATTERN, '')}`;
  }
}

export default Path;
