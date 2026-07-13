# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Reference-preserving JSON (de)serialization for the code model.

The code model is a cyclic object graph with heavy structural sharing (the emitter
deduplicates types, and types reference each other, e.g. ``type.elementType``, and enums
reference their own values). Plain JSON cannot represent cycles or shared references, so
we use the same ``$id``/``$ref`` convention as the C# emitter and System.Text.Json's
``ReferenceHandler.Preserve``:

- The first time an object is seen it is written as ``{"$id": "N", ...properties}``.
- The first time an array is seen it is written as ``{"$id": "N", "$values": [...]}``.
- Any later reference to an already-seen object/array is written as ``{"$ref": "N"}``.

Because the ``$id`` is registered before recursing into a node's children, cycles are
encoded as a ``$ref`` back to an enclosing node. The reconstructed value has the same
shared identity and cycles as the original graph, so the rest of the generator is
unchanged. The format is interoperable with the JavaScript serializer used by the emitter.
"""

import json
import sys
from typing import Any

# The code model can be a deep graph; the default recursion limit (1000) is not enough.
_RECURSION_LIMIT = 100000


def loads(text: str) -> Any:
    """Parse a ``$id``/``$ref`` JSON string into a (possibly cyclic) Python object graph."""
    raw = json.loads(text)
    id_map: dict[str, Any] = {}
    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(max(old_limit, _RECURSION_LIMIT))
    try:
        return _rebuild(raw, id_map)
    finally:
        sys.setrecursionlimit(old_limit)


def _rebuild(node: Any, id_map: dict[str, Any]) -> Any:
    if isinstance(node, list):
        # Bare arrays only appear as the content of a "$values" wrapper, but handle
        # them defensively anyway.
        return [_rebuild(item, id_map) for item in node]
    if not isinstance(node, dict):
        return node
    ref = node.get("$ref")
    if ref is not None:
        return id_map[ref]
    node_id = node.get("$id")
    if "$values" in node:
        arr: list[Any] = []
        if node_id is not None:
            id_map[node_id] = arr  # register before recursing so cycles resolve
        for item in node["$values"]:
            arr.append(_rebuild(item, id_map))
        return arr
    obj: dict[str, Any] = {}
    if node_id is not None:
        id_map[node_id] = obj  # register before recursing so cycles resolve
    for key, value in node.items():
        if key == "$id":
            continue
        obj[key] = _rebuild(value, id_map)
    return obj


def dumps(value: Any) -> str:
    """Serialize a (possibly cyclic) Python object graph into a ``$id``/``$ref`` JSON string."""
    ids: dict[int, str] = {}
    counter = [0]
    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(max(old_limit, _RECURSION_LIMIT))
    try:
        return json.dumps(_encode(value, ids, counter))
    finally:
        sys.setrecursionlimit(old_limit)


def _encode(value: Any, ids: dict[int, str], counter: list) -> Any:
    # Scalars (including strings) are inlined. bool is a subclass of int, so it is covered.
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if not isinstance(value, (dict, list, tuple)):
        return value
    existing = ids.get(id(value))
    if existing is not None:
        return {"$ref": existing}
    counter[0] += 1
    node_id = str(counter[0])
    ids[id(value)] = node_id
    if isinstance(value, dict):
        result: dict[str, Any] = {"$id": node_id}
        for key, val in value.items():
            result[key] = _encode(val, ids, counter)
        return result
    return {"$id": node_id, "$values": [_encode(item, ids, counter) for item in value]}
