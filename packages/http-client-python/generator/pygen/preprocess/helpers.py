# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import re
from typing import Any, Dict
from .python_mappings import (
    REDEFINED_BUILTINS,
    BUILTIN_PACKAGES,
)


def add_redefined_builtin_info(name: str, yaml_data: Dict[str, Any]) -> None:
    if name in REDEFINED_BUILTINS:
        yaml_data["pylintDisable"] = "redefined-builtin"


def pad_builtin_namespaces(namespace: str) -> str:
    items = namespace.split(".")
    if items[0] in BUILTIN_PACKAGES:
        items[0] = items[0] + "_"
    return ".".join(items)


def pad_special_chars(name: str) -> str:
    return re.sub(r"[^A-z0-9_]", "_", name)
