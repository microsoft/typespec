# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Tests for generation-subdir option: verifies that _validation.py and _types.py
are placed in the correct directory (generation_dir, not root_dir) when
generation-subdir is configured.
"""
from pathlib import Path
from pygen.codegen.models import CodeModel
from pygen import OptionsDict


def get_code_model(namespace="generation.subdir2", generation_subdir=None):
    """Create a minimal CodeModel for testing."""
    options = {
        "show-send-request": True,
        "builders-visibility": "public",
        "show-operations": True,
        "models-mode": "dpg",
    }
    if generation_subdir is not None:
        options["generation-subdir"] = generation_subdir

    return CodeModel(
        {
            "clients": [
                {
                    "name": "Client",
                    "namespace": namespace,
                    "moduleName": namespace.replace(".", "_"),
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": namespace,
        },
        options=OptionsDict(options),
    )


def test_get_root_dir_without_generation_subdir():
    """Root dir should be the namespace path when no generation-subdir."""
    code_model = get_code_model("generation.subdir2", generation_subdir=None)
    assert code_model.get_root_dir() == Path("generation/subdir2")


def test_get_root_dir_with_generation_subdir():
    """Root dir should NOT include generation-subdir."""
    code_model = get_code_model("generation.subdir2", generation_subdir="_generated")
    assert code_model.get_root_dir() == Path("generation/subdir2")


def test_get_generation_dir_without_generation_subdir():
    """Generation dir should equal root dir when no generation-subdir."""
    code_model = get_code_model("generation.subdir2", generation_subdir=None)
    namespace = "generation.subdir2"
    assert code_model.get_generation_dir(namespace) == Path("generation/subdir2")


def test_get_generation_dir_with_generation_subdir():
    """Generation dir should include the generation-subdir when configured.

    This is the critical test: _validation.py and _types.py should be placed
    in generation_dir = root_dir / generation-subdir, not in root_dir.
    For example, with namespace="generation.subdir2" and generation-subdir="_generated":
    - root_dir = "generation/subdir2"
    - generation_dir = "generation/subdir2/_generated"
    - _validation.py → "generation/subdir2/_generated/_validation.py"  ✓
    """
    code_model = get_code_model("generation.subdir2", generation_subdir="_generated")
    namespace = "generation.subdir2"
    assert code_model.get_generation_dir(namespace) == Path("generation/subdir2/_generated")


def test_validation_py_in_generation_dir_not_root_dir():
    """_validation.py should be in generation_dir, not root_dir.

    This verifies the fix for: [python] validation file generating into wrong directory.
    When generation-subdir="_generated", the root dir is "generation/subdir2"
    but _validation.py must be in "generation/subdir2/_generated/" so that
    the relative import `from .._validation import api_version_validation`
    works correctly in "generation/subdir2/_generated/operations/_operations.py".
    """
    code_model = get_code_model("generation.subdir2", generation_subdir="_generated")
    namespace = "generation.subdir2"
    root_dir = code_model.get_root_dir()
    generation_dir = code_model.get_generation_dir(namespace)

    # root_dir and generation_dir should be different when generation-subdir is set
    assert root_dir != generation_dir

    # The _validation.py should be in generation_dir, not root_dir
    validation_path = generation_dir / Path("_validation.py")
    root_validation_path = root_dir / Path("_validation.py")
    assert validation_path != root_validation_path

    # generation_dir should be root_dir / generation-subdir
    assert generation_dir == root_dir / "_generated"


def test_relative_import_path_for_validation():
    """Verify the import path for _validation from operations namespace.

    When generation-subdir="_generated":
    - Operations file is at: generation/subdir2/_generated/operations/_operations.py
    - Python module: generation.subdir2._generated.operations._operations
    - _validation.py is at: generation/subdir2/_generated/_validation.py
    - Python module: generation.subdir2._generated._validation

    The import `from .._validation import api_version_validation` resolves correctly:
    - `..` from generation.subdir2._generated.operations → generation.subdir2._generated
    - `_validation` → generation.subdir2._generated._validation ✓
    """
    code_model = get_code_model("generation.subdir2", generation_subdir="_generated")

    # Test with explicit operations namespace (the actual serialize_namespace used for operations)
    # Whether it's "operations" or "_operations" depends on version-tolerant mode,
    # but both result in the same ".._validation" import path
    for ops_folder in ("operations", "_operations"):
        serialize_namespace = f"generation.subdir2.{ops_folder}"

        # The relative import path from operations to the main namespace
        relative_path = code_model.get_relative_import_path(
            serialize_namespace, module_name="_validation"
        )
        # Should be ".._validation" (2 dots to go up from operations to main ns, then _validation)
        assert relative_path == ".._validation", (
            f"Expected '.._validation' for serialize_namespace={serialize_namespace!r}, "
            f"got {relative_path!r}"
        )


def test_relative_import_path_for_types():
    """Verify the import path for _types from operations namespace."""
    code_model = get_code_model("generation.subdir2", generation_subdir="_generated")

    # Test with explicit operations namespaces
    for ops_folder in ("operations", "_operations"):
        serialize_namespace = f"generation.subdir2.{ops_folder}"

        # The relative import path from operations to the main namespace for _types
        relative_path = code_model.get_relative_import_path(serialize_namespace)
        # Should be ".." (go up to parent - i.e., the _generated directory)
        assert relative_path == "..", (
            f"Expected '..' for serialize_namespace={serialize_namespace!r}, "
            f"got {relative_path!r}"
        )


def test_azure_storage_blob_scenario():
    """Test the Azure Storage Blob scenario from the issue.

    In the Azure Storage Blob SDK, the namespace is 'azure.storage.blob' and
    generation-subdir is '_generated'. Operations are in:
      azure/storage/blob/_generated/operations/_operations.py
    
    When generation-subdir was not properly handled, _validation.py was placed at
    azure/storage/blob/_validation.py (root_dir) instead of
    azure/storage/blob/_generated/_validation.py (generation_dir).
    This caused an ImportError since from .._validation resolves relative to
    the actual file location (azure.storage.blob._generated.operations).
    """
    code_model = get_code_model("azure.storage.blob", generation_subdir="_generated")
    namespace = "azure.storage.blob"

    root_dir = code_model.get_root_dir()
    generation_dir = code_model.get_generation_dir(namespace)

    # root_dir should not include _generated
    assert root_dir == Path("azure/storage/blob")
    # generation_dir should include _generated
    assert generation_dir == Path("azure/storage/blob/_generated")

    # The relative import for _validation from operations
    serialize_namespace = "azure.storage.blob.operations"
    relative_path = code_model.get_relative_import_path(
        serialize_namespace, module_name="_validation"
    )
    # .._validation means: go up from azure.storage.blob._generated.operations to
    # azure.storage.blob._generated, then import _validation
    assert relative_path == ".._validation"
