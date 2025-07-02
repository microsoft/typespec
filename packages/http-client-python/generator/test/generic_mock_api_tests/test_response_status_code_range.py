# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from response.statuscoderange import StatusCodeRangeClient
from response.statuscoderange.models import ErrorInRange, NotFoundError
from azure.core.exceptions import HttpResponseError, ResourceNotFoundError


@pytest.fixture
def client():
    with StatusCodeRangeClient(endpoint="http://localhost:3000") as client:
        yield client


def test_error_response_status_code_in_range(client: StatusCodeRangeClient):
    """Test that error response with status code in range (494-499) raises HttpResponseError with ErrorInRange model."""
    with pytest.raises(HttpResponseError) as exc_info:
        client.error_response_status_code_in_range()

    error = exc_info.value.model
    assert isinstance(error, ErrorInRange)
    assert error.code == "request-header-too-large"
    assert error.message == "Request header too large"
    assert exc_info.value.response.status_code == 494


def test_error_response_status_code_404(client: StatusCodeRangeClient):
    """Test that error response with status code 404 raises ResourceNotFoundError with NotFoundError model."""
    with pytest.raises(ResourceNotFoundError) as exc_info:
        client.error_response_status_code404()

    error = exc_info.value.model
    assert isinstance(error, NotFoundError)
    assert error.code == "not-found"
    assert error.resource_id == "resource1"
    assert exc_info.value.response.status_code == 404
