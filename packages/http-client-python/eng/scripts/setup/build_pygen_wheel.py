#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys

if not sys.version_info >= (3, 9, 0):
    raise Exception("Autorest for Python extension requires Python 3.9 at least")

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError

    detect_package_manager()  # Just check if we have a package manager
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Exception("Your Python installation doesn't have a suitable package manager (pip or uv) available")


# Now we have a package manager (pip or uv) and Py >= 3.9, go to work

from pathlib import Path

from venvtools import python_run
from package_manager import install_packages, create_venv_with_package_manager

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv_build_wheel"
    venv_context = create_venv_with_package_manager(venv_path)

    install_packages(["build"], venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")


if __name__ == "__main__":
    main()
