#!/usr/bin/env python

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile

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

# Native browser dependencies built for Pyodide's WebAssembly runtime.
BROWSER_NATIVE_PACKAGES = ("pyyaml", "markupsafe")


def _vendor_dir():
    return _ROOT_DIR / "eng" / "playground-wheels"


def _sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _normalize(name):
    return re.sub(r"[-_.]+", "-", name).lower()


def _wheel_metadata(path):
    with zipfile.ZipFile(path) as archive:
        name = next(n for n in archive.namelist() if n.endswith(".dist-info/METADATA"))
        metadata = archive.read(name).decode()
    package = re.search(r"^Name: (.+)$", metadata, re.MULTILINE).group(1).strip()
    version = re.search(r"^Version: (.+)$", metadata, re.MULTILINE).group(1).strip()
    requirements = re.findall(r"^Requires-Dist: (.+)$", metadata, re.MULTILINE)
    return _normalize(package), version, requirements


def load_pyodide_lock():
    """Read pyodide-lock.json from the pinned pyodide npm dependency instead of the Pyodide CDN."""
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


def load_vendored_wheels():
    """Return the checked-in browser wheels after verifying their hashes."""
    vendor = _vendor_dir()
    lock_path = vendor / "wheels.json"
    if not lock_path.is_file():
        raise RuntimeError(f"Vendored browser wheel lock not found at {lock_path}.")
    wheels = json.loads(lock_path.read_text())["wheels"]
    actual = {p.name for p in vendor.glob("*.whl")}
    if actual != set(wheels):
        missing = sorted(set(wheels) - actual)
        extra = sorted(actual - set(wheels))
        raise RuntimeError(f"Vendored browser wheels do not match wheels.json. Missing: {missing}. Extra: {extra}.")
    for filename, digest in wheels.items():
        if _sha256(vendor / filename) != digest:
            raise RuntimeError(f"Vendored browser wheel {filename} does not match its sha256 in wheels.json.")
    return [vendor / filename for filename in sorted(wheels)]


def validate_browser_wheels(generator_wheel, wheels, lock):
    """Check that the vendored wheels satisfy pygen and match the pinned Pyodide runtime."""
    by_name = {}
    for wheel in wheels:
        name, version, _ = _wheel_metadata(wheel)
        if not wheel.name.endswith("-none-any.whl") and name not in BROWSER_NATIVE_PACKAGES:
            raise RuntimeError(f"Unsupported native browser dependency: {wheel.name}")
        by_name[name] = (version, wheel)
    for name in BROWSER_NATIVE_PACKAGES:
        package = lock["packages"][name]
        wheel = by_name.get(name, (None, None))[1]
        if wheel is None or wheel.name != package["file_name"] or _sha256(wheel) != package["sha256"]:
            raise RuntimeError(f"Vendored {name} wheel does not match pinned Pyodide package {package['file_name']}.")
    for wheel in [generator_wheel, *wheels]:
        for requirement in _wheel_metadata(wheel)[2]:
            # Conditional requirements target other Python versions or extras.
            if ";" in requirement:
                continue
            match = re.match(r"([A-Za-z0-9_.-]+)\s*(?:\[[^]]*\])?\s*(?:==\s*([^,\s]+))?", requirement)
            name, version = _normalize(match.group(1)), match.group(2)
            if name not in by_name:
                raise RuntimeError(f"Vendored browser wheels are missing {requirement} required by {wheel.name}.")
            if version and by_name[name][0] != version:
                raise RuntimeError(
                    f"Vendored {name} {by_name[name][0]} does not satisfy {requirement} required by {wheel.name}."
                )


def build_browser_wheels():
    dist = _ROOT_DIR / "generator" / "dist"
    wheel = next(dist.glob("pygen-*.whl"), None)
    if wheel is None:
        raise RuntimeError(f"Generator wheel not found in {dist}. Build the generator before preparing browser wheels.")
    wheels = load_vendored_wheels()
    validate_browser_wheels(wheel, wheels, load_pyodide_lock())

    browser = dist / "browser"
    if browser.exists():
        shutil.rmtree(browser)
    browser.mkdir()
    for source in [wheel, *wheels]:
        shutil.copyfile(source, browser / source.name)
    names = sorted(p.name for p in [wheel, *wheels])
    (browser / "manifest.json").write_text(json.dumps({"wheels": names}, indent=2) + "\n")


def update_vendored_wheels(venv_context):
    """Refresh the checked-in browser wheels. This maintainer-only step requires package downloads."""
    dist = _ROOT_DIR / "generator" / "dist"
    wheel = next(dist.glob("pygen-*.whl"), None)
    if wheel is None:
        raise RuntimeError(f"Generator wheel not found in {dist}. Build the generator before updating browser wheels.")
    lock = load_pyodide_lock()
    native = [lock["packages"][name] for name in BROWSER_NATIVE_PACKAGES]
    _, abi, platform = native[0]["file_name"].removesuffix(".whl").rsplit("-", 2)
    pyodide_version = json.loads((_ROOT_DIR / "package.json").read_text())["dependencies"]["pyodide"]
    with tempfile.TemporaryDirectory(dir=dist) as directory:
        staging = Path(directory) / "download"
        links = Path(directory) / "pyodide"
        links.mkdir()
        for package in native:
            url = f"https://cdn.jsdelivr.net/pyodide/v{pyodide_version}/full/{package['file_name']}"
            with urllib.request.urlopen(url) as response:
                content = response.read()
            if hashlib.sha256(content).hexdigest() != package["sha256"]:
                raise RuntimeError(f"Downloaded {package['file_name']} does not match pyodide-lock.json.")
            (links / package["file_name"]).write_bytes(content)
        command = [
            venv_context.env_exe,
            "-m",
            "pip",
            "download",
            str(wheel),
            # Later platformdirs releases import os.geteuid, which Pyodide does not provide.
            "platformdirs==4.3.8",
            *[f"{package['name']}=={package['version']}" for package in native],
            f"--find-links={links}",
            f"--dest={staging}",
            "--only-binary=:all:",
            f"--python-version={lock['info']['python']}",
            f"--platform={platform}",
            "--implementation=cp",
            f"--abi={abi}",
        ]
        env = os.environ.copy()
        env["PIP_INDEX_URL"] = (
            env.get("PIP_INDEX_URL")
            or env.get("UV_DEFAULT_INDEX")
            or "https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-python/pypi/simple/"
        )
        subprocess.run(command, env=env, check=True)

        wheels = sorted(p for p in staging.glob("*.whl") if not p.name.startswith("pygen-"))
        validate_browser_wheels(wheel, wheels, lock)
        vendor = _vendor_dir()
        vendor.mkdir(parents=True, exist_ok=True)
        for stale in vendor.glob("*.whl"):
            stale.unlink()
        for source in wheels:
            shutil.copyfile(source, vendor / source.name)
        hashes = {p.name: _sha256(p) for p in wheels}
        (vendor / "wheels.json").write_text(json.dumps({"wheels": hashes}, indent=2) + "\n")


def main(playground=False, update_browser_wheels=False):
    venv_path = _ROOT_DIR / "venv_build_wheel"
    venv_context = create_venv_with_package_manager(venv_path)

    # uv environments are unseeded; refreshing browser wheels downloads them with pip.
    install_packages(["build", "pip==26.2.2"] if update_browser_wheels else ["build"], venv_context)
    python_run(venv_context, "build", ["--wheel"], additional_dir="generator")
    if update_browser_wheels:
        update_vendored_wheels(venv_context)
    if playground or update_browser_wheels:
        build_browser_wheels()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--playground", action="store_true", help="Prepare browser dependency wheels for the playground"
    )
    parser.add_argument(
        "--update-browser-wheels",
        action="store_true",
        help="Refresh the vendored playground dependency wheels. Requires access to package sources.",
    )
    args = parser.parse_args()
    main(playground=args.playground, update_browser_wheels=args.update_browser_wheels)
