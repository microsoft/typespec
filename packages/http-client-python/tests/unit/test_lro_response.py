# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

from types import SimpleNamespace

import pytest

from pygen.codegen.serializers.builder_serializer import LROOperationSerializer


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


class _TestLROOperationSerializer(LROOperationSerializer):
    def response_headers_and_deserialization(self, builder, response):
        return ["deserialized = response.json()"]


@pytest.mark.parametrize("models_mode", [None, "dpg"])
@pytest.mark.parametrize("generate_typeddict_only", [False, True])
def test_lro_response_is_available_for_deserialization(models_mode, generate_typeddict_only):
    code_model = SimpleNamespace(
        options={"models-mode": models_mode},
        generate_typeddict_only=generate_typeddict_only,
        get_serialize_namespace=lambda *args, **kwargs: "test",
    )
    serializer = _TestLROOperationSerializer(code_model, async_mode=False, client_namespace="test")
    operation = SimpleNamespace(
        lro_response=SimpleNamespace(headers=[], type=object()),
    )

    generated = serializer.get_long_running_output(operation)

    assert "    response = pipeline_response.http_response" in generated
    assert "    deserialized = response.json()" in generated
