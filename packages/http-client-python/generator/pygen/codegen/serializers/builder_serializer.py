# pylint: disable=too-many-lines
# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from abc import abstractmethod
from collections import defaultdict
from typing import Generic, List, Type, TypeVar, Dict, Union, Optional, cast

from ..models import (
    Operation,
    PagingOperation,
    CodeModel,
    LROOperation,
    LROPagingOperation,
    ModelType,
    DictionaryType,
    ListType,
    RequestBuilder,
    ParameterLocation,
    Response,
    BinaryType,
    BodyParameter,
    ParameterMethodLocation,
    OverloadedRequestBuilder,
    Property,
    RequestBuilderType,
    CombinedType,
    JSONModelType,
    DPGModelType,
    ParameterListType,
    ByteArraySchema,
)
from .parameter_serializer import ParameterSerializer, PopKwargType
from ..models.parameter_list import ParameterType
from . import utils
from ...utils import xml_serializable, json_serializable

T = TypeVar("T")
OrderedSet = Dict[T, None]

BuilderType = TypeVar(
    "BuilderType",
    bound=Union[
        RequestBuilder,
        Operation,
        PagingOperation,
        LROOperation,
        LROPagingOperation,
        OverloadedRequestBuilder,
    ],
)
OperationType = TypeVar(
    "OperationType",
    bound=Union[Operation, PagingOperation, LROOperation, LROPagingOperation],
)


def _all_same(data: List[List[str]]) -> bool:
    return len(data) > 1 and all(sorted(data[0]) == sorted(data[i]) for i in range(1, len(data)))


def _need_type_ignore(builder: OperationType) -> bool:
    for e in builder.non_default_errors:
        for status_code in e.status_codes:
            if status_code in (401, 404, 409, 304):
                return True
    return False


def _xml_config(send_xml: bool, content_types: List[str]) -> str:
    if not (send_xml and "xml" in str(content_types)):
        return ""
    if len(content_types) == 1:
        return ", is_xml=True"
    return ", is_xml='xml' in str(content_type)"


def _escape_str(input_str: str) -> str:
    replace = input_str.replace("'", "\\'")
    return f'"{replace}"'


def _get_polymorphic_subtype_template(polymorphic_subtype: ModelType) -> List[str]:
    retval: List[str] = []
    retval.append("")
    retval.append(f'# JSON input template for discriminator value "{polymorphic_subtype.discriminator_value}":')
    subtype_template = utils.json_dumps_template(
        polymorphic_subtype.get_json_template_representation(),
    )

    def _get_polymorphic_parent(
        polymorphic_subtype: Optional[ModelType],
    ) -> Optional[ModelType]:
        if not polymorphic_subtype:
            return None
        try:
            return next(p for p in polymorphic_subtype.parents if p.discriminated_subtypes)
        except StopIteration:
            return None

    polymorphic_parent = _get_polymorphic_parent(polymorphic_subtype)
    while _get_polymorphic_parent(polymorphic_parent):
        polymorphic_parent = _get_polymorphic_parent(polymorphic_parent)
    retval.extend(f"{cast(ModelType, polymorphic_parent).snake_case_name} = {subtype_template}".splitlines())
    return retval


def _serialize_grouped_body(builder: BuilderType) -> List[str]:
    retval: List[str] = []
    for grouped_parameter in builder.parameters.grouped:
        retval.append(f"{grouped_parameter.client_name} = None")
    groupers = [p for p in builder.parameters if p.grouper]
    for grouper in groupers:
        retval.append(f"if {grouper.client_name} is not None:")
        retval.extend(
            [
                f"    {parameter} = {grouper.client_name}.{property}"
                for property, parameter in grouper.property_to_parameter_name.items()
            ]
        )
    return retval


def _serialize_flattened_body(body_parameter: BodyParameter) -> List[str]:
    retval: List[str] = []
    if not body_parameter.property_to_parameter_name:
        raise ValueError("This method can't be called if the operation doesn't need parameter flattening")

    parameter_string = ", ".join(
        f"{property_name}={parameter_name}"
        for property_name, parameter_name in body_parameter.property_to_parameter_name.items()
    )
    model_type = cast(ModelType, body_parameter.type)
    retval.append(f"{body_parameter.client_name} = _models.{model_type.name}({parameter_string})")
    return retval


def _serialize_json_model_body(body_parameter: BodyParameter, parameters: List[ParameterType]) -> List[str]:
    retval: List[str] = []
    if not body_parameter.property_to_parameter_name:
        raise ValueError("This method can't be called if the operation doesn't need parameter flattening")

    retval.append(f"if {body_parameter.client_name} is _Unset:")
    for p in parameters:
        if p.client_default_value is None and not p.optional and p.default_to_unset_sentinel:
            retval.append(f"    if {p.client_name} is _Unset:")
            retval.append(f"            raise TypeError('missing required argument: {p.client_name}')")
    parameter_string = ", \n".join(
        f'"{property_name}": {parameter_name}'
        for property_name, parameter_name in body_parameter.property_to_parameter_name.items()
    )
    model_type = cast(ModelType, body_parameter.type)
    if isinstance(model_type, CombinedType) and model_type.target_model_subtype((JSONModelType,)):
        model_type = model_type.target_model_subtype((JSONModelType,))
    retval.append(f"    {body_parameter.client_name} = {{{parameter_string}}}")
    retval.append(f"    {body_parameter.client_name} =  {{")
    retval.append(f"        k: v for k, v in {body_parameter.client_name}.items() if v is not None")
    retval.append("    }")
    return retval


def _serialize_multipart_body(builder: BuilderType) -> List[str]:
    retval: List[str] = []
    body_param = builder.parameters.body_parameter
    # we have to construct our form data before passing to the request as well
    retval.append("# Construct form data")
    retval.append(f"_{body_param.client_name} = {{")
    for param in body_param.entries:
        retval.append(f'    "{param.wire_name}": {param.client_name},')
    retval.append("}")
    return retval


def _get_json_response_template_to_status_codes(
    builder: OperationType,
) -> Dict[str, List[str]]:
    retval = defaultdict(list)
    for response in builder.responses:
        json_template = response.get_json_template_representation()
        if not json_template:
            continue
        status_codes = [str(status_code) for status_code in response.status_codes]
        response_json = utils.json_dumps_template(json_template)
        retval[response_json].extend(status_codes)
    return retval


def is_json_model_type(parameters: ParameterListType) -> bool:
    return (
        parameters.has_body
        and parameters.body_parameter.has_json_model_type
        and any(p.in_flattened_body for p in parameters.parameters)
    )


class _BuilderBaseSerializer(Generic[BuilderType]):
    def __init__(self, code_model: CodeModel, async_mode: bool) -> None:
        self.code_model = code_model
        self.async_mode = async_mode
        self.parameter_serializer = ParameterSerializer()

    @property
    @abstractmethod
    def _need_self_param(self) -> bool: ...

    @property
    @abstractmethod
    def _function_def(self) -> str:
        """The def keyword for the builder we're serializing, i.e. 'def' or 'async def'"""

    @property
    @abstractmethod
    def _call_method(self) -> str:
        """How to call network calls. Await if we have to await network calls"""

    @property
    @abstractmethod
    def serializer_name(self) -> str:
        """Name of serializer"""

    @abstractmethod
    def response_docstring(self, builder: BuilderType) -> List[str]:
        """Response portion of the docstring"""

    def decorators(self, builder: BuilderType) -> List[str]:
        """Decorators for the method"""
        retval: List[str] = []
        if builder.is_overload:
            return ["@overload"]
        if self.code_model.options["tracing"] and builder.want_tracing:
            retval.append(f"@distributed_trace{'_async' if self.async_mode else ''}")
        return retval

    def _method_signature(self, builder: BuilderType) -> str:
        return self.parameter_serializer.serialize_method(
            function_def=self._function_def,
            method_name=builder.name,
            need_self_param=self._need_self_param,
            method_param_signatures=builder.method_signature(self.async_mode),
            pylint_disable=builder.pylint_disable(self.async_mode),
        )

    def method_signature_and_response_type_annotation(
        self, builder: BuilderType, *, want_decorators: Optional[bool] = True
    ) -> str:
        response_type_annotation = builder.response_type_annotation(async_mode=self.async_mode)
        method_signature = self._method_signature(builder)
        decorators = self.decorators(builder)
        decorators_str = ""
        if decorators and want_decorators:
            decorators_str = "\n".join(decorators) + "\n"
        return decorators_str + utils.method_signature_and_response_type_annotation_template(
            method_signature=method_signature,
            response_type_annotation=response_type_annotation,
        )

    def description_and_summary(self, builder: BuilderType) -> List[str]:
        description_list: List[str] = []
        description_list.append(f"{builder.summary.strip() if builder.summary else builder.description.strip()}")
        if builder.summary and builder.description:
            description_list.append("")
            description_list.append(builder.description.strip())
        description_list.append("")
        return description_list

    @staticmethod
    def line_too_long(docs: List[str], indentation: int = 0) -> bool:
        return any(len(line) > (120 - indentation) for line in docs)

    def example_template(self, builder: BuilderType) -> List[str]:
        template = []
        if builder.abstract:
            return []
        if self._json_input_example_template(builder):
            template.append("")
            template += self._json_input_example_template(builder)
        return template

    def param_description(self, builder: BuilderType) -> List[str]:
        description_list: List[str] = []
        for param in builder.parameters.method:
            if (
                not param.in_docstring
                or param.hide_in_operation_signature
                or param.method_location == ParameterMethodLocation.KWARG
            ):
                continue
            description_list.extend(
                f":{param.description_keyword} {param.client_name}: {param.description}".replace("\n", "\n ").split(
                    "\n"
                )
            )
            docstring_type = param.docstring_type(
                async_mode=self.async_mode,
            )
            description_list.append(f":{param.docstring_type_keyword} {param.client_name}: {docstring_type}")
        return description_list

    def param_description_and_response_docstring(self, builder: BuilderType) -> List[str]:
        if builder.abstract:
            return []
        return self.param_description(builder) + self.response_docstring(builder)

    @property
    @abstractmethod
    def _json_response_template_name(self) -> str: ...

    def _json_input_example_template(self, builder: BuilderType) -> List[str]:
        template: List[str] = []
        if not builder.parameters.has_body or builder.parameters.body_parameter.flattened:
            # No input template if now body parameter
            return template

        body_param = builder.parameters.body_parameter
        if not isinstance(body_param.type, (ListType, DictionaryType, ModelType, CombinedType)):
            return template

        if (
            isinstance(body_param.type, (ListType, DictionaryType))
            and self.code_model.options["models_mode"] == "msrest"
        ):
            return template

        if isinstance(body_param.type, ModelType) and body_param.type.base == "msrest":
            return template

        json_type = body_param.type
        if isinstance(body_param.type, CombinedType):
            target_model_type = body_param.type.target_model_subtype((JSONModelType, DPGModelType))
            if target_model_type is None:
                return template
            json_type = target_model_type

        polymorphic_subtypes: List[ModelType] = []
        json_type.get_polymorphic_subtypes(polymorphic_subtypes)
        if polymorphic_subtypes:
            # we just assume one kind of polymorphic body for input
            discriminator_name = cast(Property, polymorphic_subtypes[0].discriminator).wire_name
            template.append(
                "# The input is polymorphic. The following are possible polymorphic "
                f'inputs based off discriminator "{discriminator_name}":'
            )
            for idx in range(
                min(
                    self.code_model.options["polymorphic_examples"],
                    len(polymorphic_subtypes),
                )
            ):
                template.extend(_get_polymorphic_subtype_template(polymorphic_subtypes[idx]))
            template.append("")
        template.append("# JSON input template you can fill out and use as your body input.")
        json_template = utils.json_dumps_template(
            json_type.get_json_template_representation(),
        )
        template.extend(f"{builder.parameters.body_parameter.client_name} = {json_template}".splitlines())
        return template

    def serialize_path(self, builder: BuilderType) -> List[str]:
        return self.parameter_serializer.serialize_path(builder.parameters.path, self.serializer_name)

    @property
    def pipeline_name(self) -> str:
        return f"{'_' if self.code_model.is_azure_flavor else ''}pipeline"


############################## REQUEST BUILDERS ##############################


class RequestBuilderSerializer(_BuilderBaseSerializer[RequestBuilderType]):
    def description_and_summary(self, builder: RequestBuilderType) -> List[str]:
        retval = super().description_and_summary(builder)
        retval += [
            "See https://aka.ms/azsdk/dpcodegen/python/send_request for how to incorporate this "
            "request builder into your code flow.",
            "",
        ]
        return retval

    @property
    def _call_method(self) -> str:
        return ""

    @property
    def serializer_name(self) -> str:
        return "_SERIALIZER"

    @property
    def _json_response_template_name(self) -> str:
        return "response.json()"

    @staticmethod
    def declare_non_inputtable_headers_queries(
        builder: RequestBuilderType,
    ) -> List[str]:
        def _get_value(param):
            declaration = param.get_declaration() if param.constant else None
            if param.location in [ParameterLocation.HEADER, ParameterLocation.QUERY]:
                kwarg_dict = "headers" if param.location == ParameterLocation.HEADER else "params"
                return f"_{kwarg_dict}.pop('{param.wire_name}', {declaration})"
            return declaration

        return [
            f"{p.client_name} = {_get_value(p)}"
            for p in (builder.parameters.headers + builder.parameters.query)
            if not p.in_method_signature
        ]

    @property
    def _function_def(self) -> str:
        return "def"

    @property
    def _need_self_param(self) -> bool:
        return False

    def response_docstring(self, builder: RequestBuilderType) -> List[str]:
        request_full_path = f"{self.code_model.core_library}.rest.HttpRequest"
        response_str = (
            f":return: Returns an :class:`~{request_full_path}` that you will pass to the client's "
            + "`send_request` method. See https://aka.ms/azsdk/dpcodegen/python/send_request for how to "
            + "incorporate this response into your code flow."
        )
        rtype_str = f":rtype: ~{request_full_path}"
        return [response_str, rtype_str]

    def pop_kwargs_from_signature(self, builder: RequestBuilderType) -> List[str]:
        return self.parameter_serializer.pop_kwargs_from_signature(
            builder.parameters.kwargs_to_pop,
            check_kwarg_dict=True,
            pop_headers_kwarg=(PopKwargType.CASE_INSENSITIVE if bool(builder.parameters.headers) else PopKwargType.NO),
            pop_params_kwarg=(PopKwargType.CASE_INSENSITIVE if bool(builder.parameters.query) else PopKwargType.NO),
        )

    @staticmethod
    def create_http_request(builder: RequestBuilderType) -> List[str]:
        retval = ["return HttpRequest("]
        retval.append(f'    method="{builder.method}",')
        retval.append("    url=_url,")
        if builder.parameters.query:
            retval.append("    params=_params,")
        if builder.parameters.headers:
            retval.append("    headers=_headers,")
        if builder.parameters.has_body and builder.parameters.body_parameter.in_method_signature:
            body_param = builder.parameters.body_parameter
            if body_param.constant or body_param.method_location != ParameterMethodLocation.KWARG:
                # we only need to pass it through if it's not a kwarg or it's a popped kwarg
                retval.append(
                    f"    {builder.parameters.body_parameter.client_name}="
                    f"{builder.parameters.body_parameter.client_name},"
                )
        retval.append("    **kwargs")
        retval.append(")")
        return retval

    def serialize_headers(self, builder: RequestBuilderType) -> List[str]:
        headers = [
            h
            for h in builder.parameters.headers
            if not builder.has_form_data_body or h.wire_name.lower() != "content-type"
        ]
        retval = ["# Construct headers"] if headers else []
        for header in headers:
            retval.extend(
                self.parameter_serializer.serialize_query_header(
                    header,
                    "headers",
                    self.serializer_name,
                    self.code_model.is_legacy,
                )
            )
        return retval

    def serialize_query(self, builder: RequestBuilderType) -> List[str]:
        retval = ["# Construct parameters"]
        for parameter in builder.parameters.query:
            retval.extend(
                self.parameter_serializer.serialize_query_header(
                    parameter,
                    "params",
                    self.serializer_name,
                    self.code_model.is_legacy,
                )
            )
        return retval

    def construct_url(self, builder: RequestBuilderType) -> str:
        if any(o for o in ["low_level_client", "version_tolerant"] if self.code_model.options.get(o)):
            url_value = _escape_str(builder.url)
        else:
            url_value = f'kwargs.pop("template_url", {_escape_str(builder.url)})'
        return f"_url = {url_value}{'  # pylint: disable=line-too-long' if len(url_value) > 114 else ''}"


############################## NORMAL OPERATIONS ##############################


class _OperationSerializer(_BuilderBaseSerializer[OperationType]):
    def description_and_summary(self, builder: OperationType) -> List[str]:
        retval = super().description_and_summary(builder)
        if builder.deprecated:
            retval.append(".. warning::")
            retval.append("    This method is deprecated")
            retval.append("")
        if builder.external_docs and builder.external_docs.get("url"):
            retval.append(".. seealso::")
            retval.append(f"   - {builder.external_docs['url']}")
            retval.append("")
        return retval

    @property
    def _json_response_template_name(self) -> str:
        return "response"

    def example_template(self, builder: OperationType) -> List[str]:
        if self.code_model.options["models_mode"] in ("msrest", "dpg"):
            return []
        retval = super().example_template(builder)
        for response in builder.responses:
            polymorphic_subtypes: List[ModelType] = []
            if not response.type:
                continue
            response.get_polymorphic_subtypes(polymorphic_subtypes)
            if polymorphic_subtypes:
                # we just assume one kind of polymorphic body for input
                discriminator_name = cast(Property, polymorphic_subtypes[0].discriminator).wire_name
                retval.append("")
                retval.append(
                    "# The response is polymorphic. The following are possible polymorphic "
                    f'responses based off discriminator "{discriminator_name}":'
                )
                for idx in range(
                    min(
                        self.code_model.options["polymorphic_examples"],
                        len(polymorphic_subtypes),
                    )
                ):
                    retval.extend(_get_polymorphic_subtype_template(polymorphic_subtypes[idx]))

        if _get_json_response_template_to_status_codes(builder):
            retval.append("")
            for (
                response_body,
                status_codes,
            ) in _get_json_response_template_to_status_codes(builder).items():
                retval.append("# response body for status code(s): {}".format(", ".join(status_codes)))
                retval.extend(f"{self._json_response_template_name} == {response_body}".splitlines())
        return retval

    def make_pipeline_call(self, builder: OperationType) -> List[str]:
        retval = []
        type_ignore = self.async_mode and builder.group_name == ""  # is in a mixin
        if builder.stream_value is True and not self.code_model.options["version_tolerant"]:
            retval.append("_decompress = kwargs.pop('decompress', True)")
        retval.extend(
            [
                f"_stream = {builder.stream_value}",
                f"pipeline_response: PipelineResponse = {self._call_method}self._client.{self.pipeline_name}.run(  "
                + f"{'# type: ignore' if type_ignore else ''} # pylint: disable=protected-access",
                "    _request,",
                "    stream=_stream,",
                "    **kwargs",
                ")",
            ]
        )
        return retval

    @property
    def _function_def(self) -> str:
        return "async def" if self.async_mode else "def"

    @property
    def _need_self_param(self) -> bool:
        return True

    @property
    def serializer_name(self) -> str:
        return "self._serialize"

    def decorators(self, builder: OperationType) -> List[str]:
        """Decorators for the method"""
        retval = super().decorators(builder)
        if self._api_version_validation(builder):
            retval.append(self._api_version_validation(builder))
        return retval

    def _api_version_validation(self, builder: OperationType) -> str:
        if builder.is_overload:
            return ""
        retval: List[str] = []
        if builder.added_on:
            retval.append(f'    method_added_on="{builder.added_on}",')
        params_added_on = defaultdict(list)
        for parameter in builder.parameters:
            if parameter.added_on:
                params_added_on[parameter.added_on].append(parameter.client_name)
        if params_added_on:
            retval.append(f"    params_added_on={dict(params_added_on)},")
        if retval:
            retval_str = "\n".join(retval)
            return f"@api_version_validation(\n{retval_str}\n){builder.pylint_disable(self.async_mode)}"
        return ""

    def pop_kwargs_from_signature(self, builder: OperationType) -> List[str]:
        kwargs_to_pop = builder.parameters.kwargs_to_pop
        kwargs = self.parameter_serializer.pop_kwargs_from_signature(
            kwargs_to_pop,
            check_kwarg_dict=True,
            pop_headers_kwarg=(
                PopKwargType.CASE_INSENSITIVE
                if builder.has_kwargs_to_pop_with_default(kwargs_to_pop, ParameterLocation.HEADER)  # type: ignore
                else PopKwargType.SIMPLE
            ),
            pop_params_kwarg=(
                PopKwargType.CASE_INSENSITIVE
                if builder.has_kwargs_to_pop_with_default(kwargs_to_pop, ParameterLocation.QUERY)  # type: ignore
                else PopKwargType.SIMPLE
            ),
            check_client_input=not self.code_model.options["multiapi"],
            operation_name=f"('{builder.name}')" if builder.group_name == "" else "",
        )
        for p in builder.parameters.parameters:
            if p.hide_in_operation_signature:
                kwargs.append(f'{p.client_name} = kwargs.pop("{p.client_name}", None)')
        cls_annotation = builder.cls_type_annotation(async_mode=self.async_mode)
        kwargs.append(f"cls: {cls_annotation} = kwargs.pop(\n    'cls', None\n)")
        return kwargs

    def response_docstring(self, builder: OperationType) -> List[str]:
        response_str = f":return: {builder.response_docstring_text(async_mode=self.async_mode)}"
        rtype_str = f":rtype: {builder.response_docstring_type(async_mode=self.async_mode)}"
        return [
            response_str,
            rtype_str,
            f":raises ~{self.code_model.core_library}.exceptions.HttpResponseError:",
        ]

    def _serialize_body_parameter(self, builder: OperationType) -> List[str]:
        """We need to serialize params if they're not meant to be streamed in.

        This function serializes the body params that need to be serialized.
        """
        retval: List[str] = []
        body_param = builder.parameters.body_parameter
        if body_param.is_form_data:
            model_type = cast(
                ModelType,
                (
                    body_param.type.target_model_subtype((JSONModelType, DPGModelType))
                    if isinstance(body_param.type, CombinedType)
                    else body_param.type
                ),
            )
            file_fields = [p.wire_name for p in model_type.properties if p.is_multipart_file_input]
            data_fields = [p.wire_name for p in model_type.properties if not p.is_multipart_file_input]
            retval.extend(
                [
                    "_body = (",
                    f"    {body_param.client_name}.as_dict()",
                    f"    if isinstance({body_param.client_name}, _model_base.Model) else",
                    f"    {body_param.client_name}",
                    ")",
                    f"_file_fields: List[str] = {file_fields}",
                    f"_data_fields: List[str] = {data_fields}",
                    "_files, _data = prepare_multipart_form_data(_body, _file_fields, _data_fields)",
                ]
            )
            return retval

        body_kwarg_name = builder.request_builder.parameters.body_parameter.client_name
        send_xml = builder.parameters.body_parameter.type.is_xml
        xml_serialization_ctxt = body_param.type.xml_serialization_ctxt if send_xml else None
        ser_ctxt_name = "serialization_ctxt"
        if xml_serialization_ctxt and self.code_model.options["models_mode"]:
            retval.append(f'{ser_ctxt_name} = {{"xml": {{{xml_serialization_ctxt}}}}}')
        if self.code_model.options["models_mode"] == "msrest":
            is_xml_cmd = _xml_config(send_xml, builder.parameters.body_parameter.content_types)
            serialization_ctxt_cmd = f", {ser_ctxt_name}={ser_ctxt_name}" if xml_serialization_ctxt else ""
            create_body_call = (
                f"_{body_kwarg_name} = self._serialize.body({body_param.client_name}, "
                f"'{body_param.type.serialization_type}'{is_xml_cmd}{serialization_ctxt_cmd})"
            )
        elif self.code_model.options["models_mode"] == "dpg":
            if json_serializable(body_param.default_content_type):
                if hasattr(body_param.type, "encode") and body_param.type.encode:  # type: ignore
                    create_body_call = (
                        f"_{body_kwarg_name} = json.dumps({body_param.client_name}, "
                        "cls=SdkJSONEncoder, exclude_readonly=True, "
                        f"format='{body_param.type.encode}')  # type: ignore"  # type: ignore
                    )
                else:
                    create_body_call = (
                        f"_{body_kwarg_name} = json.dumps({body_param.client_name}, "
                        "cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore"
                    )
            elif xml_serializable(body_param.default_content_type):
                create_body_call = f"_{body_kwarg_name} = _get_element({body_param.client_name})"
            else:
                create_body_call = f"_{body_kwarg_name} = {body_param.client_name}"
        else:
            create_body_call = f"_{body_kwarg_name} = {body_param.client_name}"
        if body_param.optional:
            retval.append(f"if {body_param.client_name} is not None:")
            retval.append("    " + create_body_call)
            retval.append("else:")
            retval.append(f"    _{body_kwarg_name} = None")
        else:
            retval.append(create_body_call)
        return retval

    def _create_body_parameter(
        self,
        builder: OperationType,
    ) -> List[str]:
        """Create the body parameter before we pass it as either json or content to the request builder"""
        retval = []
        body_param = builder.parameters.body_parameter
        if body_param.entries:
            return _serialize_multipart_body(builder)
        body_kwarg_name = builder.request_builder.parameters.body_parameter.client_name
        body_param_type = body_param.type
        if isinstance(body_param_type, BinaryType) or (
            isinstance(body_param.type, ByteArraySchema) and body_param.default_content_type != "application/json"
        ):
            retval.append(f"_{body_kwarg_name} = {body_param.client_name}")
            if (
                not body_param.default_content_type
                and not next(p for p in builder.parameters if p.wire_name.lower() == "content-type").optional
            ):
                content_types = "'" + "', '".join(body_param.content_types) + "'"
                retval.extend(
                    [
                        "if not content_type:",
                        f'    raise TypeError("Missing required keyword-only argument: content_type. '
                        f'Known values are:" + "{content_types}")',
                    ]
                )
        else:
            retval.extend(self._serialize_body_parameter(builder))
        return retval

    def _initialize_overloads(self, builder: OperationType, is_paging: bool = False) -> List[str]:
        retval: List[str] = []
        # For paging, we put body parameter in local place outside `prepare_request`
        if is_paging:
            return retval
        same_content_type = len(set(o.parameters.body_parameter.default_content_type for o in builder.overloads)) == 1
        if same_content_type:
            default_content_type = builder.overloads[0].parameters.body_parameter.default_content_type
            retval.append(f'content_type = content_type or "{default_content_type}"')
        client_names = [
            overload.request_builder.parameters.body_parameter.client_name for overload in builder.overloads
        ]
        for v in sorted(set(client_names), key=client_names.index):
            retval.append(f"_{v} = None")
        try:
            # if there is a binary overload, we do a binary check first.
            binary_overload = cast(
                OperationType,
                next((o for o in builder.overloads if isinstance(o.parameters.body_parameter.type, BinaryType))),
            )
            binary_body_param = binary_overload.parameters.body_parameter
            retval.append(f"if {binary_body_param.type.instance_check_template.format(binary_body_param.client_name)}:")
            if binary_body_param.default_content_type and not same_content_type:
                retval.append(f'    content_type = content_type or "{binary_body_param.default_content_type}"')
            retval.extend(f"    {l}" for l in self._create_body_parameter(binary_overload))
            retval.append("else:")
            other_overload = cast(
                OperationType,
                next((o for o in builder.overloads if not isinstance(o.parameters.body_parameter.type, BinaryType))),
            )
            retval.extend(f"    {l}" for l in self._create_body_parameter(other_overload))
            if other_overload.parameters.body_parameter.default_content_type and not same_content_type:
                retval.append(
                    "    content_type = content_type or "
                    f'"{other_overload.parameters.body_parameter.default_content_type}"'
                )
        except StopIteration:
            for idx, overload in enumerate(builder.overloads):
                if_statement = "if" if idx == 0 else "elif"
                body_param = overload.parameters.body_parameter
                retval.append(
                    f"{if_statement} {body_param.type.instance_check_template.format(body_param.client_name)}:"
                )
                if body_param.default_content_type and not same_content_type:
                    retval.append(f'    content_type = content_type or "{body_param.default_content_type}"')
                retval.extend(f"    {l}" for l in self._create_body_parameter(cast(OperationType, overload)))
        return retval

    def _create_request_builder_call(
        self,
        builder: OperationType,
        request_builder: RequestBuilderType,
        is_next_request: bool = False,
    ) -> List[str]:
        retval: List[str] = []
        if self.code_model.options["builders_visibility"] == "embedded":
            request_path_name = request_builder.name
        else:
            group_name = request_builder.group_name
            request_path_name = "rest{}.{}".format(
                ("_" + group_name) if group_name else "",
                request_builder.name,
            )
        retval.append(f"_request = {request_path_name}(")
        for parameter in request_builder.parameters.method:
            if parameter.location == ParameterLocation.BODY:
                # going to pass in body later based off of overloads
                continue
            if (
                is_next_request
                and builder.operation_type == "paging"
                and not bool(builder.next_request_builder)  # type: ignore
                and parameter.location == ParameterLocation.QUERY
            ):
                # if we don't want to reformat query parameters for next link calls
                # in paging operations with a single swagger operation defintion,
                # we skip passing query params when building the next request
                continue
            type_ignore = (
                parameter.grouped_by
                and parameter.client_default_value is not None
                and next(p for p in builder.parameters if p.grouper and p.client_name == parameter.grouped_by).optional
            )
            retval.append(
                f"    {parameter.client_name}={parameter.name_in_high_level_operation},"
                f"{'  # type: ignore' if type_ignore else ''}"
            )
        if builder.parameters.has_body and builder.parameters.body_parameter.entries:
            # this is for legacy
            client_name = builder.parameters.body_parameter.client_name
            retval.append(f"    {client_name}=_{client_name},")
        elif request_builder.has_form_data_body:
            retval.append("    files=_files,")
            retval.append("    data=_data,")
        elif request_builder.overloads:
            seen_body_params = set()
            for overload in request_builder.overloads:
                body_param = overload.parameters.body_parameter
                if body_param.client_name in seen_body_params:
                    continue
                seen_body_params.add(body_param.client_name)

                retval.append(f"    {body_param.client_name}={body_param.name_in_high_level_operation},")
        elif request_builder.parameters.has_body:
            body_param = request_builder.parameters.body_parameter
            retval.append(f"    {body_param.client_name}={body_param.name_in_high_level_operation},")
        retval.append("    headers=_headers,")
        retval.append("    params=_params,")
        retval.append(")")
        return retval

    def _postprocess_http_request(self, builder: OperationType, template_url: Optional[str] = None) -> List[str]:
        retval: List[str] = []
        if builder.parameters.path:
            retval.extend(self.serialize_path(builder))
        url_to_format = "_request.url"
        if self.code_model.options["version_tolerant"] and template_url:
            url_to_format = template_url
        retval.append(
            "_request.url = self._client.format_url({}{})".format(
                url_to_format,
                ", **path_format_arguments" if builder.parameters.path else "",
            )
        )
        return retval

    def _call_request_builder_helper(
        self,
        builder: OperationType,
        request_builder: RequestBuilderType,
        template_url: Optional[str] = None,
        is_next_request: bool = False,
        is_paging: bool = False,
    ) -> List[str]:
        retval = []
        if builder.parameters.grouped:
            # request builders don't allow grouped parameters, so we group them before making the call
            retval.extend(_serialize_grouped_body(builder))
        if builder.parameters.has_body and builder.parameters.body_parameter.flattened:
            # serialize flattened body before passing to request builder as well
            retval.extend(_serialize_flattened_body(builder.parameters.body_parameter))
        if is_json_model_type(builder.parameters):
            retval.extend(_serialize_json_model_body(builder.parameters.body_parameter, builder.parameters.parameters))
        if builder.has_form_data_body:
            retval.extend(self._create_body_parameter(builder))
        elif builder.overloads:
            # we are only dealing with two overloads. If there are three, we generate an abstract operation
            retval.extend(self._initialize_overloads(builder, is_paging=is_paging))
        elif builder.parameters.has_body:
            # non-overloaded body
            retval.extend(self._create_body_parameter(builder))
        retval.append("")
        retval.extend(self._create_request_builder_call(builder, request_builder, is_next_request))
        retval.extend(self._postprocess_http_request(builder, template_url))
        return retval

    def call_request_builder(self, builder: OperationType, is_paging: bool = False) -> List[str]:
        return self._call_request_builder_helper(builder, builder.request_builder, is_paging=is_paging)

    def response_headers_and_deserialization(
        self,
        builder: OperationType,
        response: Response,
    ) -> List[str]:
        return self.response_headers(response) + self.response_deserialization(builder, response)

    def response_headers(self, response: Response) -> List[str]:
        retval: List[str] = [
            (
                f"response_headers['{response_header.wire_name}']=self._deserialize("
                f"'{response_header.serialization_type}', response.headers.get('{response_header.wire_name}'))"
            )
            for response_header in response.headers
        ]
        if response.headers:
            retval.append("")
        return retval

    def response_deserialization(
        self,
        builder: OperationType,
        response: Response,
    ) -> List[str]:
        retval: List[str] = []
        deserialize_code: List[str] = []
        stream_logic = True
        if builder.has_stream_response:
            if isinstance(response.type, ByteArraySchema):
                deserialized = f"{'await ' if self.async_mode else ''}response.read()"
            else:
                stream_logic = False
                if self.code_model.options["version_tolerant"]:
                    deserialized = "response.iter_bytes()"
                else:
                    deserialized = (
                        f"response.stream_download(self._client.{self.pipeline_name}, decompress=_decompress)"
                    )
            deserialize_code.append(f"deserialized = {deserialized}")
        elif response.type:
            pylint_disable = ""
            if isinstance(response.type, ModelType) and response.type.internal:
                pylint_disable = "  # pylint: disable=protected-access"
            if self.code_model.options["models_mode"] == "msrest":
                deserialize_code.append("deserialized = self._deserialize(")
                deserialize_code.append(f"    '{response.serialization_type}',{pylint_disable}")
                deserialize_code.append(" pipeline_response.http_response")
                deserialize_code.append(")")
            elif self.code_model.options["models_mode"] == "dpg":
                if builder.has_stream_response:
                    deserialize_code.append("deserialized = response.content")
                else:
                    format_filed = (
                        f', format="{response.type.encode}"'
                        if isinstance(response.type, ByteArraySchema)
                        and response.default_content_type == "application/json"
                        else ""
                    )
                    response_attr = "json" if json_serializable(str(response.default_content_type)) else "text"
                    deserialize_func = "_deserialize"
                    if xml_serializable(str(response.default_content_type)):
                        deserialize_func = "_deserialize_xml"
                    deserialize_code.append(f"deserialized = {deserialize_func}(")
                    deserialize_code.append(
                        f"    {response.type.type_annotation(is_operation_file=True)},{pylint_disable}"
                    )
                    deserialize_code.append(f"    response.{response_attr}(){response.result_property}{format_filed}")
                    deserialize_code.append(")")

            else:
                deserialized_value = "ET.fromstring(response.text())" if response.type.is_xml else "response.json()"
                deserialize_code.append("if response.content:")
                deserialize_code.append(f"    deserialized = {deserialized_value}")
                deserialize_code.append("else:")
                deserialize_code.append("    deserialized = None")
        if len(deserialize_code) > 0:
            if builder.expose_stream_keyword and stream_logic:
                retval.append("if _stream:")
                retval.append("    deserialized = response.iter_bytes()")
                retval.append("else:")
                retval.extend([f"    {dc}" for dc in deserialize_code])
            else:
                retval.extend(deserialize_code)
        return retval

    def handle_error_response(self, builder: OperationType) -> List[str]:
        async_await = "await " if self.async_mode else ""
        retval = [f"if response.status_code not in {str(builder.success_status_codes)}:"]
        response_read = [
            "    try:",
            f"        {async_await}response.read()  # Load the body in memory and close the socket",
            "    except (StreamConsumedError, StreamClosedError):",
            "        pass",
        ]
        if builder.stream_value is True:  # _stream is True so no need to judge it
            retval.extend(response_read)
        elif isinstance(builder.stream_value, str):  # _stream is not sure, so we need to judge it
            retval.append("    if _stream:")
            retval.extend([f"    {l}" for l in response_read])
        type_ignore = "  # type: ignore" if _need_type_ignore(builder) else ""
        retval.append(
            f"    map_error(status_code=response.status_code, response=response, error_map=error_map){type_ignore}"
        )
        error_model = ""
        if builder.default_error_deserialization and self.code_model.options["models_mode"]:
            if self.code_model.options["models_mode"] == "dpg":
                retval.append(f"    error = _deserialize({builder.default_error_deserialization},  response.json())")
            else:
                retval.append(
                    f"    error = self._deserialize.failsafe_deserialize({builder.default_error_deserialization}, "
                    "pipeline_response)"
                )
            error_model = ", model=error"
        retval.append(
            "    raise HttpResponseError(response=response{}{})".format(
                error_model,
                (", error_format=ARMErrorFormat" if self.code_model.options["azure_arm"] else ""),
            )
        )
        return retval

    def handle_response(self, builder: OperationType) -> List[str]:
        retval: List[str] = ["response = pipeline_response.http_response"]
        retval.append("")
        retval.extend(self.handle_error_response(builder))
        retval.append("")
        if builder.has_optional_return_type:
            retval.append("deserialized = None")
        if builder.any_response_has_headers:
            retval.append("response_headers = {}")
        if builder.has_response_body or builder.any_response_has_headers:  # pylint: disable=too-many-nested-blocks
            if len(builder.responses) > 1:
                status_codes, res_headers, res_deserialization = [], [], []
                for status_code in builder.success_status_codes:
                    response = builder.get_response_from_status(status_code)
                    if response.headers or response.type:
                        status_codes.append(status_code)
                        res_headers.append(self.response_headers(response))
                        res_deserialization.append(self.response_deserialization(builder, response))

                is_headers_same = _all_same(res_headers)
                is_deserialization_same = _all_same(res_deserialization)
                if is_deserialization_same:
                    if is_headers_same:
                        retval.extend(res_headers[0])
                        retval.extend(res_deserialization[0])
                        retval.append("")
                    else:
                        for status_code, headers in zip(status_codes, res_headers):
                            if headers:
                                retval.append(f"if response.status_code == {status_code}:")
                                retval.extend([f"    {line}" for line in headers])
                                retval.append("")
                        retval.extend(res_deserialization[0])
                        retval.append("")
                else:
                    for status_code, headers, deserialization in zip(status_codes, res_headers, res_deserialization):
                        retval.append(f"if response.status_code == {status_code}:")
                        retval.extend([f"    {line}" for line in headers])
                        retval.extend([f"    {line}" for line in deserialization])
                        retval.append("")
            else:
                retval.extend(self.response_headers_and_deserialization(builder, builder.responses[0]))
                retval.append("")
        if builder.has_optional_return_type or self.code_model.options["models_mode"]:
            deserialized = "deserialized"
        else:
            deserialized = f"cast({builder.response_type_annotation(async_mode=self.async_mode)}, deserialized)"
        retval.append("if cls:")
        retval.append(
            "    return cls(pipeline_response, {}, {}){}".format(
                deserialized if builder.has_response_body else "None",
                "response_headers" if builder.any_response_has_headers else "{}",
                " # type: ignore",
            )
        )
        if builder.has_response_body and any(
            response.is_stream_response or response.type for response in builder.responses
        ):
            retval.append("")
            retval.append(f"return {deserialized}  # type: ignore")
        if builder.request_builder.method == "HEAD" and self.code_model.options["head_as_boolean"]:
            retval.append("return 200 <= response.status_code <= 299")
        return retval

    def error_map(self, builder: OperationType) -> List[str]:
        retval = ["error_map: MutableMapping = {"]
        if builder.non_default_errors:
            if not 401 in builder.non_default_error_status_codes:
                retval.append("    401: ClientAuthenticationError,")
            if not 404 in builder.non_default_error_status_codes:
                retval.append("    404: ResourceNotFoundError,")
            if not 409 in builder.non_default_error_status_codes:
                retval.append("    409: ResourceExistsError,")
            if not 304 in builder.non_default_error_status_codes:
                retval.append("    304: ResourceNotModifiedError,")
            for e in builder.non_default_errors:
                error_model_str = ""
                if isinstance(e.type, ModelType):
                    if self.code_model.options["models_mode"] == "msrest":
                        error_model_str = (
                            f", model=self._deserialize(" f"_models.{e.type.serialization_type}, response)"
                        )
                    elif self.code_model.options["models_mode"] == "dpg":
                        error_model_str = f", model=_deserialize(_models.{e.type.name}, response.json())"
                error_format_str = ", error_format=ARMErrorFormat" if self.code_model.options["azure_arm"] else ""
                for status_code in e.status_codes:
                    if status_code == 401:
                        retval.append(
                            "    401:  cast(Type[HttpResponseError], "
                            "lambda response: ClientAuthenticationError(response=response"
                            f"{error_model_str}{error_format_str})),"
                        )
                    elif status_code == 404:
                        retval.append(
                            "    404:  cast(Type[HttpResponseError], "
                            "lambda response: ResourceNotFoundError(response=response"
                            f"{error_model_str}{error_format_str})),"
                        )
                    elif status_code == 409:
                        retval.append(
                            "    409:  cast(Type[HttpResponseError], "
                            "lambda response: ResourceExistsError(response=response"
                            f"{error_model_str}{error_format_str})),"
                        )
                    elif status_code == 304:
                        retval.append(
                            "    304:  cast(Type[HttpResponseError], "
                            "lambda response: ResourceNotModifiedError(response=response"
                            f"{error_model_str}{error_format_str})),"
                        )
                    elif not error_model_str and not error_format_str:
                        retval.append(f"    {status_code}: HttpResponseError,")
                    else:
                        retval.append(
                            f"    {status_code}: cast(Type[HttpResponseError], "
                            "lambda response: HttpResponseError(response=response"
                            f"{error_model_str}{error_format_str})),"
                        )
        else:
            retval.append(
                "    401: ClientAuthenticationError, 404: ResourceNotFoundError, 409: ResourceExistsError, "
                "304: ResourceNotModifiedError"
            )
        retval.append("}")
        if builder.has_etag:
            retval.extend(
                [
                    "if match_condition == MatchConditions.IfNotModified:",
                    "    error_map[412] = ResourceModifiedError",
                    "elif match_condition == MatchConditions.IfPresent:",
                    "    error_map[412] = ResourceNotFoundError",
                    "elif match_condition == MatchConditions.IfMissing:",
                    "    error_map[412] = ResourceExistsError",
                ]
            )
        retval.append("error_map.update(kwargs.pop('error_map', {}) or {})")
        return retval

    @property
    def _call_method(self) -> str:
        return "await " if self.async_mode else ""


class OperationSerializer(_OperationSerializer[Operation]): ...


############################## PAGING OPERATIONS ##############################

PagingOperationType = TypeVar("PagingOperationType", bound=Union[PagingOperation, LROPagingOperation])


class _PagingOperationSerializer(_OperationSerializer[PagingOperationType]):
    def __init__(self, code_model: CodeModel, async_mode: bool) -> None:
        # for pylint reasons need to redefine init
        # probably because inheritance is going too deep
        super().__init__(code_model, async_mode)
        self.code_model = code_model
        self.async_mode = async_mode
        self.parameter_serializer = ParameterSerializer()

    def serialize_path(self, builder: PagingOperationType) -> List[str]:
        return self.parameter_serializer.serialize_path(builder.parameters.path, self.serializer_name)

    def decorators(self, builder: PagingOperationType) -> List[str]:
        """Decorators for the method"""
        retval: List[str] = []
        if builder.is_overload:
            return ["@overload"]
        if self.code_model.options["tracing"] and builder.want_tracing:
            retval.append("@distributed_trace")
        if self._api_version_validation(builder):
            retval.append(self._api_version_validation(builder))
        return retval

    def call_next_link_request_builder(self, builder: PagingOperationType) -> List[str]:
        if builder.next_request_builder:
            request_builder = builder.next_request_builder
            template_url = None
        else:
            request_builder = builder.request_builder
            template_url = "next_link"

        request_builder = builder.next_request_builder or builder.request_builder
        if builder.next_request_builder:
            return self._call_request_builder_helper(
                builder,
                request_builder,
                template_url=template_url,
                is_next_request=True,
            )
        retval: List[str] = []
        query_str = ""
        next_link_str = "next_link"
        try:
            api_version_param = next(
                p for p in builder.client.parameters if p.is_api_version and p.location == ParameterLocation.QUERY
            )
            retval.append("# make call to next link with the client's api-version")
            retval.append("_parsed_next_link = urllib.parse.urlparse(next_link)")
            retval.extend(
                [
                    "_next_request_params = case_insensitive_dict({",
                    "    key: [urllib.parse.quote(v) for v in value]"
                    "    for key, value in urllib.parse.parse_qs(_parsed_next_link.query).items()"
                    "})",
                ]
            )
            api_version = (
                "self._api_version"
                if self.code_model.options["multiapi"] and builder.group_name
                else api_version_param.full_client_name
            )
            retval.append(f'_next_request_params["api-version"] = {api_version}')
            query_str = ", params=_next_request_params"
            next_link_str = "urllib.parse.urljoin(next_link, _parsed_next_link.path)"
        except StopIteration:
            pass

        retval.append(f'_request = HttpRequest("GET", {next_link_str}{query_str})')
        retval.extend(self._postprocess_http_request(builder, "_request.url"))

        return retval

    def _prepare_request_callback(self, builder: PagingOperationType) -> List[str]:
        retval = self._initialize_overloads(builder)
        retval.append("def prepare_request(next_link=None):")
        retval.append("    if not next_link:")
        retval.extend([f"        {line}" for line in self.call_request_builder(builder, is_paging=True)])
        retval.append("")
        retval.append("    else:")
        retval.extend([f"        {line}" for line in self.call_next_link_request_builder(builder)])
        if not builder.next_request_builder and self.code_model.is_legacy:
            retval.append('        _request.method = "GET"')
        else:
            retval.append("")
        retval.append("    return _request")
        return retval

    @property
    def _function_def(self) -> str:
        return "def"

    def _extract_data_callback(self, builder: PagingOperationType) -> List[str]:
        retval = [f"{'async ' if self.async_mode else ''}def extract_data(pipeline_response):"]
        response = builder.responses[0]
        deserialized = "pipeline_response.http_response.json()"
        if self.code_model.options["models_mode"] == "msrest":
            suffix = ".http_response" if hasattr(builder, "initial_operation") else ""
            deserialize_type = response.serialization_type
            pylint_disable = "  # pylint: disable=protected-access"
            if isinstance(response.type, ModelType) and not response.type.internal:
                deserialize_type = f'"{response.serialization_type}"'
                pylint_disable = ""
            deserialized = (
                f"self._deserialize(\n    {deserialize_type},{pylint_disable}\n    pipeline_response{suffix}\n)"
            )
            retval.append(f"    deserialized = {deserialized}")
        elif self.code_model.options["models_mode"] == "dpg":
            # we don't want to generate paging models for DPG
            retval.append(f"    deserialized = {deserialized}")
        else:
            retval.append(f"    deserialized = {deserialized}")
        item_name = builder.item_name
        access = f".{item_name}" if self.code_model.options["models_mode"] == "msrest" else f'["{item_name}"]'
        list_of_elem_deserialized = ""
        if self.code_model.options["models_mode"] == "dpg":
            item_type = builder.item_type.type_annotation(is_operation_file=True)
            list_of_elem_deserialized = f"_deserialize({item_type}, deserialized{access})"
        else:
            list_of_elem_deserialized = f"deserialized{access}"
        retval.append(f"    list_of_elem = {list_of_elem_deserialized}")
        retval.append("    if cls:")
        retval.append("        list_of_elem = cls(list_of_elem) # type: ignore")

        continuation_token_name = builder.continuation_token_name
        if not continuation_token_name:
            cont_token_property = "None"
        elif self.code_model.options["models_mode"] == "msrest":
            cont_token_property = f"deserialized.{continuation_token_name} or None"
        else:
            cont_token_property = f'deserialized.get("{continuation_token_name}") or None'
        list_type = "AsyncList" if self.async_mode else "iter"
        retval.append(f"    return {cont_token_property}, {list_type}(list_of_elem)")
        return retval

    def _get_next_callback(self, builder: PagingOperationType) -> List[str]:
        retval = [f"{'async ' if self.async_mode else ''}def get_next(next_link=None):"]
        retval.append("    _request = prepare_request(next_link)")
        retval.append("")
        retval.extend([f"    {l}" for l in self.make_pipeline_call(builder)])
        retval.append("    response = pipeline_response.http_response")
        retval.append("")
        retval.extend([f"    {line}" for line in self.handle_error_response(builder)])
        retval.append("")
        retval.append("    return pipeline_response")
        return retval

    def set_up_params_for_pager(self, builder: PagingOperationType) -> List[str]:
        retval = []
        retval.extend(self.error_map(builder))
        retval.extend(self._prepare_request_callback(builder))
        retval.append("")
        retval.extend(self._extract_data_callback(builder))
        retval.append("")
        retval.extend(self._get_next_callback(builder))
        return retval


class PagingOperationSerializer(_PagingOperationSerializer[PagingOperation]): ...


############################## LRO OPERATIONS ##############################

LROOperationType = TypeVar("LROOperationType", bound=Union[LROOperation, LROPagingOperation])


class _LROOperationSerializer(_OperationSerializer[LROOperationType]):
    def __init__(self, code_model: CodeModel, async_mode: bool) -> None:
        # for pylint reasons need to redefine init
        # probably because inheritance is going too deep
        super().__init__(code_model, async_mode)
        self.code_model = code_model
        self.async_mode = async_mode
        self.parameter_serializer = ParameterSerializer()

    def serialize_path(self, builder: LROOperationType) -> List[str]:
        return self.parameter_serializer.serialize_path(builder.parameters.path, self.serializer_name)

    def initial_call(self, builder: LROOperationType) -> List[str]:
        retval = [
            f"polling: Union[bool, {builder.get_base_polling_method(self.async_mode)}] = kwargs.pop('polling', True)",
        ]
        retval.append("lro_delay = kwargs.pop(")
        retval.append("    'polling_interval',")
        retval.append("    self._config.polling_interval")
        retval.append(")")
        retval.append("cont_token: Optional[str] = kwargs.pop('continuation_token', None)")
        retval.append("if cont_token is None:")
        retval.append(
            f"    raw_result = {self._call_method}self.{builder.initial_operation.name}("
            f"{'' if any(rsp.type for rsp in builder.initial_operation.responses) else '  # type: ignore'}"
        )
        retval.extend(
            [f"        {parameter.client_name}={parameter.client_name}," for parameter in builder.parameters.method]
        )
        retval.append("        cls=lambda x,y,z: x,")
        retval.append("        headers=_headers,")
        retval.append("        params=_params,")
        retval.append("        **kwargs")
        retval.append("    )")
        retval.append(f"    {'await ' if self.async_mode else ''}raw_result.http_response.read() # type: ignore")

        retval.append("kwargs.pop('error_map', None)")
        return retval

    def return_lro_poller(self, builder: LROOperationType) -> List[str]:
        retval = []
        lro_options_str = (
            "lro_options={'final-state-via': '" + builder.lro_options["final-state-via"] + "'},"
            if builder.lro_options
            else ""
        )
        path_format_arguments_str = ""
        if builder.parameters.path:
            path_format_arguments_str = "path_format_arguments=path_format_arguments,"
            retval.extend(self.serialize_path(builder))
            retval.append("")
        retval.extend(
            [
                "if polling is True:",
                f"    polling_method: {builder.get_base_polling_method(self.async_mode)} "
                + f"= cast({builder.get_base_polling_method(self.async_mode)}, "
                f"{builder.get_polling_method(self.async_mode)}(",
                "        lro_delay,",
                f"        {lro_options_str}",
                f"        {path_format_arguments_str}",
                "        **kwargs",
                "))",
            ]
        )
        retval.append(
            f"elif polling is False: polling_method = cast({builder.get_base_polling_method(self.async_mode)}, "
            f"{builder.get_no_polling_method(self.async_mode)}())"
        )
        retval.append("else: polling_method = polling")
        retval.append("if cont_token:")
        retval.append(f"    return {builder.get_poller_with_response_type(self.async_mode)}.from_continuation_token(")
        retval.append("        polling_method=polling_method,")
        retval.append("        continuation_token=cont_token,")
        retval.append("        client=self._client,")
        retval.append("        deserialization_callback=get_long_running_output")
        retval.append("    )")
        retval.append(f"return {builder.get_poller_with_response_type(self.async_mode)}(")
        retval.append("    self._client, raw_result, get_long_running_output, polling_method  # type: ignore")
        retval.append("    )")
        return retval

    def get_long_running_output(self, builder: LROOperationType) -> List[str]:
        pylint_disable = ""
        if not builder.lro_response:
            pylint_disable = "  # pylint: disable=inconsistent-return-statements"
        retval = [f"def get_long_running_output(pipeline_response):{pylint_disable}"]
        if builder.lro_response:
            if builder.lro_response.headers:
                retval.append("    response_headers = {}")
            if (
                not self.code_model.options["models_mode"]
                or self.code_model.options["models_mode"] == "dpg"
                or builder.lro_response.headers
            ):
                retval.append("    response = pipeline_response.http_response")
            retval.extend(
                [f"    {line}" for line in self.response_headers_and_deserialization(builder, builder.lro_response)]
            )
        retval.append("    if cls:")
        retval.append(
            "        return cls(pipeline_response, {}, {}){}".format(
                ("deserialized" if builder.lro_response and builder.lro_response.type else "None"),
                ("response_headers" if builder.lro_response and builder.lro_response.headers else "{}"),
                " # type: ignore",
            )
        )
        if builder.lro_response and builder.lro_response.type:
            retval.append("    return deserialized")
        return retval


class LROOperationSerializer(_LROOperationSerializer[LROOperation]): ...


############################## LRO PAGING OPERATIONS ##############################


class LROPagingOperationSerializer(
    _LROOperationSerializer[LROPagingOperation],
    _PagingOperationSerializer[LROPagingOperation],
):
    @property
    def _call_method(self) -> str:
        return "await " if self.async_mode else ""

    @property
    def _function_def(self) -> str:
        return "async def" if self.async_mode else "def"

    def get_long_running_output(self, builder: LROPagingOperation) -> List[str]:
        retval = ["def get_long_running_output(pipeline_response):"]
        retval.append(f"    {self._function_def} internal_get_next(next_link=None):")
        retval.append("        if next_link is None:")
        retval.append("            return pipeline_response")
        retval.append(f"        return {self._call_method}get_next(next_link)")
        retval.append("")
        retval.append(f"    return {builder.get_pager(self.async_mode)}(")
        retval.append("        internal_get_next, extract_data")
        retval.append("    )")
        return retval

    def decorators(self, builder: LROPagingOperation) -> List[str]:
        """Decorators for the method"""
        return _LROOperationSerializer.decorators(self, builder)  # type: ignore


def get_operation_serializer(
    builder: Operation,
    code_model,
    async_mode: bool,
) -> Union[
    OperationSerializer,
    PagingOperationSerializer,
    LROOperationSerializer,
    LROPagingOperationSerializer,
]:
    ret_cls: Union[
        Type[OperationSerializer],
        Type[PagingOperationSerializer],
        Type[LROOperationSerializer],
        Type[LROPagingOperationSerializer],
    ] = OperationSerializer
    if builder.operation_type == "lropaging":
        ret_cls = LROPagingOperationSerializer
    elif builder.operation_type == "lro":
        ret_cls = LROOperationSerializer
    elif builder.operation_type == "paging":
        ret_cls = PagingOperationSerializer
    return ret_cls(code_model, async_mode)
