# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import base64
import pytest
from payload.contentnegotiation import ContentNegotiationClient
from payload.contentnegotiation.models import PngImageAsJson


@pytest.fixture
def client():
    with ContentNegotiationClient(endpoint="http://localhost:3000") as client:
        yield client


def test_get_avatar_as_png(client: ContentNegotiationClient, png_data: bytes):
    assert b"".join(client.same_body.get_avatar_as_png()) == png_data


def test_get_avatar_as_jpeg(client: ContentNegotiationClient, jpg_data: bytes):
    assert b"".join(client.same_body.get_avatar_as_jpeg()) == jpg_data


def test_different_body_get_avatar_as_png(client: ContentNegotiationClient, png_data: bytes):
    assert b"".join(client.different_body.get_avatar_as_png()) == png_data


def test_different_body_get_avatar_as_json(client: ContentNegotiationClient, png_data: bytes):
    result = client.different_body.get_avatar_as_json()
    expected = PngImageAsJson(content=base64.b64encode(png_data).decode())
    assert result == expected
