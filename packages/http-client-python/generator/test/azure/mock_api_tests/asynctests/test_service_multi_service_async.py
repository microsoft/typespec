# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from azure.core.exceptions import HttpResponseError
from service.multiservice.aio import Combined
from service.multiservice.models import VersionsA, VersionsB


@pytest.mark.asyncio
async def test_service_multi_service_foo():
    client = Combined(endpoint="http://localhost:3000")
    with pytest.raises(HttpResponseError):
        await client.foo.test(api_version=VersionsA.AV1)

    await client.foo.test()


@pytest.mark.asyncio
async def test_service_multi_service_bar():
    client = Combined(endpoint="http://localhost:3000")

    with pytest.raises(HttpResponseError):
        await client.bar.test(api_version=VersionsB.BV1)

    await client.bar.test()
