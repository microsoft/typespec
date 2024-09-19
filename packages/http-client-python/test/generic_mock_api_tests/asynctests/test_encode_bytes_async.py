# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from pathlib import Path
from encode.bytes.aio import BytesClient
from encode.bytes.models import (
    DefaultBytesProperty,
    Base64urlBytesProperty,
    Base64BytesProperty,
    Base64urlArrayBytesProperty,
)


FILE_FOLDER = Path(__file__).parent.parent


@pytest.fixture
async def client():
    async with BytesClient() as client:
        yield client


@pytest.mark.asyncio
async def test_query(client: BytesClient):
    await client.query.default(
        value=bytes("test", "utf-8"),
    )
    await client.query.base64(
        value=bytes("test", "utf-8"),
    )
    await client.query.base64_url(
        value=bytes("test", "utf-8"),
    )
    await client.query.base64_url_array(
        value=[
            bytes("test", "utf-8"),
            bytes("test", "utf-8"),
        ],
    )


@pytest.mark.asyncio
async def test_property(client: BytesClient):
    result = await client.property.default(
        DefaultBytesProperty(
            value=bytes("test", "utf-8"),
        )
    )
    assert result.value == bytes("test", "utf-8")

    result = await client.property.base64(
        Base64BytesProperty(
            value=bytes("test", "utf-8"),
        )
    )
    assert result.value == bytes("test", "utf-8")

    result = await client.property.base64_url(
        Base64urlBytesProperty(
            value=bytes("test", "utf-8"),
        )
    )
    assert result.value == bytes("test", "utf-8")

    result = await client.property.base64_url_array(
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


@pytest.mark.asyncio
async def test_header(client: BytesClient):
    await client.header.default(
        value=bytes("test", "utf-8"),
    )
    await client.header.base64(
        value=bytes("test", "utf-8"),
    )
    await client.header.base64_url(
        value=bytes("test", "utf-8"),
    )
    await client.header.base64_url_array(
        value=[
            bytes("test", "utf-8"),
            bytes("test", "utf-8"),
        ],
    )


@pytest.fixture
def png_data() -> bytes:
    with open(str(FILE_FOLDER / "data/image.png"), "rb") as file_in:
        return file_in.read()


@pytest.mark.asyncio
async def test_request_body(client: BytesClient, png_data: bytes):
    await client.request_body.default(
        value=bytes("test", "utf-8"),
    )
    await client.request_body.octet_stream(
        value=png_data,
    )
    await client.request_body.custom_content_type(
        value=png_data,
    )
    await client.request_body.base64(
        value=bytes("test", "utf-8"),
    )
    await client.request_body.base64_url(
        value=bytes("test", "utf-8"),
    )


@pytest.mark.asyncio
async def test_response_body(client: BytesClient, png_data: bytes):
    expected = b"test"
    assert expected == await client.response_body.default()
    assert expected == await client.response_body.base64()
    assert expected == await client.response_body.base64_url()
    assert b"".join([d async for d in (await client.response_body.octet_stream())]) == png_data
    assert b"".join([d async for d in (await client.response_body.custom_content_type())]) == png_data
