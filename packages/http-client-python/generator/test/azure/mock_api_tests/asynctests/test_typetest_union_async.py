# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.union.aio import UnionClient
from typetest.union import models


@pytest.fixture
async def client():
    async with UnionClient() as client:
        yield client


@pytest.mark.asyncio
async def test_enums_only(client: UnionClient):
    value = models.EnumsOnlyCases(lr="right", ud="up")
    assert (await client.enums_only.get()) == {"prop": value}
    await client.enums_only.send(prop=value)


@pytest.mark.asyncio
async def test_floats_only(client: UnionClient):
    value = 2.2
    assert (await client.floats_only.get()) == {"prop": value}
    await client.floats_only.send(prop=value)


@pytest.mark.asyncio
async def test_ints_only(client: UnionClient):
    value = 2
    assert (await client.ints_only.get()) == {"prop": value}
    await client.ints_only.send(prop=value)


@pytest.mark.asyncio
async def test_mixed_literals(client: UnionClient):
    value = models.MixedLiteralsCases(string_literal="a", int_literal=2, float_literal=3.3, boolean_literal=True)
    assert (await client.mixed_literals.get()) == {"prop": value}
    await client.mixed_literals.send(prop=value)


@pytest.mark.asyncio
async def test_mixed_types(client: UnionClient):
    value = models.MixedTypesCases(
        model=models.Cat(name="test"),
        literal="a",
        int_property=2,
        boolean=True,
        array=[models.Cat(name="test"), "a", 2, True],
    )
    assert (await client.mixed_types.get()) == {"prop": value}
    await client.mixed_types.send(prop=value)


@pytest.mark.asyncio
async def test_models_only(client: UnionClient):
    value = models.Cat(name="test")
    assert (await client.models_only.get()) == {"prop": value}
    await client.models_only.send(prop=value)


@pytest.mark.asyncio
async def test_string_and_array(client: UnionClient):
    value = models.StringAndArrayCases(string="test", array=["test1", "test2"])
    assert (await client.string_and_array.get()) == {"prop": value}
    await client.string_and_array.send(prop=value)


@pytest.mark.asyncio
async def test_string_extensible(client: UnionClient):
    value = "custom"
    assert (await client.string_extensible.get()) == {"prop": value}
    await client.string_extensible.send(prop=value)


@pytest.mark.asyncio
async def test_string_extensible_named(client: UnionClient):
    value = "custom"
    assert (await client.string_extensible_named.get()) == {"prop": value}
    await client.string_extensible_named.send(prop=value)


@pytest.mark.asyncio
async def test_strings_only(client: UnionClient):
    value = "b"
    assert (await client.strings_only.get()) == {"prop": value}
    await client.strings_only.send(prop=value)
