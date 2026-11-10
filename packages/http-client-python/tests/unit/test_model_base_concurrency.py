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

The tests cover controlled parent/subclass initialization as well as concurrent
deserialization of fresh model classes.
"""

import copy
import sys
import threading
import uuid
from typing import List, Optional

import pytest

from specialwords._utils.model_base import Model, rest_field, rest_discriminator, _RestField, _deserialize

N_THREADS = 32
N_TRIALS = 20


def _give_unique_qualnames(*model_classes):
    # The original cache used module and qualname, so avoid testing a cache collision
    # instead of a race when creating fresh classes.
    suffix = uuid.uuid4().hex
    for model_class in model_classes:
        model_class.__qualname__ = f"{model_class.__qualname__}_{suffix}"


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


@pytest.mark.parametrize("deserialize", [False, True], ids=["constructor", "deserialize"])
def test_parent_and_child_first_initialization_does_not_invalidate_iteration(deserialize):
    """Publishing parent metadata cannot invalidate the child's field iteration."""
    child_scanning_parent = threading.Event()
    resume_child = threading.Event()
    parent_finished = threading.Event()
    results = []
    parent_results = []
    errors = []

    class PauseDuringScan:
        # Field discovery probes `_type`; pause the child, then report this is not a field.
        @property
        def _type(self):
            if threading.current_thread() is child_thread:
                child_scanning_parent.set()
                if not resume_child.wait(timeout=10):
                    raise TimeoutError("Parent initialization did not finish")
            raise AttributeError("_type")

    class Parent(Model):
        pause = PauseDuringScan()
        name: str = rest_field()

    class Child(Parent):
        extra: int = rest_field()

    _give_unique_qualnames(Parent, Child)

    def build_child():
        try:
            payload = {"name": "child", "extra": 42}
            results.append(_deserialize(Child, payload) if deserialize else Child(payload))
        except Exception as exc:
            errors.append(exc)

    def build_parent():
        try:
            parent_results.append(Parent({"name": "parent"}))
        except Exception as exc:
            errors.append(exc)
        finally:
            parent_finished.set()

    child_thread = threading.Thread(target=build_child, daemon=True)
    parent_thread = threading.Thread(target=build_parent, daemon=True)
    child_thread.start()
    try:
        assert child_scanning_parent.wait(timeout=10), "Child did not start scanning Parent"
        parent_thread.start()
        # A synchronized implementation may hold the parent until the child resumes.
        parent_finished.wait(timeout=5)
    finally:
        resume_child.set()
        child_thread.join(timeout=10)
        if parent_thread.ident is not None:
            parent_thread.join(timeout=10)

    assert not child_thread.is_alive(), "Child initialization did not finish"
    assert not parent_thread.is_alive(), "Parent initialization did not finish"
    if errors:
        raise errors[0]
    assert len(parent_results) == 1
    assert parent_results[0].name == "parent"
    assert len(results) == 1
    child = results[0]
    assert isinstance(child, Child)
    assert child.name == "child"
    assert child.extra == 42


def test_models_with_same_qualname_initialize_independently():
    def make_model():
        class Repeated(Model):
            value: int = rest_field()

        return Repeated

    first = make_model()
    second = make_model()
    assert first is not second
    assert first.__qualname__ == second.__qualname__
    assert first({"value": 1}).value == 1
    assert second({"value": 2}).value == 2


def test_discriminator_scan_does_not_fail_during_first_initialization():
    """Publishing model metadata cannot invalidate a discriminator scan."""
    discriminator_scanning = threading.Event()
    resume_discriminator_scan = threading.Event()
    parent_finished = threading.Event()
    discriminator_thread = None
    results = []
    parent_results = []
    errors = []

    class PausingField(_RestField):
        def __init__(self):
            super().__init__(name="probe", is_discriminator=False)

        @property
        def _is_discriminator(self):
            if threading.current_thread() is discriminator_thread:
                discriminator_scanning.set()
                if not resume_discriminator_scan.wait(timeout=10):
                    raise TimeoutError("Parent initialization did not finish")
            return self.__dict__["_is_discriminator"]

        @_is_discriminator.setter
        def _is_discriminator(self, value):
            self.__dict__["_is_discriminator"] = value

    class Animal(Model):
        __mapping__: dict[str, Model] = {}
        probe: str = PausingField()
        kind: str = rest_discriminator(name="kind")

    class Cat(Animal, discriminator="cat"):
        pass

    _give_unique_qualnames(Animal, Cat)

    def deserialize_animal():
        try:
            results.append(_deserialize(Animal, {"kind": "cat"}))
        except Exception as exc:
            errors.append(exc)

    def initialize_animal():
        try:
            parent_results.append(Animal({"kind": "cat"}))
        except Exception as exc:
            errors.append(exc)
        finally:
            parent_finished.set()

    discriminator_thread = threading.Thread(target=deserialize_animal, daemon=True)
    parent_thread = threading.Thread(target=initialize_animal, daemon=True)
    discriminator_thread.start()
    try:
        assert discriminator_scanning.wait(timeout=10), "Discriminator scan did not start"
        parent_thread.start()
        # A synchronized implementation may hold the initializer until the scan resumes.
        parent_finished.wait(timeout=5)
    finally:
        resume_discriminator_scan.set()
        discriminator_thread.join(timeout=10)
        if parent_thread.ident is not None:
            parent_thread.join(timeout=10)

    assert not discriminator_thread.is_alive(), "Discriminator scan did not finish"
    assert not parent_thread.is_alive(), "Parent initialization did not finish"
    if errors:
        raise errors[0]
    assert len(parent_results) == 1
    assert len(results) == 1
    assert isinstance(results[0], Cat)
    assert results[0].kind == "cat"


def test_concurrent_first_deserialization_is_thread_safe():
    """First-time concurrent deserialization always returns fully deserialized models."""

    # Increase contention and restore the process-wide interval afterwards.
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

            _give_unique_qualnames(Inner, Outer)

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
            if corruptions:
                pytest.fail(f"trial {trial}: {len(corruptions)}/{N_THREADS} results corrupted, e.g. {corruptions[0]}")
    finally:
        sys.setswitchinterval(old_switch_interval)
