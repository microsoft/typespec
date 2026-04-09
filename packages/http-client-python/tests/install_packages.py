#!/usr/bin/env python
"""Install generated packages for testing.

This script handles cross-platform path issues that can occur with inline
tox commands on Windows.
"""

import glob
import os
import subprocess
import sys


def install_packages(flavor: str, tests_dir: str) -> None:
    """Install generated packages for the given flavor."""
    generated_dir = os.path.join(tests_dir, "generated", flavor)

    if not os.path.exists(generated_dir):
        print(f"Warning: Generated directory does not exist: {generated_dir}")
        return

    # Find all package directories that have pyproject.toml or setup.py
    all_dirs = glob.glob(os.path.join(generated_dir, "*"))
    packages = [
        p for p in all_dirs
        if os.path.isdir(p) and (
            os.path.exists(os.path.join(p, "pyproject.toml")) or
            os.path.exists(os.path.join(p, "setup.py"))
        )
    ]

    # Log skipped directories for debugging
    skipped = [os.path.basename(p) for p in all_dirs if os.path.isdir(p) and p not in packages]
    if skipped:
        print(f"Skipping {len(skipped)} directories without packaging files: {', '.join(skipped[:5])}{'...' if len(skipped) > 5 else ''}")

    if not packages:
        print(f"Warning: No packages found in {generated_dir}")
        return

    print(f"Installing {len(packages)} packages from {generated_dir}")

    # Install packages using uv pip
    # Use --no-deps to avoid dependency resolution overhead
    # Install in batches to avoid command line length limits on Windows
    batch_size = 20  # Conservative batch size for Windows command line limits
    use_uv = True

    for i in range(0, len(packages), batch_size):
        batch = packages[i:i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(packages) + batch_size - 1) // batch_size

        if total_batches > 1:
            print(f"  Batch {batch_num}/{total_batches}: {len(batch)} packages")

        if use_uv:
            cmd = ["uv", "pip", "install", "--no-deps"] + batch
        else:
            cmd = [sys.executable, "-m", "pip", "install", "--no-deps"] + batch

        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error installing packages: {e}")
            sys.exit(1)
        except FileNotFoundError:
            if use_uv:
                # uv not found, fall back to pip for this and subsequent batches
                print("uv not found, falling back to pip")
                use_uv = False
                cmd = [sys.executable, "-m", "pip", "install", "--no-deps"] + batch
                subprocess.run(cmd, check=True)

    print(f"Successfully installed {len(packages)} packages")


def main():
    if len(sys.argv) < 2:
        print("Usage: install_packages.py <flavor> [tests_dir]")
        print("  flavor: azure or unbranded")
        print("  tests_dir: optional, defaults to script directory")
        sys.exit(1)

    flavor = sys.argv[1]
    tests_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))

    if flavor not in ("azure", "unbranded"):
        print(f"Error: Invalid flavor '{flavor}'. Must be 'azure' or 'unbranded'")
        sys.exit(1)

    install_packages(flavor, tests_dir)


if __name__ == "__main__":
    main()
