# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.structure.service.models import ClientType
from client.structure.service import ServiceClient
from client.structure.multiclient import ClientAClient, ClientBClient
from client.structure.renamedoperation import RenamedOperationClient
from client.structure.twooperationgroup import TwoOperationGroupClient


def test_structure_default():
    client = ServiceClient(endpoint="http://localhost:3000", client=ClientType.DEFAULT)
    client.one()
    client.two()
    client.foo.three()
    client.foo.four()
    client.bar.five()
    client.bar.six()
    client.baz.foo.seven()
    client.qux.eight()
    client.qux.bar.nine()


def test_structure_multiclient():
    client_a = ClientAClient(endpoint="http://localhost:3000", client=ClientType.MULTI_CLIENT)
    client_a.renamed_one()
    client_a.renamed_three()
    client_a.renamed_five()

    client_b = ClientBClient(endpoint="http://localhost:3000", client=ClientType.MULTI_CLIENT)
    client_b.renamed_two()
    client_b.renamed_four()
    client_b.renamed_six()


@pytest.mark.skip(reason="will reopen the cases after upgrade `@azure-tools/typespec-client-generator-core` to 0.67.0")
def test_structure_renamed_operation():
    client = RenamedOperationClient(endpoint="http://localhost:3000", client=ClientType.RENAMED_OPERATION)
    client.renamed_one()
    client.renamed_three()
    client.renamed_five()

    client.renamed_two()
    client.renamed_four()
    client.renamed_six()


@pytest.mark.skip(reason="will reopen the cases after upgrade `@azure-tools/typespec-client-generator-core` to 0.67.0")
def test_structure_two_operation_group():
    client = TwoOperationGroupClient(endpoint="http://localhost:3000", client=ClientType.TWO_OPERATION_GROUP)
    client.one()
    client.three()
    client.four()

    client.two()
    client.five()
    client.six()
