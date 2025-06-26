# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from contextlib import contextmanager
import tempfile
import subprocess
import venv
import sys
from pathlib import Path


_ROOT_DIR = Path(__file__).parent.parent.parent.parent


class ExtendedEnvBuilder(venv.EnvBuilder):
    """An extended env builder which saves the context, to have access
    easily to bin path and such.
    """

    def __init__(self, *args, **kwargs):
        self.context = None
        if sys.version_info < (3, 9, 0):
            # Not supported on Python 3.8, and we don't need it
            kwargs.pop("upgrade_deps", None)
        super().__init__(*args, **kwargs)

    def ensure_directories(self, env_dir):
        self.context = super(ExtendedEnvBuilder, self).ensure_directories(env_dir)
        return self.context


def create(
    env_dir,
    system_site_packages=False,
    clear=False,
    symlinks=False,
    with_pip=False,
    prompt=None,
    upgrade_deps=False,
):
    """Create a virtual environment in a directory."""
    builder = ExtendedEnvBuilder(
        system_site_packages=system_site_packages,
        clear=clear,
        symlinks=symlinks,
        with_pip=with_pip,
        prompt=prompt,
        upgrade_deps=upgrade_deps,
    )
    builder.create(env_dir)
    return builder.context


@contextmanager
def create_venv_with_package(packages):
    """Create a venv with these packages in a temp dir and yield the env.

    packages should be an iterable of package version instruction (e.g. package~=1.2.3)
    """
    from package_manager import detect_package_manager, PackageManagerNotFoundError
    
    with tempfile.TemporaryDirectory() as tempdir:
        my_env = create(tempdir, with_pip=True, upgrade_deps=True)
        
        try:
            package_manager = detect_package_manager()
        except PackageManagerNotFoundError:
            # Fall back to pip via venv context
            package_manager = "pip"
        
        if package_manager == "uv":
            # Use uv directly
            upgrade_cmd = ["uv", "pip", "install", "-U", "pip"]
            install_cmd = ["uv", "pip", "install"]
        else:
            # Use pip via venv context
            upgrade_cmd = [my_env.env_exe, "-m", "pip", "install", "-U", "pip"]
            install_cmd = [my_env.env_exe, "-m", "pip", "install"]
        
        subprocess.check_call(upgrade_cmd)
        if packages:
            subprocess.check_call(install_cmd + packages)
        yield my_env


def python_run(venv_context, module, command=None, *, additional_dir="."):
    try:
        # Handle different package managers
        if module == "pip":
            # Try to detect if we should use uv instead
            try:
                from package_manager import detect_package_manager
                package_manager = detect_package_manager()
                if package_manager == "uv":
                    cmd_line = ["uv", "pip"] + (command if command else [])
                else:
                    cmd_line = [venv_context.env_exe, "-m", module] + (command if command else [])
            except:
                # Fall back to original behavior
                cmd_line = [venv_context.env_exe, "-m", module] + (command if command else [])
        else:
            cmd_line = [venv_context.env_exe, "-m", module] + (command if command else [])
        
        print("Executing: {}".format(" ".join(cmd_line)))
        subprocess.run(
            cmd_line,
            cwd=_ROOT_DIR / additional_dir,
            check=True,
        )
    except subprocess.CalledProcessError as err:
        print(err)
        sys.exit(1)
