# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.singlediscriminator.aio import SingleDiscriminatorClient
from typetest.model.singlediscriminator.models import Sparrow, Eagle, Bird, Dinosaur


@pytest.fixture
async def client():
    async with SingleDiscriminatorClient() as client:
        yield client


@pytest.fixture
async def valid_body():
    return Sparrow(wingspan=1)


@pytest.mark.asyncio
async def test_get_model(client, valid_body):
    assert await client.get_model() == valid_body


@pytest.mark.asyncio
async def test_put_model(client, valid_body):
    await client.put_model(valid_body)


@pytest.fixture
async def recursive_body():
    return Eagle(
        {
            "wingspan": 5,
            "kind": "eagle",
            "partner": {"wingspan": 2, "kind": "goose"},
            "friends": [{"wingspan": 2, "kind": "seagull"}],
            "hate": {"key3": {"wingspan": 1, "kind": "sparrow"}},
        }
    )


@pytest.mark.asyncio
async def test_get_recursive_model(client, recursive_body):
    assert await client.get_recursive_model() == recursive_body


@pytest.mark.asyncio
async def test_put_recursive_model(client, recursive_body):
    await client.put_recursive_model(recursive_body)


@pytest.mark.asyncio
async def test_get_missing_discriminator(client):
    assert await client.get_missing_discriminator() == Bird(wingspan=1)


@pytest.mark.asyncio
async def test_get_wrong_discriminator(client):
    assert await client.get_wrong_discriminator() == Bird(wingspan=1, kind="wrongKind")


@pytest.mark.asyncio
async def test_get_legacy_model(client):
    assert await client.get_legacy_model() == Dinosaur(size=20, kind="t-rex")
