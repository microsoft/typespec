# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.enum.extensible import ExtensibleClient, models


@pytest.fixture
def client():
    with ExtensibleClient() as client:
        yield client


def test_known_value(client):
    assert client.string.get_known_value() == models.DaysOfWeekExtensibleEnum.MONDAY
    client.string.put_known_value(models.DaysOfWeekExtensibleEnum.MONDAY)


def test_unknown_value(client):
    assert client.string.get_unknown_value() == "Weekend"
    client.string.put_unknown_value("Weekend")
