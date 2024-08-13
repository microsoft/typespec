# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from pathlib import Path
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Union, List

import yaml

from ._version import VERSION


__version__ = VERSION
_LOGGER = logging.getLogger(__name__)


class ReaderAndWriter:
    def __init__(self, *, output_folder: Union[str, Path], **kwargs: Any) -> None:
        self.output_folder = Path(output_folder)
        self._list_file: List[str] = []
        try:
            with open(
                Path(self.output_folder) / Path("..") / Path("python.json"),
                "r",
                encoding="utf-8-sig",
            ) as fd:
                python_json = json.load(fd)
        except Exception:  # pylint: disable=broad-except
            python_json = {}
        self.options = kwargs
        if python_json:
            _LOGGER.warning("Loading python.json file. This behavior will be depreacted")
        self.options.update(python_json)

    def read_file(self, path: Union[str, Path]) -> str:
        """Directly reading from disk"""
        # make path relative to output folder
        try:
            with open(self.output_folder / Path(path), "r", encoding="utf-8-sig") as fd:
                return fd.read()
        except FileNotFoundError:
            return ""

    def write_file(self, filename: Union[str, Path], file_content: str) -> None:
        """Directly writing to disk"""
        file_folder = Path(filename).parent
        if not Path.is_dir(self.output_folder / file_folder):
            Path.mkdir(self.output_folder / file_folder, parents=True)
        with open(self.output_folder / Path(filename), "w", encoding="utf-8") as fd:
            fd.write(file_content)

    def list_file(self) -> List[str]:
        return [str(f.relative_to(self.output_folder)) for f in self.output_folder.glob("**/*") if f.is_file()]


class Plugin(ReaderAndWriter, ABC):
    """A base class for autorest plugin.

    :param autorestapi: An autorest API instance
    """

    @abstractmethod
    def process(self) -> bool:
        """The plugin process.

        :rtype: bool
        :returns: True if everything's ok, False optherwise
        :raises Exception: Could raise any exception, stacktrace will be sent to autorest API
        """
        raise NotImplementedError()


class YamlUpdatePlugin(Plugin):
    """A plugin that update the YAML as input."""

    def get_yaml(self) -> Dict[str, Any]:
        # cadl file doesn't have to be relative to output folder
        with open(self.options["cadl_file"], "r", encoding="utf-8-sig") as fd:
            return yaml.safe_load(fd.read())

    def write_yaml(self, yaml_string: str) -> None:
        with open(self.options["cadl_file"], "w", encoding="utf-8-sig") as fd:
            fd.write(yaml_string)

    def process(self) -> bool:
        # List the input file, should be only one
        yaml_data = self.get_yaml()

        self.update_yaml(yaml_data)

        yaml_string = yaml.safe_dump(yaml_data)

        self.write_yaml(yaml_string)
        return True

    @abstractmethod
    def update_yaml(self, yaml_data: Dict[str, Any]) -> None:
        """The code-model-v4-no-tags yaml model tree.

        :rtype: updated yaml
        :raises Exception: Could raise any exception, stacktrace will be sent to autorest API
        """
        raise NotImplementedError()
