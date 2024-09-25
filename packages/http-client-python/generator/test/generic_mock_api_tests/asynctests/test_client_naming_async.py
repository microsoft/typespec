# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from client.naming.aio import NamingClient
from client.naming import models


@pytest.fixture
async def client():
    async with NamingClient() as client:
        yield client


@pytest.mark.asyncio
async def test_client(client: NamingClient):
    await client.client(models.ClientNameModel(client_name=True))


@pytest.mark.asyncio
async def test_language(client: NamingClient):
    await client.language(models.LanguageClientNameModel(python_name=True))


@pytest.mark.asyncio
async def test_compatible_with_encoded_name(client: NamingClient):
    await client.compatible_with_encoded_name(models.ClientNameAndJsonEncodedNameModel(client_name=True))


@pytest.mark.asyncio
async def test_operation(client: NamingClient):
    await client.client_name()


@pytest.mark.asyncio
async def test_parameter(client: NamingClient):
    await client.parameter(client_name="true")


@pytest.mark.asyncio
async def test_header_request(client: NamingClient):
    await client.request(client_name="true")


@pytest.mark.asyncio
async def test_header_response(client: NamingClient):
    assert (await client.response(cls=lambda x, y, z: z))["default-name"] == "true"


@pytest.mark.asyncio
async def test_model_client(client: NamingClient):
    await client.client_model.client(models.ClientModel(default_name=True))


@pytest.mark.asyncio
async def test_model_language(client: NamingClient):
    await client.client_model.language(models.PythonModel(default_name=True))


@pytest.mark.asyncio
async def test_union_enum_member_name(client: NamingClient):
    await client.union_enum.union_enum_member_name(models.ExtensibleEnum.CLIENT_ENUM_VALUE1)


@pytest.mark.asyncio
async def test_union_enum_name(client: NamingClient):
    await client.union_enum.union_enum_name(models.ClientExtensibleEnum.ENUM_VALUE1)
