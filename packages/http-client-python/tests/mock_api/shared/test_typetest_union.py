# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.union import UnionClient
from typetest.union import models


@pytest.fixture
def client():
    with UnionClient() as client:
        yield client


def test_enums_only(client: UnionClient):
    value = models.EnumsOnlyCases(lr="right", ud="up")
    assert client.enums_only.get() == {"prop": value}
    client.enums_only.send(prop=value)


def test_floats_only(client: UnionClient):
    value = 2.2
    assert client.floats_only.get() == {"prop": value}
    client.floats_only.send(prop=value)


def test_ints_only(client: UnionClient):
    value = 2
    assert client.ints_only.get() == {"prop": value}
    client.ints_only.send(prop=value)


def test_mixed_literals(client: UnionClient):
    value = models.MixedLiteralsCases(string_literal="a", int_literal=2, float_literal=3.3, boolean_literal=True)
    assert client.mixed_literals.get() == {"prop": value}
    client.mixed_literals.send(prop=value)


def test_mixed_types(client: UnionClient):
    value = models.MixedTypesCases(
        model=models.Cat(name="test"),
        literal="a",
        int_property=2,
        boolean=True,
        array=[models.Cat(name="test"), "a", 2, True],
    )
    assert client.mixed_types.get() == {"prop": value}
    client.mixed_types.send(prop=value)


def test_models_only(client: UnionClient):
    value = models.Cat(name="test")
    assert client.models_only.get() == {"prop": value}
    client.models_only.send(prop=value)


def test_string_and_array(client: UnionClient):
    value = models.StringAndArrayCases(string="test", array=["test1", "test2"])
    assert client.string_and_array.get() == {"prop": value}
    client.string_and_array.send(prop=value)


def test_string_extensible(client: UnionClient):
    value = "custom"
    assert client.string_extensible.get() == {"prop": value}
    client.string_extensible.send(prop=value)


def test_string_extensible_named(client: UnionClient):
    value = "custom"
    assert client.string_extensible_named.get() == {"prop": value}
    client.string_extensible_named.send(prop=value)


def test_strings_only(client: UnionClient):
    value = "b"
    assert client.strings_only.get() == {"prop": value}
    client.strings_only.send(prop=value)
