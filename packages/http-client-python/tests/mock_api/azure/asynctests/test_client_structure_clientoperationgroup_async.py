# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.structure.clientoperationgroup.models import ClientType
from client.structure.clientoperationgroup.aio import FirstClient, SecondClient


@pytest.mark.asyncio
async def test_first_client_operations():
    client = FirstClient(endpoint="http://localhost:3000", client=ClientType.CLIENT_OPERATION_GROUP)

    await client.one()

    await client.group3.two()
    await client.group3.three()

    await client.group4.four()


@pytest.mark.asyncio
async def test_second_client_operations():
    client = SecondClient(endpoint="http://localhost:3000", client=ClientType.CLIENT_OPERATION_GROUP)

    await client.five()

    await client.group5.six()
