/**
 * Cleanup the raw content:
 *  - trim whitespaces
 *  - replace \r\n with \n
 * @param rawContent: raw content to clean.
 */
export const cleanupBody = (rawContent: string): string => rawContent.trim().replace(/\r?\n|\r/g, "\n");
