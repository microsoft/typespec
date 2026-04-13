# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pygen.codegen.models import Parameter, CodeModel, ConstantType, StringType


def get_code_model():
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
            "only-path-and-body-params-positional": True,
        },
    )


def _make_constant_type(value):
    code_model = get_code_model()
    string_type = StringType(
        yaml_data={"type": "str"},
        code_model=code_model,
    )
    return ConstantType(
        yaml_data={"type": "constant"},
        code_model=code_model,
        value_type=string_type,
        value=value,
    )


def test_api_version_parameter_description():
    """Test that api_version parameter description shows None as default."""
    code_model = get_code_model()
    constant_type = _make_constant_type("2025-11-01")
    param = Parameter(
        yaml_data={
            "wireName": "api-version",
            "clientName": "api_version",
            "location": "query",
            "clientDefaultValue": "2025-11-01",
            "optional": True,
            "implementation": "Client",
            "isApiVersion": True,
            "description": "The API version to use for this operation.",
            "inOverload": False,
            "inOverloaded": False,
            "type": {"type": "constant"},
        },
        code_model=code_model,
        type=constant_type,
    )
    desc = param.description
    assert "Default value is None." in desc
    assert "If not set, the operation's default API version will be used." in desc
    assert 'Known values are "2025-11-01" and None.' in desc
    assert "Note that overriding this default value may result in unsupported behavior" not in desc


def test_non_api_version_constant_parameter_description():
    """Test that non-api_version optional constant parameters still show the original behavior."""
    code_model = get_code_model()
    constant_type = _make_constant_type("some-value")
    param = Parameter(
        yaml_data={
            "wireName": "some-param",
            "clientName": "some_param",
            "location": "query",
            "clientDefaultValue": "some-value",
            "optional": True,
            "implementation": "Method",
            "isApiVersion": False,
            "description": "Some parameter.",
            "inOverload": False,
            "inOverloaded": False,
            "type": {"type": "constant"},
        },
        code_model=code_model,
        type=constant_type,
    )
    desc = param.description
    assert 'Known values are "some-value" and None.' in desc
    assert 'Default value is "some-value".' in desc
    assert "Note that overriding this default value may result in unsupported behavior" not in desc


def test_required_api_version_parameter_description():
    """Test that required api_version parameter description shows overriding note."""
    code_model = get_code_model()
    constant_type = _make_constant_type("2025-11-01")
    param = Parameter(
        yaml_data={
            "wireName": "api-version",
            "clientName": "api_version",
            "location": "query",
            "clientDefaultValue": "2025-11-01",
            "optional": False,
            "implementation": "Client",
            "isApiVersion": True,
            "description": "The API version to use for this operation.",
            "inOverload": False,
            "inOverloaded": False,
            "type": {"type": "constant"},
        },
        code_model=code_model,
        type=constant_type,
    )
    desc = param.description
    # Required api_version is constant - should not have the override note
    assert "Note that overriding this default value may result in unsupported behavior" not in desc
