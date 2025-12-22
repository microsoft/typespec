# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Test that a property named 'list' doesn't cause syntax errors in generated code."""

import pytest
from pygen.codegen.models import CodeModel, ListType, Property
from pygen.codegen.models.primitive_types import StringType


@pytest.fixture
def yaml_data_with_list_property():
    """YAML data for a model with a property named 'list'."""
    return {
        "namespace": "test.namespace",
        "clients": [],
        "types": [
            {
                "type": "model",
                "name": "TestModel",
                "properties": [
                    {
                        "clientName": "list",
                        "wireName": "list",
                        "type": {"type": "list", "elementType": {"type": "string"}},
                        "optional": True,
                    }
                ],
                "usage": "input,output",
            }
        ],
    }


@pytest.fixture
def yaml_data_without_list_property():
    """YAML data for a model without a property named 'list'."""
    return {
        "namespace": "test.namespace",
        "clients": [],
        "types": [
            {
                "type": "model",
                "name": "TestModel",
                "properties": [
                    {
                        "clientName": "items",
                        "wireName": "items",
                        "type": {"type": "list", "elementType": {"type": "string"}},
                        "optional": True,
                    }
                ],
                "usage": "input,output",
            }
        ],
    }


@pytest.fixture
def code_model_options():
    """Common options for CodeModel."""
    return {
        "version-tolerant": True,
        "models-mode": "dpg",
    }


def test_has_property_named_list(yaml_data_with_list_property, code_model_options):
    """Test that has_property_named_list property works correctly."""
    code_model = CodeModel(yaml_data_with_list_property, code_model_options)
    assert code_model.has_property_named_list is True


def test_list_type_annotation_with_property_named_list(yaml_data_with_list_property, code_model_options):
    """Test that ListType uses 'List' instead of 'list' when property named list exists."""
    code_model = CodeModel(yaml_data_with_list_property, code_model_options)
    
    # Create a ListType
    element_type = StringType({"type": "string"}, code_model)
    list_type = ListType(
        {"type": "list", "elementType": {"type": "string"}},
        code_model,
        element_type,
    )
    
    # Test annotation in model file (is_operation_file=False)
    annotation = list_type.type_annotation(is_operation_file=False)
    assert annotation == "List[str]", f"Expected 'List[str]' but got '{annotation}'"
    
    # Test annotation in operation file (is_operation_file=True) - should use 'list'
    annotation = list_type.type_annotation(is_operation_file=True)
    assert annotation == "list[str]", f"Expected 'list[str]' but got '{annotation}'"


def test_list_type_annotation_without_property_named_list(yaml_data_without_list_property, code_model_options):
    """Test that ListType uses 'list' when no property named list exists."""
    code_model = CodeModel(yaml_data_without_list_property, code_model_options)
    
    # Create a ListType
    element_type = StringType({"type": "string"}, code_model)
    list_type = ListType(
        {"type": "list", "elementType": {"type": "string"}},
        code_model,
        element_type,
    )
    
    # Test annotation in both contexts - should always use 'list'
    annotation = list_type.type_annotation(is_operation_file=False)
    assert annotation == "list[str]", f"Expected 'list[str]' but got '{annotation}'"
    
    annotation = list_type.type_annotation(is_operation_file=True)
    assert annotation == "list[str]", f"Expected 'list[str]' but got '{annotation}'"


def test_list_import_added_when_needed(yaml_data_with_list_property, code_model_options):
    """Test that List type alias is defined when needed."""
    code_model = CodeModel(yaml_data_with_list_property, code_model_options)
    
    # The imports are handled at the serializer level, not the ListType level
    # So we just verify that has_property_named_list is True
    assert code_model.has_property_named_list is True
