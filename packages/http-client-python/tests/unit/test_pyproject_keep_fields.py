# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Unit tests for preserving manually customized pyproject.toml fields.

The emitter regenerates pyproject.toml on every emit. Manual edits to fields
the emitter doesn't own (description, classifiers, project URLs) must be
preserved so they are not clobbered (see GitHub issue #10311).
"""
from pygen.codegen.serializers.general_serializer import GeneralSerializer


def _keep_fields(file_content: str, keep_pyproject_fields: bool = True) -> dict:
    # external_lib_version_map only relies on module-level helpers, not on
    # instance state, so we can bypass __init__ for a focused unit test.
    serializer = GeneralSerializer.__new__(GeneralSerializer)
    return serializer.external_lib_version_map(file_content, {}, keep_pyproject_fields)["KEEP_FIELDS"]


def test_preserve_description():
    content = """
[project]
name = "azure-ai-sample"
description = "Microsoft Azure AI Sample Client Library for Python"
"""
    keep_fields = _keep_fields(content)
    assert keep_fields["project.description"] == "Microsoft Azure AI Sample Client Library for Python"


def test_preserve_classifiers():
    content = """
[project]
name = "azure-ai-sample"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Programming Language :: Python :: 3.13",
    "Programming Language :: Python :: 3.14",
]
"""
    keep_fields = _keep_fields(content)
    assert "Programming Language :: Python :: 3.14" in keep_fields["project.classifiers"]


def test_preserve_project_urls():
    content = """
[project]
name = "azure-ai-sample"

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python-custom"
documentation = "https://aka.ms/custom-docs"
"""
    keep_fields = _keep_fields(content)
    assert keep_fields["project.urls"]["repository"] == "https://github.com/Azure/azure-sdk-for-python-custom"
    assert keep_fields["project.urls"]["documentation"] == "https://aka.ms/custom-docs"


def test_fields_not_kept_when_option_disabled():
    content = """
[project]
name = "azure-ai-sample"
description = "Microsoft Azure AI Sample Client Library for Python"
classifiers = ["Programming Language :: Python :: 3.14"]

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python-custom"
"""
    keep_fields = _keep_fields(content, keep_pyproject_fields=False)
    assert "project.description" not in keep_fields
    assert "project.classifiers" not in keep_fields
    assert "project.urls" not in keep_fields


def test_missing_fields_not_kept():
    content = """
[project]
name = "azure-ai-sample"
"""
    keep_fields = _keep_fields(content)
    assert "project.description" not in keep_fields
    assert "project.classifiers" not in keep_fields
    assert "project.urls" not in keep_fields


def test_invalid_toml_returns_empty():
    assert _keep_fields("this is : not valid = toml [[[") == {}
