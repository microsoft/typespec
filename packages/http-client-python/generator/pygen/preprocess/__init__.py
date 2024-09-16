# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""The preprocessing autorest plugin.
"""
import copy
from typing import Callable, Dict, Any, List, Optional

from ..utils import to_snake_case, extract_original_name
from .helpers import (
    add_redefined_builtin_info,
    pad_builtin_namespaces,
    pad_special_chars,
)
from .python_mappings import CADL_RESERVED_WORDS, RESERVED_WORDS, PadType

from .. import YamlUpdatePlugin
from ..utils import (
    parse_args,
    get_body_type_for_description,
    JSON_REGEXP,
    KNOWN_TYPES,
    update_enum_value,
)


def update_overload_section(
    overload: Dict[str, Any],
    yaml_data: Dict[str, Any],
    section: str,
):
    try:
        for overload_s, original_s in zip(overload[section], yaml_data[section]):
            if overload_s.get("type"):
                overload_s["type"] = original_s["type"]
            if overload_s.get("headers"):
                for overload_h, original_h in zip(overload_s["headers"], original_s["headers"]):
                    if overload_h.get("type"):
                        overload_h["type"] = original_h["type"]
    except KeyError as exc:
        raise ValueError(overload["name"]) from exc


def add_overload(yaml_data: Dict[str, Any], body_type: Dict[str, Any], for_flatten_params=False):
    overload = copy.deepcopy(yaml_data)
    overload["isOverload"] = True
    overload["bodyParameter"]["type"] = body_type
    overload["bodyParameter"]["defaultToUnsetSentinel"] = False
    overload["overloads"] = []
    if yaml_data.get("initialOperation"):
        overload["initialOperation"] = yaml_data["initialOperation"]

    if for_flatten_params:
        overload["bodyParameter"]["flattened"] = True
    else:
        overload["parameters"] = [p for p in overload["parameters"] if not p.get("inFlattenedBody")]
    # for yaml sync, we need to make sure all of the responses, parameters, and exceptions' types have the same yaml id
    for overload_p, original_p in zip(overload["parameters"], yaml_data["parameters"]):
        overload_p["type"] = original_p["type"]
    update_overload_section(overload, yaml_data, "responses")
    update_overload_section(overload, yaml_data, "exceptions")

    # update content type to be an overloads content type
    content_type_param = next(p for p in overload["parameters"] if p["wireName"].lower() == "content-type")
    content_type_param["inOverload"] = True
    content_type_param["inDocstring"] = True
    body_type_description = get_body_type_for_description(overload["bodyParameter"])
    content_type_param["description"] = (
        f"Body Parameter content-type. Content type parameter for {body_type_description} body."
    )
    content_types = yaml_data["bodyParameter"]["contentTypes"]
    if body_type["type"] == "binary" and len(content_types) > 1:
        content_types = "'" + "', '".join(content_types) + "'"
        content_type_param["description"] += f" Known values are: {content_types}."
    overload["bodyParameter"]["inOverload"] = True
    for parameter in overload["parameters"]:
        parameter["inOverload"] = True
        parameter["defaultToUnsetSentinel"] = False
    return overload


def add_overloads_for_body_param(yaml_data: Dict[str, Any]) -> None:
    """If we added a body parameter type, add overloads for that type"""
    body_parameter = yaml_data["bodyParameter"]
    if not (
        body_parameter["type"]["type"] == "combined"
        and len(yaml_data["bodyParameter"]["type"]["types"]) > len(yaml_data["overloads"])
    ):
        return
    for body_type in body_parameter["type"]["types"]:
        if any(o for o in yaml_data["overloads"] if id(o["bodyParameter"]["type"]) == id(body_type)):
            continue
        yaml_data["overloads"].append(add_overload(yaml_data, body_type))
        if body_type.get("type") == "model" and body_type.get("base") == "json":
            yaml_data["overloads"].append(add_overload(yaml_data, body_type, for_flatten_params=True))
    content_type_param = next(p for p in yaml_data["parameters"] if p["wireName"].lower() == "content-type")
    content_type_param["inOverload"] = False
    content_type_param["inOverridden"] = True
    content_type_param["inDocstring"] = True
    content_type_param["clientDefaultValue"] = (
        None  # make it none bc it will be overridden, we depend on default of overloads
    )
    content_type_param["optional"] = True


def update_description(description: Optional[str], default_description: str = "") -> str:
    if not description:
        description = default_description
    description.rstrip(" ")
    if description and description[-1] != ".":
        description += "."
    return description


def update_operation_group_class_name(prefix: str, class_name: str) -> str:
    if class_name == "":
        return prefix + "OperationsMixin"
    if class_name == "Operations":
        return "Operations"
    return class_name + "Operations"


def update_paging_response(yaml_data: Dict[str, Any]) -> None:
    yaml_data["discriminator"] = "paging"


HEADERS_HIDE_IN_METHOD = (
    "repeatability-request-id",
    "repeatability-first-sent",
    "x-ms-client-request-id",
    "client-request-id",
    "return-client-request-id",
)
HEADERS_CONVERT_IN_METHOD = {
    "if-match": {
        "clientName": "etag",
        "wireName": "etag",
        "description": "check if resource is changed. Set None to skip checking etag.",
    },
    "if-none-match": {
        "clientName": "match_condition",
        "wireName": "match-condition",
        "description": "The match condition to use upon the etag.",
        "type": {
            "type": "sdkcore",
            "name": "MatchConditions",
        },
    },
}


def get_wire_name_lower(parameter: Dict[str, Any]) -> str:
    return (parameter.get("wireName") or "").lower()


def headers_convert(yaml_data: Dict[str, Any], replace_data: Any) -> None:
    if isinstance(replace_data, dict):
        for k, v in replace_data.items():
            yaml_data[k] = v


def has_json_content_type(yaml_data: Dict[str, Any]) -> bool:
    return any(ct for ct in yaml_data.get("contentTypes", []) if JSON_REGEXP.match(ct))


def has_multi_part_content_type(yaml_data: Dict[str, Any]) -> bool:
    return any(ct for ct in yaml_data.get("contentTypes", []) if ct == "multipart/form-data")


class PreProcessPlugin(YamlUpdatePlugin):
    """Add Python naming information."""

    @property
    def azure_arm(self) -> bool:
        return self.options.get("azure-arm", False)

    @property
    def version_tolerant(self) -> bool:
        return self.options.get("version-tolerant", True)

    @property
    def models_mode(self) -> Optional[str]:
        return self.options.get("models-mode", "dpg" if self.is_cadl else None)

    @property
    def is_cadl(self) -> bool:
        return self.options.get("cadl_file", False)

    def add_body_param_type(
        self,
        code_model: Dict[str, Any],
        body_parameter: Dict[str, Any],
    ):
        # only add overload for special content type
        if (  # pylint: disable=too-many-boolean-expressions
            body_parameter
            and body_parameter["type"]["type"] in ("model", "dict", "list")
            and (
                has_json_content_type(body_parameter) or (self.is_cadl and has_multi_part_content_type(body_parameter))
            )
            and not body_parameter["type"].get("xmlMetadata")
            and not any(t for t in ["flattened", "groupedBy"] if body_parameter.get(t))
        ):
            origin_type = body_parameter["type"]["type"]
            is_dpg_model = body_parameter["type"].get("base") == "dpg"
            body_parameter["type"] = {
                "type": "combined",
                "types": [body_parameter["type"]],
            }
            # don't add binary overload for multipart content type
            if not (self.is_cadl and has_multi_part_content_type(body_parameter)):
                body_parameter["type"]["types"].append(KNOWN_TYPES["binary"])

            if origin_type == "model" and is_dpg_model and self.models_mode == "dpg":
                body_parameter["type"]["types"].insert(1, KNOWN_TYPES["any-object"])
            code_model["types"].append(body_parameter["type"])

    def pad_reserved_words(self, name: str, pad_type: PadType):
        # we want to pad hidden variables as well
        if not name:
            # we'll pass in empty operation groups sometime etc.
            return name

        if self.is_cadl:
            reserved_words = {k: (v + CADL_RESERVED_WORDS.get(k, [])) for k, v in RESERVED_WORDS.items()}
        else:
            reserved_words = RESERVED_WORDS
        name = pad_special_chars(name)
        name_prefix = "_" if name[0] == "_" else ""
        name = name[1:] if name[0] == "_" else name
        if name.lower() in reserved_words[pad_type]:
            return name_prefix + name + pad_type
        return name_prefix + name

    def update_types(self, yaml_data: List[Dict[str, Any]]) -> None:
        for type in yaml_data:
            for property in type.get("properties", []):
                property["description"] = update_description(property.get("description", ""))
                property["clientName"] = self.pad_reserved_words(property["clientName"].lower(), PadType.PROPERTY)
                add_redefined_builtin_info(property["clientName"], property)
            if type.get("name"):
                pad_type = PadType.MODEL if type["type"] == "model" else PadType.ENUM_CLASS
                name = self.pad_reserved_words(type["name"], pad_type)
                type["name"] = name[0].upper() + name[1:]
                type["description"] = update_description(type.get("description", ""), type["name"])
                type["snakeCaseName"] = to_snake_case(type["name"])
            if type.get("values"):
                # we're enums
                values_to_add = []
                for value in type["values"]:
                    padded_name = self.pad_reserved_words(value["name"].lower(), PadType.ENUM_VALUE).upper()
                    if self.version_tolerant:
                        if padded_name[0] in "0123456789":
                            padded_name = "ENUM_" + padded_name
                            value["name"] = padded_name
                    else:
                        if value["name"] != padded_name:
                            values_to_add.append(
                                update_enum_value(
                                    name=padded_name,
                                    value=value["value"],
                                    description=value["description"],
                                    enum_type=value["enumType"],
                                )
                            )
                type["values"].extend(values_to_add)

        # add type for reference
        for v in HEADERS_CONVERT_IN_METHOD.values():
            if isinstance(v, dict) and "type" in v:
                yaml_data.append(v["type"])

    def update_client(self, yaml_data: Dict[str, Any]) -> None:
        yaml_data["description"] = update_description(yaml_data["description"], default_description=yaml_data["name"])
        yaml_data["legacyFilename"] = to_snake_case(yaml_data["name"].replace(" ", "_"))
        parameters = yaml_data["parameters"]
        for parameter in parameters:
            self.update_parameter(parameter)
            if parameter["clientName"] == "credential":
                policy = parameter["type"].get("policy")
                if policy and policy["type"] == "BearerTokenCredentialPolicy" and self.azure_arm:
                    policy["type"] = "ARMChallengeAuthenticationPolicy"
                    policy["credentialScopes"] = ["https://management.azure.com/.default"]
        if (
            (not self.version_tolerant or self.azure_arm)
            and parameters
            and parameters[-1]["clientName"] == "credential"
        ):
            # we need to move credential to the front in mgmt mode for backcompat reasons
            yaml_data["parameters"] = [parameters[-1]] + parameters[:-1]
        prop_name = yaml_data["name"]
        if prop_name.endswith("Client"):
            prop_name = prop_name[: len(prop_name) - len("Client")]
        yaml_data["builderPadName"] = to_snake_case(prop_name)
        for og in yaml_data.get("operationGroups", []):
            for o in og["operations"]:
                property_if_match = None
                property_if_none_match = None
                for p in o["parameters"]:
                    wire_name_lower = get_wire_name_lower(p)
                    if p["location"] == "header" and wire_name_lower == "client-request-id":
                        yaml_data["requestIdHeaderName"] = wire_name_lower
                    if self.version_tolerant and p["location"] == "header":
                        if wire_name_lower == "if-match":
                            property_if_match = p
                        elif wire_name_lower == "if-none-match":
                            property_if_none_match = p
                # pylint: disable=line-too-long
                # some service(e.g. https://github.com/Azure/azure-rest-api-specs/blob/main/specification/cosmos-db/data-plane/Microsoft.Tables/preview/2019-02-02/table.json)
                # only has one, so we need to add "if-none-match" or "if-match" if it's missing
                if not property_if_match and property_if_none_match:
                    property_if_match = property_if_none_match.copy()
                    property_if_match["wireName"] = "if-match"
                if not property_if_none_match and property_if_match:
                    property_if_none_match = property_if_match.copy()
                    property_if_none_match["wireName"] = "if-none-match"

                if property_if_match and property_if_none_match:
                    # arrange if-match and if-none-match to the end of parameters
                    o["parameters"] = [
                        item
                        for item in o["parameters"]
                        if get_wire_name_lower(item) not in ("if-match", "if-none-match")
                    ] + [property_if_match, property_if_none_match]

                    o["hasEtag"] = True
                    yaml_data["hasEtag"] = True

    def get_operation_updater(self, yaml_data: Dict[str, Any]) -> Callable[[Dict[str, Any], Dict[str, Any]], None]:
        if yaml_data["discriminator"] == "lropaging":
            return self.update_lro_paging_operation
        if yaml_data["discriminator"] == "lro":
            return self.update_lro_operation
        if yaml_data["discriminator"] == "paging":
            return self.update_paging_operation
        return self.update_operation

    def update_parameter(self, yaml_data: Dict[str, Any]) -> None:
        yaml_data["description"] = update_description(yaml_data.get("description", ""))
        if not (yaml_data["location"] == "header" and yaml_data["clientName"] in ("content_type", "accept")):
            yaml_data["clientName"] = self.pad_reserved_words(yaml_data["clientName"].lower(), PadType.PARAMETER)
        if yaml_data.get("propertyToParameterName"):
            # need to create a new one with padded keys and values
            yaml_data["propertyToParameterName"] = {
                self.pad_reserved_words(prop, PadType.PROPERTY): self.pad_reserved_words(
                    param_name, PadType.PARAMETER
                ).lower()
                for prop, param_name in yaml_data["propertyToParameterName"].items()
            }
        wire_name_lower = (yaml_data.get("wireName") or "").lower()
        if yaml_data["location"] == "header" and (
            wire_name_lower in HEADERS_HIDE_IN_METHOD or yaml_data.get("clientDefaultValue") == "multipart/form-data"
        ):
            yaml_data["hideInMethod"] = True
        if self.version_tolerant and yaml_data["location"] == "header" and wire_name_lower in HEADERS_CONVERT_IN_METHOD:
            headers_convert(yaml_data, HEADERS_CONVERT_IN_METHOD[wire_name_lower])
        if wire_name_lower in ["$host", "content-type", "accept"] and yaml_data["type"]["type"] == "constant":
            yaml_data["clientDefaultValue"] = yaml_data["type"]["value"]

    def update_operation(
        self,
        code_model: Dict[str, Any],
        yaml_data: Dict[str, Any],
        *,
        is_overload: bool = False,
    ) -> None:
        yaml_data["groupName"] = self.pad_reserved_words(yaml_data["groupName"], PadType.OPERATION_GROUP)
        yaml_data["groupName"] = to_snake_case(yaml_data["groupName"])
        yaml_data["name"] = yaml_data["name"].lower()
        if yaml_data.get("isLroInitialOperation") is True:
            yaml_data["name"] = (
                "_" + self.pad_reserved_words(extract_original_name(yaml_data["name"]), PadType.METHOD) + "_initial"
            )
        else:
            yaml_data["name"] = self.pad_reserved_words(yaml_data["name"], PadType.METHOD)
        yaml_data["description"] = update_description(yaml_data["description"], yaml_data["name"])
        yaml_data["summary"] = update_description(yaml_data.get("summary", ""))
        body_parameter = yaml_data.get("bodyParameter")
        for parameter in yaml_data["parameters"]:
            self.update_parameter(parameter)
        if yaml_data.get("bodyParameter"):
            self.update_parameter(yaml_data["bodyParameter"])
            for entry in yaml_data["bodyParameter"].get("entries", []):
                self.update_parameter(entry)
        for overload in yaml_data.get("overloads", []):
            self.update_operation(code_model, overload, is_overload=True)
        for response in yaml_data.get("responses", []):
            response["discriminator"] = "operation"
        if body_parameter and not is_overload:
            # if we have a JSON body, we add a binary overload
            self.add_body_param_type(code_model, body_parameter)
            add_overloads_for_body_param(yaml_data)

    def _update_lro_operation_helper(self, yaml_data: Dict[str, Any]) -> None:
        for response in yaml_data.get("responses", []):
            response["discriminator"] = "lro"
            response["pollerSync"] = response.get("pollerSync") or "azure.core.polling.LROPoller"
            response["pollerAsync"] = response.get("pollerAsync") or "azure.core.polling.AsyncLROPoller"
            if not response.get("pollingMethodSync"):
                response["pollingMethodSync"] = (
                    "azure.mgmt.core.polling.arm_polling.ARMPolling"
                    if self.azure_arm
                    else "azure.core.polling.base_polling.LROBasePolling"
                )
            if not response.get("pollingMethodAsync"):
                response["pollingMethodAsync"] = (
                    "azure.mgmt.core.polling.async_arm_polling.AsyncARMPolling"
                    if self.azure_arm
                    else "azure.core.polling.async_base_polling.AsyncLROBasePolling"
                )

    def update_lro_paging_operation(
        self,
        code_model: Dict[str, Any],
        yaml_data: Dict[str, Any],
        is_overload: bool = False,
        item_type: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.update_lro_operation(code_model, yaml_data, is_overload=is_overload)
        self.update_paging_operation(code_model, yaml_data, is_overload=is_overload, item_type=item_type)
        yaml_data["discriminator"] = "lropaging"
        for response in yaml_data.get("responses", []):
            response["discriminator"] = "lropaging"
        for overload in yaml_data.get("overloads", []):
            self.update_lro_paging_operation(
                code_model,
                overload,
                is_overload=True,
                item_type=yaml_data["responses"][0]["itemType"],
            )

    def update_lro_operation(
        self,
        code_model: Dict[str, Any],
        yaml_data: Dict[str, Any],
        is_overload: bool = False,
    ) -> None:
        def convert_initial_operation_response_type(data: Dict[str, Any]) -> None:
            for response in data.get("responses", []):
                response["type"] = KNOWN_TYPES["binary"]

        self.update_operation(code_model, yaml_data, is_overload=is_overload)
        self.update_operation(code_model, yaml_data["initialOperation"], is_overload=is_overload)
        convert_initial_operation_response_type(yaml_data["initialOperation"])
        self._update_lro_operation_helper(yaml_data)
        for overload in yaml_data.get("overloads", []):
            self._update_lro_operation_helper(overload)
            self.update_operation(code_model, overload["initialOperation"], is_overload=True)
            convert_initial_operation_response_type(overload["initialOperation"])

    def update_paging_operation(
        self,
        code_model: Dict[str, Any],
        yaml_data: Dict[str, Any],
        is_overload: bool = False,
        item_type: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.update_operation(code_model, yaml_data, is_overload=is_overload)
        item_type = item_type or yaml_data["itemType"]["elementType"]
        if yaml_data.get("nextOperation"):
            yaml_data["nextOperation"]["groupName"] = self.pad_reserved_words(
                yaml_data["nextOperation"]["groupName"], PadType.OPERATION_GROUP
            )
            yaml_data["nextOperation"]["groupName"] = to_snake_case(yaml_data["nextOperation"]["groupName"])
            for response in yaml_data["nextOperation"].get("responses", []):
                update_paging_response(response)
                response["itemType"] = item_type
        for response in yaml_data.get("responses", []):
            update_paging_response(response)
            response["itemType"] = item_type
        for overload in yaml_data.get("overloads", []):
            self.update_paging_operation(code_model, overload, is_overload=True, item_type=item_type)

    def update_operation_groups(self, code_model: Dict[str, Any], client: Dict[str, Any]) -> None:
        operation_groups_yaml_data = client.get("operationGroups", [])
        for operation_group in operation_groups_yaml_data:
            operation_group["identifyName"] = self.pad_reserved_words(
                operation_group.get("name", operation_group["propertyName"]),
                PadType.OPERATION_GROUP,
            )
            operation_group["identifyName"] = to_snake_case(operation_group["identifyName"])
            operation_group["propertyName"] = self.pad_reserved_words(
                operation_group["propertyName"], PadType.OPERATION_GROUP
            )
            operation_group["propertyName"] = to_snake_case(operation_group["propertyName"])
            operation_group["className"] = update_operation_group_class_name(
                client["name"], operation_group["className"]
            )
            for operation in operation_group["operations"]:
                self.get_operation_updater(operation)(code_model, operation)

            if operation_group.get("operationGroups"):
                self.update_operation_groups(code_model, operation_group)

    def update_yaml(self, yaml_data: Dict[str, Any]) -> None:
        """Convert in place the YAML str."""
        self.update_types(yaml_data["types"])
        yaml_data["types"] += KNOWN_TYPES.values()
        for client in yaml_data["clients"]:
            self.update_client(client)
            self.update_operation_groups(yaml_data, client)
        for clients in yaml_data["subnamespaceToClients"].values():
            for client in clients:
                self.update_client(client)
                self.update_operation_groups(yaml_data, client)
        if yaml_data.get("namespace"):
            yaml_data["namespace"] = pad_builtin_namespaces(yaml_data["namespace"])


if __name__ == "__main__":
    # CADL pipeline will call this
    args, unknown_args = parse_args()
    PreProcessPlugin(output_folder=args.output_folder, cadl_file=args.cadl_file, **unknown_args).process()
