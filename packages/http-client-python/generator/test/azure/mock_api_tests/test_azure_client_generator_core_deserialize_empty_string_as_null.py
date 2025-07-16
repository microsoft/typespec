# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.emptystring import DeserializeEmptyStringAsNullClient
from specs.azure.clientgenerator.core.emptystring import models


@pytest.fixture
def client():
    with DeserializeEmptyStringAsNullClient() as client:
        yield client


def test_get(client: DeserializeEmptyStringAsNullClient):
    result = client.get()
    assert result == models.ResponseModel(sample_url="")
