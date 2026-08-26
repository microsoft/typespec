#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute apiview generation within a tox environment. Depending on which package is being executed against,
# a failure may be suppressed.

import os
import sys
from subprocess import run, TimeoutExpired
import logging
from util import run_check

logging.getLogger().setLevel(logging.INFO)

# Timeout for each apiview generation (seconds)
APIVIEW_TIMEOUT = 30


def _single_dir_apiview(mod):
    for attempt in range(2):
        try:
            result = run(
                ["apistubgen", "--pkg-path", str(mod.absolute())],
                capture_output=True,
                timeout=APIVIEW_TIMEOUT,
            )
            if result.returncode == 0:
                return True
            if attempt == 1:
                logging.error(f"{mod.stem} failed: {result.stderr.decode()[:200]}")
                return False
        except TimeoutExpired:
            if attempt == 1:
                logging.error(f"{mod.stem} timed out after {APIVIEW_TIMEOUT}s")
                return False
        except Exception as e:
            if attempt == 1:
                logging.error(f"{mod.stem} error: {e}")
                return False
    return False


if __name__ == "__main__":
    if os.name == "nt":
        logging.info("Skip running ApiView on Windows for now to reduce time cost in CI")
        sys.exit(0)
    run_check("apiview", _single_dir_apiview, "APIView")
