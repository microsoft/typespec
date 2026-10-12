# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from response.bodyornocontent.aio import BodyOrNoContentClient
from response.bodyornocontent.models import BlobLayout


@pytest_asyncio.fixture
async def client():
    async with BodyOrNoContentClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_get_body(client: BodyOrNoContentClient):
    result, response = await client.get_body(
        cls=lambda pipeline_response, result, _: (result, pipeline_response.http_response)
    )

    assert result == BlobLayout(content="hello")
    assert response.status_code == 200
    assert response.headers["x-ms-request-id"] == "body-request"


@pytest.mark.asyncio
async def test_get_no_content(client: BodyOrNoContentClient):
    result, response = await client.get_no_content(
        cls=lambda pipeline_response, result, _: (result, pipeline_response.http_response)
    )

    assert result is None
    assert response.status_code == 204
    assert response.headers["x-ms-request-id"] == "no-content-request"
