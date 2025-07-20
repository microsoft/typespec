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

from pathlib import Path
from package_manager import create_venv_with_package_manager, install_packages

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv"
    venv_preexists = venv_path.exists()

    assert venv_preexists  # Otherwise install was not done

    venv_context = create_venv_with_package_manager(venv_path)

    try:
        install_packages(["-r", f"{_ROOT_DIR}/generator/dev_requirements.txt"], venv_context)
    except FileNotFoundError as e:
        raise ValueError(e.filename)


if __name__ == "__main__":
    main()
