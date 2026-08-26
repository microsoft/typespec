# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from response.bodyornocontent.aio import BodyOrNoContentClient


@pytest_asyncio.fixture
async def client():
    async with BodyOrNoContentClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_get_body(client: BodyOrNoContentClient):
    body, response = await client.get_body(cls=lambda x, y, z: (y, x))

    assert body.content == "hello"
    assert response.http_response.status_code == 200
    assert response.http_response.headers["x-ms-request-id"] == "body-request"


@pytest.mark.asyncio
async def test_get_no_content(client: BodyOrNoContentClient):
    body, response = await client.get_no_content(cls=lambda x, y, z: (y, x))

    assert body is None
    assert response.http_response.status_code == 204
    assert response.http_response.headers["x-ms-request-id"] == "no-content-request"
