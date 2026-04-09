# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""
Batch process multiple TypeSpec YAML files in a single Python process.
This avoids the overhead of spawning a new Python process for each spec.
"""
import argparse
import json
import sys
import os
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor, as_completed
from multiprocessing import freeze_support

# Add the generator to the path
_ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_ROOT_DIR / "generator"))


def process_single_spec(config_path_str: str) -> tuple[str, bool, str]:
    """Process a single spec from its config file.

    Returns: (output_dir, success, error_message)
    """
    # Import inside function for multiprocessing compatibility
    from pygen import preprocess, codegen, black

    config_path = Path(config_path_str)
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        yaml_path = config["yamlPath"]
        command_args = config["commandArgs"]
        output_dir = config["outputDir"]

        # Convert command args to the format expected by pygen
        # Remove keys that shouldn't be passed to pygen
        pygen_args = {k.replace("-", "_"): v for k, v in command_args.items()
                      if k not in ["emit-yaml-only"]}

        # Run preprocess and codegen
        preprocess.PreProcessPlugin(
            output_folder=output_dir,
            tsp_file=yaml_path,
            **pygen_args
        ).process()

        codegen.CodeGenerator(
            output_folder=output_dir,
            tsp_file=yaml_path,
            **pygen_args
        ).process()

        # Run black
        black.BlackScriptPlugin(
            output_folder=output_dir,
            **pygen_args
        ).process()

        # Clean up the config file
        config_path.unlink()

        return (output_dir, True, "")
    except Exception as e:
        return (str(config_path), False, str(e))


def main():
    parser = argparse.ArgumentParser(description="Batch process TypeSpec YAML files")
    parser.add_argument(
        "--config-files",
        nargs="+",
        required=True,
        help="Paths to .tsp-codegen.json config files",
    )
    parser.add_argument(
        "--jobs",
        type=int,
        default=4,
        help="Number of parallel jobs (default: 4)",
    )
    args = parser.parse_args()

    # Use strings for multiprocessing compatibility
    config_files = args.config_files

    print(f"Processing {len(config_files)} specs with {args.jobs} parallel jobs...")

    succeeded = 0
    failed = 0

    # Use ProcessPoolExecutor for true parallelism (bypasses GIL)
    with ProcessPoolExecutor(max_workers=args.jobs) as executor:
        futures = {executor.submit(process_single_spec, cf): cf for cf in config_files}

        for future in as_completed(futures):
            output_dir, success, error = future.result()
            if success:
                succeeded += 1
            else:
                failed += 1
                print(f"  ✗ {output_dir}: {error}")

    print(f"\nBatch processing complete: {succeeded} succeeded, {failed} failed")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    freeze_support()  # Required for Windows multiprocessing
    main()
