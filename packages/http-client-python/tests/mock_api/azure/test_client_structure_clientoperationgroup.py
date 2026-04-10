# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from client.structure.clientoperationgroup.models import ClientType
from client.structure.clientoperationgroup import FirstClient, SecondClient


def test_first_client_operations():
    client = FirstClient(endpoint="http://localhost:3000", client=ClientType.CLIENT_OPERATION_GROUP)

    client.one()

    client.group3.two()
    client.group3.three()

    client.group4.four()


def test_second_client_operations():
    client = SecondClient(endpoint="http://localhost:3000", client=ClientType.CLIENT_OPERATION_GROUP)

    client.five()

    client.group5.six()
