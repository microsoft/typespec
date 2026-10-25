# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path
from typing import Any, Union

from . import codegen, preprocess
from .black import BlackScriptPlugin


def generate(*, output_folder: Union[str, Path], tsp_file: str, **kwargs: Any) -> None:
    preprocess.PreProcessPlugin(output_folder=output_folder, tsp_file=tsp_file, **kwargs).process()
    generator = codegen.CodeGenerator(output_folder=output_folder, tsp_file=tsp_file, **kwargs)
    generator.process()
    BlackScriptPlugin(output_folder=output_folder, files=generator.written_files, **kwargs).process()
