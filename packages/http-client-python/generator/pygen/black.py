# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from pathlib import Path
import os
import black
from black.report import NothingChanged

from . import Plugin
from .utils import parse_args

_LOGGER = logging.getLogger("blib2to3")

_BLACK_MODE = black.Mode()  # pyright: ignore [reportPrivateImportUsage]
_BLACK_MODE.line_length = 120


class BlackScriptPlugin(Plugin):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        output_folder = self.options.get("output-folder", str(self.output_folder))
        if output_folder.startswith("file:"):
            output_folder = output_folder[5:]
        if os.name == "nt" and output_folder.startswith("///"):
            output_folder = output_folder[3:]
        self.output_folder = Path(output_folder)

    def process(self) -> bool:
        # apply format_file on every .py file in the output folder
        list(
            map(
                self.format_file,
                [
                    Path(f)
                    for f in self.list_file()
                    if Path(f).parts[0]
                    not in (
                        "__pycache__",
                        "node_modules",
                        "venv",
                        "env",
                    )
                    # we shall also format generated files like "../../../generated_tests/test_xxx.py"
                    and (not Path(f).parts[0].startswith(".") or Path(f).parts[0] == "..") and Path(f).suffix == ".py"
                ],
            )
        )
        return True

    def format_file(self, file: Path) -> None:
        file_content = ""
        try:
            file_content = self.read_file(file)
            file_content = black.format_file_contents(file_content, fast=True, mode=_BLACK_MODE)
        except NothingChanged:
            pass
        except:
            _LOGGER.error("Error: failed to format %s", file)
            raise
        pylint_disables = []
        lines = file_content.splitlines()
        if len(lines) > 0:
            if "line-too-long" not in lines[0] and any(len(line) > 120 for line in lines):
                pylint_disables.extend(["line-too-long", "useless-suppression"])
            if "too-many-lines" not in lines[0] and len(lines) > 1000:
                pylint_disables.append("too-many-lines")
            if pylint_disables:
                file_content = (
                    "\n".join([lines[0] + ",".join([""] + pylint_disables)] + lines[1:])
                    if "pylint: disable=" in lines[0]
                    else f"# pylint: disable={','.join(pylint_disables)}\n" + file_content
                )
        self.write_file(file, file_content)


if __name__ == "__main__":
    # TSP pipeline will call this
    args, unknown_args = parse_args(need_tsp_file=False)
    BlackScriptPlugin(output_folder=args.output_folder, **unknown_args).process()
