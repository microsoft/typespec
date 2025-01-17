# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from type.enum.fixed import FixedClient, models
from corehttp.exceptions import HttpResponseError


@pytest.fixture
def client():
    with FixedClient() as client:
        yield client


def test_known_value(client):
    assert client.string.get_known_value() == models.DaysOfWeekEnum.MONDAY
    client.string.put_known_value(models.DaysOfWeekEnum.MONDAY)


def test_unknown_value(client: FixedClient):
    try:
        client.string.put_unknown_value("Weekend")
    except HttpResponseError as err:
        assert err.status_code == 500
