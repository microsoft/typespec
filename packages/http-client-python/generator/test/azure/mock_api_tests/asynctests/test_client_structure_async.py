# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.structure.service.models import ClientType
from client.structure.service.aio import ServiceClient
from client.structure.multiclient.aio import ClientAClient, ClientBClient
from client.structure.renamedoperation.aio import RenamedOperationClient
from client.structure.twooperationgroup.aio import TwoOperationGroupClient


@pytest.mark.asyncio
async def test_structure_default():
    client = ServiceClient(endpoint="http://localhost:3000", client=ClientType.DEFAULT)
    await client.one()
    await client.two()
    await client.foo.three()
    await client.foo.four()
    await client.bar.five()
    await client.bar.six()
    await client.baz.foo.seven()
    await client.qux.eight()
    await client.qux.bar.nine()


@pytest.mark.asyncio
async def test_structure_multiclient():
    client_a = ClientAClient(endpoint="http://localhost:3000", client=ClientType.MULTI_CLIENT)
    await client_a.renamed_one()
    await client_a.renamed_three()
    await client_a.renamed_five()

    client_b = ClientBClient(endpoint="http://localhost:3000", client=ClientType.MULTI_CLIENT)
    await client_b.renamed_two()
    await client_b.renamed_four()
    await client_b.renamed_six()


@pytest.mark.asyncio
async def test_structure_renamed_operation():
    client = RenamedOperationClient(endpoint="http://localhost:3000", client=ClientType.RENAMED_OPERATION)
    await client.renamed_one()
    await client.renamed_three()
    await client.renamed_five()

    await client.group.renamed_two()
    await client.group.renamed_four()
    await client.group.renamed_six()


@pytest.mark.asyncio
async def test_structure_two_operation_group():
    client = TwoOperationGroupClient(endpoint="http://localhost:3000", client=ClientType.RENAMED_OPERATION)
    await client.group1.one()
    await client.group1.three()
    await client.group1.four()

    await client.group2.two()
    await client.group2.five()
    await client.group2.six()
