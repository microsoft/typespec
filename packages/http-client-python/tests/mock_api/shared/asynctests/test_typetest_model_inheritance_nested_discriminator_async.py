# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.nesteddiscriminator.aio import NestedDiscriminatorClient
from typetest.model.nesteddiscriminator.models import GoblinShark, Salmon, Fish


@pytest.fixture
async def client():
    async with NestedDiscriminatorClient() as client:
        yield client


@pytest.fixture
async def valid_body():
    return GoblinShark(age=1)


@pytest.mark.asyncio
async def test_get_model(client, valid_body):
    assert await client.get_model() == valid_body
    assert isinstance(await client.get_model(), GoblinShark)


@pytest.mark.asyncio
async def test_put_model(client, valid_body):
    await client.put_model(valid_body)


@pytest.fixture
async def valid_recursive_body():
    return Salmon(
        {
            "age": 1,
            "kind": "salmon",
            "partner": {"age": 2, "kind": "shark", "sharktype": "saw"},
            "friends": [
                {
                    "age": 2,
                    "kind": "salmon",
                    "partner": {"age": 3, "kind": "salmon"},
                    "hate": {
                        "key1": {"age": 4, "kind": "salmon"},
                        "key2": {"age": 2, "kind": "shark", "sharktype": "goblin"},
                    },
                },
                {"age": 3, "kind": "shark", "sharktype": "goblin"},
            ],
            "hate": {
                "key3": {"age": 3, "kind": "shark", "sharktype": "saw"},
                "key4": {
                    "age": 2,
                    "kind": "salmon",
                    "friends": [
                        {"age": 1, "kind": "salmon"},
                        {"age": 4, "kind": "shark", "sharktype": "goblin"},
                    ],
                },
            },
        }
    )


@pytest.mark.asyncio
async def test_get_recursive_model(client, valid_recursive_body):
    assert valid_recursive_body == await client.get_recursive_model()
    assert isinstance(await client.get_recursive_model(), Salmon)


@pytest.mark.asyncio
async def test_put_recursive_model(client, valid_recursive_body):
    await client.put_recursive_model(valid_recursive_body)


@pytest.mark.asyncio
async def test_get_missing_discriminator(client):
    assert await client.get_missing_discriminator() == Fish(age=1)


@pytest.mark.asyncio
async def test_get_wrong_discriminator(client):
    assert await client.get_wrong_discriminator() == Fish(age=1, kind="wrongKind")
