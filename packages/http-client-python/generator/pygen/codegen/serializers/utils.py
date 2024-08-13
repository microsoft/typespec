# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json
from typing import Optional, List, Any
from pathlib import Path

from ..models import Client, OperationGroup


def method_signature_and_response_type_annotation_template(
    *,
    method_signature: str,
    response_type_annotation: str,
) -> str:
    return f"{method_signature} -> {response_type_annotation}:"


def extract_sample_name(file_path: str) -> str:
    file = file_path.split("specification")[-1]
    return Path(file).parts[-1].replace(".json", "")


def strip_end(namespace: str) -> str:
    return ".".join(namespace.split(".")[:-1])


def get_namespace_config(namespace: str, multiapi: bool) -> str:
    return strip_end(namespace) if multiapi else namespace


def get_namespace_from_package_name(package_name: Optional[str]) -> str:
    return (package_name or "").replace("-", ".")


def get_all_operation_groups_recursively(clients: List[Client]) -> List[OperationGroup]:
    operation_groups = []
    queue = []
    for client in clients:
        queue.extend(client.operation_groups)
    while queue:
        operation_groups.append(queue.pop(0))
        if operation_groups[-1].operation_groups:
            queue.extend(operation_groups[-1].operation_groups)
    return operation_groups


def _improve_json_string(template_representation: str) -> Any:
    origin = template_representation.split("\n")
    final = []
    for line in origin:
        idx0 = line.find("#")
        idx1 = line.rfind('"')
        modified_line = ""
        if idx0 > -1 and idx1 > -1:
            modified_line = line[:idx0] + line[idx1:] + "  " + line[idx0:idx1] + "\n"
        else:
            modified_line = line + "\n"
        modified_line = modified_line.replace('"', "").replace("\\", '"')
        final.append(modified_line)
    return "".join(final)


def json_dumps_template(template_representation: Any) -> Any:
    # only for template use, since it wraps everything in strings
    return _improve_json_string(json.dumps(template_representation, indent=4))
