# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import venv
import logging
from pathlib import Path
from venvtools import python_run

_ROOT_DIR = Path(__file__).parent.parent

_LOGGER = logging.getLogger(__name__)

if __name__ == "__main__":
    venv_path = _ROOT_DIR / "venv"
    venv_prexists = venv_path.exists()

    assert venv_prexists  # Otherwise install was not done

    env_builder = venv.EnvBuilder(with_pip=True)
    venv_context = env_builder.ensure_directories(venv_path)

    if "--debug" in sys.argv or "--debug=true" in sys.argv:
        try:
            import debugpy  # pylint: disable=import-outside-toplevel
        except ImportError:
            raise SystemExit("Please pip install ptvsd in order to use VSCode debugging")

        # 5678 is the default attach port in the VS Code debug configurations
        debugpy.listen(("localhost", 5678))
        debugpy.wait_for_client()
        breakpoint()  # pylint: disable=undefined-variable

    # run m2r
    python_run(venv_context, "generator.pygen.m2r", command=sys.argv[1:])
    python_run(venv_context, "generator.pygen.preprocess.__init__", command=sys.argv[1:])
    python_run(venv_context, "generator.pygen.codegen.__init__", command=sys.argv[1:])
    python_run(venv_context, "generator.pygen.black", command=sys.argv[1:])
