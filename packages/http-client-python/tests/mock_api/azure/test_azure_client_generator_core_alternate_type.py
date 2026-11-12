# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import geojson
from specs.azure.clientgenerator.core.alternatetype import AlternateTypeClient
from specs.azure.clientgenerator.core.alternatetype import models

# Shared test data
PROPERTIES = {"name": "A single point of interest", "category": "landmark", "elevation": 100}

GEOMETRY = geojson.Point((-122.25, 37.87))

FEATURE_ID = "feature-1"


@pytest.fixture
def client():
    with AlternateTypeClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.fixture
def feature_geojson():
    """Shared GeoJSON Feature for tests."""
    return geojson.Feature(type="Feature", geometry=GEOMETRY, properties=PROPERTIES, id=FEATURE_ID)


def test_external_type_get_model(client: AlternateTypeClient):
    """Test getting a Feature object with geometry, properties, and optional id fields."""
    result = client.external_type.get_model()

    # Validate the response structure based on the TypeSpec example
    assert result.type == "Feature"
    assert result.geometry.type == "Point"
    assert result.geometry.coordinates == [-122.25, 37.87]
    assert result.properties == PROPERTIES
    assert result.id == FEATURE_ID


def test_external_type_put_model(client: AlternateTypeClient, feature_geojson):
    """Test putting a Feature object in request body."""
    # Should return None (204/empty response)
    result = client.external_type.put_model(body=feature_geojson)
    assert result is None


def test_external_type_get_property(client: AlternateTypeClient):
    """Test getting a ModelWithFeatureProperty object with feature and additionalProperty fields."""
    result = client.external_type.get_property()

    # Validate the response structure based on the TypeSpec example
    assert result.feature.type == "Feature"
    assert result.feature.geometry.type == "Point"
    assert result.feature.geometry.coordinates == [-122.25, 37.87]
    assert result.feature.properties == PROPERTIES
    assert result.feature.id == FEATURE_ID
    assert result.additional_property == "extra"


def test_external_type_put_property(client: AlternateTypeClient, feature_geojson):
    """Test putting a ModelWithFeatureProperty object in request body."""
    model_with_feature = models.ModelWithFeatureProperty(feature=feature_geojson, additional_property="extra")

    # Should return None (204/empty response)
    result = client.external_type.put_property(body=model_with_feature)
    assert result is None
