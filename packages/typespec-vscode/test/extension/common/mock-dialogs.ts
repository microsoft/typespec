import type { ElectronApplication } from "playwright";

export interface Dialog {
  showOpenDialog(...args: any[]): Promise<{
    filePaths: string[];
    canceled: boolean;
  }>;
}

/** Special marker to indicate a sequence of results where each call returns the next item */
const SEQUENCE_MARKER = "__sequence__" as const;

export interface DialogResultSequence<T> {
  [SEQUENCE_MARKER]: true;
  results: T[];
}

/** Create a sequence of results where each call returns the next item in the list */
export function sequence<T>(...results: T[]): DialogResultSequence<T> {
  return {
    [SEQUENCE_MARKER]: true,
    results,
  };
}

function isSequence<T>(value: unknown): value is DialogResultSequence<T> {
  return typeof value === "object" && value !== null && SEQUENCE_MARKER in value;
}

export type DialogMethodStub<T extends keyof Dialog> = {
  method: T;
  value: Awaited<ReturnType<Dialog[T]>>;
};

export type DialogMethodStubPartial<T extends keyof Dialog> = {
  method: T;
  value:
    | Partial<Awaited<ReturnType<Dialog[T]>>>
    | DialogResultSequence<Partial<Awaited<ReturnType<Dialog[T]>>>>;
};

type DialogMethodStubResolved<T extends keyof Dialog> = {
  method: T;
  value: Awaited<ReturnType<Dialog[T]>> | DialogResultSequence<Awaited<ReturnType<Dialog[T]>>>;
};

type DialogDefaults = {
  [K in keyof Dialog]: Awaited<ReturnType<Dialog[K]>>;
};

const dialogDefaults: DialogDefaults = {
  showOpenDialog: {
    filePaths: [],
    canceled: false,
  },
};

export function stubDialog<T extends keyof Dialog>(
  app: ElectronApplication,
  method: T,
  value?: Partial<Awaited<ReturnType<Dialog[T]>>>,
) {
  if (!value) value = dialogDefaults[method];
  return stubMultipleDialogs(app, [{ method, value }]);
}

export function stubMultipleDialogs<T extends keyof Dialog>(
  app: ElectronApplication,
  mocks: DialogMethodStubPartial<T>[],
) {
  const mocksRequired = mocks.map((mock) => {
    const methodDefault = dialogDefaults[mock.method];
    if (!methodDefault) return mock as DialogMethodStubResolved<T>;

    if (isSequence(mock.value)) {
      // Apply defaults to each result in the sequence
      const resolvedResults = mock.value.results.map((result) => {
        if (typeof result === "object") {
          return { ...methodDefault, ...result };
        }
        return result ?? methodDefault;
      });
      return {
        method: mock.method,
        value: { __sequence__: true, results: resolvedResults },
      } as DialogMethodStubResolved<T>;
    }

    if (typeof mock.value === "object") {
      mock.value = { ...methodDefault, ...mock.value };
    } else {
      mock.value = mock.value ?? methodDefault;
    }
    return mock as DialogMethodStubResolved<T>;
  });

  // https://github.com/microsoft/playwright/issues/8278#issuecomment-1009957411
  return app.evaluate(({ dialog, ...args }, mocks) => {
    mocks.forEach((mock) => {
      const thisDialog = dialog[mock.method];
      if (!thisDialog) {
        throw new Error(`can't find ${mock.method} on dialog module.`);
      }

      const isSeq = (v: unknown): v is { __sequence__: true; results: unknown[] } =>
        typeof v === "object" && v !== null && "__sequence__" in v;

      if (isSeq(mock.value)) {
        let callIndex = 0;
        const results = mock.value.results;
        if (mock.method.endsWith("Sync")) {
          dialog[mock.method] = () => {
            const result = results[Math.min(callIndex, results.length - 1)];
            callIndex++;

            return result;
          };
        } else {
          dialog[mock.method] = async () => {
            const result = results[Math.min(callIndex, results.length - 1)];
            return result;
          };
        }
      } else {
        if (mock.method.endsWith("Sync")) {
          dialog[mock.method] = () => {
            return mock.value;
          };
        } else {
          dialog[mock.method] = async () => {
            return mock.value;
          };
        }
      }
    });
  }, mocksRequired);
}

/**
 * Mock the `showOpenDialog`. Call this before something that will trigger the dialog.
 * @param filePaths - Either a single array of file paths, or a sequence of arrays for multiple calls
 */
export function mockShowOpenDialog(
  app: ElectronApplication,
  filePaths: string[] | DialogResultSequence<string[]>,
) {
  if (isSequence(filePaths)) {
    const sequenceValue = sequence(
      ...filePaths.results.map((r) => ({ filePaths: r, canceled: false })),
    );
    return stubMultipleDialogs(app, [{ method: "showOpenDialog", value: sequenceValue }]);
  }
  return stubDialog(app, "showOpenDialog", {
    filePaths,
    canceled: false,
  });
}
