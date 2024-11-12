#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import os

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
    venv_preexists = venv_path.exists()

    assert venv_preexists  # Otherwise install was not done

    env_builder = venv.EnvBuilder(with_pip=True)        
    venv_context = env_builder.ensure_directories(venv_path)
    print(venv_context.env_exe)
    print(os.path.exists(venv_context.env_exe))

    for root, dirs, files in os.walk(venv_path):
        for dir_name in dirs:
            print(os.path.join(root, dir_name))
        for file in files:
            print(file)
    # python_run(venv_context, "build", ["--wheel"], additional_dir="generator")


if __name__ == "__main__":
    main()
