# cspell: ignore Hdvcmxk
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json
import pytest
from typetest.property.nullable import models
from typetest.property.nullable.aio import NullableClient
from typetest.property.nullable._model_base import (  # pylint: disable=protected-access
    SdkJSONEncoder,
)

try:
    from corehttp.serialization import NULL
except ImportError:
    from azure.core.serialization import NULL


@pytest.fixture
async def client():
    async with NullableClient() as client:
        yield client


@pytest.mark.asyncio
async def test_bytes(client: NullableClient):
    non_null_model = models.BytesProperty(required_property="foo", nullable_property="aGVsbG8sIHdvcmxkIQ==")
    non_model = models.BytesProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.bytes.get_non_null() == non_null_model
    assert (await client.bytes.get_null())["nullableProperty"] is None
    await client.bytes.patch_non_null(body=non_null_model)
    await client.bytes.patch_null(body=non_model)


@pytest.mark.asyncio
async def test_collections_byte(client: NullableClient):
    non_null_model = models.CollectionsByteProperty(
        required_property="foo",
        nullable_property=["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
    )
    non_model = models.CollectionsByteProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.collections_byte.get_non_null() == non_null_model
    assert (await client.collections_byte.get_null())["nullableProperty"] is None
    await client.collections_byte.patch_non_null(body=non_null_model)
    await client.collections_byte.patch_null(body=non_model)


@pytest.mark.asyncio
async def test_collections_model(client: NullableClient):
    non_null_model = models.CollectionsModelProperty(
        required_property="foo",
        nullable_property=[
            models.InnerModel(property="hello"),
            models.InnerModel(property="world"),
        ],
    )
    non_model = models.CollectionsModelProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.collections_model.get_non_null() == non_null_model
    assert (await client.collections_model.get_null())["nullableProperty"] is None
    await client.collections_model.patch_non_null(body=non_null_model)
    await client.collections_model.patch_null(body=non_model)


@pytest.mark.asyncio
async def test_collections_string(client: NullableClient):
    non_null_model = models.CollectionsStringProperty(required_property="foo", nullable_property=["hello", "world"])
    non_model = models.CollectionsStringProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.collections_string.get_non_null() == non_null_model
    assert (await client.collections_string.get_null())["nullableProperty"] is None
    await client.collections_string.patch_non_null(body=non_null_model)
    await client.collections_string.patch_null(body=non_model)


@pytest.mark.asyncio
async def test_datetime(client: NullableClient):
    non_null_model = models.DatetimeProperty(required_property="foo", nullable_property="2022-08-26T18:38:00Z")
    non_model = models.DatetimeProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.datetime.get_non_null() == non_null_model
    assert (await client.datetime.get_null())["nullableProperty"] is None
    await client.datetime.patch_non_null(body=non_null_model)
    await client.datetime.patch_null(body=non_model)


@pytest.mark.asyncio
async def test_duration(client: NullableClient):
    non_null_model = models.DurationProperty(required_property="foo", nullable_property="P123DT22H14M12.011S")
    non_model = models.DurationProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.duration.get_non_null() == non_null_model
    assert (await client.duration.get_null())["nullableProperty"] is None
    await client.duration.patch_non_null(body=non_null_model)
    await client.duration.patch_null(body=non_model)


@pytest.mark.asyncio
async def test_string(client: NullableClient):
    non_null_model = models.StringProperty(required_property="foo", nullable_property="hello")
    non_model = models.StringProperty(required_property="foo", nullable_property=NULL)
    assert '{"requiredProperty": "foo", "nullableProperty": null}' == json.dumps(non_model, cls=SdkJSONEncoder)
    assert await client.string.get_non_null() == non_null_model
    assert (await client.string.get_null())["nullableProperty"] is None
    await client.string.patch_non_null(body=non_null_model)
    await client.string.patch_null(body=non_model)
