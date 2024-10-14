# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.naming import NamingClient, models


@pytest.fixture
def client():
    with NamingClient() as client:
        yield client


def test_client(client: NamingClient):
    client.client(models.ClientNameModel(client_name=True))


def test_language(client: NamingClient):
    client.language(models.LanguageClientNameModel(python_name=True))


def test_compatible_with_encoded_name(client: NamingClient):
    client.compatible_with_encoded_name(models.ClientNameAndJsonEncodedNameModel(client_name=True))


def test_operation(client: NamingClient):
    client.client_name()


def test_parameter(client: NamingClient):
    client.parameter(client_name="true")


def test_header_request(client: NamingClient):
    client.request(client_name="true")


def test_header_response(client: NamingClient):
    assert client.response(cls=lambda x, y, z: z)["default-name"] == "true"


def test_model_client(client: NamingClient):
    client.client_model.client(models.ClientModel(default_name=True))


def test_model_language(client: NamingClient):
    client.client_model.language(models.PythonModel(default_name=True))


def test_union_enum_member_name(client: NamingClient):
    client.union_enum.union_enum_member_name(models.ExtensibleEnum.CLIENT_ENUM_VALUE1)


def test_union_enum_name(client: NamingClient):
    client.union_enum.union_enum_name(models.ClientExtensibleEnum.ENUM_VALUE1)
