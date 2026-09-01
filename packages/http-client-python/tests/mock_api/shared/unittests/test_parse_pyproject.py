from pathlib import Path
from typing import Dict, Any

try:
    import tomllib
except ImportError:
    import tomli as tomllib


def check_no_setup_py(package_path: str) -> None:
    """
    Check that setup.py does not exist in the package directory.

    Args:
        package_path: Relative path to the package directory

    Raises:
        AssertionError: If setup.py exists in the package directory
    """
    package_dir = Path(__file__).parent / package_path
    setup_py_path = package_dir / "setup.py"

    assert not setup_py_path.exists(), f"setup.py should not exist at {setup_py_path} when using pyproject.toml"


def get_pyproject_section(package_path: str, section_name: str) -> Dict[str, Any]:
    """
    Get a specific section from a package's pyproject.toml file.

    Args:
        package_path: Relative path to the package directory containing pyproject.toml
        section_name: Dot-separated section name (e.g., "tool.azure-sdk-build")

    Returns:
        Dictionary containing the section data

    Raises:
        AssertionError: If pyproject.toml not found or section missing
    """
    try:
        # Convert to absolute path and find pyproject.toml
        package_dir = Path(__file__).parent / package_path
        pyproject_path = package_dir / "pyproject.toml"

        # Assert pyproject.toml exists
        assert pyproject_path.exists(), f"pyproject.toml not found at {pyproject_path}"

        # Parse pyproject.toml
        with open(pyproject_path, "rb") as f:
            data = tomllib.load(f)

        # Check that the project name matches the folder name
        if "project" in data and "name" in data["project"]:
            expected_name = package_dir.name
            actual_name = data["project"]["name"]
            assert (
                actual_name == expected_name
            ), f"Project name '{actual_name}' in pyproject.toml does not match folder name '{expected_name}'"

        # Navigate to the requested section
        section_parts = section_name.split(".")
        current_data = data

        for part in section_parts:
            assert (
                part in current_data
            ), f"pyproject.toml does not contain [{'.'.join(section_parts[:section_parts.index(part)+1])}] section"
            current_data = current_data[part]

        return current_data

    except Exception as e:
        raise AssertionError(f"Error checking pyproject.toml at '{package_path}': {e}")


def test_azure_sdk_build():
    """Test that authentication-union packages have pyproject.toml with [tool.azure-sdk-build] pyright = false."""

    # Need to check the file directly, since installed distribution metadata won't include custom sections.
    test_paths = ["../../../generated/azure/authentication-union"]

    for package_path in test_paths:
        # First check that setup.py doesn't exist
        check_no_setup_py(package_path)

        # Get the [tool.azure-sdk-build] section
        azure_sdk_build = get_pyproject_section(package_path, "tool.azure-sdk-build")

        # Check for pyright = false
        assert (
            "pyright" in azure_sdk_build
        ), f"[tool.azure-sdk-build] section does not contain 'pyright' setting in {package_path}"
        assert (
            azure_sdk_build["pyright"] is False
        ), f"Expected pyright = false, but got pyright = {azure_sdk_build['pyright']} in {package_path}"