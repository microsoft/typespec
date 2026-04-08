# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.structure.clientoperationgroup.models import ClientType
from client.structure.clientoperationgroup import FirstClient, SecondClient


@pytest.mark.skip(reason="will reopen the cases after upgrade `@azure-tools/typespec-client-generator-core` to 0.67.0")
def test_first_client_operations():
    client = FirstClient(endpoint="http://localhost:3000", client=ClientType.CLIENT_OPERATION_GROUP)

    client.one()

    client.two()
    client.three()

    client.four()


@pytest.mark.skip(reason="will reopen the cases after upgrade `@azure-tools/typespec-client-generator-core` to 0.67.0")
def test_second_client_operations():
    client = SecondClient(endpoint="http://localhost:3000", client=ClientType.CLIENT_OPERATION_GROUP)

    client.five()

    client.six()
