# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.visibility import VisibilityClient, models


@pytest.fixture
def client():
    with VisibilityClient() as client:
        yield client


def test_get_model(client):
    result = client.get_model(models.VisibilityModel(query_prop=123))
    assert result == models.VisibilityModel(read_prop="abc")


def test_put_model(client):
    client.put_model(models.VisibilityModel(create_prop=["foo", "bar"], update_prop=[1, 2]))


def test_patch_model(client):
    client.patch_model(models.VisibilityModel(update_prop=[1, 2]))


def test_post_model(client):
    client.post_model(models.VisibilityModel(create_prop=["foo", "bar"]))


def test_delete_model(client):
    client.delete_model(models.VisibilityModel(delete_prop=True))


def test_put_read_only_model(client):
    client.put_read_only_model(
        models.ReadOnlyModel(optional_nullable_int_list=[1, 2], optional_string_record={"foo", "bar"})
    )
