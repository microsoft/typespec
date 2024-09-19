# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path

import pytest
from encode.bytes import BytesClient
from encode.bytes.models import (
    DefaultBytesProperty,
    Base64urlBytesProperty,
    Base64BytesProperty,
    Base64urlArrayBytesProperty,
)

FILE_FOLDER = Path(__file__).parent


@pytest.fixture
def client():
    with BytesClient() as client:
        yield client


def test_query(client: BytesClient):
    client.query.default(
        value=bytes("test", "utf-8"),
    )
    client.query.base64(
        value=bytes("test", "utf-8"),
    )
    client.query.base64_url(
        value=bytes("test", "utf-8"),
    )
    client.query.base64_url_array(
        value=[
            bytes("test", "utf-8"),
            bytes("test", "utf-8"),
        ],
    )


def test_property(client: BytesClient):
    result = client.property.default(
        DefaultBytesProperty(
            value=bytes("test", "utf-8"),
        )
    )
    assert result.value == bytes("test", "utf-8")

    result = client.property.base64(
        Base64BytesProperty(
            value=bytes("test", "utf-8"),
        )
    )
    assert result.value == bytes("test", "utf-8")

    result = client.property.base64_url(
        Base64urlBytesProperty(
            value=bytes("test", "utf-8"),
        )
    )
    assert result.value == bytes("test", "utf-8")

    result = client.property.base64_url_array(
        Base64urlArrayBytesProperty(
            value=[
                bytes("test", "utf-8"),
                bytes("test", "utf-8"),
            ],
        )
    )
    assert result.value == [
        bytes("test", "utf-8"),
        bytes("test", "utf-8"),
    ]


def test_header(client: BytesClient):
    client.header.default(
        value=bytes("test", "utf-8"),
    )
    client.header.base64(
        value=bytes("test", "utf-8"),
    )
    client.header.base64_url(
        value=bytes("test", "utf-8"),
    )
    client.header.base64_url_array(
        value=[
            bytes("test", "utf-8"),
            bytes("test", "utf-8"),
        ],
    )


@pytest.fixture
def png_data() -> bytes:
    with open(str(FILE_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


def test_request_body(client: BytesClient, png_data: bytes):
    client.request_body.default(
        value=bytes("test", "utf-8"),
    )
    client.request_body.octet_stream(
        value=png_data,
    )
    client.request_body.custom_content_type(
        value=png_data,
    )
    client.request_body.base64(
        value=bytes("test", "utf-8"),
    )
    client.request_body.base64_url(
        value=bytes("test", "utf-8"),
    )


def test_response_body(client: BytesClient, png_data: bytes):
    expected = b"test"
    assert expected == client.response_body.default()
    assert expected == client.response_body.base64()
    assert expected == client.response_body.base64_url()
    assert b"".join(client.response_body.octet_stream()) == png_data
    assert b"".join(client.response_body.custom_content_type()) == png_data
