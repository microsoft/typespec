# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

from types import SimpleNamespace

import pytest

from pygen import OptionsDict
from pygen.codegen.models import CodeModel, build_type
from pygen.codegen.models.lro_operation import LROOperationBase
from pygen.codegen.models.response import LROResponse
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


@pytest.mark.parametrize(
    "models_mode, expected",
    [("dpg", ["parent_", "class_"]), ("msrest", ["parent_", "class_"]), ("none", ["wire.parent", "wire.class"])],
)
def test_monitor_metadata_paths_use_model_names_or_wire_names(models_mode, expected):
    code_model = CodeModel(
        {
            "namespace": "sample",
            "clients": [
                {
                    "name": "client",
                    "namespace": "sample",
                    "moduleName": "sample",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
        },
        OptionsDict({"models-mode": models_mode, "flavor": "azure", "tsp_file": True}),
    )
    monitor = build_type(
        {
            "type": "model",
            "base": "dpg",
            "name": "Monitor",
            "snakeCaseName": "monitor",
            "properties": [
                {
                    "wireName": "wire.parent",
                    "clientName": "parent_",
                    "optional": True,
                    "type": {
                        "type": "model",
                        "base": "dpg",
                        "name": "Details",
                        "snakeCaseName": "details",
                        "properties": [
                            {
                                "wireName": "wire.class",
                                "clientName": "class_",
                                "optional": True,
                                "type": {"type": "string"},
                            }
                        ],
                    },
                }
            ],
        },
        code_model,
    )
    operation = LROOperationBase.__new__(LROOperationBase)
    operation.code_model = code_model
    operation.status_monitor_type = monitor
    properties = operation._metadata_properties(["wire.parent", "wire.class"])
    assert properties[-1].client_name == "class_"
    assert operation._metadata_path(properties) == expected


@pytest.mark.parametrize("async_mode", [False, True])
@pytest.mark.parametrize("subdir", [None, "_generated"])
def test_metadata_poller_paths_use_the_public_package(async_mode, subdir):
    response = LROResponse.__new__(LROResponse)
    response.code_model = SimpleNamespace(namespace="sample", options={"generation-subdir": subdir})
    response.has_lro_metadata = True
    package = f"sample.{subdir}" if subdir else "sample"

    assert response.get_poller_path(async_mode) == (
        f"{package}.aio.AsyncMetadataLROPoller" if async_mode else f"{package}.MetadataLROPoller"
    )
    assert response.get_polling_method_path(async_mode) == (
        f"{package}._polling._AsyncMetadataPolling" if async_mode else f"{package}._polling._MetadataPolling"
    )
