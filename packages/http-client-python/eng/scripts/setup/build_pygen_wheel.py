#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys

if not sys.version_info >= (3, 8, 0):
    raise Exception("Autorest for Python extension requires Python 3.8 at least")

try:
    import pip
except ImportError:
    raise Exception("Your Python installation doesn't have pip available")

try:
    import venv
except ImportError:
    raise Exception("Your Python installation doesn't have venv available")


# Now we have pip and Py >= 3.8, go to work

from pathlib import Path

from venvtools import python_run

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv"
    if venv_path.exists():
        env_builder = venv.EnvBuilder(with_pip=True)        
        venv_context = env_builder.ensure_directories(venv_path)
        python_run(venv_context, "build", ["--wheel"], additional_dir="generator")
    else:
        raise Exception("Please run 'npm install' first to create a Python virtual environment.")

if __name__ == "__main__":
    main()
