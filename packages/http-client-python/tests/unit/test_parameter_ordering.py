# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pygen.codegen.models import Parameter, AnyType, CodeModel, StringType
from pygen.codegen.models.parameter_list import ParameterList


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


def get_parameter(name, required, default_value=None, type=None):
    if not type:
        type = AnyType(
            yaml_data={"type": "any"},
            code_model=get_code_model(),
        )

    return Parameter(
        yaml_data={
            "wireName": name,
            "clientName": name,
            "location": "path",
            "clientDefaultValue": default_value,
            "optional": not required,
            "implementation": "Method",
            "inOverload": False,
            "inOverloaded": False,
        },
        code_model=get_code_model(),
        type=type,
    )


def test_sort_parameters_with_default_value_from_schema():
    type = StringType(
        yaml_data={"clientDefaultValue": "this_is_the_default", "type": "str"},
        code_model=get_code_model(),
    )
    parameter_with_default_schema_value_required = get_parameter(
        name="required_param_with_schema_default", required=True, type=type
    )
    required_parameter = get_parameter(name="required_parameter", required=True)

    parameter_list = [parameter_with_default_schema_value_required, required_parameter]

    assert [
        required_parameter,
        parameter_with_default_schema_value_required,
    ] == ParameterList({}, get_code_model(), parameter_list).method


def test_sort_required_parameters():
    required_default_value_parameter = get_parameter(
        name="required_default_value_parameter", required=True, default_value="hello"
    )
    required_parameter = get_parameter(name="required_parameter", required=True)

    parameter_list = [required_parameter, required_default_value_parameter]

    assert [required_parameter, required_default_value_parameter] == ParameterList(
        {}, get_code_model(), parameter_list
    ).method

    # switch around ordering to confirm

    parameter_list = [required_default_value_parameter, required_parameter]

    assert [required_parameter, required_default_value_parameter] == ParameterList(
        {}, get_code_model(), parameter_list
    ).method


def test_sort_required_and_non_required_parameters():
    required_parameter = get_parameter(name="required_parameter", required=True)

    optional_parameter = get_parameter(name="optional_parameter", required=False)

    parameter_list = [optional_parameter, required_parameter]

    assert [required_parameter, optional_parameter] == ParameterList({}, get_code_model(), parameter_list).method
