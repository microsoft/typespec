# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.naming.typeddict import NamingClient, models


@pytest.fixture
def client():
    with NamingClient() as client:
        yield client


def test_client(client: NamingClient):
    """TypedDict uses wire name 'defaultName', not client name 'client_name'."""
    client.property.client({"defaultName": True})


def test_language(client: NamingClient):
    """TypedDict uses wire name 'defaultName', not language-specific name 'python_name'."""
    client.property.language({"defaultName": True})


def test_compatible_with_encoded_name(client: NamingClient):
    """TypedDict uses encoded wire name 'wireName', not client name 'client_name'."""
    client.property.compatible_with_encoded_name({"wireName": True})


def test_operation(client: NamingClient):
    client.client_name()


def test_parameter(client: NamingClient):
    client.parameter(client_name="true")


def test_header_request(client: NamingClient):
    client.header.request(client_name="true")


def test_header_response(client: NamingClient):
    assert client.header.response(cls=lambda x, y, z: z)["default-name"] == "true"


def test_model_client(client: NamingClient):
    """TypedDict uses wire name 'defaultName', not client name 'default_name'."""
    client.model_client.client({"defaultName": True})


def test_model_language(client: NamingClient):
    """TypedDict uses wire name 'defaultName', not client name 'default_name'."""
    client.model_client.language({"defaultName": True})


def test_union_enum_member_name(client: NamingClient):
    client.union_enum.union_enum_member_name(models.ExtensibleEnum.CLIENT_ENUM_VALUE1)


def test_union_enum_name(client: NamingClient):
    client.union_enum.union_enum_name(models.ClientExtensibleEnum.ENUM_VALUE1)
