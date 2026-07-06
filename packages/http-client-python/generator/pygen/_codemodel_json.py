# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Graph-preserving JSON (de)serialization for the code model.

The code model is a cyclic object graph with heavy structural sharing (the emitter
deduplicates types, and types reference each other, e.g. ``type.elementType``). Plain
JSON cannot represent cycles or shared references, so we use the ``flatted`` wire format
(https://github.com/WebReflection/flatted): a flat JSON array where every object, array
and string is stored once in its own slot and nested references are encoded as numeric
string indices into that array. Numbers, booleans and ``null`` are inlined.

The reconstructed value is structurally identical to what ``yaml.safe_load`` used to
return (same shared identity, same cycles), so the rest of the generator is unchanged.

The format is byte-compatible with the JavaScript ``flatted`` package used by the emitter.
"""

import json
import sys
from typing import Any

# The code model can be a deep graph; the default recursion limit (1000) is not enough.
_RECURSION_LIMIT = 100000


def loads(text: str) -> Any:
    """Parse a flatted JSON string into a (possibly cyclic) Python object graph."""
    slots = json.loads(text)
    cache: dict[int, Any] = {}
    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(max(old_limit, _RECURSION_LIMIT))
    try:
        return _resolve_slot(0, slots, cache)
    finally:
        sys.setrecursionlimit(old_limit)


def _resolve_slot(index: int, slots: list, cache: dict[int, Any]) -> Any:
    if index in cache:
        return cache[index]
    node = slots[index]
    if isinstance(node, dict):
        obj: dict[str, Any] = {}
        cache[index] = obj  # register before recursing so cycles resolve
        for key, value in node.items():
            obj[key] = _resolve_child(value, slots, cache)
        return obj
    if isinstance(node, list):
        arr: list[Any] = []
        cache[index] = arr  # register before recursing so cycles resolve
        for value in node:
            arr.append(_resolve_child(value, slots, cache))
        return arr
    # A real string / number / bool / null stored in its own slot.
    cache[index] = node
    return node


def _resolve_child(value: Any, slots: list, cache: dict[int, Any]) -> Any:
    # Inside a node, every string is an index reference; numbers/bools/null are inlined.
    if isinstance(value, str):
        return _resolve_slot(int(value), slots, cache)
    return value


def dumps(value: Any) -> str:
    """Serialize a (possibly cyclic) Python object graph into a flatted JSON string."""
    slots: list[Any] = []
    known_str: dict[str, int] = {}
    known_obj: dict[int, int] = {}
    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(max(old_limit, _RECURSION_LIMIT))
    try:
        _index_of(value, slots, known_str, known_obj)  # registers the root at slot 0
        output: list[str] = []
        i = 0
        while i < len(slots):
            node = slots[i]
            if isinstance(node, (dict, list)):
                output.append(json.dumps(_encode_node(node, slots, known_str, known_obj)))
            else:
                output.append(json.dumps(node))
            i += 1
        return "[" + ",".join(output) + "]"
    finally:
        sys.setrecursionlimit(old_limit)


def _index_of(value: Any, slots: list, known_str: dict, known_obj: dict) -> str:
    if isinstance(value, str):
        index = known_str.get(value)
        if index is None:
            index = len(slots)
            slots.append(value)
            known_str[value] = index
        return str(index)
    # dict or list: dedup by identity
    index = known_obj.get(id(value))
    if index is None:
        index = len(slots)
        slots.append(value)
        known_obj[id(value)] = index
    return str(index)


def _encode_node(node: Any, slots: list, known_str: dict, known_obj: dict) -> Any:
    if isinstance(node, dict):
        return {key: _encode_child(value, slots, known_str, known_obj) for key, value in node.items()}
    return [_encode_child(value, slots, known_str, known_obj) for value in node]


def _encode_child(value: Any, slots: list, known_str: dict, known_obj: dict) -> Any:
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        return _index_of(value, slots, known_str, known_obj)
    if isinstance(value, (dict, list)):
        return _index_of(value, slots, known_str, known_obj)
    return value
