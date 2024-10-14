# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.example.basic.aio import AzureExampleClient
from specs.azure.example.basic.models import ActionRequest, Model


@pytest.fixture
async def client():
    async with AzureExampleClient() as client:
        yield client


@pytest.mark.asyncio
async def test_basic_action(client: AzureExampleClient):
    body = ActionRequest(
        string_property="text",
        model_property=Model(int32_property=1, float32_property=1.5, enum_property="EnumValue1"),
        array_property=["item"],
        record_property={"record": "value"},
    )
    result = await client.basic_action(
        body=body,
        query_param="query",
        header_param="header",
    )
    assert result.string_property == body.string_property
