#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute apiview generation within a tox environment. Depending on which package is being executed against,
# a failure may be suppressed.

from subprocess import check_call, CalledProcessError
import logging
from util import run_check

logging.getLogger().setLevel(logging.INFO)


def _single_dir_apiview(mod):
    loop = 0
    while True:
        try:
            check_call(
                [
                    "apistubgen",
                    "--pkg-path",
                    str(mod.absolute()),
                ]
            )
        except CalledProcessError as e:
            if loop >= 2:  # retry for maximum 3 times because sometimes the apistubgen has transient failure.
                logging.error("{} exited with apiview generation error {}".format(mod.stem, e.returncode))
                return False
            else:
                loop += 1
                continue
        return True


if __name__ == "__main__":
    run_check("apiview", _single_dir_apiview, "APIView")
