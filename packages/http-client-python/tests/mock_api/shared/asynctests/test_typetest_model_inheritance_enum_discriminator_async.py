# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.enumdiscriminator.aio import EnumDiscriminatorClient
from typetest.model.enumdiscriminator import models


@pytest.fixture
async def client():
    async with EnumDiscriminatorClient() as client:
        yield client


@pytest.fixture
def valid_body():
    return models.Golden(weight=10)


@pytest.fixture
def valid_fixed_body():
    return models.Cobra(length=10)


@pytest.mark.asyncio
async def test_get_extensible_model(client: EnumDiscriminatorClient, valid_body: models.Dog):
    assert await client.get_extensible_model() == valid_body
    assert isinstance(await client.get_extensible_model(), models.Golden)


@pytest.mark.asyncio
async def test_put_extensible_model(client: EnumDiscriminatorClient, valid_body: models.Dog):
    await client.put_extensible_model(valid_body)


@pytest.mark.asyncio
async def test_get_extensible_model_missing_discriminator(
    client: EnumDiscriminatorClient,
):
    assert await client.get_extensible_model_missing_discriminator() == models.Dog(weight=10)


@pytest.mark.asyncio
async def test_get_extensible_model_wrong_discriminator(
    client: EnumDiscriminatorClient,
):
    assert await client.get_extensible_model_wrong_discriminator() == models.Dog(weight=8, kind="wrongKind")


@pytest.mark.asyncio
async def test_get_fixed_model(client: EnumDiscriminatorClient, valid_fixed_body: models.Snake):
    assert await client.get_fixed_model() == valid_fixed_body
    assert isinstance(await client.get_fixed_model(), models.Cobra)


@pytest.mark.asyncio
async def test_put_fixed_model(client: EnumDiscriminatorClient, valid_fixed_body: models.Snake):
    await client.put_fixed_model(valid_fixed_body)


@pytest.mark.asyncio
async def test_get_fixed_model_missing_discriminator(client: EnumDiscriminatorClient):
    assert await client.get_fixed_model_missing_discriminator() == models.Snake(length=10)


@pytest.mark.asyncio
async def test_get_fixed_model_wrong_discriminator(client: EnumDiscriminatorClient):
    assert await client.get_fixed_model_wrong_discriminator() == models.Snake(length=8, kind="wrongKind")
