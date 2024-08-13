# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from parameters.bodyoptionality.aio import BodyOptionalityClient
from parameters.bodyoptionality.models import BodyModel


@pytest.fixture
async def client():
    async with BodyOptionalityClient() as client:
        yield client


@pytest.mark.asyncio
async def test_required_explicit(client: BodyOptionalityClient):
    await client.required_explicit(BodyModel(name="foo"))


@pytest.mark.asyncio
async def test_required_implicit(client: BodyOptionalityClient):
    await client.required_implicit(name="foo")


@pytest.mark.asyncio
async def test_optional_explicit(client: BodyOptionalityClient):
    await client.optional_explicit.set(BodyModel(name="foo"))
    await client.optional_explicit.omit()
