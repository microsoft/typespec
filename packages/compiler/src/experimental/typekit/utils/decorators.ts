import { Type } from "../../../core/types.js";
import { $doc, getDoc } from "../../../lib/decorators.js";
import { Typekit } from "../define-kit.js";
import { decoratorApplication } from "../utils.js";

/**
 * Copy the doc from the source type to the target type.
 *
 * This function applies the result of `getDoc` to the target type as a decorator.
 *
 * @param source The source type.
 * @param target The target type.
 * @param tk The typekit.
 */
export function copyDoc(source: Type, target: Type, tk: Typekit): void {
  const doc = getDoc(tk.program, source);
  if (doc && "decorators" in target) {
    target.decorators.push(...decoratorApplication(tk, [$doc, () => doc]));
  }
}
