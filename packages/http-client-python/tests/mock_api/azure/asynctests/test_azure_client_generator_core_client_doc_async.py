# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from specs.azure.clientgenerator.core.clientdoc.aio import ClientDocClient
from specs.azure.clientgenerator.core.clientdoc import models


@pytest_asyncio.fixture
async def client():
    async with ClientDocClient() as client:
        yield client


@pytest.mark.asyncio
async def test_harvest(client: ClientDocClient):
    body = models.Plant(name="Rose", species="Rosa")
    assert await client.documentation.harvest(body) == body


def test_model_doc_appended():
    # @clientDoc in append mode keeps the base @doc and appends the client-specific text.
    assert models.Plant.__doc__ == (
        "A plant in the garden. This model is used to represent a plant in the client SDK.\n"
        "\n"
        "    :ivar name: The name of the plant. Required.\n"
        "    :vartype name: str\n"
        "    :ivar species: The species of the plant. Required.\n"
        "    :vartype species: str\n"
        "    "
    )


@pytest.mark.asyncio
async def test_operation_doc_replaced(client: ClientDocClient):
    # @clientDoc in replace mode overrides the base @doc completely.
    assert client.documentation.harvest.__doc__ == (
        "Retrieves a plant from the garden by submitting its name.\n"
        "\n"
        "        :param body: Is one of the following types: Plant, JSON, IO[bytes] Required.\n"
        "        :type body: ~specs.azure.clientgenerator.core.clientdoc.models.Plant or JSON or IO[bytes]\n"
        "        :return: Plant. The Plant is compatible with MutableMapping\n"
        "        :rtype: ~specs.azure.clientgenerator.core.clientdoc.models.Plant\n"
        "        :raises ~azure.core.exceptions.HttpResponseError:\n"
        "        "
    )
