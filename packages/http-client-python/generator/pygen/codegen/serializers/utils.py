# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json
from typing import Optional, Any
from pathlib import Path

from ..models import ModelType, BaseType, CombinedType, FileImport


def get_sub_type(param_type: ModelType) -> ModelType:
    if param_type.discriminated_subtypes:
        for item in param_type.discriminated_subtypes.values():
            return get_sub_type(item)
    return param_type


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


def get_namespace_config(namespace: str) -> str:
    return namespace


def get_namespace_from_package_name(package_name: Optional[str]) -> str:
    return (package_name or "").replace("-", ".")


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


def create_fake_value(param_type: BaseType) -> Any:
    """Create a fake value for a parameter type by getting its JSON template representation.

    This function generates a fake value suitable for samples and tests.

    :param param_type: The parameter type to create a fake value for.
    :return: A string representation of the fake value.
    """
    if isinstance(param_type, ModelType):
        model_type = param_type
    elif isinstance(param_type, CombinedType):
        model_type = param_type.target_model_subtype((ModelType,))
    else:
        model_type = None
    resolved_type = get_sub_type(model_type) if model_type else param_type
    return json_dumps_template(resolved_type.get_json_template_representation())


def hash_file_import(file_import: FileImport) -> str:
    """Generate a hash for a FileImport object based on its imports.

    :param file_import: The FileImport object to generate a hash for.
    :return: A string representing the hash of the FileImport object.
    """

    return "".join(sorted(list(set([str(hash(i)) for i in file_import.imports]))))
