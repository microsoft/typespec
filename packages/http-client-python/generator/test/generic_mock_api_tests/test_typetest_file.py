# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json

import pytest
from typetest.file import FileClient


@pytest.fixture
def client():
    with FileClient(endpoint="http://localhost:3000") as client:
        yield client


def test_upload_file_specific_content_type(client: FileClient, png_data: bytes):
    client.body.upload_file_specific_content_type(png_data)


# Do not support this case for now
# def test_upload_file_json_content_type(client: FileClient):
#     client.body.upload_file_json_content_type(json.dumps({"message": "test file content"}).encode())


# although result is expected but actually there is deserialization issue
# def test_download_file_json_content_type(client: FileClient):
#     result = client.body.download_file_json_content_type()
#     assert result == {"message": "test file content"}


def test_download_file_specific_content_type(client: FileClient, png_data: bytes):
    result = b"".join(client.body.download_file_specific_content_type())
    assert result == png_data


def test_download_file_multiple_content_types(client: FileClient, png_data: bytes):
    result = b"".join(client.body.download_file_multiple_content_types())
    assert result == png_data


def test_upload_file_default_content_type(client: FileClient, png_data: bytes):
    client.body.upload_file_default_content_type(png_data, content_type="image/png")


def test_download_file_default_content_type(client: FileClient, png_data: bytes):
    result = b"".join(client.body.download_file_default_content_type())
    assert result == png_data
