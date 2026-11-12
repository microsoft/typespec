# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from service.multipleservices.servicea import ServiceAClient
from service.multipleservices.serviceb import ServiceBClient


@pytest.fixture
def client_a():
    with ServiceAClient() as client:
        yield client


@pytest.fixture
def client_b():
    with ServiceBClient() as client:
        yield client


def test_service_a_op(client_a: ServiceAClient):
    client_a.operations.op_a()


def test_service_a_sub_namespace_op(client_a: ServiceAClient):
    client_a.sub_namespace.sub_op_a()


def test_service_b_op(client_b: ServiceBClient):
    client_b.operations.op_b()


def test_service_b_sub_namespace_op(client_b: ServiceBClient):
    client_b.sub_namespace.sub_op_b()
