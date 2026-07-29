#!/usr/bin/env python
"""Install generated packages for testing.

Supports two modes:
1. Build wheels from source dirs into a wheel directory (build command)
2. Install from pre-built wheels via --find-links (instant, no compilation)

The build step runs once before tox envs start. Each tox env then installs
from pre-built wheels, avoiding redundant source builds across environments.
"""

import glob
import os
import subprocess
import sys


def _find_packages(generated_dir):
    """Find all package directories that have pyproject.toml or setup.py."""
    all_dirs = glob.glob(os.path.join(generated_dir, "*"))
    return sorted([
        p for p in all_dirs
        if os.path.isdir(p) and (
            os.path.exists(os.path.join(p, "pyproject.toml")) or
            os.path.exists(os.path.join(p, "setup.py"))
        )
    ])


def build_wheels(flavor, tests_dir):
    """Build wheels for all packages into a shared directory."""
    generated_dir = os.path.join(tests_dir, "generated", flavor)
    wheel_dir = os.path.join(tests_dir, ".wheels", flavor)
    os.makedirs(wheel_dir, exist_ok=True)

    packages = _find_packages(generated_dir)
    if not packages:
        print(f"Warning: No packages found in {generated_dir}")
        return

    print(f"Building {len(packages)} wheels for {flavor}...")

    batch_size = 50
    for i in range(0, len(packages), batch_size):
        batch = packages[i:i + batch_size]
        try:
            subprocess.run(
                ["uv", "pip", "wheel", "--no-deps", "--wheel-dir", wheel_dir] + batch,
                check=True,
            )
        except FileNotFoundError:
            subprocess.run(
                [sys.executable, "-m", "pip", "wheel", "--no-deps", "--wheel-dir", wheel_dir] + batch,
                check=True,
            )

    wheel_count = len(glob.glob(os.path.join(wheel_dir, "*.whl")))
    print(f"Built {wheel_count} wheels for {flavor}")


def install_packages(flavor, tests_dir):
    """Install generated packages for the given flavor."""
    generated_dir = os.path.join(tests_dir, "generated", flavor)
    wheel_dir = os.path.join(tests_dir, ".wheels", flavor)

    if not os.path.exists(generated_dir):
        print(f"Warning: Generated directory does not exist: {generated_dir}")
        return

    packages = _find_packages(generated_dir)
    if not packages:
        print(f"Warning: No packages found in {generated_dir}")
        return

    print(f"Installing {len(packages)} packages from {generated_dir}")

    use_wheels = os.path.isdir(wheel_dir) and bool(glob.glob(os.path.join(wheel_dir, "*.whl")))
    use_uv = True

    if use_wheels:
        # Install from pre-built wheels (instant, no compilation).
        # Use wheel filenames to derive package specs since --no-index
        # won't resolve source directory paths.
        wheel_files = glob.glob(os.path.join(wheel_dir, "*.whl"))
        print(f"  Using {len(wheel_files)} pre-built wheels from .wheels/{flavor}/")
        try:
            cmd = ["uv", "pip", "install", "--no-deps", "--no-index", "--find-links", wheel_dir] + wheel_files
            subprocess.run(cmd, check=True)
            print(f"Successfully installed {len(wheel_files)} packages")
            return
        except FileNotFoundError:
            use_uv = False
            try:
                cmd = [sys.executable, "-m", "pip", "install", "--no-deps", "--no-index", "--find-links", wheel_dir] + wheel_files
                subprocess.run(cmd, check=True)
                print(f"Successfully installed {len(wheel_files)} packages")
                return
            except subprocess.CalledProcessError:
                print("  Wheel install failed, falling back to source install")
        except subprocess.CalledProcessError:
            print("  Wheel install failed, falling back to source install")

    # Fall back to source install with per-flavor cache
    cache_dir = os.path.join(tests_dir, ".uv-cache", flavor)
    batch_size = 50
    for i in range(0, len(packages), batch_size):
        batch = packages[i:i + batch_size]
        if use_uv:
            cmd = ["uv", "pip", "install", "--no-deps", "--cache-dir", cache_dir] + batch
        else:
            cmd = [sys.executable, "-m", "pip", "install", "--no-deps"] + batch
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error installing packages: {e}")
            sys.exit(1)
        except FileNotFoundError:
            if use_uv:
                print("uv not found, falling back to pip")
                use_uv = False
                cmd = [sys.executable, "-m", "pip", "install", "--no-deps"] + batch
                subprocess.run(cmd, check=True)

    print(f"Successfully installed {len(packages)} packages")


def main():
    if len(sys.argv) < 2:
        print("Usage: install_packages.py <flavor> [tests_dir]")
        print("       install_packages.py build <flavor> [tests_dir]")
        sys.exit(1)

    # Support both old-style (install_packages.py <flavor> <dir>) and new build command
    if sys.argv[1] == "build":
        if len(sys.argv) < 3:
            print("Usage: install_packages.py build <flavor> [tests_dir]")
            sys.exit(1)
        flavor = sys.argv[2]
        tests_dir = sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(__file__))
        build_wheels(flavor, tests_dir)
    elif sys.argv[1] in ("azure", "unbranded"):
        flavor = sys.argv[1]
        tests_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))
        install_packages(flavor, tests_dir)
    else:
        print(f"Error: Unknown command or flavor '{sys.argv[1]}'")
        sys.exit(1)


if __name__ == "__main__":
    main()
