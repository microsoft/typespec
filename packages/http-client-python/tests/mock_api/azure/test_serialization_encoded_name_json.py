# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from serialization.encodedname.json import JsonClient, models


@pytest.fixture
def client():
    with JsonClient() as client:
        yield client


def test_property_send(client: JsonClient):
    client.property.send(models.JsonEncodedNameModel(default_name=True))


def test_property_get(client: JsonClient):
    assert client.property.get().default_name
