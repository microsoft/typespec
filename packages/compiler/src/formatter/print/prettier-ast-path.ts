// --------------------------------------------------
//  Unfortunately have to make our own `AstPath` as prettier types have issue with readonly Array.
// https://github.com/prettier/prettier/issues/15034
// --------------------------------------------------

// The type of elements that make up the given array T.
type ArrayElement<T> = T extends Array<infer E> ? E : never;

// Effectively performing T[P], except that it's telling TypeScript that it's
// safe to do this for tuples, arrays, or objects.
type IndexValue<T, P> = T extends readonly any[]
  ? P extends number
    ? T[P]
    : never
  : P extends keyof T
  ? T[P]
  : never;

// Determines if an object T is an array like string[] (in which case this
// evaluates to false) or a tuple like [string] (in which case this evaluates to
// true).
type IsTuple<T> = T extends []
  ? true
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends [infer First, ...infer Remain]
  ? IsTuple<Remain>
  : false;
// A union of the properties of the given object that are arrays.
type ArrayProperties<T> = {
  [K in keyof T]: NonNullable<T[K]> extends readonly any[] ? K : never;
}[keyof T];

// A union of the properties of the given array T that can be used to index it.
// If the array is a tuple, then that's going to be the explicit indices of the
// array, otherwise it's going to just be number.
type IndexProperties<T extends { length: number }> = IsTuple<T> extends true
  ? Exclude<Partial<T>["length"], T["length"]>
  : number;

type CallProperties<T> = T extends any[] ? IndexProperties<T> : keyof T;
export type IterProperties<T> = T extends any[] ? IndexProperties<T> : ArrayProperties<T>;

type CallCallback<T, U> = (path: AstPath<T>, index: number, value: any) => U;
type EachCallback<T> = (path: AstPath<ArrayElement<T>>, index: number, value: any) => void;
type MapCallback<T, U> = (path: AstPath<ArrayElement<T>>, index: number, value: any) => U;

// https://github.com/prettier/prettier/blob/next/src/common/ast-path.js
export interface AstPath<T = any> {
  get key(): string | null;
  get index(): number | null;
  get node(): T;
  get parent(): T | null;
  get grandparent(): T | null;
  get isInArray(): boolean;
  get siblings(): T[] | null;
  get next(): T | null;
  get previous(): T | null;
  get isFirst(): boolean;
  get isLast(): boolean;
  get isRoot(): boolean;
  get root(): T;
  get ancestors(): T[];

  stack: T[];

  callParent<U>(callback: (path: this) => U, count?: number): U;

  /**
   * @deprecated Please use `AstPath#key` or `AstPath#index`
   */
  getName(): PropertyKey | null;

  /**
   * @deprecated Please use `AstPath#node` or  `AstPath#siblings`
   */
  getValue(): T;

  getNode(count?: number): T | null;

  getParentNode(count?: number): T | null;

  match(
    ...predicates: Array<(node: any, name: string | null, number: number | null) => boolean>
  ): boolean;

  // For each of the tree walk functions (call, each, and map) this provides 5
  // strict type signatures, along with a fallback at the end if you end up
  // calling more than 5 properties deep. This helps a lot with typing because
  // for the majority of cases you're calling fewer than 5 properties, so the
  // tree walk functions have a clearer understanding of what you're doing.
  //
  // Note that resolving these types is somewhat complicated, and it wasn't
  // even supported until TypeScript 4.2 (before it would just say that the
  // type instantiation was excessively deep and possibly infinite).

  call<U>(callback: CallCallback<T, U>): U;
  call<U, P1 extends CallProperties<T>>(callback: CallCallback<IndexValue<T, P1>, U>, prop1: P1): U;

  each(callback: EachCallback<T>): void;
  each<P1 extends IterProperties<T>>(callback: EachCallback<IndexValue<T, P1>>, prop1: P1): void;

  map<U>(callback: MapCallback<T, U>): U[];
  map<U, P1 extends IterProperties<T>>(callback: MapCallback<IndexValue<T, P1>, U>, prop1: P1): U[];
}
