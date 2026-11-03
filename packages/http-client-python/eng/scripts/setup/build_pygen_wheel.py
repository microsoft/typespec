#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import argparse
import json
import os
import shutil
import subprocess
import tempfile
from urllib.request import urlopen

if not sys.version_info >= (3, 10, 0):
    raise Exception("Autorest for Python extension requires Python 3.10 at least")

try:
    from package_manager import detect_package_manager, PackageManagerNotFoundError

    detect_package_manager()  # Just check if we have a package manager
except (ImportError, ModuleNotFoundError, PackageManagerNotFoundError):
    raise Exception("Your Python installation doesn't have a suitable package manager (pip or uv) available")


# Now we have a package manager (pip or uv) and Py >= 3.10, go to work

from pathlib import Path

from venvtools import python_run
from package_manager import install_packages, create_venv_with_package_manager

# eng/scripts/setup/build_pygen_wheel.py -> need to go up 4 levels to get to package root
_ROOT_DIR = Path(__file__).parent.parent.parent.parent


def build_browser_wheels(venv_context):
    dist = _ROOT_DIR / "generator" / "dist"
    wheel = next(dist.glob("pygen-*.whl"), None)
    if wheel is None:
        raise RuntimeError(f"Generator wheel not found in {dist}. Build the generator before preparing browser wheels.")
    package = json.loads((_ROOT_DIR / "package.json").read_text())
    pyodide_url = f"https://cdn.jsdelivr.net/pyodide/v{package['dependencies']['pyodide']}/full/"
    with urlopen(f"{pyodide_url}pyodide-lock.json") as response:
        lock = json.load(response)

    # These native extensions must match the browser's WebAssembly runtime, not the build host.
    native_packages = [lock["packages"][name] for name in ("pyyaml", "markupsafe")]
    with tempfile.TemporaryDirectory(dir=dist) as directory:
        staging = Path(directory)
        constraints = staging / "constraints.txt"
        constraints.write_text(
            "".join(f"{p['name']}=={p['version']}\n" for p in native_packages)
            # Later platformdirs releases import os.geteuid, which Pyodide 0.26 does not provide.
            + "platformdirs==4.3.8\n"
        )
        platform = native_packages[0]["file_name"].removesuffix(".whl").rsplit("-", 1)[1]
        command = [
            venv_context.env_exe,
            "-m",
            "pip",
            "download",
            str(wheel),
            "--dest",
            str(staging),
            "--only-binary=:all:",
            "--python-version",
            lock["info"]["python"],
            "--platform",
            platform,
            "--platform",
            "any",
            "--implementation",
            "cp",
            "--abi",
            native_packages[0]["file_name"].rsplit("-", 3)[2],
            "--constraint",
            str(constraints),
        ]
        for package in native_packages:
            command.extend(["--find-links", pyodide_url + package["file_name"]])
        env = os.environ.copy()
        env["PIP_INDEX_URL"] = (
            env.get("PIP_INDEX_URL")
            or env.get("UV_DEFAULT_INDEX")
            or "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-python/pypi/simple/"
        )
        subprocess.run(command, env=env, check=True)

        unexpected = [
            p.name
            for p in staging.glob("*.whl")
            if not p.name.endswith("-none-any.whl") and p.name not in {p["file_name"] for p in native_packages}
        ]
        if unexpected:
            raise RuntimeError(f"Unsupported native browser dependencies: {', '.join(unexpected)}")
        browser = dist / "browser"
        if browser.exists():
            shutil.rmtree(browser)
        browser.mkdir()
        wheels = sorted(p.name for p in staging.glob("*-none-any.whl"))
        for filename in wheels:
            shutil.copyfile(staging / filename, browser / filename)
        (browser / "manifest.json").write_text(json.dumps({"wheels": wheels}, indent=2) + "\n")


def main(playground=False):
    venv_path = _ROOT_DIR / "venv_build_wheel"
    venv_context = create_venv_with_package_manager(venv_path)

    install_packages(["build"], venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")
    if playground:
        build_browser_wheels(venv_context)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--playground", action="store_true", help="Prepare browser dependency wheels for the playground"
    )
    main(playground=parser.parse_args().playground)
