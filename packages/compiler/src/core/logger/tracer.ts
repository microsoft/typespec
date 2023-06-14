import { Logger, Tracer, TracerOptions } from "../types.js";

export function createTracer(logger: Logger, tracerOptions: TracerOptions = {}): Tracer {
  const filters = tracerOptions.filter ? createFilterTree(tracerOptions.filter) : undefined;
  function shouldTrace(area: string) {
    if (!filters) {
      return false;
    }
    return filters.match(area);
  }

  function log(area: string, message: string) {
    if (shouldTrace(area)) {
      logger.log({
        level: "trace",
        code: area,
        message,
      });
    }
  }

  return createTracerInternal(log);
}

interface Tree {
  all: boolean;
  children: Record<string, Tree>;
}

interface AreaFilter {
  match(area: string): boolean;
}
function createFilterTree(filters: string[]): AreaFilter {
  const tree: Tree = {
    all: false,
    children: {},
  };
  for (const filter of filters) {
    if (tree.all) {
      break;
    }
    let current = tree;
    const segments = filter.split(".");

    for (const segment of segments) {
      if (current.all) {
        break;
      }
      if (segment === "*") {
        current.all = true;
        break;
      }
      current.children[segment] = {
        all: false,
        children: {},
      };
      current = current.children[segment];
    }
    current.all = true;
  }

  return { match };

  function match(area: string): boolean {
    if (tree.all) {
      return true;
    }
    const segments = area.split(".");
    let current = tree;
    for (const segment of segments) {
      if (current.all) {
        return true;
      }
      if (!current.children[segment]) {
        return false;
      }
      current = current.children[segment];
    }
    return true;
  }
}

function createTracerInternal(log: (area: string, message: string) => void) {
  return {
    trace,
    sub,
  };

  function trace(area: string, message: string) {
    log(area, message);
  }

  function sub(subArea: string) {
    return createTracerInternal((area, message) => {
      log(joinAreas(subArea, area), message);
    });
  }
}

function joinAreas(a: string | undefined, b: string | undefined): string {
  if (a) {
    if (b) {
      return `${a}.${b}`;
    }
    return a;
  } else {
    return b ?? "";
  }
}
