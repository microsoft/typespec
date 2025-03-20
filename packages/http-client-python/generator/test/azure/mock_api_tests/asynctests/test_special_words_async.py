# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specialwords.aio import SpecialWordsClient
from specialwords import models


@pytest.fixture
async def client():
    async with SpecialWordsClient() as client:
        yield client


@pytest.mark.asyncio
async def test_operations(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "_method"
        await getattr(client.operations, sw + suffix)()


@pytest.mark.asyncio
async def test_parameter(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "_parameter"
        await getattr(client.parameters, "with_" + sw)(**{sw + suffix: "ok"})
    await client.parameters.with_cancellation_token(cancellation_token="ok")


@pytest.mark.asyncio
async def test_model(client: SpecialWordsClient, special_words):
    for sw in special_words:
        suffix = "" if sw == "constructor" else "Model"
        model = getattr(models, sw.capitalize() + suffix)
        await getattr(client.models, "with_" + sw)(model(name="ok"))


@pytest.mark.asyncio
async def test_model_properties(client: SpecialWordsClient):
    await client.model_properties.same_as_model(models.SameAsModel(same_as_model="ok"))
