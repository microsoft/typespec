# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import geojson
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.alternatetype import aio, models

FEATURE = geojson.Feature(
    geometry=geojson.Point((-122.25, 37.87)),
    properties={
        "name": "A single point of interest",
        "category": "landmark",
        "elevation": 100,
    },
    id="feature-1",
)


@pytest_asyncio.fixture
async def client():
    async with aio.AlternateTypeClient() as client:
        yield client


@pytest.mark.asyncio
async def test_get_model(client: aio.AlternateTypeClient):
    result = await client.external_type.get_model()
    assert result == FEATURE


@pytest.mark.asyncio
async def test_put_model(client: aio.AlternateTypeClient):
    await client.external_type.put_model(FEATURE)


@pytest.mark.asyncio
async def test_get_property(client: aio.AlternateTypeClient):
    result = await client.external_type.get_property()
    assert result == models.ModelWithFeatureProperty(
        feature=FEATURE,
        additional_property="extra",
    )


@pytest.mark.asyncio
async def test_put_property(client: aio.AlternateTypeClient):
    await client.external_type.put_property(
        models.ModelWithFeatureProperty(
            feature=FEATURE,
            additional_property="extra",
        )
    )
