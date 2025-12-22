# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from service.multiservice.aio import Combined
from service.multiservice.models import VersionsA


@pytest.mark.asyncio
async def test_service_multi_service_foo():
    client = Combined(api_version=VersionsA.AV2, endpoint="http://localhost:3000")
    await client.foo.test()


@pytest.mark.asyncio
async def test_service_multi_service_bar():
    client = Combined(api_version=VersionsA.AV2, endpoint="http://localhost:3000")
    await client.bar.test()
