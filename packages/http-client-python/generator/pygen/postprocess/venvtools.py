# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional
import subprocess
import venv
import sys
from pathlib import Path


_ROOT_DIR = Path(__file__).parent


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


def python_run(venv_context, module, command, directory=_ROOT_DIR) -> Optional[str]:
    try:
        cmd_line = [
            venv_context.env_exe,
            "-m",
            module,
        ] + command
        print("Executing: {}".format(" ".join(cmd_line)))
        subprocess.run(
            cmd_line,
            cwd=directory,
            check=True,
            stdout=False,
        )
        if module == "get_all":
            with open(f"{command[1]}/.temp_folder/patched.txt", "r", encoding="utf-8-sig") as f:
                return f.read()
    except subprocess.CalledProcessError as err:
        print(err)
        sys.exit(1)
    return None
