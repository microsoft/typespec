# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

"""Unit tests for setup.py to pyproject.toml migration functionality."""

from pygen.codegen.serializers.general_serializer import GeneralSerializer, VERSION_MAP
from jinja2 import Environment, DictLoader
from unittest.mock import Mock


def get_mock_serializer():
    """Create a mock serializer for testing."""
    mock_code_model = Mock()
    mock_code_model.options = {
        "package-name": "test-client",
        "package-pprint-name": "Test Client",
        "package-version": "1.0.0",
        "package-mode": True,
    }
    
    env = Environment(loader=DictLoader({}))
    serializer = GeneralSerializer(code_model=mock_code_model, env=env, async_mode=False)
    return serializer


def test_keep_setuppy_fields_dependencies():
    """Test that dependencies from setup.py are correctly extracted."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
from setuptools import setup

setup(
    name="test-client",
    install_requires=[
        "isodate>=0.6.1",
        "azure-core>=1.35.0",
        "typing-extensions>=4.6.0",
        "cryptography>=41.0.0",
    ],
)
"""
    
    result = serializer._keep_setuppy_fields(setup_py_content)
    
    # Check that cryptography (non-default dependency) is kept
    assert "KEEP_FIELDS" in result
    assert "project.dependencies" in result["KEEP_FIELDS"]
    deps = result["KEEP_FIELDS"]["project.dependencies"]
    
    # Should contain cryptography but not the default dependencies
    assert any("cryptography" in dep for dep in deps)
    assert not any("isodate" in dep for dep in deps)
    assert not any("azure-core" in dep for dep in deps)


def test_keep_setuppy_fields_keywords():
    """Test that keywords from setup.py are correctly extracted."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
setup(
    name="test-client",
    keywords="azure, azure sdk, confidential computing, ledger",
)
"""
    
    result = serializer._keep_setuppy_fields(setup_py_content)
    
    # Check that non-default keywords are kept
    assert "KEEP_FIELDS" in result
    assert "project.keywords" in result["KEEP_FIELDS"]
    keywords = result["KEEP_FIELDS"]["project.keywords"]
    
    # Should contain custom keywords but not default ones
    assert "confidential computing" in keywords
    assert "ledger" in keywords
    assert "azure" not in keywords
    assert "azure sdk" not in keywords


def test_keep_setuppy_fields_project_urls():
    """Test that project URLs from setup.py are correctly extracted."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
setup(
    name="test-client",
    url="https://github.com/custom/custom-sdk-for-python",
)
"""
    
    result = serializer._keep_setuppy_fields(setup_py_content)
    
    # Check that custom URL is kept
    assert "KEEP_FIELDS" in result
    assert "project.urls" in result["KEEP_FIELDS"]
    urls = result["KEEP_FIELDS"]["project.urls"]
    
    assert "homepage" in urls
    assert urls["homepage"] == "https://github.com/custom/custom-sdk-for-python"


def test_keep_setuppy_fields_no_azure_url():
    """Test that default Azure SDK URLs are not kept."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
setup(
    name="test-client",
    url="https://github.com/Azure/azure-sdk-for-python/tree/main/sdk",
)
"""
    
    result = serializer._keep_setuppy_fields(setup_py_content)
    
    # Should not keep the default Azure SDK URL
    assert "project.urls" not in result.get("KEEP_FIELDS", {})


def test_keep_setuppy_fields_empty():
    """Test that empty setup.py doesn't cause errors."""
    serializer = get_mock_serializer()
    
    setup_py_content = ""
    
    result = serializer._keep_setuppy_fields(setup_py_content)
    
    # Should return a result with empty KEEP_FIELDS
    assert "KEEP_FIELDS" in result
    assert len(result["KEEP_FIELDS"]) == 0


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
