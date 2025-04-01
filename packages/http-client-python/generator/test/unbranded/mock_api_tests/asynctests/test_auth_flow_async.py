# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from authentication.oauth2.aio import OAuth2Client


@pytest.mark.asyncio
async def test_oauth2_auth_flows():
    oauth2_client = OAuth2Client("fake_credential")
    assert oauth2_client._config.authentication_policy._auth_flows == [
        {
            "authorizationUrl": "https://login.microsoftonline.com/common/oauth2/authorize",
            "scopes": [{"value": "https://security.microsoft.com/.default"}],
            "type": "implicit",
        }
    ]
