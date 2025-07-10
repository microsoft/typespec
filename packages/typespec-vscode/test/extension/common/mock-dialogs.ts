import type { ElectronApplication } from "playwright";

export interface Dialog {
  showOpenDialog(...args: any[]): Promise<{
    filePaths: string[];
    canceled: boolean;
  }>;
}

export type DialogMethodStub<T extends keyof Dialog> = {
  method: T;
  value: Awaited<ReturnType<Dialog[T]>>;
};

export type DialogMethodStubPartial<T extends keyof Dialog> = {
  method: T;
  value: Partial<Awaited<ReturnType<Dialog[T]>>>;
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
    if (!methodDefault) return mock as DialogMethodStub<T>;
    if (typeof mock.value === "object") {
      mock.value = { ...methodDefault, ...mock.value };
    } else {
      mock.value = mock.value ?? methodDefault;
    }
    return mock as DialogMethodStub<T>;
  });

  // https://github.com/microsoft/playwright/issues/8278#issuecomment-1009957411
  return app.evaluate(({ dialog }, mocks) => {
    mocks.forEach((mock: DialogMethodStub<keyof Dialog>) => {
      const thisDialog = dialog[mock.method];
      if (!thisDialog) {
        throw new Error(`can't find ${mock.method as any} on dialog module.`);
      }
      if ((mock.method as any).endsWith("Sync")) {
        dialog[mock.method] = () => {
          return mock.value;
        };
      } else {
        dialog[mock.method] = async () => {
          return mock.value;
        };
      }
    });
  }, mocksRequired);
}

/**
 * Mock the `showOpenDialog`. Call this before something that will trigger the dialog.
 */
export function mockShowOpenDialog(app: ElectronApplication, filePaths: string[]) {
  return stubDialog(app, "showOpenDialog", {
    filePaths,
    canceled: false,
  });
}
