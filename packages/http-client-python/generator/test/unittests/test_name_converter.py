# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from pygen.preprocess import PreProcessPlugin
from pygen.preprocess.python_mappings import PadType, RESERVED_TSP_MODEL_PROPERTIES


def pad_reserved_words(name: str, pad_type: PadType) -> str:
    return PreProcessPlugin(output_folder="").pad_reserved_words(name, pad_type, {})


def make_tsp_plugin() -> PreProcessPlugin:
    """Create a PreProcessPlugin with is_tsp=True (as used by the TypeSpec Python emitter)."""
    return PreProcessPlugin(output_folder="", tsp_file="true")


def make_body_parameter_yaml(property_to_parameter_name: dict) -> dict:
    """Create a minimal body parameter yaml_data dict for update_parameter tests."""
    return {
        "description": "",
        "location": "body",
        "clientName": "body",
        "propertyToParameterName": property_to_parameter_name,
        "type": {"type": "model"},
        "wireName": None,
    }


def mangled_property_name(name: str) -> str:
    """Return the Python-mangled form of a name when used as a model property client name."""
    return name + PadType.PROPERTY.value


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


def test_mapping_protocol_names_are_tsp_property_reserved_words():
    """Verify that all Mapping protocol method names are reserved for TSP model properties."""
    # These names conflict with Python's Mapping/MutableMapping protocol, so model
    # property *client names* must be renamed (e.g. items -> items_property).
    for name in RESERVED_TSP_MODEL_PROPERTIES:
        result = make_tsp_plugin().pad_reserved_words(name, PadType.PROPERTY, {})
        expected = mangled_property_name(name)
        assert result == expected, (
            f"Expected '{name}' to be padded to '{expected}' "
            f"when used as a model property client name, but got '{result}'"
        )


def test_mapping_protocol_names_are_not_parameter_reserved_words():
    """Verify that Mapping protocol names are NOT reserved for method parameters.

    Parameters can be named 'items', 'keys', etc. without renaming because they
    are ordinary Python variables, not attributes on a Mapping subclass.
    """
    for name in RESERVED_TSP_MODEL_PROPERTIES:
        result = make_tsp_plugin().pad_reserved_words(name, PadType.PARAMETER, {})
        assert result == name, (
            f"Expected '{name}' to remain unchanged as a parameter name, but got '{result}'"
        )


@pytest.mark.parametrize("mapping_name", RESERVED_TSP_MODEL_PROPERTIES)
def test_update_parameter_property_to_parameter_name_wire_keys_not_padded(mapping_name):
    """Wire-name keys in propertyToParameterName must NOT be padded.

    When a TypeSpec operation uses a spread body (e.g. `op doSomething(items: string[]): void;`),
    the emitter builds propertyToParameterName with wire names as keys and Python parameter names
    as values.  The preprocess step must leave the wire-name keys alone so they are sent correctly
    on the wire (e.g. JSON key "items", not the mangled "items_property").
    """
    plugin = make_tsp_plugin()
    yaml_data = make_body_parameter_yaml({mapping_name: mapping_name})
    plugin.update_parameter(yaml_data)

    assert mapping_name in yaml_data["propertyToParameterName"], (
        f"Wire name '{mapping_name}' must remain as the key in propertyToParameterName "
        f"but was not found. Current keys: {list(yaml_data['propertyToParameterName'].keys())}"
    )
    mangled = mangled_property_name(mapping_name)
    assert mangled not in yaml_data["propertyToParameterName"], (
        f"Mangled name '{mangled}' must NOT appear as a key in propertyToParameterName "
        f"because keys are wire names, not Python property names."
    )


def test_update_parameter_property_to_parameter_name_values_are_padded():
    """Parameter-name values in propertyToParameterName ARE padded when they match reserved words.

    The values are Python parameter names passed to the generated method.  Names that conflict
    with reserved parameter words (e.g. 'continuation_token') must still be renamed.
    """
    plugin = make_tsp_plugin()
    yaml_data = make_body_parameter_yaml({"continuation_token": "continuation_token"})
    plugin.update_parameter(yaml_data)

    # Wire-name key stays unchanged
    assert "continuation_token" in yaml_data["propertyToParameterName"]
    # Python parameter value is padded
    assert yaml_data["propertyToParameterName"]["continuation_token"] == "continuation_token_parameter"


def test_update_parameter_items_wire_name_preserved():
    """Regression test: 'items' spread-body wire name must not be mangled to 'items_property'.

    Reproduces the bug reported in GitHub issue:
      op doSomething(items: string[]): void;
    The request body JSON key must be "items", not "items_property".
    """
    plugin = make_tsp_plugin()
    yaml_data = make_body_parameter_yaml({"items": "items"})
    plugin.update_parameter(yaml_data)

    assert yaml_data["propertyToParameterName"] == {"items": "items"}, (
        f"Expected {{'items': 'items'}} but got {yaml_data['propertyToParameterName']}. "
        f"The wire name 'items' was incorrectly mangled."
    )


def test_update_parameter_all_mapping_names_wire_names_preserved():
    """Regression test: all Mapping protocol names as spread-body wire names must be preserved."""
    plugin = make_tsp_plugin()
    # Build a dict with all mapping names as both wire names and parameter names
    property_to_param = {name: name for name in RESERVED_TSP_MODEL_PROPERTIES}
    yaml_data = make_body_parameter_yaml(property_to_param)
    plugin.update_parameter(yaml_data)

    result = yaml_data["propertyToParameterName"]
    for wire_name in RESERVED_TSP_MODEL_PROPERTIES:
        assert wire_name in result, (
            f"Wire name '{wire_name}' was incorrectly mangled. "
            f"Current keys: {list(result.keys())}"
        )
        mangled = mangled_property_name(wire_name)
        assert mangled not in result, (
            f"Mangled key '{mangled}' must not appear; wire names must not be padded."
        )
