"""Unit tests for setup.py to pyproject.toml migration functionality."""

import pytest
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


def test_keep_setuppy_fields_dependencies(caplog):
    """Test that dependencies from setup.py are correctly extracted."""
    serializer = get_mock_serializer()
    
    # Reset VERSION_MAP to known state
    original_isodate = VERSION_MAP.get("isodate", "0.6.1")
    VERSION_MAP["isodate"] = "0.6.1"
    
    setup_py_content = """
from setuptools import setup

setup(
    name="test-client",
    install_requires=[
        "isodate>=100.0.0",
        "azure-core>=1.35.0",
        "typing-extensions>=4.6.0",
        "cryptography>=41.0.0",
    ],
)
"""
    
    params = {"KEEP_FIELDS": {"project.keywords": {"azure", "azure sdk"}}}
    
    with caplog.at_level("INFO"):
        serializer._keep_setuppy_fields(setup_py_content, params)
    
    # Check that cryptography (non-default dependency) is kept
    assert "project.dependencies" in params["KEEP_FIELDS"]
    deps = params["KEEP_FIELDS"]["project.dependencies"]
    
    # Should contain cryptography but not the default dependencies
    assert any("cryptography" in dep for dep in deps)
    assert not any("isodate" in dep for dep in deps)
    assert not any("azure-core" in dep for dep in deps)
    
    # Check that VERSION_MAP was updated for isodate
    assert VERSION_MAP["isodate"] == "100.0.0"
    
    # Check INFO logging
    assert "Keeping field dependency: cryptography>=41.0.0" in caplog.text
    assert "Keeping field dependency: isodate 100.0.0" in caplog.text
    
    # Restore original VERSION_MAP
    VERSION_MAP["isodate"] = original_isodate


def test_keep_setuppy_fields_keywords(caplog):
    """Test that keywords from setup.py are correctly extracted."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
setup(
    name="test-client",
    keywords="azure, azure sdk, confidential computing, ledger",
)
"""
    
    params = {"KEEP_FIELDS": {"project.keywords": {"azure", "azure sdk"}}}
    
    with caplog.at_level("INFO"):
        serializer._keep_setuppy_fields(setup_py_content, params)
    
    # Check that keywords are added to the set
    keywords = params["KEEP_FIELDS"]["project.keywords"]
    
    # Should contain all keywords including defaults
    assert "azure" in keywords
    assert "azure sdk" in keywords
    assert "confidential computing" in keywords
    assert "ledger" in keywords
    
    # Check no duplicates
    assert len([k for k in keywords if k == "azure"]) == 1
    assert len([k for k in keywords if k == "azure sdk"]) == 1
    
    # Check INFO logging
    assert "Keeping field project.keywords" in caplog.text


def test_keep_setuppy_fields_project_urls(caplog):
    """Test that project URLs from setup.py are correctly extracted."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
setup(
    name="test-client",
    project_urls={
        "Source": "https://github.com/Azure/azure-sdk-for-python",
        "Bug Reports": "https://github.com/Azure/azure-sdk-for-python/issues",
    },
)
"""
    
    params = {"KEEP_FIELDS": {"project.keywords": {"azure", "azure sdk"}}}
    
    with caplog.at_level("INFO"):
        serializer._keep_setuppy_fields(setup_py_content, params)
    
    # Check that custom URLs are kept
    assert "project.urls" in params["KEEP_FIELDS"]
    urls = params["KEEP_FIELDS"]["project.urls"]
    
    assert "Source" in urls
    assert urls["Source"] == "https://github.com/Azure/azure-sdk-for-python"
    assert "Bug Reports" in urls or '"Bug Reports"' in urls
    if "Bug Reports" in urls:
        assert urls["Bug Reports"] == "https://github.com/Azure/azure-sdk-for-python/issues"
    else:
        assert urls['"Bug Reports"'] == "https://github.com/Azure/azure-sdk-for-python/issues"
    
    # Check INFO logging
    assert "Keeping field project.urls.Source" in caplog.text or "Keeping field project.urls.Bug Reports" in caplog.text


def test_keep_setuppy_fields_pprint_name_warning(caplog):
    """Test that warning is logged when PACKAGE_PPRINT_NAME differs."""
    serializer = get_mock_serializer()
    
    setup_py_content = """
PACKAGE_PPRINT_NAME = "TestClient"

setup(
    name="test-client",
)
"""
    
    params = {"KEEP_FIELDS": {"project.keywords": {"azure", "azure sdk"}}}
    
    with caplog.at_level("WARNING"):
        serializer._keep_setuppy_fields(setup_py_content, params)
    
    # Check that warning was logged
    assert "Generated package-pprint-name 'Test Client' does not match existing PACKAGE_PPRINT_NAME 'TestClient'" in caplog.text
    assert "Ensure the new package-pprint-name is correct" in caplog.text


def test_keep_setuppy_fields_empty():
    """Test that empty setup.py doesn't cause errors."""
    serializer = get_mock_serializer()
    
    setup_py_content = ""
    
    params = {"KEEP_FIELDS": {"project.keywords": {"azure", "azure sdk"}}}
    
    serializer._keep_setuppy_fields(setup_py_content, params)
    
    # Should have only the default keywords
    assert params["KEEP_FIELDS"]["project.keywords"] == {"azure", "azure sdk"}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
