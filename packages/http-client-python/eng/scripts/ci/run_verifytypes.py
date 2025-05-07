#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute verifytypes within a tox environment. Depending on which package is being executed against,
# a failure may be suppressed.

import os
from subprocess import check_output, CalledProcessError
import logging
import sys
import time
from util import run_check

logging.getLogger().setLevel(logging.INFO)


def _single_dir_verifytypes(mod):
    inner_class = next(d for d in mod.iterdir() if d.is_dir() and not str(d).endswith("egg-info"))
    retries = 3
    while retries:
        try:
            check_output(
                [
                    sys.executable,
                    "-m",
                    "pyright",
                    "--verifytypes",
                    "-p",
                    str(inner_class.absolute()),
                    "--ignoreexternal",
                ],
                text=True,
            )
            return True
        except CalledProcessError as e:
            logging.exception("{} exited with verifytypes error {}".format(inner_class.stem, e.returncode))
            logging.error(f"Verifytypes stdout:\n{e.stdout}\n===========")
            logging.error(f"Verifytypes stderr:\n{e.stderr}\n===========")
            # Verifytypes has shown to randomly failed with a 217, retry the same folder 3 times should help
            retries -= 1
            time.sleep(5)

    return False


if __name__ == "__main__":
    if os.name == "nt":
        # Before https://github.com/microsoft/typespec/issues/4667 fixed, skip running Verifytypes on Windows
        logging.info("Skip running Verifytypes on Windows for now")
        sys.exit(0)
    run_check("verifytypes", _single_dir_verifytypes, "Verifytypes")
