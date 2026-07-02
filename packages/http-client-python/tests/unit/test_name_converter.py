# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pygen.preprocess import PreProcessPlugin
from pygen.preprocess.python_mappings import PadType


def pad_reserved_words(name: str, pad_type: PadType) -> str:
    return PreProcessPlugin(output_folder="").pad_reserved_words(name, pad_type, {})


def test_escaped_reserved_words():
    expected_conversion_model = {"Self": "Self", "And": "AndModel"}
    for name in expected_conversion_model:
        assert pad_reserved_words(name, pad_type=PadType.MODEL) == expected_conversion_model[name]

    expected_conversion_method = {
        "self": "self",
        "and": "and_method",
        "content_type": "content_type",
    }
    for name in expected_conversion_method:
        assert pad_reserved_words(name, pad_type=PadType.METHOD) == expected_conversion_method[name]

    expected_conversion_parameter = {
        "content_type": "content_type_parameter",
        "request_id": "request_id_parameter",
        "elif": "elif_parameter",
        "self": "self_parameter",
        "continuation_token": "continuation_token_parameter",
    }
    for name in expected_conversion_parameter:
        assert pad_reserved_words(name, pad_type=PadType.PARAMETER) == expected_conversion_parameter[name]


def test_update_types_accepts_numeric_enum_value_names():
    standalone_enum_value = {"name": 20200101, "isExactName": False, "type": "enumvalue"}
    nested_enum_value = {"name": 20210101, "isExactName": False, "type": "enumvalue", "value": "2021-01-01"}
    nested_digits_enum_value = {
        "name": 20220101,
        "isExactName": False,
        "type": "enumvalue",
        "value": "20220101",
    }
    enum_type = {"name": "ApiVersion", "type": "enum", "values": [nested_enum_value, nested_digits_enum_value]}

    PreProcessPlugin(output_folder="").update_types([standalone_enum_value, enum_type])

    assert standalone_enum_value["description"] == "20200101."
    assert standalone_enum_value["snakeCaseName"] == "20200101"
    assert nested_enum_value["name"] == "ENUM_2021_01_01"
    assert nested_digits_enum_value["name"] == "ENUM_20220101"
