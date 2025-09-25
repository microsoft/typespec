import { DiagnosticMessages, LinterRuleContext } from "@typespec/compiler";
import { ChatCompleteOptions, ChatMessage } from "@typespec/compiler/experimental";
import z, { AnyZodObject } from "zod";
import { md5 } from "../utils.js";
import { askLanguageModeWithRetry } from "./lm-utils.js";
import { LmResponseError, zLmResponseContent } from "./types.js";

const zKeyed = z.object({
  key: z
    .string()
    .describe(
      "Key to identify the data and used in the cache, should be unique globally in the topic",
    ),
});
type Keyed = z.infer<typeof zKeyed>;

/**
 * LmChecker is used to help checking data with language model aggregately.
 */
export class LmRuleChecker<
  dataT extends object,
  resultSchemaT extends AnyZodObject,
  P extends DiagnosticMessages,
> {
  private cache: LmRuleCheckerCache<z.infer<resultSchemaT> & Keyed>;
  private dataToCheck: (dataT & Keyed)[] = [];
  private deferredPromises: Map<string, DeferredPromise<z.infer<resultSchemaT> & Keyed>> =
    new Map();

  /**
   *
   * @param name for logging purpose only
   * @param messages
   * @param lmOptions
   * @param resultZodType
   * @param checkBatchSize
   */
  constructor(
    private name: string,
    public messages: ChatMessage[],
    private lmOptions: ChatCompleteOptions,
    private resultZodType: resultSchemaT,
    private checkBatchSize: number = 30,
  ) {
    this.cache = new LmRuleCheckerCache<z.infer<resultSchemaT> & Keyed>();
  }

  private getDataWithKey(data: dataT): dataT & Keyed {
    const json = JSON.stringify(data);
    // hash the string so that AI won't do strange things to the key field
    const hash = md5(json);
    return {
      ...data,
      key: hash,
    };
  }

  /**
   * Queues data for batch checking.
   *   - The actual check will be performed when checkAllData is called.
   *   - createRuleWithLm will help to call checkAllData if you are using it to create the linter rule.
   *
   * @param data The data to queue for checking
   * @returns A promise that resolves with the check result when batch processing completes
   */
  async queueDataToCheck(data: dataT): Promise<z.infer<resultSchemaT>> {
    const keyedData = this.getDataWithKey(data);
    const found = this.deferredPromises.get(keyedData.key);
    if (found) {
      return found.getPromise();
    } else {
      const deferred = new DeferredPromise<Keyed>();
      this.deferredPromises.set(keyedData.key, deferred);
      this.dataToCheck.push(keyedData);
      return deferred.getPromise();
    }
  }

  async checkAllData(context: LinterRuleContext<P>) {
    const data = this.dataToCheck;
    this.dataToCheck = [];

    const dataToLm = [];

    for (const d of data) {
      const cached = this.cache.get(d.key);
      if (cached) {
        this.resolveCheckData(d, cached);
      } else {
        dataToLm.push(d);
      }
    }
    console.log(
      `[ChatComplete(${this.name})] ${dataToLm.length} out of ${data.length} items need to be checked by LM.`,
    );
    if (dataToLm.length === 0) {
      return;
    }

    const s = Date.now();
    const promises = [];
    for (let i = 0; i < dataToLm.length; i += this.checkBatchSize) {
      const batch = dataToLm.slice(i, i + this.checkBatchSize);
      console.log(
        `[ChatComplete(${this.name})] Start processing batch ${i} to ${i + batch.length}`,
      );
      const p = this.checkDataInternal(batch, context, this.lmOptions, 3);
      const pp = p.then(() => {
        console.log(
          `[ChatComplete(${this.name})] Finished processing batch ${i} to ${i + batch.length}`,
        );
      });
      promises.push(pp);
      // TODO: more logic may be needed here to handle service throttling
    }
    await Promise.all(promises);
    const e = Date.now();
    console.log(
      `[ChatComplete(${this.name})] Finished processing all ${data.length} items in ${e - s} ms, cache size = ${this.cache.size()}.`,
    );
  }

  private async checkDataInternal(
    data: (dataT & Keyed)[],
    context: LinterRuleContext<P>,
    options: ChatCompleteOptions,
    retryCount: number,
  ) {
    if (data.length === 0) {
      return;
    }
    if (retryCount < 0) {
      // report error for the rest data
      for (const d of data) {
        this.rejectCheckData(d, {
          type: "error",
          error: `Failed to get response from LM. Please retry again later.`,
        });
      }
      return;
    }
    const keyedResultZodType = z.intersection(zKeyed, this.resultZodType);
    const zResponse = zLmResponseContent.extend(
      z.object({
        data: z.array(keyedResultZodType).describe("Array of the check result"),
      }).shape,
    );
    const messages: ChatMessage[] = [
      ...this.messages,
      {
        role: "user",
        message: `Following is the data to check as required, please respond data in json format that strictly matches the required response schema. *IMPORTANT* MAKE SURE the keys in the response match the keys in the request data EXACTLY so that the response can be associated with the request by comparing whether the key is strictly equal. Here is the data to check: ${JSON.stringify(data)}`,
      },
    ];
    console.debug(`[ChatComplete] ask LM to check ${data.length} items...`);
    const response = await askLanguageModeWithRetry(context, "", messages, options, zResponse);
    if (response.type === "error") {
      for (const d of data) {
        this.rejectCheckData(d, response);
      }
      return;
    }
    const responseData = response.data;
    for (const d of responseData) {
      this.cache.set(d.key, d);
    }
    const left: (dataT & Keyed)[] = [];
    for (const d of data) {
      const resolved = this.cache.get(d.key);
      if (resolved) {
        this.resolveCheckData(d, resolved);
      } else {
        left.push(d);
      }
    }
    if (left.length > 0) {
      console.debug(
        `[ChatComplete(${this.name})] ${left.length} out of ${data.length} items not resolved, retrying...`,
      );
      // some data are not resolved, maybe missed by AI try again
      await this.checkDataInternal(left, context, options, retryCount - 1);
    }
  }

  private resolveCheckData(data: dataT & Keyed, result: z.infer<resultSchemaT> & Keyed) {
    const deferred = this.deferredPromises.get(data.key);
    if (deferred) {
      deferred.resolvePromise(result);
      this.deferredPromises.delete(data.key);
    }
  }

  private rejectCheckData(data: dataT & Keyed, error: LmResponseError) {
    const deferred = this.deferredPromises.get(data.key);
    if (deferred) {
      deferred.rejectPromise(error);
      this.deferredPromises.delete(data.key);
    }
  }
}

class DeferredPromise<T> {
  private promise: Promise<T>;
  private resolve!: (value: T) => void;
  private reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((res, rej) => {
      this.resolve = res;
      this.reject = rej;
    });
  }

  getPromise(): Promise<T> {
    return this.promise;
  }

  resolvePromise(value: T) {
    this.resolve(value);
  }

  rejectPromise(reason?: any) {
    this.reject(reason);
  }
}

class LmRuleCheckerCache<resultT extends object> {
  private cache = new Map<string, resultT>();

  constructor() {}

  get(key: string): resultT | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: resultT) {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
