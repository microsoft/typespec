# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import geojson
import pytest
from specs.azure.clientgenerator.core.alternatetype import AlternateTypeClient, models

FEATURE = geojson.Feature(
    geometry=geojson.Point((-122.25, 37.87)),
    properties={
        "name": "A single point of interest",
        "category": "landmark",
        "elevation": 100,
    },
    id="feature-1",
)


@pytest.fixture
def client():
    with AlternateTypeClient() as client:
        yield client


def test_get_model(client: AlternateTypeClient):
    result = client.external_type.get_model()
    assert result == FEATURE


def test_put_model(client: AlternateTypeClient):
    client.external_type.put_model(FEATURE)


def test_get_property(client: AlternateTypeClient):
    result = client.external_type.get_property()
    assert result == models.ModelWithFeatureProperty(
        feature=FEATURE,
        additional_property="extra",
    )


def test_put_property(client: AlternateTypeClient):
    client.external_type.put_property(
        models.ModelWithFeatureProperty(
            feature=FEATURE,
            additional_property="extra",
        )
    )
