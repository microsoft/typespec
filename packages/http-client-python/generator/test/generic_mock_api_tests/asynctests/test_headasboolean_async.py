# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from headasbooleantrue.aio import VisibilityClient as HeadAsBooleanTrueClient
from headasbooleantrue import models as models_true

from headasbooleanfalse.aio import VisibilityClient as HeadAsBooleanFalseClient
from headasbooleanfalse import models as models_false


@pytest.fixture
async def client_true():
    async with HeadAsBooleanTrueClient() as client:
        yield client


@pytest.fixture
async def client_false():
    async with HeadAsBooleanFalseClient() as client:
        yield client


@pytest.mark.asyncio
async def test_head_true(client_true):
    body = models_true.VisibilityModel(query_prop=123)
    assert await client_true.head_model(body) == True


@pytest.mark.asyncio
async def test_head_false(client_false):
    body = models_false.VisibilityModel(query_prop=123)
    assert await client_false.head_model(body) is None
