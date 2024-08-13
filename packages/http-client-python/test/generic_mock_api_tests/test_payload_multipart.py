# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path
import pytest
from payload.multipart import MultiPartClient, models

JPG = Path(__file__).parent / "data/image.jpg"
PNG = Path(__file__).parent / "data/image.png"


@pytest.fixture
def client():
    with MultiPartClient(endpoint="http://localhost:3000") as client:
        yield client


def test_anonymous_model(client: MultiPartClient):
    client.form_data.anonymous_model({"profileImage": open(str(JPG), "rb")})


def test_basic(client: MultiPartClient):
    client.form_data.basic(
        models.MultiPartRequest(
            id="123",
            profile_image=open(str(JPG), "rb"),
        )
    )


def test_binary_array_parts(client: MultiPartClient):
    client.form_data.binary_array_parts(
        models.BinaryArrayPartsRequest(
            id="123",
            pictures=[
                open(str(PNG), "rb"),
                open(str(PNG), "rb"),
            ],
        )
    )


def test_check_file_name_and_content_type(client: MultiPartClient):
    client.form_data.check_file_name_and_content_type(
        models.MultiPartRequest(
            id="123",
            profile_image=("hello.jpg", open(str(JPG), "rb"), "image/jpg"),
        )
    )


def test_complex(client: MultiPartClient):
    client.form_data.complex(
        models.ComplexPartsRequest(
            id="123",
            previous_addresses=[
                models.Address(city="Y"),
                models.Address(city="Z"),
            ],
            address=models.Address(city="X"),
            pictures=[
                open(str(PNG), "rb"),
                open(str(PNG), "rb"),
            ],
            profile_image=open(str(JPG), "rb"),
        )
    )


def test_json_array_parts(client: MultiPartClient):
    client.form_data.json_array_parts(
        models.JsonArrayPartsRequest(
            previous_addresses=[
                models.Address(city="Y"),
                models.Address(city="Z"),
            ],
            profile_image=open(str(JPG), "rb"),
        )
    )


def test_json_part(client: MultiPartClient):
    client.form_data.json_part(
        models.JsonPartRequest(
            address=models.Address(city="X"),
            profile_image=open(str(JPG), "rb"),
        )
    )


def test_multi_binary_parts(client: MultiPartClient):
    client.form_data.multi_binary_parts(
        models.MultiBinaryPartsRequest(
            profile_image=open(str(JPG), "rb"),
            picture=open(str(PNG), "rb"),
        )
    )
    client.form_data.multi_binary_parts(
        models.MultiBinaryPartsRequest(
            profile_image=open(str(JPG), "rb"),
        )
    )
