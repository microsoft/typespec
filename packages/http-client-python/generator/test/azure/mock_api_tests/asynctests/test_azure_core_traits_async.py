# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import functools
from datetime import datetime

import pytest
from azure.core.exceptions import HttpResponseError
from azure.core import MatchConditions
from specs.azure.core.traits.aio import TraitsClient
from specs.azure.core.traits.models import UserActionParam


@pytest.fixture
async def client():
    async with TraitsClient() as client:
        yield client


@pytest.mark.asyncio
async def test_get(client: TraitsClient, check_client_request_id_header):
    async def assert_test_get(**kwargs):
        checked = {}
        result, header = await client.smoke_test(
            id=1,
            foo="123",
            if_unmodified_since=datetime(year=2022, month=8, day=26, hour=14, minute=38, second=0),
            if_modified_since=datetime(year=2021, month=8, day=26, hour=14, minute=38, second=0),
            cls=lambda x, y, z: (y, z),
            raw_request_hook=functools.partial(
                check_client_request_id_header, header="x-ms-client-request-id", checked=checked
            ),
            **kwargs,
        )
        assert result.id == 1
        assert result.name == "Madge"
        assert header["ETag"] == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
        assert header["bar"] == "456"
        assert header["x-ms-client-request-id"] == checked["x-ms-client-request-id"]

    await assert_test_get(etag="valid", match_condition=MatchConditions.IfNotModified)
    await assert_test_get(etag="invalid", match_condition=MatchConditions.IfModified)
    with pytest.raises(HttpResponseError):
        await assert_test_get()


@pytest.mark.asyncio
async def test_repeatable_action(client: TraitsClient, check_repeatability_header):
    result, header = await client.repeatable_action(
        id=1,
        body=UserActionParam(user_action_value="test"),
        cls=lambda x, y, z: (y, z),
        raw_request_hook=check_repeatability_header,
    )
    assert result.user_action_result == "test"
    assert header["Repeatability-Result"] == "accepted"

    result, header = await client.repeatable_action(
        id=1,
        body=UserActionParam(user_action_value="test"),
        cls=lambda x, y, z: (y, z),
        headers={
            "Repeatability-Request-ID": "5942d803-e3fa-4f96-8f67-607d7bd607f5",
            "Repeatability-First-Sent": "Sun, 06 Nov 1994 08:49:37 GMT",
        },
        raw_request_hook=check_repeatability_header,
    )
    assert result.user_action_result == "test"
    assert header["Repeatability-Result"] == "accepted"

    with pytest.raises(HttpResponseError):
        await client.repeatable_action(
            id=1,
            body=UserActionParam(user_action_value="test"),
            cls=lambda x, y, z: (y, z),
            headers={"Repeatability-Request-ID": "wrong-id"},
        )

    with pytest.raises(HttpResponseError):
        await client.repeatable_action(
            id=1,
            body=UserActionParam(user_action_value="test"),
            cls=lambda x, y, z: (y, z),
            headers={"Repeatability-First-Sent": "wrong-datetime"},
        )
