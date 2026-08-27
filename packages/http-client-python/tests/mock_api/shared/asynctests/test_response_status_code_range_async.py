# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from response.statuscoderange.aio import StatusCodeRangeClient
from response.statuscoderange.models import ErrorInRange


@pytest_asyncio.fixture
async def client():
    async with StatusCodeRangeClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_error_response_status_code_in_range(client: StatusCodeRangeClient, core_library):
    with pytest.raises(core_library.exceptions.HttpResponseError) as exc_info:
        await client.error_response_status_code_in_range()

    error = exc_info.value.model
    assert isinstance(error, ErrorInRange)
    assert error.code == "request-header-too-large"
    assert error.message == "Request header too large"
    assert exc_info.value.response.status_code == 494


@pytest.mark.asyncio
async def test_error_response_status_code_404(client: StatusCodeRangeClient, core_library):
    # 404 maps to the dedicated azure-core ``ResourceNotFoundError`` via ``map_error``,
    # which raises before the customized error body is deserialized, so no model is attached.
    with pytest.raises(core_library.exceptions.ResourceNotFoundError) as exc_info:
        await client.error_response_status_code404()

    assert exc_info.value.response.status_code == 404
