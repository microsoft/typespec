export interface EmitterFilter {
  includedEmitters: string[];
  excludedEmitters: string[];
  isScoped: boolean;
}

export interface ScopedValue<T> {
  emitterFilter: EmitterFilter;
  value: T;
}

export function parseScopeFilter(string: string | undefined): EmitterFilter {
  if (!string) {
    return {
      excludedEmitters: [],
      includedEmitters: [],
      isScoped: false,
    };
  }

  const parts = string.split(",");
  const includedEmitters: string[] = [];
  const excludedEmitters: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith("!")) {
      excludedEmitters.push(trimmed.substring(1));
    } else {
      includedEmitters.push(trimmed);
    }
  }

  return {
    excludedEmitters,
    includedEmitters,
    isScoped: true,
  };
}
