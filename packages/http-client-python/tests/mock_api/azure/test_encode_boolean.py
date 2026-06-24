# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from encode.boolean import BooleanClient, models


@pytest.fixture
def client():
    with BooleanClient() as client:
        yield client


def test_property_true_lower(client: BooleanClient):
    result = client.property.true_lower(models.BoolAsStringProperty(value=True))
    assert result.value == True
    assert result["value"] == "true"


def test_property_false_lower(client: BooleanClient):
    result = client.property.false_lower(models.BoolAsStringProperty(value=False))
    assert result.value == False
    assert result["value"] == "false"


def test_property_true_upper(client: BooleanClient):
    result = client.property.true_upper(models.BoolAsStringProperty(value=True))
    assert result.value == True
    assert result["value"] == "TRUE"


def test_property_false_mixed(client: BooleanClient):
    result = client.property.false_mixed(models.BoolAsStringProperty(value=False))
    assert result.value == False
    assert result["value"] == "FaLsE"
