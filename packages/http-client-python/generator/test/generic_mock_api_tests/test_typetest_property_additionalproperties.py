# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.property.additionalproperties import AdditionalPropertiesClient, models


@pytest.fixture
def client():
    with AdditionalPropertiesClient() as client:
        yield client


def test_extends_different_spread_float(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadFloatDerived({"name": "abc", "prop": 43.125, "derivedProp": 43.125})
    assert client.extends_different_spread_float.get() == body
    client.extends_different_spread_float.put(body)


def test_extends_different_spread_model(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadModelDerived(
        {"knownProp": "abc", "prop": {"state": "ok"}, "derivedProp": {"state": "ok"}}
    )
    assert client.extends_different_spread_model.get() == body
    client.extends_different_spread_model.put(body)


def test_extends_different_spread_model_array(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadModelArrayDerived(
        {
            "knownProp": "abc",
            "prop": [{"state": "ok"}, {"state": "ok"}],
            "derivedProp": [{"state": "ok"}, {"state": "ok"}],
        }
    )
    assert client.extends_different_spread_model_array.get() == body
    client.extends_different_spread_model_array.put(body)


def test_extends_different_spread_string(client: AdditionalPropertiesClient):
    body = models.DifferentSpreadStringDerived({"id": 43.125, "prop": "abc", "derivedProp": "abc"})
    assert client.extends_different_spread_string.get() == body
    client.extends_different_spread_string.put(body)


def test_extends_float(client: AdditionalPropertiesClient):
    body = models.ExtendsFloatAdditionalProperties({"id": 43.125, "prop": 43.125})
    assert client.extends_float.get() == body
    client.extends_float.put(body)


def test_extends_model(client: AdditionalPropertiesClient):
    body = models.ExtendsModelAdditionalProperties({"knownProp": {"state": "ok"}, "prop": {"state": "ok"}})
    assert client.extends_model.get() == body
    client.extends_model.put(body)


def test_extends_model_array(client: AdditionalPropertiesClient):
    body = models.ExtendsModelArrayAdditionalProperties(
        {
            "knownProp": [{"state": "ok"}, {"state": "ok"}],
            "prop": [{"state": "ok"}, {"state": "ok"}],
        }
    )
    assert client.extends_model_array.get() == body
    client.extends_model_array.put(body)


def test_extends_string(client: AdditionalPropertiesClient):
    body = models.ExtendsStringAdditionalProperties({"name": "ExtendsStringAdditionalProperties", "prop": "abc"})
    assert client.extends_string.get() == body
    client.extends_string.put(body)


def test_extends_unknown(client: AdditionalPropertiesClient):
    body = models.ExtendsUnknownAdditionalProperties(
        {
            "name": "ExtendsUnknownAdditionalProperties",
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert client.extends_unknown.get() == body
    client.extends_unknown.put(body)


def test_extends_unknown_derived(client: AdditionalPropertiesClient):
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
    assert client.extends_unknown_derived.get() == body
    client.extends_unknown_derived.put(body)


def test_extends_unknown_discriminated(client: AdditionalPropertiesClient):
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
    assert client.extends_unknown_discriminated.get() == body
    client.extends_unknown_discriminated.put(body)


def test_is_float(client: AdditionalPropertiesClient):
    body = models.IsFloatAdditionalProperties({"id": 43.125, "prop": 43.125})
    assert client.is_float.get() == body
    client.is_float.put(body)


def test_is_model(client: AdditionalPropertiesClient):
    body = models.IsModelAdditionalProperties({"knownProp": {"state": "ok"}, "prop": {"state": "ok"}})
    assert client.is_model.get() == body
    client.is_model.put(body)


def test_is_model_array(client: AdditionalPropertiesClient):
    body = models.IsModelArrayAdditionalProperties(
        {
            "knownProp": [{"state": "ok"}, {"state": "ok"}],
            "prop": [{"state": "ok"}, {"state": "ok"}],
        }
    )
    assert client.is_model_array.get() == body
    client.is_model_array.put(body)


def test_is_string(client: AdditionalPropertiesClient):
    body = models.IsStringAdditionalProperties({"name": "IsStringAdditionalProperties", "prop": "abc"})
    assert client.is_string.get() == body
    client.is_string.put(body)


def test_is_unknown(client: AdditionalPropertiesClient):
    body = models.IsUnknownAdditionalProperties(
        {
            "name": "IsUnknownAdditionalProperties",
            "prop1": 32,
            "prop2": True,
            "prop3": "abc",
        }
    )
    assert client.is_unknown.get() == body
    client.is_unknown.put(body)


def test_is_unknown_derived(client: AdditionalPropertiesClient):
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
    assert client.is_unknown_derived.get() == body
    client.is_unknown_derived.put(body)


def test_is_unknown_discriminated(client: AdditionalPropertiesClient):
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
    assert client.is_unknown_discriminated.get() == body
    client.is_unknown_discriminated.put(body)


def test_multiple_spread(client: AdditionalPropertiesClient):
    body = {"flag": True, "prop1": "abc", "prop2": 43.125}
    assert client.multiple_spread.get() == body
    client.multiple_spread.put(body)


def test_spread_different_float(client: AdditionalPropertiesClient):
    body = {"name": "abc", "prop": 43.125}
    assert client.spread_different_float.get() == body
    client.spread_different_float.put(body)


def test_spread_different_model(client: AdditionalPropertiesClient):
    body = {"knownProp": "abc", "prop": {"state": "ok"}}
    assert client.spread_different_model.get() == body
    client.spread_different_model.put(body)


def test_spread_different_model_array(client: AdditionalPropertiesClient):
    body = {"knownProp": "abc", "prop": [{"state": "ok"}, {"state": "ok"}]}
    assert client.spread_different_model_array.get() == body
    client.spread_different_model_array.put(body)


def test_spread_different_string(client: AdditionalPropertiesClient):
    body = {"id": 43.125, "prop": "abc"}
    assert client.spread_different_string.get() == body
    client.spread_different_string.put(body)


def test_spread_model(client: AdditionalPropertiesClient):
    body = {"knownProp": {"state": "ok"}, "prop": {"state": "ok"}}
    assert client.spread_model.get() == body
    client.spread_model.put(body)


def test_spread_model_array(client: AdditionalPropertiesClient):
    body = {
        "knownProp": [{"state": "ok"}, {"state": "ok"}],
        "prop": [{"state": "ok"}, {"state": "ok"}],
    }
    assert client.spread_model_array.get() == body
    client.spread_model_array.put(body)


def test_spread_record_discriminated_union(client: AdditionalPropertiesClient):
    body = {
        "name": "abc",
        "prop1": {"fooProp": "abc", "kind": "kind0"},
        "prop2": {
            "end": "2021-01-02T00:00:00Z",
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
        },
    }
    assert client.spread_record_discriminated_union.get() == body
    client.spread_record_discriminated_union.put(body)


def test_spread_record_non_discriminated_union(client: AdditionalPropertiesClient):
    body = {
        "name": "abc",
        "prop1": {"kind": "kind0", "fooProp": "abc"},
        "prop2": {
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
            "end": "2021-01-02T00:00:00Z",
        },
    }
    assert client.spread_record_non_discriminated_union.get() == body
    client.spread_record_non_discriminated_union.put(body)


def test_spread_record_non_discriminated_union2(client: AdditionalPropertiesClient):
    body = {
        "name": "abc",
        "prop1": {"kind": "kind1", "start": "2021-01-01T00:00:00Z"},
        "prop2": {
            "kind": "kind1",
            "start": "2021-01-01T00:00:00Z",
            "end": "2021-01-02T00:00:00Z",
        },
    }
    assert client.spread_record_non_discriminated_union2.get() == body
    client.spread_record_non_discriminated_union2.put(body)


def test_spread_record_non_discriminated_union3(client: AdditionalPropertiesClient):
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
    assert client.spread_record_non_discriminated_union3.get() == body
    client.spread_record_non_discriminated_union3.put(body)


def test_spread_record_union(client: AdditionalPropertiesClient):
    body = {"flag": True, "prop1": "abc", "prop2": 43.125}
    assert client.spread_record_union.get() == body
    client.spread_record_union.put(body)


def test_spread_string(client: AdditionalPropertiesClient):
    body = {"name": "SpreadSpringRecord", "prop": "abc"}
    assert client.spread_string.get() == body
    client.spread_string.put(body)


def test_spread_float(client: AdditionalPropertiesClient):
    body = {"id": 43.125, "prop": 43.125}
    assert client.spread_float.get() == body
    client.spread_float.put(body)
