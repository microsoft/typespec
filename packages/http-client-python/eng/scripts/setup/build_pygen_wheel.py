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
    import pip
except (ImportError, ModuleNotFoundError):
    raise Exception("Your Python installation doesn't have pip available")


# Now we have pip and Py >= 3.9, go to work

from pathlib import Path

from venvtools import ExtendedEnvBuilder, python_run
from package_manager import install_packages

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv_build_wheel"
    env_builder = ExtendedEnvBuilder(with_pip=True, upgrade_deps=True)
    env_builder.create(venv_path)
    venv_context = env_builder.context

    install_packages(["build"], venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")


if __name__ == "__main__":
    main()
