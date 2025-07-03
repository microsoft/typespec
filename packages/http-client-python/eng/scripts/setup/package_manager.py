#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Package manager utilities for detecting and using pip or uv."""

import subprocess
import sys
import venv
from pathlib import Path
from venvtools import ExtendedEnvBuilder


class PackageManagerNotFoundError(Exception):
    """Raised when no suitable package manager is found."""

    pass


def _check_command_available(command: str) -> bool:
    """Check if a command is available in the environment."""
    try:
        subprocess.run([command, "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def detect_package_manager() -> str:
    """Detect the best available package manager.

    Returns:
        str: The package manager command ('uv' or 'pip')

    Raises:
        PackageManagerNotFoundError: If no suitable package manager is found
    """
    # Check for uv first since it's more modern and faster
    if _check_command_available("uv"):
        return "uv"

    # Fall back to pip
    if _check_command_available("pip"):
        return "pip"

    # As a last resort, try using python -m pip
    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"], capture_output=True, check=True)
        return "python -m pip"
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    raise PackageManagerNotFoundError("No suitable package manager found. Please install either uv or pip.")


def get_install_command(package_manager: str, venv_context=None) -> list:
    """Get the install command for the given package manager.

    Args:
        package_manager: The package manager command ('uv', 'pip', or 'python -m pip')
        venv_context: The virtual environment context (optional, used for pip)

    Returns:
        list: The base install command as a list
    """
    if package_manager == "uv":
        cmd = ["uv", "pip", "install"]
        if venv_context:
            cmd.extend(["--python", venv_context.env_exe])
        return cmd
    elif package_manager == "pip":
        if venv_context:
            return [venv_context.env_exe, "-m", "pip", "install"]
        else:
            return ["pip", "install"]
    elif package_manager == "python -m pip":
        if venv_context:
            return [venv_context.env_exe, "-m", "pip", "install"]
        else:
            return [sys.executable, "-m", "pip", "install"]
    else:
        raise ValueError(f"Unknown package manager: {package_manager}")


def install_packages(packages: list, venv_context=None, package_manager: str = None) -> None:
    """Install packages using the available package manager.

    Args:
        packages: List of packages to install
        venv_context: Virtual environment context (optional)
        package_manager: Package manager to use (auto-detected if None)
    """
    if package_manager is None:
        package_manager = detect_package_manager()

    install_cmd = get_install_command(package_manager, venv_context)

    try:
        subprocess.check_call(install_cmd + packages)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to install packages with {package_manager}: {e}")


def create_venv_with_package_manager(venv_path):
    """Create virtual environment using the best available package manager.

    Args:
        venv_path: Path where to create the virtual environment

    Returns:
        venv_context: Virtual environment context object
    """
    package_manager = detect_package_manager()

    if package_manager == "uv":
        # Use uv to create and manage the virtual environment
        if not venv_path.exists():
            subprocess.check_call(["uv", "venv", str(venv_path)])

        # Create a mock venv_context for compatibility
        class MockVenvContext:
            def __init__(self, venv_path):
                self.env_exe = (
                    str(venv_path / "bin" / "python")
                    if sys.platform != "win32"
                    else str(venv_path / "Scripts" / "python.exe")
                )

        return MockVenvContext(venv_path)
    else:
        # Use standard venv for pip
        if venv_path.exists():
            env_builder = venv.EnvBuilder(with_pip=True)
            return env_builder.ensure_directories(venv_path)
        else:
            env_builder = ExtendedEnvBuilder(with_pip=True, upgrade_deps=True)
            env_builder.create(venv_path)
            return env_builder.context
