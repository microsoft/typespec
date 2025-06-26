#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys

if not sys.version_info >= (3, 9, 0):
    raise Warning(
        "Autorest for Python extension requires Python 3.9 at least. We will run your code with Pyodide since your Python version isn't adequate."
    )

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError
    package_manager = detect_package_manager()
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Warning(
        "Your Python installation doesn't have a suitable package manager (pip or uv) available. We will run your code with Pyodide since your Python environment isn't adequate."
    )

try:
    import venv
except (ImportError, ModuleNotFoundError):
    raise Warning(
        "Your Python installation doesn't have venv available. We will run your code with Pyodide since your Python version isn't adequate."
    )


# Now we have a package manager (uv or pip) and Py >= 3.8, go to work

from pathlib import Path

from venvtools import ExtendedEnvBuilder, python_run
from package_manager import get_install_command

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv"
    if venv_path.exists():
        env_builder = venv.EnvBuilder(with_pip=True)
        venv_context = env_builder.ensure_directories(venv_path)
    else:
        print("creating venv in new directory")
        
        if package_manager == "uv":
            # Use uv to create and manage the virtual environment
            import subprocess
            print("Creating venv with uv...")
            subprocess.check_call(["uv", "venv", str(venv_path)])
            
            # Create a mock venv_context for compatibility
            class MockVenvContext:
                def __init__(self, venv_path):
                    self.env_exe = str(venv_path / "bin" / "python") if sys.platform != "win32" else str(venv_path / "Scripts" / "python.exe")
            
            venv_context = MockVenvContext(venv_path)
            
            print("Installing packages with uv...")
            subprocess.check_call(["uv", "pip", "install", "-U", "pip", "--python", venv_context.env_exe])
            subprocess.check_call(["uv", "pip", "install", "-U", "black", "--python", venv_context.env_exe])
            subprocess.check_call(["uv", "pip", "install", "-e", f"{_ROOT_DIR}/generator", "--python", venv_context.env_exe])
        else:
            # Use standard venv for pip
            env_builder = ExtendedEnvBuilder(with_pip=True, upgrade_deps=True)
            env_builder.create(venv_path)
            venv_context = env_builder.context
            
            # For pip, use the existing python_run approach
            python_run(venv_context, "pip", ["install", "-U", "pip"])
            python_run(venv_context, "pip", ["install", "-U", "black"])
            python_run(venv_context, "pip", ["install", "-e", f"{_ROOT_DIR}/generator"])


if __name__ == "__main__":
    main()
