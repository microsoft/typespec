export function getLibraryName(id: string): string | undefined {
  const match = id.match(/docs\/libraries\/([^/]+)\//);
  return match ? match[1] : undefined;
}
