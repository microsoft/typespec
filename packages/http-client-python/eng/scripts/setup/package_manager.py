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
import re
from pathlib import Path
from venvtools import ExtendedEnvBuilder

# Security floors: GHSA-qwm4-qh6w-59xr (pip), GHSA-hq85-5cpj-mr62 (uv).
MINIMUM_VERSIONS = {"pip": (26, 2, 0), "uv": (0, 13, 4)}
PIP_VERSION = "26.2.2"
if tuple(int(part) for part in PIP_VERSION.split(".")) < MINIMUM_VERSIONS["pip"]:
    raise RuntimeError("The pinned build-environment pip is below the security minimum. Update PIP_VERSION.")


class PackageManagerNotFoundError(Exception):
    """Raised when no suitable package manager is found."""

    pass


def _check_command_available(command: list[str], name: str) -> bool:
    """Check availability and reject versions below the security minimum."""
    try:
        result = subprocess.run(command + ["--version"], capture_output=True, check=True, text=True)
    except (subprocess.CalledProcessError, FileNotFoundError, PermissionError):
        return False
    match = re.match(rf"{name} (\d+)\.(\d+)(?:\.(\d+))?(?=\s|$)", result.stdout.strip())
    if match is None:
        raise RuntimeError(f"Cannot verify the installed {name} version. Install a stable, patched release.")
    version = tuple(int(value or 0) for value in match.groups())
    minimum = MINIMUM_VERSIONS[name]
    if version < minimum:
        required = ".".join(str(value) for value in minimum)
        raise RuntimeError(
            f"{match.group(0)} is below the security minimum {required}. Upgrade {name} before continuing."
        )
    return True


def detect_package_manager() -> str:
    """Detect the best available package manager.

    Returns:
        str: The package manager command ('uv' or 'pip')

    Raises:
        PackageManagerNotFoundError: If no suitable package manager is found
    """
    # Check for uv first since it's more modern and faster
    if _check_command_available(["uv"], "uv"):
        return "uv"

    # Fall back to pip
    if _check_command_available(["pip"], "pip"):
        return "pip"

    # As a last resort, try using python -m pip
    if _check_command_available([sys.executable, "-m", "pip"], "pip"):
        return "python -m pip"

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
            return ["pip", "--python", venv_context.env_exe, "install"]
        else:
            return ["pip", "install"]
    elif package_manager == "python -m pip":
        if venv_context:
            return [sys.executable, "-m", "pip", "--python", venv_context.env_exe, "install"]
        else:
            return [sys.executable, "-m", "pip", "install"]
    else:
        raise ValueError(f"Unknown package manager: {package_manager}")


def install_packages(packages: list, venv_context=None, package_manager: str = None, cwd: Path = None) -> None:
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
        if cwd:
            result = subprocess.run(install_cmd + packages, cwd=cwd, capture_output=True, text=True)
        else:
            result = subprocess.run(install_cmd + packages, capture_output=True, text=True)
        if result.returncode != 0:
            error_output = (result.stderr or "") + (result.stdout or "")
            error_msg = f"Failed to install packages with {package_manager}: command exited with code {result.returncode}\n{error_output}"
            if "401" in error_output or "Unauthorized" in error_output:
                error_msg += (
                    "\n\nReceived a 401 Unauthorized error from the Azure feed. "
                    "A pip dependency may not yet be cached. To fix this, follow the authentication steps at: "
                    "https://github.com/Azure/azure-sdk-for-python/blob/main/CONTRIBUTING.md#authentication-for-upstream-pull-through"
                )
            raise RuntimeError(error_msg)
    except OSError as e:
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

        context = MockVenvContext(venv_path)
    else:
        # Use standard venv for pip
        if venv_path.exists():
            env_builder = venv.EnvBuilder(with_pip=False)
            context = env_builder.ensure_directories(venv_path)
        else:
            env_builder = ExtendedEnvBuilder(with_pip=False)
            env_builder.create(venv_path)
            context = env_builder.context
    # Use the validated host installer rather than a potentially outdated ensurepip seed.
    install_packages([f"pip=={PIP_VERSION}"], context, package_manager=package_manager)
    return context
