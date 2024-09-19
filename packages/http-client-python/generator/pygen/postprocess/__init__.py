# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Tuple, Any
from pathlib import Path
import os
import shutil
from venv import EnvBuilder
import black
from black.report import NothingChanged
from .venvtools import ExtendedEnvBuilder, python_run

from .. import Plugin

_BLACK_MODE = black.Mode()  # pyright: ignore [reportPrivateImportUsage]
_BLACK_MODE.line_length = 120


def format_file(file: Path, file_content: str) -> str:
    if not file.suffix == ".py":
        return file_content
    try:
        file_content = black.format_file_contents(file_content, fast=True, mode=_BLACK_MODE)
    except NothingChanged:
        pass
    return file_content


class PostProcessPlugin(Plugin):
    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)
        output_folder_uri = self.options["outputFolderUri"]
        if output_folder_uri.startswith("file:"):
            output_folder_uri = output_folder_uri[5:]
        if os.name == "nt" and output_folder_uri.startswith("///"):
            output_folder_uri = output_folder_uri[3:]
        self.output_folder = Path(output_folder_uri)  # path to where the setup.py is
        self.setup_venv()

        # set up the venv
        # base folder is where the code starts, i.e. where we
        self.base_folder, self.namespace = self.get_namespace(self.output_folder, "")

    def setup_venv(self):
        venv_path = self.output_folder / Path(".temp_folder") / Path("temp_venv")

        if venv_path.exists():
            env_builder = EnvBuilder(with_pip=True)
            self.venv_context = env_builder.ensure_directories(venv_path)
        else:
            env_builder = ExtendedEnvBuilder(with_pip=True, upgrade_deps=True)
            env_builder.create(venv_path)
            self.venv_context = env_builder.context
            python_run(
                self.venv_context,
                "pip",
                ["install", "-e", str(self.output_folder)],
                directory=self.output_folder,
            )

    def get_namespace(self, dir: Path, namespace: str) -> Tuple[Path, str]:
        try:
            init_file = next(d for d in dir.iterdir() if d.name == "__init__.py")
            # we don't care about pkgutil inits, we skip over them
            file_content = self.read_file(init_file.relative_to(self.output_folder))
            if "pkgutil" not in file_content:
                return dir, namespace
        except StopIteration:
            pass

        try:
            # first, see if we can get a folder that has the same name as the current output folder
            start = self.output_folder.stem.split("-")[0]
            next_dir = next(d for d in dir.iterdir() if d.is_dir() and d.name == start)
        except StopIteration:
            invalid_start_chars = [".", "_"]
            invalid_dirs = [
                "swagger",
                "out",
                "tests",
                "samples",
            ]

            next_dir = next(
                d
                for d in dir.iterdir()
                if d.is_dir()
                and not str(d).endswith("egg-info")
                and d.name[0] not in invalid_start_chars
                and d.name not in invalid_dirs
            )

        namespace = f"{namespace}.{next_dir.name}" if namespace else next_dir.name
        return self.get_namespace(next_dir, namespace)

    def process(self) -> bool:
        folders = [f for f in self.base_folder.glob("**/*") if f.is_dir() and not f.stem.startswith("__")]
        # will always have the root
        self.fix_imports_in_init(
            generated_file_name="_client",
            folder_path=self.base_folder,
            namespace=self.namespace,
        )
        try:
            aio_folder = next(f for f in folders if f.stem == "aio")
            self.fix_imports_in_init(
                generated_file_name="_client",
                folder_path=aio_folder,
                namespace=f"{self.namespace}.aio",
            )
        except StopIteration:
            pass

        try:
            models_folder = next(f for f in folders if f.stem == "models")
            self.fix_imports_in_init(
                generated_file_name="_models",
                folder_path=models_folder,
                namespace=f"{self.namespace}.models",
            )
        except StopIteration:
            pass
        operations_folders = [f for f in folders if f.stem in ["operations", "_operations"]]
        for operations_folder in operations_folders:
            sub_namespace = ".".join(str(operations_folder.relative_to(self.base_folder)).split(os.sep))
            self.fix_imports_in_init(
                generated_file_name="_operations",
                folder_path=operations_folder,
                namespace=f"{self.namespace}.{sub_namespace}",
            )
        shutil.rmtree(f"{str(self.output_folder)}/.temp_folder")
        return True

    def fix_imports_in_init(self, generated_file_name: str, folder_path: Path, namespace: str) -> None:
        customized_objects_str = python_run(
            self.venv_context,
            command=[namespace, str(self.output_folder)],
            module="get_all",
        )

        if not customized_objects_str:
            return
        customized_objects = {k: None for k in customized_objects_str.split(",")}.keys()  # filter out duplicates
        file = (folder_path / "__init__.py").relative_to(self.output_folder)
        file_content = self.read_file(file).replace("\r\n", "\n")
        added_objs = []
        for obj in customized_objects:
            if f" import {obj}\n" in file_content:
                # means we're overriding a generated model
                file_content = file_content.replace(
                    f"from .{generated_file_name} import {obj}\n",
                    f"from ._patch import {obj}\n",
                )
            else:
                added_objs.append(obj)
        file_content = file_content.replace(
            "try:\n    from ._patch import __all__ as _patch_all\n    "
            "from ._patch import *  # pylint: disable=unused-wildcard-import"
            "\nexcept ImportError:\n    _patch_all = []",
            "",
        )
        file_content = file_content.replace("from ._patch import __all__ as _patch_all", "")
        file_content = file_content.replace(
            "from ._patch import *  # pylint: disable=unused-wildcard-import\n",
            "",
        )
        file_content = file_content.replace("__all__.extend([p for p in _patch_all if p not in __all__])", "")
        if added_objs:
            # add import
            patch_sdk_import = "from ._patch import patch_sdk as _patch_sdk"
            imports = "\n".join([f"from ._patch import {obj}" for obj in added_objs])
            if imports:
                replacement = f"{imports}\n{patch_sdk_import}"
            else:
                replacement = patch_sdk_import
            file_content = file_content.replace(patch_sdk_import, replacement)
            # add to __all__
            added_objs_all = "\n".join([f'    "{obj}",' for obj in added_objs]) + "\n"
            file_content = file_content.replace("__all__ = [", f"__all__ = [\n{added_objs_all}", 1)
        formatted_file = format_file(file, file_content)
        self.write_file(file, formatted_file)
