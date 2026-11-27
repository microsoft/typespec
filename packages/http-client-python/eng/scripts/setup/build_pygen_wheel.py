#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import argparse
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tarfile
import tempfile
import zipfile

if not sys.version_info >= (3, 10, 0):
    raise Exception("Autorest for Python extension requires Python 3.10 at least")

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError

    detect_package_manager()
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Exception("Your Python installation doesn't have a suitable package manager (pip or uv) available")

from venvtools import python_run
from package_manager import install_packages, create_venv_with_package_manager

_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def load_pyodide_lock():
    """Read the lock from the pinned Pyodide npm package."""
    expected = json.loads((_ROOT_DIR / "package.json").read_text())["dependencies"]["pyodide"]
    for directory in (_ROOT_DIR, *_ROOT_DIR.parents):
        package_dir = directory / "node_modules" / "pyodide"
        if (package_dir / "package.json").is_file():
            break
    else:
        raise RuntimeError(f"pyodide npm package not found from {_ROOT_DIR}. Run npm install before building.")
    version = json.loads((package_dir / "package.json").read_text())["version"]
    if version != expected:
        raise RuntimeError(f"Installed pyodide {version} at {package_dir} does not match pinned version {expected}.")
    return json.loads((package_dir / "pyodide-lock.json").read_text())


def download_browser_requirements(context, destination, lock):
    env = os.environ.copy()
    env["PIP_INDEX_URL"] = (
        env.get("PIP_INDEX_URL")
        or env.get("UV_DEFAULT_INDEX")
        or "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-python/pypi/simple/"
    )
    subprocess.run(
        [
            context.env_exe,
            "-m",
            "pip",
            "download",
            "--require-hashes",
            "--no-deps",
            "--no-build-isolation",
            "--only-binary=:all:",
            "--no-binary=pyyaml,markupsafe",
            "--platform=any",
            "--implementation=cp",
            "--abi=none",
            f"--python-version={lock['info']['python']}",
            "--dest",
            str(destination),
            "-r",
            str(_ROOT_DIR / "eng" / "playground-requirements.txt"),
        ],
        env=env,
        check=True,
    )


def extract_source(archive_path, destination):
    """Extract only regular files and directories from a hash-verified source archive."""
    with tarfile.open(archive_path, "r:gz") as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            if (
                path.is_absolute()
                or ".." in path.parts
                or "\\" in member.name
                or any(":" in part for part in path.parts)
                or not (member.isfile() or member.isdir())
            ):
                raise RuntimeError(f"Unsafe source archive entry: {member.name}")
            target = destination.joinpath(*path.parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.extractfile(member) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)


def build_pure_sources(context, downloads, browser, workspace):
    for package in ("pyyaml", "markupsafe"):
        archives = [p for p in downloads.glob("*.tar.gz") if p.name.lower().startswith(package + "-")]
        if len(archives) != 1:
            raise RuntimeError(f"Expected exactly one {package} source archive, found {len(archives)}.")
        source_root = workspace / package
        source_root.mkdir()
        extract_source(archives[0], source_root)
        roots = list(source_root.iterdir())
        if len(roots) != 1 or not roots[0].is_dir():
            raise RuntimeError(f"Unexpected {package} source archive layout.")
        source = roots[0]
        env = os.environ.copy()
        if package == "pyyaml":
            env["PYYAML_FORCE_LIBYAML"] = "0"
        else:
            # Use upstream setup.cfg metadata without its optional native extension.
            (source / "setup.py").write_text("from setuptools import setup\nsetup()\n")
        subprocess.run(
            [
                context.env_exe,
                "-m",
                "build",
                "--wheel",
                "--no-isolation",
                "--skip-dependency-check",
                "--outdir",
                str(browser),
            ],
            cwd=source,
            env=env,
            check=True,
        )


def check_pure_wheels(browser):
    for wheel in browser.glob("*.whl"):
        if not wheel.name.endswith("-none-any.whl"):
            raise RuntimeError(f"Unsupported browser wheel: {wheel.name}")
        with zipfile.ZipFile(wheel) as archive:
            if any(name.endswith((".so", ".pyd", ".dll", ".wasm")) for name in archive.namelist()):
                raise RuntimeError(f"Unsupported browser wheel contents: {wheel.name}")


def build_browser_wheels(context):
    dist = _ROOT_DIR / "generator" / "dist"
    wheel = next(dist.glob("pygen-*.whl"), None)
    if wheel is None:
        raise RuntimeError(f"Generator wheel not found in {dist}. Build the generator before preparing browser wheels.")
    lock = load_pyodide_lock()
    browser = dist / "browser"
    with tempfile.TemporaryDirectory(dir=dist) as directory:
        workspace = Path(directory)
        downloads = workspace / "downloads"
        downloads.mkdir()
        output = workspace / "browser"
        output.mkdir()
        download_browser_requirements(context, downloads, lock)
        for source in downloads.glob("*.whl"):
            shutil.copyfile(source, output / source.name)
        build_pure_sources(context, downloads, output, workspace)
        shutil.copyfile(wheel, output / wheel.name)
        check_pure_wheels(output)
        subprocess.run(
            [
                context.env_exe,
                "-m",
                "pip",
                "install",
                "--dry-run",
                "--ignore-installed",
                "--no-index",
                "--only-binary=:all:",
                "--find-links",
                str(output),
                "--platform=any",
                "--implementation=cp",
                "--abi=none",
                f"--python-version={lock['info']['python']}",
                str(output / wheel.name),
            ],
            check=True,
        )
        names = sorted(p.name for p in output.glob("*.whl"))
        (output / "manifest.json").write_text(json.dumps({"wheels": names}, indent=2) + "\n")
        if browser.exists():
            shutil.rmtree(browser)
        shutil.move(str(output), browser)


def main(playground=False):
    venv_context = create_venv_with_package_manager(_ROOT_DIR / "venv_build_wheel")
    packages = ["build", "wheel", "setuptools==83.0.0", "pip==26.2.2"] if playground else ["build"]
    install_packages(packages, venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")
    if playground:
        build_browser_wheels(venv_context)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--playground", action="store_true", help="Prepare browser dependency wheels for the playground"
    )
    args = parser.parse_args()
    main(playground=args.playground)
