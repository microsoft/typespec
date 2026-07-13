# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
"""Concurrency regression tests for ``Model`` lazy metadata initialization.

Regression coverage for https://github.com/microsoft/typespec/issues/11234
(upstream Azure/azure-sdk-for-python#47426).

``Model.__new__`` lazily computes each class's ``_attr_to_rest_field`` metadata on
first construction. The original implementation iterated a live class ``__dict__``
while another thread published its own metadata into that same ``__dict__``, raising
``RuntimeError: dictionary changed size during iteration``. That error was then
swallowed by ``_deserialize_default``, so concurrent first-time deserialization
silently returned raw ``dict`` objects (or models with raw-dict nested fields)
instead of fully deserialized models.

Each trial below defines *fresh* model classes, so their lazy metadata is
uninitialized - exactly like the first response of a freshly started process - then
deserializes the same payload from many threads at once.
"""
import copy
import sys
import threading
from typing import List, Optional

import pytest

from specialwords._utils.model_base import Model, rest_field, _deserialize


N_THREADS = 32
N_TRIALS = 20


def _run_concurrent_deserialization(model_cls, payload, verify):
    """Deserialize ``payload`` into ``model_cls`` from N_THREADS threads simultaneously.

    Returns the list of per-thread corruption descriptions (empty when all results
    are fully deserialized).
    """
    results = [None] * N_THREADS
    barrier = threading.Barrier(N_THREADS)

    def work(i):
        # Independent input per thread, like real HTTP responses.
        local_payload = copy.deepcopy(payload)
        # Release all threads together to maximize contention on the first-time
        # lazy initialization in Model.__new__.
        barrier.wait()
        results[i] = _deserialize(model_cls, local_payload)

    threads = [threading.Thread(target=work, args=(i,)) for i in range(N_THREADS)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    corruptions = []
    for r in results:
        problem = verify(r)
        if problem is not None:
            corruptions.append(problem)
    return corruptions


def test_concurrent_first_deserialization_is_thread_safe():
    """First-time concurrent deserialization always returns fully deserialized models."""

    # Widen the race window (the original bug reproduces at the default interval too,
    # this just makes it deterministic). Restored in the finally block.
    old_switch_interval = sys.getswitchinterval()
    sys.setswitchinterval(1e-6)
    try:
        for trial in range(N_TRIALS):
            # Fresh classes each trial => uninitialized lazy metadata, like a new process.
            class Inner(Model):
                name: str = rest_field()
                value: int = rest_field()

            class Outer(Model):
                inner: Inner = rest_field()
                items: List[Inner] = rest_field()
                maybe: Optional[Inner] = rest_field()

            payload = {
                "inner": {"name": "a", "value": 1},
                "items": [{"name": "b", "value": 2}, {"name": "c", "value": 3}],
                "maybe": {"name": "d", "value": 4},
            }

            def verify(result):
                if not isinstance(result, Outer):
                    return f"got {type(result).__name__} instead of Outer"
                try:
                    if not isinstance(result.inner, Inner):
                        return f"inner is {type(result.inner).__name__}, not Inner"
                    if (result.inner.name, result.inner.value) != ("a", 1):
                        return f"inner has wrong values: {result.inner}"
                    if not all(isinstance(it, Inner) for it in result.items):
                        return "items contains a raw dict instead of Inner"
                    if [it.name for it in result.items] != ["b", "c"]:
                        return f"items has wrong values: {result.items}"
                    if not isinstance(result.maybe, Inner):
                        return f"maybe is {type(result.maybe).__name__}, not Inner"
                except AttributeError as exc:  # nested field is a raw dict
                    return f"partially deserialized model: {exc}"
                return None

            corruptions = _run_concurrent_deserialization(Outer, payload, verify)
            assert not corruptions, (
                f"trial {trial}: {len(corruptions)}/{N_THREADS} results corrupted, "
                f"e.g. {corruptions[0]}"
            )
    finally:
        sys.setswitchinterval(old_switch_interval)
