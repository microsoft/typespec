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
    import pip
except (ImportError, ModuleNotFoundError):
    raise Warning(
        "Your Python installation doesn't have pip available. We will run your code with Pyodide since your Python version isn't adequate."
    )

try:
    import venv
except (ImportError, ModuleNotFoundError):
    raise Warning(
        "Your Python installation doesn't have venv available. We will run your code with Pyodide since your Python version isn't adequate."
    )


# Now we have pip and Py >= 3.8, go to work

from pathlib import Path

from venvtools import ExtendedEnvBuilder, python_run

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def main():
    venv_path = _ROOT_DIR / "venv"
    if venv_path.exists():
        env_builder = venv.EnvBuilder(with_pip=True)
        venv_context = env_builder.ensure_directories(venv_path)
    else:
        env_builder = ExtendedEnvBuilder(with_pip=True, upgrade_deps=True)
        env_builder.create(venv_path)
        venv_context = env_builder.context

        python_run(venv_context, "pip", ["install", "-U", "pip"])
        python_run(venv_context, "pip", ["install", "-U", "black"])
        python_run(venv_context, "pip", ["install", "-e", f"{_ROOT_DIR}/generator"])


if __name__ == "__main__":
    main()
