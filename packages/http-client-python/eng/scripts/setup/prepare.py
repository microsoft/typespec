#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import os
import argparse

if not sys.version_info >= (3, 8, 0):
    raise Exception("Autorest for Python extension requires Python 3.8 at least")

from pathlib import Path
import venv

from venvtools import python_run

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv"
    venv_preexists = venv_path.exists()

    assert venv_preexists  # Otherwise install was not done

    env_builder = venv.EnvBuilder(with_pip=True)
    venv_context = env_builder.ensure_directories(venv_path)
    try:
        python_run(
            venv_context,
            "pip",
            ["install", "-r", f"{_ROOT_DIR}/generator/dev_requirements.txt"],
        )
    except FileNotFoundError as e:
        raise ValueError(e.filename)


if __name__ == "__main__":
    main()
