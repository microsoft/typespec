# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import logging
from pathlib import Path
from pygen.generate import generate
from pygen.utils import parse_args

# eng/scripts/setup/run_tsp.py -> need to go up 4 levels to get to package root
_ROOT_DIR = Path(__file__).parent.parent.parent.parent

_LOGGER = logging.getLogger(__name__)


def main() -> None:
    venv_path = _ROOT_DIR / "venv"
    venv_preexists = venv_path.exists()

    assert venv_preexists  # Otherwise install was not done

    # Don't use EnvBuilder.ensure_directories() - it causes race conditions
    # when multiple processes run in parallel. The venv already exists.

    if "--debug" in sys.argv or "--debug=true" in sys.argv:
        try:
            import debugpy  # pylint: disable=import-outside-toplevel
        except (ImportError, ModuleNotFoundError):
            raise SystemExit("Please pip install ptvsd in order to use VSCode debugging")

        # 5678 is the default attach port in the VS Code debug configurations
        debugpy.listen(("localhost", 5678))
        debugpy.wait_for_client()
        breakpoint()  # pylint: disable=undefined-variable

    args, unknown_args = parse_args()
    generate(output_folder=args.output_folder, tsp_file=args.tsp_file, **unknown_args)


if __name__ == "__main__":
    main()
