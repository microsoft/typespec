#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------
import os
import logging
from pathlib import Path
import argparse
from concurrent.futures import ProcessPoolExecutor, as_completed

logging.getLogger().setLevel(logging.INFO)

# Root is the tests directory (4 levels up from this file: ci -> scripts -> eng -> package_root, then into tests)
ROOT_FOLDER = os.path.abspath(os.path.join(os.path.abspath(__file__), "..", "..", "..", "..", "tests"))

IGNORE_FOLDER = []

# Directories inside each generated package that should be skipped by all CI checks.
# These are auto-generated test/sample scaffolding, not the actual SDK code.
SKIP_PACKAGE_DIRS = {"generated_tests", "generated_samples", "build", "__pycache__", ".pytest_cache"}


def get_package_namespace_dir(mod):
    """Find the actual namespace directory inside a generated package, skipping non-SDK dirs."""
    for d in mod.iterdir():
        if (
            d.is_dir()
            and not d.name.startswith("_")
            and not d.name.endswith("egg-info")
            and d.name not in SKIP_PACKAGE_DIRS
        ):
            return d
    return None


def run_check(name, call_back, log_info):
    parser = argparse.ArgumentParser(
        description=f"Run {name} against target folder. Add a local custom plugin to the path prior to execution. "
    )
    parser.add_argument(
        "-t",
        "--test-folder",
        dest="test_folder",
        help="The test folder we're in. Can be 'azure' or 'unbranded'",
        required=True,
    )
    parser.add_argument(
        "-f",
        "--file-name",
        dest="file_name",
        help="The specific file name if you only want to run one file. Optional.",
        required=False,
    )
    parser.add_argument(
        "-s",
        "--subfolder",
        dest="subfolder",
        help="The subfolder containing generated code, default to 'generated'.",
        required=False,
        default="generated",
    )
    parser.add_argument(
        "-j",
        "--jobs",
        dest="jobs",
        help="Number of parallel jobs (default: CPU count)",
        type=int,
        required=False,
        default=max(1, os.cpu_count()),
    )

    args = parser.parse_args()

    # Path structure: tests/generated/{test_folder}/
    pkg_dir = Path(ROOT_FOLDER) / Path(args.subfolder) / Path(args.test_folder)
    dirs = [d for d in pkg_dir.iterdir() if d.is_dir() and not d.stem.startswith("_") and d.stem not in IGNORE_FOLDER]
    if args.file_name:
        dirs = [d for d in dirs if args.file_name.lower() in d.stem.lower()]

    if not dirs:
        logging.info("No directories to process")
        return

    logging.info(f"Processing {len(dirs)} packages with {args.jobs} parallel jobs...")

    failed = []
    succeeded = 0

    with ProcessPoolExecutor(max_workers=args.jobs) as executor:
        futures = {executor.submit(call_back, d): d for d in dirs}
        for future in as_completed(futures):
            pkg = futures[future]
            try:
                if future.result():
                    succeeded += 1
                else:
                    failed.append(pkg.stem)
            except Exception as e:
                logging.error(f"{pkg.stem} raised exception: {e}")
                failed.append(pkg.stem)

    logging.info(f"{log_info}: {succeeded} succeeded, {len(failed)} failed")

    if failed:
        logging.error(f"{log_info} failed for: {', '.join(failed)}")
        exit(1)
