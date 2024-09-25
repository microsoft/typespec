# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import functools

import pytest

from azure.specialheaders.xmsclientrequestid import XmsClientRequestIdClient


@pytest.fixture
def client():
    with XmsClientRequestIdClient() as client:
        yield client


def test_get(client: XmsClientRequestIdClient, check_client_request_id_header):
    checked = {}
    result, resp = client.get(
        cls=lambda x, y, z: (y, x),
        raw_request_hook=functools.partial(
            check_client_request_id_header, header="x-ms-client-request-id", checked=checked
        ),
    )
    assert result is None
    assert resp.http_response.headers["x-ms-client-request-id"] == checked["x-ms-client-request-id"]
    pass
