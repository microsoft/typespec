import "@typespec/efnext-cli-sketch";
using TypeSpecCLI;
/**
 * This is a **really** awesome Todo CLI tool. It makes
 * managing your todo items very easy.
 *
 * # Usage
 *
 * ```bash
 * todo-cli create --title "title" --description "desc"
 * todo-cli finish 42
 * ```
 */
@cli
interface TodoCLI {
  /** Create a todo item. */
  create(todoItem: TodoItem, @invertable color?: boolean): void;
  /** Finish a todo item. */
  finish(@positional id: int32): void;
}

model TodoItem {
  /** The todo item's title. */
  @short("t") title: string;

  /** The todo item's description. */
  @short("d") description: string;
}
