# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
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


def python_run(venv_context, module, command=None, *, additional_dir="."):
    try:
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
