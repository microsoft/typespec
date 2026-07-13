# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""The preprocessing autorest plugin."""

import copy
from typing import Callable, Any, Optional

from ..utils import to_snake_case, extract_original_name
from .helpers import (
    add_redefined_builtin_info,
    pad_builtin_namespaces,
    pad_special_chars,
)
from .python_mappings import TSP_RESERVED_WORDS, RESERVED_WORDS, PadType

from .. import YamlUpdatePlugin
from ..utils import (
    parse_args,
    get_body_type_for_description,
    JSON_REGEXP,
    KNOWN_TYPES,
    description_ends_with_code_block,
)


def update_overload_section(
    overload: dict[str, Any],
    yaml_data: dict[str, Any],
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


def add_overload(yaml_data: dict[str, Any], body_type: dict[str, Any], for_flatten_params=False):
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


def add_overloads_for_body_param(yaml_data: dict[str, Any]) -> None:
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
        if body_type.get("type") == "model" and body_type.get("base") == "json":
            yaml_data["overloads"].append(add_overload(yaml_data, body_type, for_flatten_params=True))
            # Skip single-body JSON overload; the TypedDict overload replaces it
            continue
        yaml_data["overloads"].append(add_overload(yaml_data, body_type))
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
    # Don't append a trailing period when the description ends with a code block: the
    # period would land inside the rendered literal block (e.g. "]." ) and break Sphinx.
    if description and description[-1] != "." and not description_ends_with_code_block(description):
        description += "."
    return description


def update_operation_group_class_name(prefix: str, class_name: str) -> str:
    if class_name == "":
        return prefix + "OperationsMixin"
    if class_name == "Operations":
        return "Operations"
    return class_name + "Operations"


def update_paging_response(yaml_data: dict[str, Any]) -> None:
    yaml_data["discriminator"] = "paging"


HEADERS_HIDE_IN_METHOD = (
    "repeatability-request-id",
    "repeatability-first-sent",
    "x-ms-client-request-id",
    "client-request-id",
    "return-client-request-id",
)
ETAG_MATCH_DATA = {
    "clientName": "etag",
    "etagRole": "ifMatch",
    "description": "check if resource is changed. Set None to skip checking etag.",
}
ETAG_NONE_MATCH_DATA = {
    "clientName": "match_condition",
    "etagRole": "ifNoneMatch",
    "description": "The match condition to use upon the etag.",
    "type": {
        "type": "sdkcore",
        "name": "MatchConditions",
    },
}
CLOUD_SETTING = {
    "optional": True,
    "description": "The cloud setting for which to get the ARM endpoint.",
    "clientName": "cloud_setting",
    "implementation": "Client",
    "location": "keyword",
    "type": {
        "type": "sdkcore",
        "name": "AzureClouds",
        "isTypingOnly": True,
    },
}
STANDARD_IF_MATCH_WIRE_NAME = "if-match"
STANDARD_IF_NONE_MATCH_WIRE_NAME = "if-none-match"


def get_wire_name_lower(parameter: dict[str, Any]) -> str:
    return (parameter.get("wireName") or "").lower()


def _get_etag_role(parameter: dict[str, Any]) -> Optional[str]:
    """Return 'ifMatch', 'ifNoneMatch', or None for this header parameter."""
    return parameter.get("etagRole")


def _pick_etag_slot(candidates: list[dict[str, Any]], standard_wire_name: str) -> Optional[dict[str, Any]]:
    """Choose which etag-typed header should be promoted to the etag/match_condition slot.

    When more than one etag-typed header is present in an operation, prefer the
    standard If-Match/If-None-Match header (matched on wireName). Otherwise
    fall back to the first candidate. Returns None if there are no candidates.
    """
    if not candidates:
        return None
    for c in candidates:
        if get_wire_name_lower(c) == standard_wire_name:
            return c
    return candidates[0]


def _resolve_etag_pair(
    if_match_candidates: list[dict[str, Any]],
    if_none_match_candidates: list[dict[str, Any]],
) -> tuple[Optional[dict[str, Any]], Optional[dict[str, Any]]]:
    """Select and reconcile the etag header pair for an operation.

    When multiple etag-typed headers are present, prefer the standard
    If-Match / If-None-Match pair.  Synthesize a missing partner when only
    one side is present, and strip etagRole from non-selected candidates.

    Returns (property_if_match, property_if_none_match) — both None when
    there are no etag candidates.
    """
    property_if_match = _pick_etag_slot(if_match_candidates, STANDARD_IF_MATCH_WIRE_NAME)
    property_if_none_match = _pick_etag_slot(if_none_match_candidates, STANDARD_IF_NONE_MATCH_WIRE_NAME)

    # Ensure the promoted pair come from the same family.  When one slot is
    # standard and the other custom (cross-family), replace the custom slot
    # with a synthetic standard partner.  Also synthesize the missing partner
    # when only one side is present.
    if property_if_match and property_if_none_match:
        match_is_std = get_wire_name_lower(property_if_match) == STANDARD_IF_MATCH_WIRE_NAME
        none_match_is_std = get_wire_name_lower(property_if_none_match) == STANDARD_IF_NONE_MATCH_WIRE_NAME
        if match_is_std and not none_match_is_std:
            property_if_none_match = property_if_match.copy()
            property_if_none_match["wireName"] = STANDARD_IF_NONE_MATCH_WIRE_NAME
            property_if_none_match["etagRole"] = "ifNoneMatch"
        elif none_match_is_std and not match_is_std:
            property_if_match = property_if_none_match.copy()
            property_if_match["wireName"] = STANDARD_IF_MATCH_WIRE_NAME
            property_if_match["etagRole"] = "ifMatch"
    elif not property_if_match and property_if_none_match:
        property_if_match = property_if_none_match.copy()
        property_if_match["wireName"] = STANDARD_IF_MATCH_WIRE_NAME
        property_if_match["etagRole"] = "ifMatch"
    elif property_if_match and not property_if_none_match:
        property_if_none_match = property_if_match.copy()
        property_if_none_match["wireName"] = STANDARD_IF_NONE_MATCH_WIRE_NAME
        property_if_none_match["etagRole"] = "ifNoneMatch"

    for c in if_match_candidates:
        if c is not property_if_match:
            c.pop("etagRole", None)
    for c in if_none_match_candidates:
        if c is not property_if_none_match:
            c.pop("etagRole", None)

    return property_if_match, property_if_none_match


def _process_operation_etag_headers(
    operation: dict[str, Any],
    client: dict[str, Any],
    version_tolerant: bool,
) -> None:
    """Collect etag candidates from *operation*, resolve the promoted pair,
    and update *operation* / *client* accordingly."""
    if_match_candidates: list[dict[str, Any]] = []
    if_none_match_candidates: list[dict[str, Any]] = []
    for p in operation["parameters"]:
        wire_name_lower = get_wire_name_lower(p)
        if p["location"] == "header" and wire_name_lower == "client-request-id":
            client["requestIdHeaderName"] = wire_name_lower
        if version_tolerant and p["location"] == "header":
            role = _get_etag_role(p)
            if role == "ifMatch":
                if_match_candidates.append(p)
            elif role == "ifNoneMatch":
                if_none_match_candidates.append(p)

    property_if_match, property_if_none_match = _resolve_etag_pair(if_match_candidates, if_none_match_candidates)

    if property_if_match and property_if_none_match:
        etag_params = {id(property_if_match), id(property_if_none_match)}
        operation["parameters"] = [item for item in operation["parameters"] if id(item) not in etag_params] + [
            property_if_match,
            property_if_none_match,
        ]
        operation["hasEtag"] = True
        client["hasEtag"] = True


def headers_convert(yaml_data: dict[str, Any], replace_data: Any) -> None:
    if isinstance(replace_data, dict):
        for k, v in replace_data.items():
            yaml_data[k] = v


def has_json_content_type(yaml_data: dict[str, Any]) -> bool:
    return any(ct for ct in yaml_data.get("contentTypes", []) if JSON_REGEXP.match(ct))


def has_multi_part_content_type(yaml_data: dict[str, Any]) -> bool:
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
        return self.options.get("models-mode", "dpg" if self.is_tsp else None)

    @property
    def is_tsp(self) -> bool:
        return self.options.get("tsp_file", False)

    @staticmethod
    def _find_existing_typeddict(
        code_model: dict[str, Any],
        cross_lang_id: Optional[str],
        name: Optional[str] = None,
    ) -> Optional[dict[str, Any]]:
        """Find an existing typeddict copy for the given model.

        Matches on both ``crossLanguageDefinitionId`` and ``name``. The name is required because
        template-instantiated models (e.g. ``ResourceUpdateModel<Foo, FooProperties>``) all share
        the template's cross-language id, so matching on the id alone would reuse one model's copy
        (e.g. ``CacheUpdate``) for a different model (e.g. ``VolumeUpdate``).
        """
        if not cross_lang_id:
            return None
        return next(
            (
                t
                for t in code_model["types"]
                if t.get("type") == "model"
                and t.get("base") == "typeddict"
                and t.get("crossLanguageDefinitionId") == cross_lang_id
                and (name is None or t.get("name") == name)
            ),
            None,
        )

    @staticmethod
    def _find_spread_original(code_model: dict[str, Any], json_model: dict[str, Any]) -> Optional[dict[str, Any]]:
        """Recover the dpg model that a spread (json) body was cloned from.

        When a spread body type is also used elsewhere, the emitter clones it, renames the clone to
        ``<Method>Request`` and sets ``base = "json"`` while keeping the original
        ``crossLanguageDefinitionId``. To reference the real model's TypedDict we look the clone up
        by that id.

        Distinct template-instantiated models share a single ``crossLanguageDefinitionId``, so an id
        match alone is ambiguous. We only reuse an original when the choice is unambiguous:

        * a dpg candidate whose ``name`` equals the json model's name (the body was not renamed), or
        * exactly one dpg candidate carries the id.

        Otherwise we return ``None`` so the caller falls back to the json model itself, avoiding a
        reference to the wrong model's TypedDict.
        """
        cross_lang_id = json_model.get("crossLanguageDefinitionId")
        if not cross_lang_id:
            return None
        candidates = [
            t
            for t in code_model["types"]
            if t.get("type") == "model"
            and t.get("base") == "dpg"
            and t.get("crossLanguageDefinitionId") == cross_lang_id
            and t is not json_model
        ]
        if not candidates:
            return None
        name = json_model.get("name")
        for candidate in candidates:
            if candidate.get("name") == name:
                return candidate
        if len(candidates) == 1:
            return candidates[0]
        return None

    @staticmethod
    def _insert_typeddict_overload(
        code_model: dict[str, Any],
        body_parameter: dict[str, Any],
        source: dict[str, Any],
        origin_type: str,
        existing_td: Optional[dict[str, Any]],
    ) -> None:
        """Insert a typeddict type into the body parameter's combined types."""
        if origin_type == "model":
            td_type = existing_td or {**source, "base": "typeddict"}
            body_parameter["type"]["types"].insert(1, td_type)
            if not existing_td:
                code_model["types"].append(td_type)
        else:
            td_list_or_dict = copy.deepcopy(body_parameter["type"]["types"][0])
            td_elem = existing_td or {**source, "base": "typeddict"}
            td_list_or_dict["elementType"] = td_elem
            body_parameter["type"]["types"].insert(1, td_list_or_dict)
            if not existing_td:
                code_model["types"].append(td_elem)

    def add_body_param_type(
        self,
        code_model: dict[str, Any],
        body_parameter: dict[str, Any],
    ):
        # For a binary `bytes` body (e.g. content type application/octet-stream or a custom
        # binary media type), add an IO overload alongside the `bytes` one. This keeps backward
        # compatibility for services migrating from swagger, whose binary bodies were typed as IO.
        if (
            body_parameter
            and body_parameter["type"]["type"] == "bytes"
            and not has_json_content_type(body_parameter)
            and not (self.is_tsp and has_multi_part_content_type(body_parameter))
            and self.options["models-mode"] != "typeddict"
            and not any(t for t in ["flattened", "groupedBy"] if body_parameter.get(t))
        ):
            body_parameter["type"] = {
                "type": "combined",
                "types": [body_parameter["type"], KNOWN_TYPES["binary"]],
            }
            code_model["types"].append(body_parameter["type"])
            return

        # only add overload for special content type
        if (  # pylint: disable=too-many-boolean-expressions
            body_parameter
            and body_parameter["type"]["type"] in ("model", "dict", "list")
            and (has_json_content_type(body_parameter) or (self.is_tsp and has_multi_part_content_type(body_parameter)))
            and not body_parameter["type"].get("xmlMetadata")
            and not any(t for t in ["flattened", "groupedBy"] if body_parameter.get(t))
        ):
            origin_type = body_parameter["type"]["type"]
            model_type = (
                body_parameter["type"] if origin_type == "model" else body_parameter["type"].get("elementType", {})
            )
            is_dpg_model = model_type.get("base") == "dpg"
            is_json_model = model_type.get("base") == "json"
            is_typeddict_only = self.options["models-mode"] == "typeddict"

            body_parameter["type"] = {
                "type": "combined",
                "types": [body_parameter["type"]],
            }
            # don't add binary overload for multipart content type or typeddict-only mode
            if not (self.is_tsp and has_multi_part_content_type(body_parameter)) and not is_typeddict_only:
                body_parameter["type"]["types"].append(KNOWN_TYPES["binary"])

            # Add typeddict overload for non-spread dpg models
            if self.options["models-mode"] == "dpg" and is_dpg_model:
                cross_lang_id = model_type.get("crossLanguageDefinitionId")
                existing_td = self._find_existing_typeddict(code_model, cross_lang_id, model_type.get("name"))
                self._insert_typeddict_overload(code_model, body_parameter, model_type, origin_type, existing_td)

            # For spread bodies (json base), add a typeddict overload that references
            # the original model. This replaces the JSON single-body overload.
            if is_json_model:
                cross_lang_id = model_type.get("crossLanguageDefinitionId")
                original = self._find_spread_original(code_model, model_type)

                if is_typeddict_only and original:
                    # In typeddict-only mode, the original dpg model already renders
                    # as a TypedDict — reference it directly, no copy needed.
                    if origin_type == "model":
                        body_parameter["type"]["types"].insert(1, original)
                    else:
                        td_list_or_dict = copy.deepcopy(body_parameter["type"]["types"][0])
                        td_list_or_dict["elementType"] = original
                        body_parameter["type"]["types"].insert(1, td_list_or_dict)
                else:
                    source = original or model_type
                    existing_td = self._find_existing_typeddict(code_model, cross_lang_id, source.get("name"))
                    self._insert_typeddict_overload(code_model, body_parameter, source, origin_type, existing_td)

            if len(body_parameter["type"]["types"]) == 1:
                # Only one body variant remains (e.g. typeddict-only mode where the
                # binary and JSON overloads are omitted). Collapse the combined
                # wrapper back to the single type so we don't emit a lone
                # ``@overload`` (mypy rejects a single overload definition).
                body_parameter["type"] = body_parameter["type"]["types"][0]
                return

            code_model["types"].append(body_parameter["type"])

    def pad_reserved_words(self, name: str, pad_type: PadType, yaml_type: dict[str, Any]) -> str:
        # we want to pad hidden variables as well
        if not name:
            # we'll pass in empty operation groups sometime etc.
            return name

        if self.is_tsp:
            reserved_words = {k: (v + TSP_RESERVED_WORDS.get(k, [])) for k, v in RESERVED_WORDS.items()}
        else:
            reserved_words = RESERVED_WORDS
        name = pad_special_chars(name)
        name_prefix = "_" if name[0] == "_" else ""
        name = name[1:] if name[0] == "_" else name
        if name.lower() in reserved_words[pad_type]:
            if self.is_tsp and name.lower() in TSP_RESERVED_WORDS.get(pad_type, []):
                # to maintain backcompat for cases where we pad in tsp but not in autorest,
                # if we have a tsp reserved word, we also want to keep track of the original name for backcompat
                yaml_type["originalTspName"] = name_prefix + name
            return name_prefix + name + pad_type
        return name_prefix + name

    def update_types(self, yaml_data: list[dict[str, Any]]) -> None:
        for type in yaml_data:
            for property in type.get("properties", []):
                property["description"] = update_description(property.get("description", ""))
                if not property.get("isExactName", False):
                    property["clientName"] = self.pad_reserved_words(
                        property["clientName"].lower(), PadType.PROPERTY, property
                    )
                add_redefined_builtin_info(property["clientName"], property)
            if type.get("name"):
                pad_type = PadType.MODEL if type["type"] == "model" else PadType.ENUM_CLASS
                if type["type"] != "enumvalue":
                    name = self.pad_reserved_words(type["name"], pad_type, type)
                    type["name"] = name[0].upper() + name[1:]
                type["description"] = update_description(type.get("description", ""), type["name"])
                type["snakeCaseName"] = to_snake_case(type["name"])
            if type.get("values"):
                # we're enums - enum values are UPPER_CASE so no padding needed for reserved words
                for value in type["values"]:
                    if value.get("isExactName", False):
                        continue
                    upper_name = value["name"].upper()
                    if upper_name[0] in "0123456789":
                        upper_name = "ENUM_" + upper_name
                        value["name"] = upper_name

        # add type for reference
        if "type" in ETAG_NONE_MATCH_DATA:
            yaml_data.append(ETAG_NONE_MATCH_DATA["type"])
        yaml_data.append(CLOUD_SETTING["type"])  # type: ignore

    def update_client(self, yaml_data: dict[str, Any]) -> None:
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
                _process_operation_etag_headers(o, yaml_data, self.version_tolerant)

        # add client signature cloud_setting for arm
        if self.azure_arm and yaml_data["parameters"]:
            yaml_data["parameters"].append(CLOUD_SETTING)

    def get_operation_updater(self, yaml_data: dict[str, Any]) -> Callable[[dict[str, Any], dict[str, Any]], None]:
        if yaml_data["discriminator"] == "lropaging":
            return self.update_lro_paging_operation
        if yaml_data["discriminator"] == "lro":
            return self.update_lro_operation
        if yaml_data["discriminator"] == "paging":
            return self.update_paging_operation
        return self.update_operation

    def update_parameter(self, yaml_data: dict[str, Any]) -> None:
        yaml_data["description"] = update_description(yaml_data.get("description", ""))
        if not yaml_data.get("isExactName", False) and not (
            yaml_data["location"] == "header" and yaml_data["clientName"] in ("content_type", "accept")
        ):
            yaml_data["clientName"] = self.pad_reserved_words(
                yaml_data["clientName"].lower(), PadType.PARAMETER, yaml_data
            )
        if yaml_data.get("propertyToParameterName"):
            # need to create a new one with padded values (but NOT keys, since keys are wire names)
            # build a lookup of exact-name properties from the body type's properties
            exact_name_props = set()
            for prop in yaml_data.get("type", {}).get("properties", []):
                if prop.get("isExactName", False):
                    exact_name_props.add(prop.get("wireName", ""))
            yaml_data["propertyToParameterName"] = {
                prop: (
                    param_name
                    if prop in exact_name_props
                    else self.pad_reserved_words(param_name, PadType.PARAMETER, yaml_data).lower()
                )
                for prop, param_name in yaml_data["propertyToParameterName"].items()
            }
        wire_name_lower = (yaml_data.get("wireName") or "").lower()
        if yaml_data["location"] == "header" and (
            wire_name_lower in HEADERS_HIDE_IN_METHOD or yaml_data.get("clientDefaultValue") == "multipart/form-data"
        ):
            yaml_data["hideInMethod"] = True
        if self.version_tolerant and yaml_data["location"] == "header":
            role = _get_etag_role(yaml_data)
            if role == "ifMatch":
                headers_convert(yaml_data, ETAG_MATCH_DATA)
            elif role == "ifNoneMatch":
                headers_convert(yaml_data, ETAG_NONE_MATCH_DATA)
        if wire_name_lower in ["$host", "content-type", "accept"] and yaml_data["type"]["type"] == "constant":
            yaml_data["clientDefaultValue"] = yaml_data["type"]["value"]

    def update_operation(
        self,
        code_model: dict[str, Any],
        yaml_data: dict[str, Any],
        *,
        is_overload: bool = False,
    ) -> None:
        yaml_data["groupName"] = self.pad_reserved_words(yaml_data["groupName"], PadType.OPERATION_GROUP, yaml_data)
        yaml_data["groupName"] = to_snake_case(yaml_data["groupName"])
        if yaml_data.get("isExactName", False):
            # exact() client name: keep the operation name as-is without lowercasing,
            # snake-casing, or padding reserved words.
            if yaml_data.get("isLroInitialOperation") is True:
                yaml_data["name"] = "_" + extract_original_name(yaml_data["name"]) + "_initial"
        else:
            yaml_data["name"] = yaml_data["name"].lower()
            if yaml_data.get("isLroInitialOperation") is True:
                yaml_data["name"] = (
                    "_"
                    + self.pad_reserved_words(
                        extract_original_name(yaml_data["name"]),
                        PadType.METHOD,
                        yaml_data,
                    )
                    + "_initial"
                )
            else:
                yaml_data["name"] = self.pad_reserved_words(yaml_data["name"], PadType.METHOD, yaml_data)
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

    def _update_lro_operation_helper(self, yaml_data: dict[str, Any]) -> None:
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
        code_model: dict[str, Any],
        yaml_data: dict[str, Any],
        is_overload: bool = False,
        item_type: Optional[dict[str, Any]] = None,
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
        code_model: dict[str, Any],
        yaml_data: dict[str, Any],
        is_overload: bool = False,
    ) -> None:
        def convert_initial_operation_response_type(data: dict[str, Any]) -> None:
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
        code_model: dict[str, Any],
        yaml_data: dict[str, Any],
        is_overload: bool = False,
        item_type: Optional[dict[str, Any]] = None,
    ) -> None:
        self.update_operation(code_model, yaml_data, is_overload=is_overload)
        item_type = item_type or yaml_data["itemType"]["elementType"]
        if yaml_data.get("nextOperation"):
            yaml_data["nextOperation"]["groupName"] = self.pad_reserved_words(
                yaml_data["nextOperation"]["groupName"],
                PadType.OPERATION_GROUP,
                yaml_data["nextOperation"],
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

    def update_operation_groups(self, code_model: dict[str, Any], client: dict[str, Any]) -> None:
        operation_groups_yaml_data = client.get("operationGroups", [])
        for operation_group in operation_groups_yaml_data:
            operation_group["identifyName"] = self.pad_reserved_words(
                operation_group.get("name", operation_group["propertyName"]),
                PadType.OPERATION_GROUP,
                operation_group,
            )
            operation_group["identifyName"] = to_snake_case(operation_group["identifyName"])
            operation_group["propertyName"] = self.pad_reserved_words(
                operation_group["propertyName"],
                PadType.OPERATION_GROUP,
                operation_group,
            )
            operation_group["propertyName"] = to_snake_case(operation_group["propertyName"])
            operation_group["className"] = update_operation_group_class_name(
                client["name"], operation_group["className"]
            )
            for operation in operation_group["operations"]:
                self.get_operation_updater(operation)(code_model, operation)

            if operation_group.get("operationGroups"):
                self.update_operation_groups(code_model, operation_group)

    def update_yaml(self, yaml_data: dict[str, Any]) -> None:
        """Convert in place the YAML str."""
        self.update_types(yaml_data["types"])
        yaml_data["types"] += KNOWN_TYPES.values()
        for client in yaml_data["clients"]:
            self.update_client(client)
            self.update_operation_groups(yaml_data, client)
        if yaml_data.get("namespace"):
            yaml_data["namespace"] = pad_builtin_namespaces(yaml_data["namespace"])


if __name__ == "__main__":
    # TSP pipeline will call this
    args, unknown_args = parse_args()
    PreProcessPlugin(output_folder=args.output_folder, tsp_file=args.tsp_file, **unknown_args).process()
