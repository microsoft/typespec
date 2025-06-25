# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.encode.duration import DurationClient
from specs.azure.encode.duration import models


@pytest.fixture
def client():
    with DurationClient() as client:
        yield client


def test_duration_constant(client: DurationClient):
    client.duration_constant(models.DurationModel(input="1.02:59:59.5000000"))
