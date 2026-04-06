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

    # Find all package directories
    packages = glob.glob(os.path.join(generated_dir, "*"))
    packages = [p for p in packages if os.path.isdir(p)]

    if not packages:
        print(f"Warning: No packages found in {generated_dir}")
        return

    print(f"Installing {len(packages)} packages from {generated_dir}")

    # Install packages using uv pip
    # Use --no-deps to avoid dependency resolution overhead
    cmd = ["uv", "pip", "install", "--no-deps"] + packages

    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully installed {len(packages)} packages")
    except subprocess.CalledProcessError as e:
        print(f"Error installing packages: {e}")
        sys.exit(1)
    except FileNotFoundError:
        # uv not found, try pip
        print("uv not found, falling back to pip")
        cmd = [sys.executable, "-m", "pip", "install", "--no-deps"] + packages
        subprocess.run(cmd, check=True)


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
