export interface TodoContext {
  endpoint: string;
}
export interface TodoOptions {
  endpoint?: string;
}
export function createTodoContext(endpoint: string, options?: TodoOptions): TodoContext {
  return {
    endpoint,
  };
}
