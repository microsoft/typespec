# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import argparse
import logging
from collections.abc import Iterable
from pathlib import Path
import os
from typing import Any, Union
import black
from black.report import NothingChanged

from . import Plugin

_LOGGER = logging.getLogger("blib2to3")

_BLACK_MODE = black.Mode()  # pyright: ignore [reportPrivateImportUsage]
_BLACK_MODE.line_length = 120


class BlackScriptPlugin(Plugin):
    def __init__(self, *, files: Iterable[Union[str, Path]], **kwargs: Any):
        super().__init__(**kwargs)
        self._files = tuple(Path(file) for file in files)
        output_folder = self.options.get("output-folder", str(self.output_folder))
        if output_folder.startswith("file:"):
            output_folder = output_folder[5:]
        if os.name == "nt" and output_folder.startswith("///"):
            output_folder = output_folder[3:]
        self.output_folder = Path(output_folder)

    def process(self) -> bool:
        for file in sorted(set(self._files)):
            if file.suffix == ".py":
                self.format_file(file)
        return True

    def format_file(self, file: Path) -> None:
        file_content = ""
        try:
            file_content = (self.output_folder / file).read_text(encoding="utf-8-sig")
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
                    file_content.replace(lines[0], lines[0] + "," + ",".join(pylint_disables), 1)
                    if "pylint: disable=" in lines[0]
                    else f"# pylint: disable={','.join(pylint_disables)}\n" + file_content
                )
        self.write_file(file, file_content)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Format explicitly listed generated Python files")
    parser.add_argument("--output-folder", required=True)
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()
    BlackScriptPlugin(output_folder=args.output_folder, files=args.files).process()
