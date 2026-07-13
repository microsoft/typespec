// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Serialize the code model to a JSON string using reference preservation.
 *
 * The code model is a cyclic object graph with heavy structural sharing (types are
 * deduplicated and reference each other, e.g. `type.elementType`, and enums reference
 * their own values). Plain JSON cannot represent cycles or shared references, so we use
 * the same `$id`/`$ref` convention as the C# emitter and System.Text.Json's
 * `ReferenceHandler.Preserve`:
 *
 * - The first time an object is seen it is written as `{ "$id": "N", ...properties }`.
 * - The first time an array is seen it is written as `{ "$id": "N", "$values": [...] }`.
 * - Any later reference to an already-seen object or array is written as `{ "$ref": "N" }`.
 *
 * Because the `$id` is assigned before recursing into an object's children, cycles are
 * encoded as a `$ref` back to the enclosing object. The Python generator reads this back
 * with a matching decoder, reconstructing an object graph with the same shared identity
 * and cycles.
 *
 * @param root The code model to serialize.
 * @returns The serialized JSON string.
 */
export function serializeCodeModel(root: unknown): string {
  const ids = new Map<object, string>();
  let counter = 0;

  function encode(value: unknown): unknown {
    if (value === null || typeof value !== "object") {
      return value;
    }
    const obj = value as object;
    const existing = ids.get(obj);
    if (existing !== undefined) {
      return { $ref: existing };
    }
    const id = (++counter).toString();
    ids.set(obj, id);
    if (Array.isArray(obj)) {
      return { $id: id, $values: obj.map(encode) };
    }
    const result: Record<string, unknown> = { $id: id };
    for (const key of Object.keys(obj)) {
      result[key] = encode((obj as Record<string, unknown>)[key]);
    }
    return result;
  }

  return JSON.stringify(encode(root));
}
