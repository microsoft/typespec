# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path
import pytest
import pytest_asyncio
from payload.multipart import models
from payload.multipart.aio import MultiPartClient

JPG = Path(__file__).parent.parent / "data/image.jpg"
PNG = Path(__file__).parent.parent / "data/image.png"

# Note: legacy tests below pass file contents as bytes via `.read()` rather than
# bare `open(...)`. This still exercises `_normalize_multipart_file_entry`'s
# bytes branch, but avoids the IO-with-`.name` branch that would synthesize a
# filename and cause the transport to guess a Content-Type (e.g. image/jpeg)
# instead of the `application/octet-stream` these tests expect.


@pytest_asyncio.fixture
async def client():
    async with MultiPartClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_anonymous_model(client: MultiPartClient):
    await client.form_data.anonymous_model({"profileImage": open(str(JPG), "rb").read()})


@pytest.mark.asyncio
async def test_basic(client: MultiPartClient):
    await client.form_data.basic(
        models.MultiPartRequest(
            id="123",
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_binary_array_parts(client: MultiPartClient):
    await client.form_data.binary_array_parts(
        models.BinaryArrayPartsRequest(
            id="123",
            pictures=[
                open(str(PNG), "rb").read(),
                open(str(PNG), "rb").read(),
            ],
        )
    )


@pytest.mark.asyncio
async def test_check_file_name_and_content_type(client: MultiPartClient):
    await client.form_data.check_file_name_and_content_type(
        models.MultiPartRequest(
            id="123",
            profile_image=("hello.jpg", open(str(JPG), "rb"), "image/jpg"),
        )
    )


@pytest.mark.asyncio
async def test_complex(client: MultiPartClient):
    await client.form_data.file_array_and_basic(
        models.ComplexPartsRequest(
            id="123",
            address=models.Address(city="X"),
            pictures=[
                open(str(PNG), "rb").read(),
                open(str(PNG), "rb").read(),
            ],
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_json_part(client: MultiPartClient):
    await client.form_data.json_part(
        models.JsonPartRequest(
            address=models.Address(city="X"),
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_multi_binary_parts(client: MultiPartClient):
    await client.form_data.multi_binary_parts(
        models.MultiBinaryPartsRequest(
            profile_image=open(str(JPG), "rb").read(),
            picture=open(str(PNG), "rb").read(),
        )
    )
    await client.form_data.multi_binary_parts(
        models.MultiBinaryPartsRequest(
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_file_with_http_part_specific_content_type(client: MultiPartClient):
    await client.form_data.http_parts.content_type.image_jpeg_content_type(
        models.FileWithHttpPartSpecificContentTypeRequest(
            profile_image=("hello.jpg", open(str(JPG), "rb"), "image/jpg"),
        )
    )


@pytest.mark.asyncio
async def test_file_with_http_part_required_content_type(client: MultiPartClient):
    await client.form_data.http_parts.content_type.required_content_type(
        models.FileWithHttpPartRequiredContentTypeRequest(
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_file_with_http_part_optional_content_type(client: MultiPartClient):
    # call twice: one with content type, one without
    await client.form_data.http_parts.content_type.optional_content_type(
        models.FileWithHttpPartOptionalContentTypeRequest(
            profile_image=("hello.jpg", open(str(JPG), "rb").read()),
        )
    )
    await client.form_data.http_parts.content_type.optional_content_type(
        models.FileWithHttpPartOptionalContentTypeRequest(
            profile_image=("hello.jpg", open(str(JPG), "rb").read(), "application/octet-stream"),
        )
    )


@pytest.mark.asyncio
async def test_complex_with_http_part(client: MultiPartClient):
    await client.form_data.http_parts.json_array_and_file_array(
        models.ComplexHttpPartsModelRequest(
            id="123",
            previous_addresses=[
                models.Address(city="Y"),
                models.Address(city="Z"),
            ],
            address=models.Address(city="X"),
            pictures=[
                open(str(PNG), "rb").read(),
                open(str(PNG), "rb").read(),
            ],
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_http_parts_non_string_float(client: MultiPartClient):
    await client.form_data.http_parts.non_string.float(models.FloatRequest(temperature=0.5))


@pytest.mark.asyncio
async def test_with_wire_name(client: MultiPartClient):
    await client.form_data.with_wire_name(
        models.MultiPartRequestWithWireName(
            identifier="123",
            image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_optional_parts(client: MultiPartClient):
    # First time with only id
    await client.form_data.optional_parts(
        models.MultiPartOptionalRequest(
            id="123",
        )
    )
    # Second time with only profileImage
    await client.form_data.optional_parts(
        models.MultiPartOptionalRequest(
            profile_image=open(str(JPG), "rb").read(),
        )
    )
    # Third time with both id and profileImage
    await client.form_data.optional_parts(
        models.MultiPartOptionalRequest(
            id="123",
            profile_image=open(str(JPG), "rb").read(),
        )
    )


@pytest.mark.asyncio
async def test_file_upload_file_specific_content_type(client: MultiPartClient):
    await client.form_data.file.upload_file_specific_content_type(
        models.UploadFileSpecificContentTypeRequest(
            file=("image.png", open(str(PNG), "rb"), "image/png"),
        )
    )


@pytest.mark.asyncio
async def test_file_upload_file_required_filename(client: MultiPartClient):
    await client.form_data.file.upload_file_required_filename(
        models.UploadFileRequiredFilenameRequest(
            file=("image.png", open(str(PNG), "rb"), "image/png"),
        )
    )


@pytest.mark.asyncio
async def test_file_upload_file_array(client: MultiPartClient):
    await client.form_data.file.upload_file_array(
        models.UploadFileArrayRequest(
            files=[
                ("image.png", open(str(PNG), "rb"), "image/png"),
                ("image.png", open(str(PNG), "rb"), "image/png"),
            ],
        )
    )
