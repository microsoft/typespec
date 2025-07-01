# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from collections.abc import ItemsView, KeysView, MutableMapping, ValuesView
import logging
from pathlib import Path
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Iterator, Optional, Union, List

import yaml
from .utils import TYPESPEC_PACKAGE_MODE, VALID_PACKAGE_MODE

from ._version import VERSION


__version__ = VERSION
_LOGGER = logging.getLogger(__name__)


class OptionsDict(MutableMapping):
    DEFAULTS = {
        "azure-arm": False,
        "basic-setup-py": False,
        "client-side-validation": False,
        "emit-cross-language-definition-file": False,
        "flavor": "azure",  # need to default to azure in shared code so we don't break swagger generation
        "from-typespec": False,
        "generate-sample": False,
        "generate-test": False,
        "head-as-boolean": True,
        "keep-version-file": False,
        "low-level-client": False,
        "multiapi": False,
        "no-async": False,
        "no-namespace-folders": False,
        "polymorphic-examples": 5,
        "validate-versioning": True,
        "version-tolerant": True,
    }

    def __init__(self, options: Optional[Dict[str, Any]] = None) -> None:
        self._data = options.copy() if options else {}
        self._validate_combinations()

    def __getitem__(self, key: str) -> Any:
        if key == "head-as-boolean" and self.get("azure-arm"):
            # override to always true if azure-arm is set
            return True
        if key in self._data:
            retval = self._data[key]
            if key == "package-files-config":
                try:
                    return {k.strip(): v.strip() for k, v in [i.split(":") for i in retval.split("|")]}
                except AttributeError:
                    return retval
            return retval
        if key == "package-mode" and self._data.get("packaging-files-dir"):
            # if packaging-files-dir is set, use it as package-mode
            return self._data["packaging-files-dir"]
        return self._get_default(key)

    def __setitem__(self, key: str, value: Any) -> None:
        validated_value = self._validate_and_transform(key, value)
        self._data[key] = validated_value

    def __delitem__(self, key: str) -> None:
        if key in self._data:
            del self._data[key]
        else:
            raise KeyError(f"Option '{key}' not found")

    def __iter__(self) -> Iterator[str]:
        # Return both explicitly set keys and all possible default keys
        return iter(set(self.keys()))

    def __len__(self) -> int:
        return len(set(self._data.keys()).union(self.DEFAULTS.keys()))

    def __contains__(self, key: str) -> bool:  # type: ignore
        return key in self._data or key in self.DEFAULTS

    def __repr__(self) -> str:
        """String representation."""
        return f"OptionsDict({dict(self.items())})"

    def _get_default(self, key: str) -> Any:  # pylint: disable=too-many-return-statements
        if key == "show-operations":
            return not self.get("low-level-client")
        if key == "tracing":
            return self.get("show-operations") and self.get("flavor") == "azure"
        if key in ["show-send-request", "only-path-and-body-params-positional", "default-optional-constants-to-none"]:
            return self.get("low-level-client") or self.get("version-tolerant")
        if key == "combine-operation-files":
            return self.get("version-tolerant")
        if key == "package-pprint-name":
            return " ".join([i.capitalize() for i in str(self.get("package-name", "")).split("-")])
        if key == "builders-visibility":
            # Default to public if low-level client is not set, otherwise embedded
            return "embedded" if not self.get("low-level-client") else "public"
        if key == "models-mode":
            models_mode_default = False if self.get("low-level-client") or self.get("version-tolerant") else "msrest"
            if self.get("tsp_file") is not None:
                models_mode_default = "dpg"
            # switch to falsy value for easier code writing
            return models_mode_default
        return self.DEFAULTS[key]

    def _validate_combinations(self) -> None:
        if not self.get("show-operations") and self.get("builders-visibility") == "embedded":
            raise ValueError(
                "Can not embed builders without operations. "
                "Either set --show-operations to True, or change the value of --builders-visibility "
                "to 'public' or 'hidden'."
            )

        if self.get("basic-setup-py") and not self.get("package-version"):
            raise ValueError("--basic-setup-py must be used with --package-version")

        if self.get("package-mode") and not self.get("package-version"):
            raise ValueError("--package-mode must be used with --package-version")

        if not self.get("show-operations") and self.get("combine-operation-files"):
            raise ValueError(
                "Can not combine operation files if you are not showing operations. "
                "If you want operation files, pass in flag --show-operations"
            )

        if self.get("multiapi") and self.get("version-tolerant"):
            raise ValueError(
                "Can not currently generate version tolerant multiapi SDKs. "
                "We are working on creating a new multiapi SDK for version tolerant and it is not available yet."
            )

        if self.get("client-side-validation") and self.get("version-tolerant"):
            raise ValueError("Can not generate version tolerant with --client-side-validation. ")

        if not (self.get("azure-arm") or self.get("version-tolerant")):
            _LOGGER.warning(
                "You are generating with options that would not allow the SDK to be shipped as an official Azure SDK. "
                "Please read https://aka.ms/azsdk/dpcodegen for more details."
            )

        if self.get("flavor") != "azure" and self.get("tracing"):
            raise ValueError("Can only have tracing turned on for Azure SDKs.")

    def _validate_and_transform(self, key: str, value: Any) -> Any:
        if key == "builders-visibility" and value not in ["public", "hidden", "embedded"]:
            raise ValueError("The value of --builders-visibility must be either 'public', 'hidden', or 'embedded'")

        if key == "models-mode" and value == "none":
            value = False  # switch to falsy value for easier code writing

        if key == "models-mode" and value not in ["msrest", "dpg", False]:
            raise ValueError(
                "--models-mode can only be 'msrest', 'dpg' or 'none'. "
                "Pass in 'msrest' if you want msrest models, or "
                "'none' if you don't want any."
            )
        if key == "package-mode":
            if (
                (value not in TYPESPEC_PACKAGE_MODE and self.get("from-typespec"))
                or (value not in VALID_PACKAGE_MODE and not self.get("from-typespec"))
            ) and not Path(value).exists():
                raise ValueError(
                    f"--package-mode can only be {' or '.join(TYPESPEC_PACKAGE_MODE)} or directory which contains template files"  # pylint: disable=line-too-long
                )
        return value

    def setdefault(self, key: str, default: Any, /) -> Any:  # type: ignore # pylint: disable=arguments-differ
        """Set a default value for a key if it does not exist."""
        if key not in self._data:
            self[key] = default
        return self[key]

    def keys(self) -> KeysView[str]:
        """Return all keys, including defaults."""
        all_keys = set(self._data.keys())
        for key in self.DEFAULTS:
            if key not in all_keys:
                all_keys.add(key)
        all_keys.update(self.DEFAULTS.keys())
        return KeysView({key: None for key in all_keys})

    def values(self) -> ValuesView[Any]:
        return {key: self[key] for key in self.keys()}.values()  # pylint: disable=consider-using-dict-items

    def items(self) -> ItemsView[str, Any]:
        return {key: self[key] for key in self.keys()}.items()  # pylint: disable=consider-using-dict-items


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
        kwargs["output-folder"] = str(self.output_folder)
        self.options = OptionsDict(kwargs)
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
        # tsp file doesn't have to be relative to output folder
        with open(self.options["tsp_file"], "r", encoding="utf-8-sig") as fd:
            return yaml.safe_load(fd.read())

    def write_yaml(self, yaml_string: str) -> None:
        with open(self.options["tsp_file"], "w", encoding="utf-8-sig") as fd:
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
