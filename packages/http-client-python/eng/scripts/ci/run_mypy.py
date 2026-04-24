#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute mypy within a tox environment. Depending on which package is being executed against,
# a failure may be suppressed.

from subprocess import check_call, CalledProcessError
import os
import logging
import sys
from util import run_check, get_package_namespace_dir

logging.getLogger().setLevel(logging.INFO)


def get_config_file_location():
    # When running from tests/ directory via tox
    mypy_ini_path = os.path.join(os.getcwd(), "../eng/scripts/ci/config/mypy.ini")
    if os.path.exists(mypy_ini_path):
        return mypy_ini_path
    # Fallback for running from different directories
    return os.path.join(os.path.dirname(__file__), "config/mypy.ini")


def _single_dir_mypy(mod):
    inner_class = get_package_namespace_dir(mod)
    if not inner_class:
        logging.info(f"No package directory found in {mod}, skipping")
        return True
    try:
        check_call(
            [
                sys.executable,
                "-m",
                "mypy",
                "--config-file",
                get_config_file_location(),
                "--ignore-missing",
                str(inner_class.absolute()),
            ]
        )
        return True
    except CalledProcessError as e:
        logging.error("{} exited with mypy error {}".format(inner_class.stem, e.returncode))
        return False


if __name__ == "__main__":
    run_check("mypy", _single_dir_mypy, "MyPy")
