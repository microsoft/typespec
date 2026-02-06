# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json

import pytest
from typetest.file.aio import FileClient


@pytest.fixture
async def client():
    async with FileClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_upload_file_specific_content_type(client: FileClient, png_data: bytes):
    await client.body.upload_file_specific_content_type(png_data)


@pytest.mark.asyncio
async def test_upload_file_json_content_type(client: FileClient):
    await client.body.upload_file_json_content_type(json.dumps({"message": "test file content"}).encode())


@pytest.mark.asyncio
async def test_download_file_json_content_type(client: FileClient):
    result = await client.body.download_file_json_content_type()
    assert result is not None


@pytest.mark.asyncio
async def test_download_file_specific_content_type(client: FileClient, png_data: bytes):
    result = b"".join([d async for d in (await client.body.download_file_specific_content_type())])
    assert result == png_data


@pytest.mark.asyncio
async def test_download_file_multiple_content_types(client: FileClient, png_data: bytes):
    result = b"".join([d async for d in (await client.body.download_file_multiple_content_types())])
    assert result == png_data


@pytest.mark.asyncio
async def test_upload_file_default_content_type(client: FileClient, png_data: bytes):
    await client.body.upload_file_default_content_type(png_data)


@pytest.mark.asyncio
async def test_download_file_default_content_type(client: FileClient, png_data: bytes):
    result = b"".join([d async for d in (await client.body.download_file_default_content_type())])
    assert result == png_data
