#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute pyright within a tox environment. Depending on which package is being executed against,
# a failure may be suppressed.

import os
from subprocess import check_output, CalledProcessError
import logging
import sys
import time
from util import run_check, get_package_namespace_dir

logging.getLogger().setLevel(logging.INFO)


def get_pyright_config_file_location():
    # When running from tests/ directory via tox
    pyright_config = os.path.join(os.getcwd(), "../eng/scripts/ci/config/pyrightconfig.json")
    if os.path.exists(pyright_config):
        return pyright_config
    # Fallback for running from different directories
    return os.path.join(os.path.dirname(__file__), "config/pyrightconfig.json")


def _single_dir_pyright(mod):
    inner_class = get_package_namespace_dir(mod)
    if not inner_class:
        logging.info(f"No package directory found in {mod}, skipping")
        return True
    retries = 3
    while retries:
        try:
            # After fully support client hierarchy, we can remove this check
            if "azure-client-generator-core-client-initialization" in str(inner_class.absolute()):
                return True

            check_output(
                [
                    sys.executable,
                    "-m",
                    "pyright",
                    "-p",
                    get_pyright_config_file_location(),
                    str(inner_class.absolute()),
                ],
                text=True,
            )
            return True
        except CalledProcessError as e:
            logging.exception("{} exited with pyright error {}".format(inner_class.stem, e.returncode))
            logging.error(f"PyRight stdout:\n{e.stdout}\n===========")
            logging.error(f"PyRight stderr:\n{e.stderr}\n===========")
            # PyRight has shown to randomly failed with a 217, retry the same folder 3 times should help
            retries -= 1
            time.sleep(5)

    return False


if __name__ == "__main__":
    if os.name == "nt":
        # Before https://github.com/microsoft/typespec/issues/4667 fixed, skip running PyRight on Windows
        logging.info("Skip running PyRight on Windows for now")
        sys.exit(0)
    run_check("pyright", _single_dir_pyright, "PyRight")
