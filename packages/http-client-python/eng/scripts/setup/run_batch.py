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
    from pygen import preprocess, codegen

    config_path = Path(config_path_str)
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        yaml_path = config["yamlPath"]
        command_args = config["commandArgs"]
        output_dir = config["outputDir"]

        # Pass command args directly to pygen - pygen expects hyphenated keys
        # Remove keys that shouldn't be passed to pygen
        pygen_args = {k: v for k, v in command_args.items() if k not in ["emit-yaml-only"]}

        # Run preprocess and codegen (black is batched at the end for performance)
        preprocess.PreProcessPlugin(output_folder=output_dir, tsp_file=yaml_path, **pygen_args).process()

        codegen.CodeGenerator(output_folder=output_dir, tsp_file=yaml_path, **pygen_args).process()

        # Clean up the config file
        config_path.unlink()

        return (output_dir, True, "")
    except Exception as e:
        return (str(config_path), False, str(e))


def render_progress_bar(completed: int, failed: int, total: int, width: int = 40) -> str:
    """Render a progress bar with green for success and red for failures."""
    success_count = completed - failed
    success_width = round((success_count / total) * width) if total > 0 else 0
    fail_width = round((failed / total) * width) if total > 0 else 0
    empty_width = width - success_width - fail_width

    # ANSI color codes
    green_bg = "\033[42m"
    red_bg = "\033[41m"
    reset = "\033[0m"
    dim = "\033[2m"
    cyan = "\033[36m"

    success_bar = f"{green_bg}{' ' * success_width}{reset}"
    fail_bar = f"{red_bg}{' ' * fail_width}{reset}" if failed > 0 else ""
    empty_bar = f"{dim}{'░' * max(0, empty_width)}{reset}"

    percent = round((completed / total) * 100) if total > 0 else 0
    return f"{success_bar}{fail_bar}{empty_bar} {cyan}{percent}%{reset} ({completed}/{total})"


def collect_config_files(generated_dir: str, flavor: str) -> list[str]:
    """Collect all .tsp-codegen-*.json config files from the generated directory."""
    flavor_dir = Path(generated_dir) / "tests" / "generated" / flavor
    if not flavor_dir.exists():
        return []

    config_files = []
    for pkg_dir in flavor_dir.iterdir():
        if pkg_dir.is_dir():
            for f in pkg_dir.iterdir():
                if f.name.startswith(".tsp-codegen-") and f.name.endswith(".json"):
                    config_files.append(str(f))
    return config_files


def main():
    parser = argparse.ArgumentParser(description="Batch process TypeSpec YAML files")
    parser.add_argument(
        "--generated-dir",
        required=True,
        help="Path to the generator directory (config files are in ../tests/generated/<flavor>/)",
    )
    parser.add_argument(
        "--flavor",
        required=True,
        help="Flavor to process (azure or unbranded)",
    )
    parser.add_argument(
        "--jobs",
        type=int,
        default=4,
        help="Number of parallel jobs (default: 4)",
    )
    args = parser.parse_args()

    # Discover config files from the generated directory
    config_files = collect_config_files(args.generated_dir, args.flavor)
    total = len(config_files)

    if total == 0:
        print("No config files found, nothing to process")
        return

    print(f"Processing {total} specs with {args.jobs} parallel jobs...")

    succeeded = 0
    failed = 0
    failed_specs = []
    output_dirs = []
    is_tty = sys.stdout.isatty()

    def update_progress():
        if is_tty:
            sys.stdout.write(f"\r{render_progress_bar(succeeded + failed, failed, total)}")
            sys.stdout.flush()

    # Initial progress bar
    update_progress()

    # Use ProcessPoolExecutor for true parallelism (bypasses GIL)
    with ProcessPoolExecutor(max_workers=args.jobs) as executor:
        futures = {executor.submit(process_single_spec, cf): cf for cf in config_files}

        for future in as_completed(futures):
            output_dir, success, error = future.result()
            if success:
                succeeded += 1
                output_dirs.append(output_dir)
            else:
                failed += 1
                failed_specs.append(f"{output_dir}: {error}")
                # Fail-fast: cancel pending futures on first failure
                print(f"\n\033[31m[FAIL-FAST] Cancelling remaining tasks after failure...\033[0m")
                for f in futures:
                    f.cancel()
                break
            update_progress()

    # Clear progress bar line
    if is_tty:
        sys.stdout.write("\r" + " " * 60 + "\r")
        sys.stdout.flush()

    # Print failures at the end
    if failed_specs:
        print("\n\033[31mFailed specs:\033[0m")
        for spec in failed_specs:
            print(f"  \033[31m•\033[0m {spec}")

    print(f"\nBatch processing complete: {succeeded} succeeded, {failed} failed")

    if failed > 0:
        sys.exit(1)

    # Run black formatting after all codegen completes. Running black separately
    # avoids duplicating black's import/startup cost in each worker process.
    if output_dirs:
        from pygen.black import BlackScriptPlugin

        print(f"Formatting {len(output_dirs)} packages with black...")
        for d in output_dirs:
            BlackScriptPlugin(output_folder=d).process()


if __name__ == "__main__":
    freeze_support()  # Required for Windows multiprocessing
    main()
