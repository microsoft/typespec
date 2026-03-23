# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from pygen.codegen.models import (
    Operation,
    Response,
    ParameterList,
    CodeModel,
    RequestBuilder,
    Client,
)
from pygen.codegen.models.parameter_list import RequestBuilderParameterList
from pygen.codegen.models.primitive_types import StringType


@pytest.fixture
def code_model():
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "blah",
                    "moduleName": "blah",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "namespace",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
            "version-tolerant": True,
            "flavor": "azure",
            "tracing": False,
            "azure-arm": False,
            "head-as-boolean": False,
            "combine-operation-files": False,
            "validate-versioning": False,
        },
    )


@pytest.fixture
def client(code_model):
    return Client(
        {
            "name": "client",
            "namespace": "blah",
            "moduleName": "blah",
            "parameters": [],
            "url": "",
            "operationGroups": [],
        },
        code_model,
        parameters=[],
    )


@pytest.fixture
def request_builder(code_model, client):
    return RequestBuilder(
        yaml_data={
            "url": "http://fake.com",
            "method": "GET",
            "groupName": "blah",
            "isOverload": False,
            "apiVersions": [],
        },
        client=client,
        code_model=code_model,
        name="test_imports_operation",
        parameters=RequestBuilderParameterList({}, code_model, parameters=[]),
    )


@pytest.fixture
def base_type(code_model):
    return StringType({"type": "string"}, code_model)


def _make_operation(code_model, client, request_builder, responses, exceptions=None):
    return Operation(
        yaml_data={
            "url": "http://fake.com",
            "method": "GET",
            "groupName": "blah",
            "isOverload": False,
            "apiVersions": [],
        },
        client=client,
        code_model=code_model,
        request_builder=request_builder,
        name="test_imports_operation",
        parameters=ParameterList({}, code_model, []),
        responses=responses,
        exceptions=exceptions or [],
    )


def _has_import(file_import, submodule_name):
    """Check whether a FileImport contains an import with the given submodule_name."""
    return any(imp.submodule_name == submodule_name for imp in file_import.imports)


def test_operation_imports_both_deserialize_xml_and_json(
    code_model, client, request_builder, base_type
):
    """When an operation has both XML and JSON/typed responses, both
    _deserialize_xml and _deserialize should be imported."""
    xml_response = Response(
        yaml_data={"statusCodes": [200], "defaultContentType": "application/xml"},
        code_model=code_model,
        headers=[],
        type=base_type,
    )
    json_response = Response(
        yaml_data={"statusCodes": [201], "defaultContentType": "application/json"},
        code_model=code_model,
        headers=[],
        type=base_type,
    )
    operation = _make_operation(
        code_model, client, request_builder, responses=[xml_response, json_response]
    )

    assert operation.enable_import_deserialize_xml
    assert operation.need_deserialize

    file_import = operation.imports(async_mode=False, serialize_namespace="namespace")
    assert _has_import(file_import, "_deserialize_xml")
    assert _has_import(file_import, "_deserialize")


def test_operation_imports_only_xml(
    code_model, client, request_builder, base_type
):
    """When an operation has only XML responses, _deserialize_xml should be
    imported.  _deserialize should also be present because the response has
    a non-binary type (triggers need_deserialize)."""
    xml_response = Response(
        yaml_data={"statusCodes": [200], "defaultContentType": "application/xml"},
        code_model=code_model,
        headers=[],
        type=base_type,
    )
    operation = _make_operation(
        code_model, client, request_builder, responses=[xml_response]
    )

    assert operation.enable_import_deserialize_xml

    file_import = operation.imports(async_mode=False, serialize_namespace="namespace")
    assert _has_import(file_import, "_deserialize_xml")


def test_operation_imports_only_json(
    code_model, client, request_builder, base_type
):
    """When an operation has only JSON responses (no XML), _deserialize
    should be imported but _deserialize_xml should NOT."""
    json_response = Response(
        yaml_data={"statusCodes": [200], "defaultContentType": "application/json"},
        code_model=code_model,
        headers=[],
        type=base_type,
    )
    operation = _make_operation(
        code_model, client, request_builder, responses=[json_response]
    )

    assert not operation.enable_import_deserialize_xml
    assert operation.need_deserialize

    file_import = operation.imports(async_mode=False, serialize_namespace="namespace")
    assert not _has_import(file_import, "_deserialize_xml")
    assert _has_import(file_import, "_deserialize")
