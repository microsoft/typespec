"""Unit tests for setup.py to pyproject.toml migration functionality."""

import pytest
from pygen.codegen.serializers.general_serializer import GeneralSerializer, VERSION_MAP
from jinja2 import Environment, DictLoader
from unittest.mock import Mock
import tomli


def get_mock_serializer_with_real_template():
    """Create a mock serializer with the real pyproject.toml template from the generator."""
    from jinja2 import Environment, DictLoader
    import os

    mock_code_model = Mock()
    mock_code_model.options = {
        "package-name": "test-client",
        "package-pprint-name": "Test Client",
        "package-version": "1.0.0",
        "package-mode": True,
    }
    mock_code_model.is_azure_flavor = True
    mock_code_model.namespace = "test.client.namespace"
    mock_code_model.is_tsp = True
    mock_code_model.clients = []
    mock_code_model.company_name = "Microsoft Corporation"
    mock_code_model.license_header = ""
    mock_code_model.is_legacy = False
    
    # Read the real template content from file
    template_path = os.path.join(os.path.dirname(__file__), "../../pygen/codegen/templates/packaging_templates/pyproject.toml.jinja2")
    with open(template_path, 'r') as f:
        template_content = f.read()
    
    # Use DictLoader with the real template content
    env = Environment(loader=DictLoader({"pyproject.toml.jinja2": template_content}))
    
    # Add template globals required by the real template
    env.globals.update({
        'MIN_PYTHON_VERSION': '3.8',
        'MAX_PYTHON_VERSION': '3.12', 
        'VERSION_MAP': VERSION_MAP,
        'dev_status': '4 - Beta',
        'pkgutil_names': []
    })
    
    serializer = GeneralSerializer(code_model=mock_code_model, env=env, async_mode=False)
    return serializer


def test_serialize_package_file_with_setuppy_dependencies(caplog):
    """Test that dependencies from setup.py are correctly preserved in generated pyproject.toml."""
    serializer = get_mock_serializer_with_real_template()
    
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
    
    # Empty pyproject.toml content (new file)
    pyproject_content = ""
    
    with caplog.at_level("INFO"):
        result = serializer.serialize_package_file(
            "pyproject.toml.jinja2", 
            pyproject_content, 
            setup_py_content
        )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that cryptography (non-default dependency) is kept
    assert "dependencies" in generated_toml["project"]
    deps = generated_toml["project"]["dependencies"]
    
    # Should contain cryptography (custom dependency from setup.py)
    assert any("cryptography" in dep for dep in deps)
    # Should contain all default dependencies 
    assert any("isodate" in dep for dep in deps)
    assert any("azure-core" in dep for dep in deps)
    assert any("typing-extensions" in dep for dep in deps)
    
    # Check that VERSION_MAP was updated for isodate
    assert VERSION_MAP["isodate"] == "100.0.0"
    
    # Check INFO logging
    assert "Keeping field dependency: cryptography>=41.0.0" in caplog.text
    assert "Keeping field dependency: isodate>=100.0.0" in caplog.text
    
    # Restore original VERSION_MAP
    VERSION_MAP["isodate"] = original_isodate


def test_serialize_package_file_with_setuppy_keywords(caplog):
    """Test that keywords from setup.py are correctly preserved in generated pyproject.toml."""
    serializer = get_mock_serializer_with_real_template()
    
    setup_py_content = """
setup(
    name="test-client",
    keywords="azure, azure sdk, confidential computing, ledger",
)
"""
    
    # Pyproject.toml with existing keywords
    pyproject_content = """
[project]
keywords = ["azure", "azure sdk"]
"""
    
    with caplog.at_level("INFO"):
        result = serializer.serialize_package_file(
            "pyproject.toml.jinja2", 
            pyproject_content, 
            setup_py_content
        )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that keywords are preserved and merged
    keywords = generated_toml["project"]["keywords"]
    
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


def test_serialize_package_file_with_setuppy_project_urls(caplog):
    """Test that project URLs from setup.py are correctly preserved in generated pyproject.toml."""
    serializer = get_mock_serializer_with_real_template()
    
    setup_py_content = """
setup(
    name="test-client",
    project_urls={
        "Source": "https://github.com/Azure/azure-sdk-for-python",
        "Bug Reports": "https://github.com/Azure/azure-sdk-for-python/issues",
    },
)
"""
    
    # Pyproject.toml with existing keywords
    pyproject_content = """
[project]
keywords = ["azure", "azure sdk"]
"""
    
    with caplog.at_level("INFO"):
        result = serializer.serialize_package_file(
            "pyproject.toml.jinja2", 
            pyproject_content, 
            setup_py_content
        )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that project URLs are kept
    assert "urls" in generated_toml["project"]
    urls = generated_toml["project"]["urls"]
    
    # Should contain the URLs
    assert urls["Source"] == "https://github.com/Azure/azure-sdk-for-python"
    assert urls["Bug Reports"] == "https://github.com/Azure/azure-sdk-for-python/issues"
    
    # Check INFO logging  
    assert "Keeping field project.urls" in caplog.text



def test_serialize_package_file_with_setuppy_pprint_name_warning(caplog):
    """Test that warning is logged when PACKAGE_PPRINT_NAME differs."""
    serializer = get_mock_serializer_with_real_template()
    
    setup_py_content = """
PACKAGE_PPRINT_NAME = "TestClient"

setup(
    name="test-client",
)
"""
    
    # Empty pyproject.toml content (new file)
    pyproject_content = ""
    
    with caplog.at_level("WARNING"):
        result = serializer.serialize_package_file(
            "pyproject.toml.jinja2", 
            pyproject_content, 
            setup_py_content
        )
    
    # Check that warning was logged
    assert "Generated package-pprint-name 'Test Client' does not match existing PACKAGE_PPRINT_NAME 'TestClient'" in caplog.text
    assert "Ensure the new package-pprint-name is correct" in caplog.text


def test_serialize_package_file_with_empty_setuppy():
    """Test that empty setup.py doesn't cause errors."""
    serializer = get_mock_serializer_with_real_template()
    
    setup_py_content = ""
    
    # Pyproject.toml with existing keywords
    pyproject_content = """
[project]
keywords = ["azure", "azure sdk"]
"""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        pyproject_content, 
        setup_py_content
    )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Should have only the default keywords (order doesn't matter)
    assert set(generated_toml["project"]["keywords"]) == {"azure", "azure sdk"}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
