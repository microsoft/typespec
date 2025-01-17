# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.property.additionalproperties import models
from typetest.property.additionalproperties.aio import AdditionalPropertiesClient


@pytest.fixture
async def client():
    async with AdditionalPropertiesClient() as client:
        yield client


@pytest.mark.asyncio
async def test_extends_different_spread_float(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadFloatDerived({"name": "abc", "prop": 43.125, "derivedProp": 43.125})
    assert await client.extends_different_spread_float.get() == body
    await client.extends_different_spread_float.put(body)


@pytest.mark.asyncio
async def test_extends_different_spread_model(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadModelDerived(
        {"knownProp": "abc", "prop": {"state": "ok"}, "derivedProp": {"state": "ok"}}
    )
    assert await client.extends_different_spread_model.get() == body
    await client.extends_different_spread_model.put(body)


@pytest.mark.asyncio
async def test_extends_different_spread_model_array(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadModelArrayDerived(
        {
            "knownProp": "abc",
            "prop": [{"state": "ok"}, {"state": "ok"}],
            "derivedProp": [{"state": "ok"}, {"state": "ok"}],
        }
    )
    assert await client.extends_different_spread_model_array.get() == body
    await client.extends_different_spread_model_array.put(body)


@pytest.mark.asyncio
async def test_extends_different_spread_string(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadStringDerived({"id": 43.125, "prop": "abc", "derivedProp": "abc"})
    assert await client.extends_different_spread_string.get() == body
    await client.extends_different_spread_string.put(body)


@pytest.mark.asyncio
async def test_extends_float(client: AdditionalPropertiesClient):
    body = models.ExtendsFloatAdditionalProperties({"id": 43.125, "prop": 43.125})
    assert await client.extends_float.get() == body
    await client.extends_float.put(body)


@pytest.mark.asyncio
async def test_extends_model(client: AdditionalPropertiesClient):
    body = models.ExtendsModelAdditionalProperties({"knownProp": {"state": "ok"}, "prop": {"state": "ok"}})
    assert await client.extends_model.get() == body
    await client.extends_model.put(body)


@pytest.mark.asyncio
async def test_extends_model_array(client: AdditionalPropertiesClient):
    body = models.ExtendsModelArrayAdditionalProperties(
        {
            "knownProp": [{"state": "ok"}, {"state": "ok"}],
            "prop": [{"state": "ok"}, {"state": "ok"}],
        }
    )
    assert await client.extends_model_array.get() == body
    await client.extends_model_array.put(body)


@pytest.mark.asyncio
async def test_extends_string(client: AdditionalPropertiesClient):
    body = models.ExtendsStringAdditionalProperties({"name": "ExtendsStringAdditionalProperties", "prop": "abc"})
    assert await client.extends_string.get() == body
    await client.extends_string.put(body)


@pytest.mark.asyncio
async def test_extends_unknown(client: AdditionalPropertiesClient):
    body = models.ExtendsUnknownAdditionalProperties(
        {
            "name": "ExtendsUnknownAdditionalProperties",
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert await client.extends_unknown.get() == body
    await client.extends_unknown.put(body)


@pytest.mark.asyncio
async def test_extends_unknown_derived(client: AdditionalPropertiesClient):
    body = models.ExtendsUnknownAdditionalPropertiesDerived(
        {
            "name": "ExtendsUnknownAdditionalProperties",
            "index": 314,
            "age": 2.71875,
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert await client.extends_unknown_derived.get() == body
    await client.extends_unknown_derived.put(body)


@pytest.mark.asyncio
async def test_extends_unknown_discriminated(client: AdditionalPropertiesClient):
    body = models.ExtendsUnknownAdditionalPropertiesDiscriminatedDerived(
        {
            "kind": "derived",
            "name": "Derived",
            "index": 314,
            "age": 2.71875,
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert await client.extends_unknown_discriminated.get() == body
    await client.extends_unknown_discriminated.put(body)


@pytest.mark.asyncio
async def test_is_float(client: AdditionalPropertiesClient):
    body = models.IsFloatAdditionalProperties({"id": 43.125, "prop": 43.125})
    assert await client.is_float.get() == body
    await client.is_float.put(body)


@pytest.mark.asyncio
async def test_is_model(client: AdditionalPropertiesClient):
    body = models.IsModelAdditionalProperties({"knownProp": {"state": "ok"}, "prop": {"state": "ok"}})
    assert await client.is_model.get() == body
    await client.is_model.put(body)


@pytest.mark.asyncio
async def test_is_model_array(client: AdditionalPropertiesClient):
    body = models.IsModelArrayAdditionalProperties(
        {
            "knownProp": [{"state": "ok"}, {"state": "ok"}],
            "prop": [{"state": "ok"}, {"state": "ok"}],
        }
    )
    assert await client.is_model_array.get() == body
    await client.is_model_array.put(body)


@pytest.mark.asyncio
async def test_is_string(client: AdditionalPropertiesClient):
    body = models.IsStringAdditionalProperties({"name": "IsStringAdditionalProperties", "prop": "abc"})
    assert await client.is_string.get() == body
    await client.is_string.put(body)


@pytest.mark.asyncio
async def test_is_unknown(client: AdditionalPropertiesClient):
    body = models.IsUnknownAdditionalProperties(
        {
            "name": "IsUnknownAdditionalProperties",
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert await client.is_unknown.get() == body
    await client.is_unknown.put(body)


@pytest.mark.asyncio
async def test_is_unknown_derived(client: AdditionalPropertiesClient):
    body = models.IsUnknownAdditionalPropertiesDerived(
        {
            "name": "IsUnknownAdditionalProperties",
            "index": 314,
            "age": 2.71875,
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert await client.is_unknown_derived.get() == body
    await client.is_unknown_derived.put(body)


@pytest.mark.asyncio
async def test_is_unknown_discriminated(client: AdditionalPropertiesClient):
    body = models.IsUnknownAdditionalPropertiesDiscriminatedDerived(
        {
            "kind": "derived",
            "name": "Derived",
            "index": 314,
            "age": 2.71875,
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert await client.is_unknown_discriminated.get() == body
    await client.is_unknown_discriminated.put(body)


@pytest.mark.asyncio
async def test_multiple_spread(client: AdditionalPropertiesClient):
    body = {"flag": True, "prop1": "abc", "prop2": 43.125}
    assert await client.multiple_spread.get() == body
    await client.multiple_spread.put(body)


@pytest.mark.asyncio
async def test_spread_different_float(client: AdditionalPropertiesClient):
    body = {"name": "abc", "prop": 43.125}
    assert await client.spread_different_float.get() == body
    await client.spread_different_float.put(body)


@pytest.mark.asyncio
async def test_spread_different_model(client: AdditionalPropertiesClient):
    body = {"knownProp": "abc", "prop": {"state": "ok"}}
    assert await client.spread_different_model.get() == body
    await client.spread_different_model.put(body)


@pytest.mark.asyncio
async def test_spread_different_model_array(client: AdditionalPropertiesClient):
    body = {"knownProp": "abc", "prop": [{"state": "ok"}, {"state": "ok"}]}
    assert await client.spread_different_model_array.get() == body
    await client.spread_different_model_array.put(body)


@pytest.mark.asyncio
async def test_spread_different_string(client: AdditionalPropertiesClient):
    body = {"id": 43.125, "prop": "abc"}
    assert await client.spread_different_string.get() == body
    await client.spread_different_string.put(body)


@pytest.mark.asyncio
async def test_spread_model(client: AdditionalPropertiesClient):
    body = {"knownProp": {"state": "ok"}, "prop": {"state": "ok"}}
    assert await client.spread_model.get() == body
    await client.spread_model.put(body)


@pytest.mark.asyncio
async def test_spread_model_array(client: AdditionalPropertiesClient):
    body = {
        "knownProp": [{"state": "ok"}, {"state": "ok"}],
        "prop": [{"state": "ok"}, {"state": "ok"}],
    }
    assert await client.spread_model_array.get() == body
    await client.spread_model_array.put(body)


@pytest.mark.asyncio
async def test_spread_record_discriminated_union(client: AdditionalPropertiesClient):
    body = {
        "name": "abc",
        "prop1": {"fooProp": "abc", "kind": "kind0"},
        "prop2": {
            "end": "2021-01-02T00:00:00Z",
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
        },
    }
    assert await client.spread_record_discriminated_union.get() == body
    await client.spread_record_discriminated_union.put(body)


@pytest.mark.asyncio
async def test_spread_record_non_discriminated_union(
    client: AdditionalPropertiesClient,
):
    body = {
        "name": "abc",
        "prop1": {"kind": "kind0", "fooProp": "abc"},
        "prop2": {
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
            "end": "2021-01-02T00:00:00Z",
        },
    }
    assert await client.spread_record_non_discriminated_union.get() == body
    await client.spread_record_non_discriminated_union.put(body)


@pytest.mark.asyncio
async def test_spread_record_non_discriminated_union2(
    client: AdditionalPropertiesClient,
):
    body = {
        "name": "abc",
        "prop1": {"kind": "kind1", "start": "2021-01-01T00:00:00Z"},
        "prop2": {
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
            "end": "2021-01-02T00:00:00Z",
        },
    }
    assert await client.spread_record_non_discriminated_union2.get() == body
    await client.spread_record_non_discriminated_union2.put(body)


@pytest.mark.asyncio
async def test_spread_record_non_discriminated_union3(
    client: AdditionalPropertiesClient,
):
    body = {
        "name": "abc",
        "prop1": [
            {"kind": "kind1", "start": "2021-01-01T00:00:00Z"},
            {"kind": "kind1", "start": "2021-01-01T00:00:00Z"},
        ],
        "prop2": {
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
            "end": "2021-01-02T00:00:00Z",
        },
    }
    assert await client.spread_record_non_discriminated_union3.get() == body
    await client.spread_record_non_discriminated_union3.put(body)


@pytest.mark.asyncio
async def test_spread_record_union(client: AdditionalPropertiesClient):
    body = {"flag": True, "prop1": "abc", "prop2": 43.125}
    assert await client.spread_record_union.get() == body
    await client.spread_record_union.put(body)


@pytest.mark.asyncio
async def test_spread_string(client: AdditionalPropertiesClient):
    body = {"name": "SpreadSpringRecord", "prop": "abc"}
    assert await client.spread_string.get() == body
    await client.spread_string.put(body)


@pytest.mark.asyncio
async def test_spread_float(client: AdditionalPropertiesClient):
    body = {"id": 43.125, "prop": 43.125}
    assert await client.spread_float.get() == body
    await client.spread_float.put(body)
