#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------
import os
import logging
from pathlib import Path
import argparse
from multiprocessing import Pool

logging.getLogger().setLevel(logging.INFO)

ROOT_FOLDER = os.path.abspath(os.path.join(os.path.abspath(__file__), "..", "..", "..", ".."))

IGNORE_FOLDER = []


def run_check(name, call_back, log_info):
    parser = argparse.ArgumentParser(
        description=f"Run {name} against target folder. Add a local custom plugin to the path prior to execution. "
    )
    parser.add_argument(
        "-t",
        "--test-folder",
        dest="test_folder",
        help="The test folder we're in. Can be 'azure', 'multiapi', or 'vanilla'",
        required=True,
    )
    parser.add_argument(
        "-g",
        "--generator",
        dest="generator",
        help="The generator we're using. Can be 'legacy', 'version-tolerant'.",
        required=False,
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
        help="The specific sub folder to validate, default to Expected/AcceptanceTests. Optional.",
        required=False,
        default="Expected/AcceptanceTests",
    )

    args = parser.parse_args()

    pkg_dir = Path(ROOT_FOLDER) / Path("test") / Path(args.test_folder)
    if args.generator:
        pkg_dir /= Path(args.generator)
    if args.subfolder:
        pkg_dir /= Path(args.subfolder)
    dirs = [d for d in pkg_dir.iterdir() if d.is_dir() and not d.stem.startswith("_") and d.stem not in IGNORE_FOLDER]
    if args.file_name:
        dirs = [d for d in dirs if args.file_name.lower() in d.stem.lower()]
    if len(dirs) > 1:
        with Pool() as pool:
            result = pool.map(call_back, dirs)
        response = all(result)
    else:
        response = call_back(dirs[0])
    if not response:
        logging.error("%s fails", log_info)
        exit(1)
