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

    detect_package_manager()  # Just check if we have a package manager
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

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv"

    # Create virtual environment using package manager abstraction
    from package_manager import create_venv_with_package_manager, install_packages

    venv_context = create_venv_with_package_manager(venv_path)

    # Install required packages - install_packages handles package manager logic
    install_packages(["-U", "black"], venv_context)
    install_packages(["-e", f"{_ROOT_DIR}/generator"], venv_context)


if __name__ == "__main__":
    main()
