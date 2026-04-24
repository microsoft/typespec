#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute pylint within a tox environment. Depending on which package is being executed against,
# a failure may be suppressed.

from subprocess import check_call, CalledProcessError
import os
import logging
import sys
from util import run_check, get_package_namespace_dir

logging.getLogger().setLevel(logging.INFO)


def get_rfc_file_location():
    # When running from tests/ directory via tox
    rfc_file_location = os.path.join(os.getcwd(), "../eng/scripts/ci/config/pylintrc")
    if os.path.exists(rfc_file_location):
        return rfc_file_location
    # Fallback for running from different directories
    return os.path.join(os.path.dirname(__file__), "config/pylintrc")


def _single_dir_pylint(mod):
    inner_class = get_package_namespace_dir(mod)
    if not inner_class:
        logging.info(f"No package directory found in {mod}, skipping")
        return True
    # Only load the Azure pylint guidelines checker plugin for azure packages.
    # The plugin (azure-pylint-guidelines-checker) is only installed in the
    # lint-azure tox environment and is not available for unbranded packages.
    is_azure = "azure" in mod.parts
    pylint_args = [
        sys.executable,
        "-m",
        "pylint",
        "--rcfile={}".format(get_rfc_file_location()),
        "--evaluation=(max(0, 0 if fatal else 10.0 - ((float(5 * error + warning + refactor + convention + info)/ statement) * 10)))",
        "--output-format=parseable",
        "--recursive=y",
        "--py-version=3.9",
    ]
    if is_azure:
        pylint_args.append("--load-plugins=pylint_guidelines_checker")
    pylint_args.append(str(inner_class.absolute()))
    try:
        check_call(pylint_args)
        return True
    except CalledProcessError as e:
        logging.error("{} exited with linting error {}".format(str(inner_class.absolute()), e.returncode))
        return False


if __name__ == "__main__":
    if os.name == "nt":
        # Before https://github.com/microsoft/typespec/issues/4759 fixed, skip running Pylint for now on Windows
        logging.info("Skip running Pylint on Windows for now")
        sys.exit(0)
    run_check("pylint", _single_dir_pylint, "Pylint")
