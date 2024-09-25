# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from authentication.apikey import ApiKeyClient
from authentication.oauth2 import OAuth2Client
from authentication.union import UnionClient
from authentication.http.custom import CustomClient


# Utilities functions


@pytest.fixture
def api_key_client(key_credential):
    client = None

    def _build_client(client_type):
        client = client_type(key_credential("valid-key"))
        return client

    yield _build_client
    if client:
        client.close()


@pytest.fixture
def token_credential(core_library):
    class FakeCredential:
        @staticmethod
        def get_token(*scopes):
            return core_library.credentials.AccessToken(token="".join(scopes), expires_on=1800)

    return FakeCredential()


@pytest.fixture
def oauth2_client(token_credential):
    client = None

    def _build_client(client_type):
        client = client_type(token_credential)
        return client

    yield _build_client
    if client:
        client.close()


@pytest.fixture
def http_custom_client(key_credential):
    client = None

    def _build_client():
        client = CustomClient(key_credential("valid-key"))
        return client

    yield _build_client
    if client:
        client.close()


# Tests


def test_api_key_valid(api_key_client):
    client = api_key_client(ApiKeyClient)
    client.valid()


def test_api_key_invalid(api_key_client, core_library):
    client = api_key_client(ApiKeyClient)
    with pytest.raises(core_library.exceptions.HttpResponseError) as ex:
        client.invalid()
    assert ex.value.status_code == 403
    assert ex.value.reason == "Forbidden"


def test_oauth2_valid(oauth2_client):
    client = oauth2_client(OAuth2Client)
    client.valid(enforce_https=False)


def test_oauth2_invalid(oauth2_client, core_library):
    client = oauth2_client(OAuth2Client)
    with pytest.raises(core_library.exceptions.HttpResponseError) as ex:
        client.invalid(enforce_https=False)
    assert ex.value.status_code == 403


def test_union_keyvalid(api_key_client):
    client = api_key_client(UnionClient)
    client.valid_key()


def test_union_tokenvalid(oauth2_client):
    client = oauth2_client(UnionClient)
    client.valid_token(enforce_https=False)


def test_http_custom_valid(http_custom_client):
    client = http_custom_client()
    client.valid()


def test_http_custom_invalid(http_custom_client, core_library):
    client = http_custom_client()
    with pytest.raises(core_library.exceptions.HttpResponseError) as ex:
        client.invalid()
    assert ex.value.status_code == 403
    assert ex.value.reason == "Forbidden"
