import * as escapeRegExp from 'escape-string-regexp';

namespace Protocol {
  export const DELIMITER = ':';

  const escapedDelimiter = escapeRegExp(DELIMITER);
  export const END_DELIMITER_PATTERN = RegExp(`[${escapedDelimiter}]*$`);

  export function normalize(protocol: string) {
    return `${protocol.replace(END_DELIMITER_PATTERN, '')}${DELIMITER}`;
  }
}

export default Protocol;
