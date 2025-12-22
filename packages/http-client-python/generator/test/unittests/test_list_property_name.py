# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Test that a property named 'list' doesn't cause syntax errors in generated code."""

import pytest
from pygen.codegen.models import CodeModel, ListType, Property
from pygen.codegen.models.primitive_types import StringType


def test_has_property_named_list():
    """Test that has_property_named_list property works correctly."""
    # Mock a code model with a property named "list"
    yaml_data = {
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
    
    options = {
        "version-tolerant": True,
        "models-mode": "dpg",
    }
    
    code_model = CodeModel(yaml_data, options)
    
    # Check that the property is detected
    assert code_model.has_property_named_list is True


def test_list_type_annotation_with_property_named_list():
    """Test that ListType uses 'List' instead of 'list' when property named list exists."""
    # Mock a code model with a property named "list"
    yaml_data = {
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
    
    options = {
        "version-tolerant": True,
        "models-mode": "dpg",
    }
    
    code_model = CodeModel(yaml_data, options)
    
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


def test_list_type_annotation_without_property_named_list():
    """Test that ListType uses 'list' when no property named list exists."""
    # Mock a code model without a property named "list"
    yaml_data = {
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
    
    options = {
        "version-tolerant": True,
        "models-mode": "dpg",
    }
    
    code_model = CodeModel(yaml_data, options)
    
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


def test_list_import_added_when_needed():
    """Test that List is imported from typing when needed."""
    # Mock a code model with a property named "list"
    yaml_data = {
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
    
    options = {
        "version-tolerant": True,
        "models-mode": "dpg",
    }
    
    code_model = CodeModel(yaml_data, options)
    
    # Create a ListType
    element_type = StringType({"type": "string"}, code_model)
    list_type = ListType(
        {"type": "list", "elementType": {"type": "string"}},
        code_model,
        element_type,
    )
    
    # Test imports in model file context
    file_import = list_type.imports(is_operation_file=False)
    
    # Check that List is imported
    has_list_import = any(
        i.module_name == "typing" and i.submodule_name == "List"
        for i in file_import.imports
    )
    assert has_list_import, "Expected List to be imported from typing"
