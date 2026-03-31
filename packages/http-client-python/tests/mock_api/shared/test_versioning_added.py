# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.added import AddedClient
from versioning.added.models import ModelV1, ModelV2, EnumV1, EnumV2


@pytest.fixture
def client():
    with AddedClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


def test_v1(client: AddedClient):
    assert client.v1(
        ModelV1(prop="foo", enum_prop=EnumV1.ENUM_MEMBER_V2, union_prop=10),
        header_v2="bar",
    ) == ModelV1(prop="foo", enum_prop=EnumV1.ENUM_MEMBER_V2, union_prop=10)


def test_v2(client: AddedClient):
    assert client.v2(ModelV2(prop="foo", enum_prop=EnumV2.ENUM_MEMBER, union_prop="bar")) == ModelV2(
        prop="foo", enum_prop=EnumV2.ENUM_MEMBER, union_prop="bar"
    )


def test_interface_v2(client: AddedClient):
    assert client.interface_v2.v2_in_interface(
        ModelV2(prop="foo", enum_prop=EnumV2.ENUM_MEMBER, union_prop="bar")
    ) == ModelV2(prop="foo", enum_prop=EnumV2.ENUM_MEMBER, union_prop="bar")
