# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Sequence, Union, Optional
from enum import Enum, auto

from ..models import (
    Parameter,
    ParameterLocation,
    ListType,
    ParameterDelimeter,
    RequestBuilderParameter,
    ClientParameter,
    ConfigParameter,
    ParameterType,
)
from ..models.parameter import _ParameterBase
from ..models.parameter_list import BodyParameterType


class PopKwargType(Enum):
    NO = auto()
    SIMPLE = auto()
    CASE_INSENSITIVE = auto()


SPECIAL_HEADER_SERIALIZATION: dict[str, list[str]] = {
    "repeatability-request-id": [
        """if "Repeatability-Request-ID" not in _headers:""",
        """    _headers["Repeatability-Request-ID"] = str(uuid.uuid4())""",
    ],
    "repeatability-first-sent": [
        """if "Repeatability-First-Sent" not in _headers:""",
        """    _headers["Repeatability-First-Sent"] = _SERIALIZER.serialize_data(""",
        """        datetime.datetime.now(datetime.timezone.utc), "rfc-1123")""",
    ],
    "client-request-id": [],
    "x-ms-client-request-id": [],
    "return-client-request-id": [],
    "etag": [
        """if_match = prep_if_match(etag, match_condition)""",
        """if if_match is not None:""",
        """    _headers["If-Match"] = _SERIALIZER.header("if_match", if_match, "str")""",
    ],
    "match-condition": [
        """if_none_match = prep_if_none_match(etag, match_condition)""",
        """if if_none_match is not None:""",
        """    _headers["If-None-Match"] = _SERIALIZER.header("if_none_match", if_none_match, "str")""",
    ],
}


def check_body_optional(body_parameter: Optional[BodyParameterType]) -> bool:
    """Check if the body parameter is optional."""
    return body_parameter.optional if body_parameter and body_parameter.in_method_signature else False


class ParameterSerializer:

    def __init__(self, serialize_namespace: str) -> None:
        self.serialize_namespace = serialize_namespace

    def serialize_parameter(self, parameter: ParameterType, serializer_name: str) -> str:
        optional_parameters = []

        if parameter.skip_url_encoding:
            optional_parameters.append("skip_quote=True")

        if parameter.delimiter and not parameter.explode:
            if parameter.delimiter == ParameterDelimeter.COMMA:
                div_char = ","
            elif parameter.delimiter == ParameterDelimeter.SPACE:
                div_char = " "
            elif parameter.delimiter == ParameterDelimeter.PIPE:
                div_char = "|"
            elif parameter.delimiter == ParameterDelimeter.TAB:
                div_char = "\t"
            else:
                raise ValueError(f"We do not support {parameter.delimiter} yet")
            optional_parameters.append(f"div='{div_char}'")

        if parameter.explode:
            if not isinstance(parameter.type, ListType):
                raise ValueError("Got a explode boolean on a non-array schema")
            type = parameter.type.element_type
        else:
            type = parameter.type

        serialization_constraints = type.serialization_constraints
        if serialization_constraints:
            optional_parameters += serialization_constraints

        origin_name = parameter.full_client_name
        
        # For dictionary parameters, use wire_name instead of Python parameter name
        from ..models.dictionary_type import DictionaryType
        if isinstance(parameter.type, DictionaryType):
            param_name = f'"{parameter.wire_name}"'
        else:
            param_name = f'"{origin_name.lstrip("_")}"'

        parameters = [
            param_name,
            "q" if parameter.explode else origin_name,
            f"'{type.serialization_type(serialize_namespace=self.serialize_namespace)}'",
            *optional_parameters,
        ]
        parameters_line = ", ".join(parameters)

        msrest_function_name = {
            ParameterLocation.PATH: "url",
            ParameterLocation.ENDPOINT_PATH: "url",
            ParameterLocation.HEADER: "header",
            ParameterLocation.QUERY: "query",
        }[parameter.location]

        serialize_line = f"{serializer_name}.{msrest_function_name}({parameters_line})"

        if parameter.explode:
            return f"[{serialize_line} if q is not None else '' for q in {origin_name}]"
        return serialize_line

    # pylint: disable=line-too-long
    def serialize_path(
        self,
        parameters: Union[
            list[Parameter],
            list[RequestBuilderParameter],
            list[ClientParameter],
            list[ConfigParameter],
        ],
        serializer_name: str,
    ) -> list[str]:
        retval = ["path_format_arguments = {"]
        retval.extend(
            [
                '    "{}": {},'.format(
                    path_parameter.wire_name,
                    (
                        f'"" if {path_parameter.full_client_name} is None else "/" + {self.serialize_parameter(path_parameter, serializer_name)}'
                        if path_parameter.optional and isinstance(path_parameter, RequestBuilderParameter)
                        else self.serialize_parameter(path_parameter, serializer_name)
                    ),
                )
                for path_parameter in parameters
            ]
        )
        retval.append("}")
        return retval

    def serialize_query_header(
        self,
        param: Parameter,
        kwarg_name: str,
        serializer_name: str,
        is_legacy: bool,
    ) -> list[str]:
        if (
            not is_legacy
            and param.location == ParameterLocation.HEADER
            and param.wire_name.lower() in SPECIAL_HEADER_SERIALIZATION
        ):
            return SPECIAL_HEADER_SERIALIZATION[param.wire_name.lower()]

        # Handle dictionary parameters specially
        from ..models.dictionary_type import DictionaryType
        if isinstance(param.type, DictionaryType):
            # For dictionary parameters, serialize and update _params with individual key-value pairs
            serialize_call = self.serialize_parameter(param, serializer_name)
            if not param.optional and (param.in_method_signature or param.constant):
                retval = [
                    f"dict_params = {serialize_call}",
                    f"if dict_params:",
                    f"    _{kwarg_name}.update(dict_params)",
                ]
            else:
                retval = [
                    f"if {param.full_client_name} is not None:",
                    f"    dict_params = {serialize_call}",
                    f"    if dict_params:",
                    f"        _{kwarg_name}.update(dict_params)",
                ]
            return retval

        set_parameter = "_{}['{}'] = {}".format(
            kwarg_name,
            param.wire_name,
            self.serialize_parameter(param, serializer_name),
        )
        if not param.optional and (param.in_method_signature or param.constant):
            retval = [set_parameter]
        else:
            retval = [
                f"if {param.full_client_name} is not None:",
                f"    {set_parameter}",
            ]
        return retval

    @staticmethod
    def pop_kwargs_from_signature(
        parameters: Sequence[_ParameterBase],
        check_kwarg_dict: bool,
        pop_headers_kwarg: PopKwargType,
        pop_params_kwarg: PopKwargType,
        check_client_input: bool = False,
        *,
        body_parameter: Optional[BodyParameterType] = None,
    ) -> list[str]:
        retval = []

        def append_pop_kwarg(key: str, pop_type: PopKwargType) -> None:
            if PopKwargType.CASE_INSENSITIVE == pop_type:
                retval.append(f'_{key} = case_insensitive_dict(kwargs.pop("{key}", {{}}) or {{}})')
            elif PopKwargType.SIMPLE == pop_type:
                retval.append(f'_{key} = kwargs.pop("{key}", {{}}) or {{}}')

        append_pop_kwarg("headers", pop_headers_kwarg)
        append_pop_kwarg("params", pop_params_kwarg)
        is_body_optional = check_body_optional(body_parameter)
        if pop_headers_kwarg != PopKwargType.NO or pop_params_kwarg != PopKwargType.NO:
            retval.append("")
        for kwarg in parameters:
            is_content_type_optional = getattr(kwarg, "is_content_type", False) and is_body_optional
            type_annotation = kwarg.type_annotation()
            type_annotation = (
                "Optional[" + kwarg.type_annotation() + "]"
                if is_content_type_optional and not type_annotation.startswith("Optional[")
                else type_annotation
            )
            if kwarg.client_default_value is not None or kwarg.optional:
                if check_client_input and kwarg.check_client_input:
                    default_value = f"self._config.{kwarg.client_name}"
                else:
                    default_value = kwarg.client_default_value_declaration
                if check_kwarg_dict and (kwarg.location in [ParameterLocation.HEADER, ParameterLocation.QUERY]):
                    kwarg_dict = "headers" if kwarg.location == ParameterLocation.HEADER else "params"
                    default_value = f"_{kwarg_dict}.pop('{kwarg.wire_name}', {default_value})"

                retval.append(
                    f"{kwarg.client_name}: {type_annotation} = kwargs.pop('{kwarg.client_name}', " + f"{default_value})"
                )
            else:
                retval.append(f"{kwarg.client_name}: {type_annotation} = kwargs.pop('{kwarg.client_name}')")
            if is_content_type_optional and body_parameter:
                retval.append(f"content_type = content_type if {body_parameter.client_name} else None")
        return retval

    @staticmethod
    def serialize_method(
        *,
        function_def: str,
        method_name: str,
        need_self_param: bool,
        method_param_signatures: list[str],
        pylint_disable: str = "",
    ):
        lines: list[str] = []
        first_line = f"{function_def} {method_name}({pylint_disable}"
        lines.append(first_line)
        if need_self_param:
            lines.append("    self,")
        lines.extend([("    " + line) for line in method_param_signatures])
        lines.append(")")
        return "\n".join(lines)
