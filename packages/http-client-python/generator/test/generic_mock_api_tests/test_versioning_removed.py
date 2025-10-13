# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from versioning.removed import RemovedClient
from versioning.removed.models import ModelV2, EnumV2, ModelV3, EnumV3


@pytest.fixture
def client():
    with RemovedClient(endpoint="http://localhost:3000", version="v2") as client:
        yield client


def test_v2(client: RemovedClient):
    assert client.v2(ModelV2(prop="foo", enum_prop=EnumV2.ENUM_MEMBER_V2, union_prop="bar")) == ModelV2(
        prop="foo", enum_prop=EnumV2.ENUM_MEMBER_V2, union_prop="bar"
    )


def test_model_v3():
    client1 = RemovedClient(endpoint="http://localhost:3000", version="v1")
    model1 = ModelV3(id="123", enum_prop=EnumV3.ENUM_MEMBER_V1)
    result = client1.model_v3(model1)
    assert result == model1

    client2 = RemovedClient(endpoint="http://localhost:3000", version="v2preview")
    model2 = ModelV3(id="123")
    result = client2.model_v3(model2)
    assert result == model2

    client3 = RemovedClient(endpoint="http://localhost:3000", version="v2")
    model3 = ModelV3(id="123", enum_prop=EnumV3.ENUM_MEMBER_V1)
    result = client3.model_v3(model3)
    assert result == model3
