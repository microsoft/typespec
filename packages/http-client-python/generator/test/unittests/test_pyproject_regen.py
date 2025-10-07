"""Unit tests for pyproject.toml regeneration functionality."""

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


def test_serialize_package_file_keeps_pyproject_dependencies(caplog):
    """Test that dependencies from existing pyproject.toml are correctly preserved in regenerated file."""
    serializer = get_mock_serializer_with_real_template()
    
    # Reset VERSION_MAP to known state
    original_isodate = VERSION_MAP.get("isodate", "0.6.1")
    VERSION_MAP["isodate"] = "0.6.1"
    
    pyproject_content = """
[build-system]
requires = ["setuptools>=61.0.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "test-client"
dependencies = [
    "isodate<200.0.0,>=100.0.0",
    "azure-core>=1.35.0",
    "typing-extensions>=4.6.0",
    "cryptography>=41.0.0",
]
"""
    
    with caplog.at_level("INFO"):
        result = serializer.serialize_package_file(
            "pyproject.toml.jinja2", 
            pyproject_content,
            ""  # No setup.py content
        )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that cryptography (custom dependency) is kept alongside defaults
    assert "dependencies" in generated_toml["project"]
    deps = generated_toml["project"]["dependencies"]
    
    # Should contain cryptography (custom dependency from existing pyproject.toml)
    assert any("cryptography" in dep for dep in deps)
    # Should contain all default dependencies 
    assert any("isodate" in dep for dep in deps)
    assert any("azure-core" in dep for dep in deps)
    assert any("typing-extensions" in dep for dep in deps)
    
    # Check that VERSION_MAP was updated for isodate
    assert VERSION_MAP["isodate"] == "100.0.0"
    
    # Restore original VERSION_MAP
    VERSION_MAP["isodate"] = original_isodate


def test_serialize_package_file_keeps_optional_dependencies():
    """Test that optional dependencies from existing pyproject.toml are correctly preserved in regenerated file."""
    serializer = get_mock_serializer_with_real_template()
    
    pyproject_content = """
[project]
name = "test-client"

[project.optional-dependencies]
dev = [
    "pytest>=6.0.0",
    "black>=21.0.0",
]
test = [
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.0.0",
]
"""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        pyproject_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that optional dependencies are preserved
    assert "optional-dependencies" in generated_toml["project"]
    optional_deps = generated_toml["project"]["optional-dependencies"]
    
    assert "dev" in optional_deps
    assert "test" in optional_deps
    assert "pytest>=6.0.0" in optional_deps["dev"]
    assert "black>=21.0.0" in optional_deps["dev"]
    assert "pytest-asyncio>=0.21.0" in optional_deps["test"]
    assert "pytest-cov>=4.0.0" in optional_deps["test"]


def test_serialize_package_file_keeps_project_urls():
    """Test that project URLs from existing pyproject.toml are correctly preserved in regenerated file."""
    serializer = get_mock_serializer_with_real_template()
    
    pyproject_content = """
[project]
name = "test-client"

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python"
"Bug Reports" = "https://github.com/Azure/azure-sdk-for-python/issues"
Source = "https://github.com/Azure/azure-sdk-for-python"
Documentation = "https://docs.microsoft.com/python/api"
"""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        pyproject_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that custom URLs are preserved and merged
    assert "urls" in generated_toml["project"]
    urls = generated_toml["project"]["urls"]
    
    # Should have all URLs from the existing pyproject.toml
    assert "repository" in urls
    assert urls["repository"] == "https://github.com/Azure/azure-sdk-for-python"
    assert "Bug Reports" in urls
    assert urls["Bug Reports"] == "https://github.com/Azure/azure-sdk-for-python/issues"
    assert "Source" in urls
    assert urls["Source"] == "https://github.com/Azure/azure-sdk-for-python"
    assert "Documentation" in urls
    assert urls["Documentation"] == "https://docs.microsoft.com/python/api"


def test_serialize_package_file_keeps_keywords():
    """Test that keywords from existing pyproject.toml are correctly preserved in regenerated file."""
    serializer = get_mock_serializer_with_real_template()
    
    pyproject_content = """
[project]
name = "test-client"
keywords = ["azure", "azure sdk", "confidential computing", "ledger"]
"""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        pyproject_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that keywords are preserved
    assert "keywords" in generated_toml["project"]
    keywords = generated_toml["project"]["keywords"]
    
    # Should contain all keywords including defaults
    assert "azure" in keywords
    assert "azure sdk" in keywords
    assert "confidential computing" in keywords
    assert "ledger" in keywords
    
    # Check no duplicates
    assert len([k for k in keywords if k == "azure"]) == 1
    assert len([k for k in keywords if k == "azure sdk"]) == 1


def test_serialize_package_file_keeps_azure_sdk_build():
    """Test that azure-sdk-build tool configuration from existing pyproject.toml is preserved in regenerated file."""
    serializer = get_mock_serializer_with_real_template()
    
    pyproject_content = """
[project]
name = "test-client"

[tool.azure-sdk-build]
dev_requirements = "dev_requirements.txt"
build_tools = "build"
"""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        pyproject_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check that azure-sdk-build configuration is preserved
    assert "azure-sdk-build" in generated_toml["tool"]
    azure_sdk_build = generated_toml["tool"]["azure-sdk-build"]
    
    assert "dev_requirements" in azure_sdk_build
    assert azure_sdk_build["dev_requirements"] == "dev_requirements.txt"
    assert "build_tools" in azure_sdk_build
    assert azure_sdk_build["build_tools"] == "build"


def test_serialize_package_file_handles_invalid_toml():
    """Test that invalid TOML content doesn't cause errors and generates valid output."""
    serializer = get_mock_serializer_with_real_template()
    
    invalid_toml_content = """
[project]
name = "test-client"
invalid toml syntax here
"""
    
    # Should not raise an exception
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        invalid_toml_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify it's valid
    generated_toml = tomli.loads(result)
    
    # Should have default keywords (since invalid TOML couldn't be parsed)
    assert "keywords" in generated_toml["project"]
    keywords = set(generated_toml["project"]["keywords"])
    assert keywords == {"azure", "azure sdk"}


def test_serialize_package_file_handles_empty_content():
    """Test that empty pyproject.toml content doesn't cause errors and generates valid output."""
    serializer = get_mock_serializer_with_real_template()
    
    empty_content = ""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        empty_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify it's valid
    generated_toml = tomli.loads(result)
    
    # Should have default keywords
    assert "keywords" in generated_toml["project"]
    keywords = set(generated_toml["project"]["keywords"])
    assert keywords == {"azure", "azure sdk"}


def test_serialize_package_file_keeps_mixed_content():
    """Test that multiple types of content from existing pyproject.toml are correctly preserved together in regenerated file."""
    serializer = get_mock_serializer_with_real_template()
    
    pyproject_content = """
[project]
name = "test-client"
keywords = ["custom-keyword", "special"]
dependencies = [
    "custom-package>=1.0.0",
    "azure-core>=1.30.0",
]

[project.optional-dependencies]
extra = ["extra-package>=2.0.0"]

[project.urls]
repository = "https://github.com/Azure/azure-sdk-for-python"
"Custom URL" = "https://example.com"

[tool.azure-sdk-build]
custom_setting = "value"
"""
    
    result = serializer.serialize_package_file(
        "pyproject.toml.jinja2", 
        pyproject_content,
        ""  # No setup.py content
    )
    
    # Parse the generated TOML to verify content
    generated_toml = tomli.loads(result)
    
    # Check all types of content are preserved
    assert "dependencies" in generated_toml["project"]
    deps = generated_toml["project"]["dependencies"]
    assert any("custom-package" in dep for dep in deps)
    
    assert "optional-dependencies" in generated_toml["project"]
    assert "extra" in generated_toml["project"]["optional-dependencies"]
    
    assert "urls" in generated_toml["project"]
    assert "Custom URL" in generated_toml["project"]["urls"]
    
    assert "azure-sdk-build" in generated_toml["tool"]
    assert generated_toml["tool"]["azure-sdk-build"]["custom_setting"] == "value"
    
    # Keywords should be merged
    keywords = generated_toml["project"]["keywords"]
    assert "azure" in keywords
    assert "azure sdk" in keywords
    assert "custom-keyword" in keywords
    assert "special" in keywords


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
