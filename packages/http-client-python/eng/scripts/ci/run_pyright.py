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
from util import run_check

logging.getLogger().setLevel(logging.INFO)


def get_pyright_config_file_location():
    pyright_config = os.path.join(os.getcwd(), "../../eng/scripts/ci/pyrightconfig.json")
    if os.path.exists(pyright_config):
        return pyright_config
    else:
        return os.path.join(os.getcwd(), "../../../eng/scripts/ci/pyrightconfig.json")


def _single_dir_pyright(mod):
    inner_class = next(d for d in mod.iterdir() if d.is_dir() and not str(d).endswith("egg-info"))
    retries = 3
    while retries:
        try:
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
    run_check("pyright", _single_dir_pyright, "PyRight")
