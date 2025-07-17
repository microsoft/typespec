# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from response.statuscoderange.aio import StatusCodeRangeClient
from response.statuscoderange.models import ErrorInRange, NotFoundError


@pytest.fixture
async def client():
    async with StatusCodeRangeClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_error_response_status_code_in_range(client: StatusCodeRangeClient):
    with pytest.raises(Exception) as exc_info:
        await client.error_response_status_code_in_range()

    error = exc_info.value.model
    assert isinstance(error, ErrorInRange)
    assert error.code == "request-header-too-large"
    assert error.message == "Request header too large"
    assert exc_info.value.response.status_code == 494


@pytest.mark.asyncio
async def test_error_response_status_code_404(client: StatusCodeRangeClient):
    with pytest.raises(Exception) as exc_info:
        await client.error_response_status_code404()

    error = exc_info.value.model
    assert isinstance(error, NotFoundError)
    assert error.code == "not-found"
    assert error.resource_id == "resource1"
    assert exc_info.value.response.status_code == 404
