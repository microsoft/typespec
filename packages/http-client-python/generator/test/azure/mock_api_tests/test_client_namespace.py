# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.clientnamespace import ClientNamespaceFirstClient
from client.clientnamespace.first.models import FirstClientResult

from client.clientnamespace.second import ClientNamespaceSecondClient
from client.clientnamespace.second.models import SecondClientResult
from client.clientnamespace.second.sub.models import SecondClientEnumType


@pytest.fixture
def first_client():
    with ClientNamespaceFirstClient() as client:
        yield client


@pytest.fixture
def second_client():
    with ClientNamespaceSecondClient() as client:
        yield client


def test_get_first(first_client: ClientNamespaceFirstClient):
    assert first_client.get_first() == FirstClientResult(name="first")


def test_get_second(second_client: ClientNamespaceSecondClient):
    assert second_client.get_second() == SecondClientResult(type=SecondClientEnumType.SECOND)
