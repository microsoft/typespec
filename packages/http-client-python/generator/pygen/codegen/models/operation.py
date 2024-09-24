# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from itertools import chain
from typing import (
    Dict,
    List,
    Any,
    Optional,
    Union,
    TYPE_CHECKING,
    Generic,
    TypeVar,
    cast,
    Sequence,
)

from .request_builder_parameter import RequestBuilderParameter

from .utils import OrderedSet, add_to_pylint_disable
from .base_builder import BaseBuilder
from .imports import FileImport, ImportType, TypingSection
from .response import (
    Response,
    PagingResponse,
    LROResponse,
    LROPagingResponse,
    get_response,
)
from .parameter import (
    BodyParameter,
    Parameter,
    ParameterLocation,
)
from .parameter_list import ParameterList
from .model_type import ModelType
from .base import BaseType
from .request_builder import OverloadedRequestBuilder, RequestBuilder
from ...utils import xml_serializable, json_serializable, NAME_LENGTH_LIMIT

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .client import Client
    from . import OperationType

ResponseType = TypeVar(
    "ResponseType",
    bound=Union[Response, PagingResponse, LROResponse, LROPagingResponse],
)


def is_internal(target: Optional[BaseType]) -> bool:
    return isinstance(target, ModelType) and target.base == "dpg" and target.internal


class OperationBase(  # pylint: disable=too-many-public-methods,too-many-instance-attributes
    Generic[ResponseType], BaseBuilder[ParameterList, List["Operation"]]
):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
        name: str,
        request_builder: Union[RequestBuilder, OverloadedRequestBuilder],
        parameters: ParameterList,
        responses: List[ResponseType],
        exceptions: List[Response],
        *,
        overloads: Optional[List["Operation"]] = None,
    ) -> None:
        super().__init__(
            code_model=code_model,
            client=client,
            yaml_data=yaml_data,
            name=name,
            parameters=parameters,
            overloads=overloads,
        )
        self.overloads: List["Operation"] = overloads or []
        self.responses = responses
        self.request_builder = request_builder
        self.deprecated = False
        self.exceptions = exceptions
        self.is_lro_initial_operation: bool = self.yaml_data.get("isLroInitialOperation", False)
        self.include_documentation: bool = not self.is_lro_initial_operation
        self.internal: bool = self.yaml_data.get("internal", False)
        if self.internal:
            self.name = "_" + self.name
        self.has_etag: bool = self.yaml_data.get("hasEtag", False)
        self.cross_language_definition_id: Optional[str] = self.yaml_data.get("crossLanguageDefinitionId")

    @property
    def stream_value(self) -> Union[str, bool]:
        return (
            f'kwargs.pop("stream", {self.has_stream_response})'
            if self.expose_stream_keyword and self.has_response_body
            else self.has_stream_response
        )

    @property
    def has_form_data_body(self):
        return self.parameters.has_form_data_body

    @property
    def expose_stream_keyword(self) -> bool:
        return self.yaml_data.get("exposeStreamKeyword", False)

    @property
    def operation_type(self) -> str:
        return "operation"

    @property
    def has_optional_return_type(self) -> bool:
        """Has optional return type if there are multiple successful response types where some have
        bodies and some are None
        """
        # means if we have at least one successful response with a body and one without
        successful_response_with_body = any(r for r in self.responses if r.type)
        successful_response_without_body = any(r for r in self.responses if not r.type)
        return successful_response_with_body and successful_response_without_body

    def response_type_annotation(self, **kwargs) -> str:
        if self.code_model.options["head_as_boolean"] and self.request_builder.method.lower() == "head":
            return "bool"
        response_type_annotations: OrderedSet[str] = {
            response.type_annotation(**kwargs): None for response in self.responses if response.type
        }
        response_str = ", ".join(response_type_annotations.keys())
        if len(response_type_annotations) > 1:
            return f"Union[{response_str}]"
        if self.has_optional_return_type:
            return f"Optional[{response_str}]"
        if self.responses:
            return self.responses[0].type_annotation(**kwargs)
        return "None"

    def pylint_disable(self, async_mode: bool) -> str:
        retval: str = ""
        if not async_mode and not self.is_overload and self.response_type_annotation(async_mode=False) == "None":
            # doesn't matter if it's async or not
            retval = add_to_pylint_disable(retval, "inconsistent-return-statements")
        try:
            if any(is_internal(r.type) for r in self.responses) or is_internal(self.parameters.body_parameter.type):
                retval = add_to_pylint_disable(retval, "protected-access")
        except ValueError:
            pass
        if len(self.name) > NAME_LENGTH_LIMIT:
            retval = add_to_pylint_disable(retval, "name-too-long")
        return retval

    def cls_type_annotation(self, *, async_mode: bool) -> str:
        if self.request_builder.method.lower() == "head" and self.code_model.options["head_as_boolean"]:
            return "ClsType[None]"
        return f"ClsType[{self.response_type_annotation(async_mode=async_mode)}]"

    def _response_docstring_helper(self, attr_name: str, **kwargs: Any) -> str:
        responses_with_body = [r for r in self.responses if r.type]
        if self.request_builder.method.lower() == "head" and self.code_model.options["head_as_boolean"]:
            return "bool"
        if responses_with_body:
            response_docstring_values: OrderedSet[str] = {
                getattr(response, attr_name)(**kwargs): None for response in responses_with_body
            }
            retval = " or ".join(response_docstring_values.keys())
            if self.has_optional_return_type:
                retval += " or None"
            return retval
        if self.responses:
            return getattr(self.responses[0], attr_name)(**kwargs)
        return "None"

    def response_docstring_text(self, **kwargs) -> str:
        retval = self._response_docstring_helper("docstring_text", **kwargs)
        if not self.code_model.options["version_tolerant"]:
            retval += " or the result of cls(response)"
        if self.code_model.options["models_mode"] == "dpg" and any(
            isinstance(r.type, ModelType) for r in self.responses
        ):
            r = next(r for r in self.responses if isinstance(r.type, ModelType))
            item_type = getattr(r, "item_type", getattr(r, "type"))
            if item_type:
                type_name = item_type.docstring_text(**kwargs)
                retval += f". The {type_name} is compatible with MutableMapping"
        return retval

    def response_docstring_type(self, **kwargs) -> str:
        return self._response_docstring_helper("docstring_type", **kwargs)

    @property
    def has_response_body(self) -> bool:
        """Tell if at least one response has a body."""
        return any(response.type for response in self.responses)

    @property
    def any_response_has_headers(self) -> bool:
        return any(response.headers for response in self.responses)

    @property
    def default_error_deserialization(self) -> Optional[str]:
        default_exceptions = [e for e in self.exceptions if "default" in e.status_codes and e.type]
        if not default_exceptions:
            return None
        exception_schema = default_exceptions[0].type
        if isinstance(exception_schema, ModelType):
            return exception_schema.type_annotation(skip_quote=True)
        # in this case, it's just an AnyType
        return "'object'"

    @property
    def non_default_errors(self) -> List[Response]:
        return [e for e in self.exceptions if "default" not in e.status_codes]

    @property
    def non_default_error_status_codes(self) -> List[Union[str, int]]:
        """Actually returns all of the status codes from exceptions (besides default)"""
        return list(chain.from_iterable([error.status_codes for error in self.non_default_errors]))

    def _imports_shared(self, async_mode: bool, **kwargs: Any) -> FileImport:  # pylint: disable=unused-argument
        file_import = FileImport(self.code_model)
        file_import.add_submodule_import("typing", "Any", ImportType.STDLIB, TypingSection.CONDITIONAL)

        response_types = [r.type_annotation(async_mode=async_mode, operation=self) for r in self.responses if r.type]
        if len(set(response_types)) > 1:
            file_import.add_submodule_import("typing", "Union", ImportType.STDLIB, TypingSection.CONDITIONAL)
        if self.added_on:
            file_import.add_submodule_import(
                f"{'.' if async_mode else ''}.._validation",
                "api_version_validation",
                ImportType.LOCAL,
            )
        return file_import

    def imports_for_multiapi(self, async_mode: bool, **kwargs: Any) -> FileImport:
        if self.abstract:
            return FileImport(self.code_model)
        file_import = self._imports_shared(async_mode, **kwargs)
        for param in self.parameters.method:
            file_import.merge(
                param.imports_for_multiapi(
                    async_mode,
                    operation=self,
                    **kwargs,
                )
            )
        for response in self.responses:
            file_import.merge(response.imports_for_multiapi(async_mode=async_mode, operation=self, **kwargs))
        if self.code_model.options["models_mode"]:
            for exception in self.exceptions:
                file_import.merge(exception.imports_for_multiapi(async_mode=async_mode, operation=self, **kwargs))
        return file_import

    @staticmethod
    def has_kwargs_to_pop_with_default(
        kwargs_to_pop: List[
            Union[
                Parameter,
                RequestBuilderParameter,
                BodyParameter,
            ]
        ],
        location: ParameterLocation,
    ) -> bool:
        return any(
            (kwarg.client_default_value or kwarg.optional) and kwarg.location == location for kwarg in kwargs_to_pop
        )

    @property
    def need_validation(self) -> bool:
        """Whether we need parameter / operation validation. For API version."""
        return bool(self.added_on) or any(p for p in self.parameters if p.added_on)

    def get_request_builder_import(
        self,
        request_builder: Union[RequestBuilder, OverloadedRequestBuilder],
        async_mode: bool,
    ) -> FileImport:
        """Helper method to get a request builder import."""
        file_import = FileImport(self.code_model)
        if self.code_model.options["builders_visibility"] != "embedded":
            group_name = request_builder.group_name
            rest_import_path = "..." if async_mode else ".."
            if group_name:
                file_import.add_submodule_import(
                    f"{rest_import_path}{self.code_model.rest_layer_name}",
                    group_name,
                    import_type=ImportType.LOCAL,
                    alias=f"rest_{group_name}",
                )
            else:
                file_import.add_submodule_import(
                    rest_import_path,
                    self.code_model.rest_layer_name,
                    import_type=ImportType.LOCAL,
                    alias="rest",
                )
        if self.code_model.options["builders_visibility"] == "embedded" and async_mode:
            file_import.add_submodule_import(
                f"...{self.code_model.operations_folder_name}.{self.filename}",
                request_builder.name,
                import_type=ImportType.LOCAL,
            )
        return file_import

    def imports(  # pylint: disable=too-many-branches, disable=too-many-statements
        self, async_mode: bool, **kwargs: Any
    ) -> FileImport:
        if self.abstract:
            return FileImport(self.code_model)
        file_import = self._imports_shared(async_mode, **kwargs)

        for param in self.parameters.method:
            file_import.merge(
                param.imports(
                    async_mode,
                    operation=self,
                    **kwargs,
                )
            )
        for response in self.responses:
            file_import.merge(response.imports(async_mode=async_mode, operation=self, **kwargs))
        if self.code_model.options["models_mode"]:
            for exception in self.exceptions:
                file_import.merge(exception.imports(async_mode=async_mode, **kwargs))

        if self.parameters.has_body and self.parameters.body_parameter.flattened:
            file_import.merge(self.parameters.body_parameter.type.imports(operation=self, **kwargs))
        if not async_mode:
            for param in self.parameters.headers:
                if param.wire_name.lower() == "repeatability-request-id":
                    file_import.add_import("uuid", ImportType.STDLIB)
                elif param.wire_name.lower() == "repeatability-first-sent":
                    file_import.add_import("datetime", ImportType.STDLIB)

        # Exceptions
        errors = [
            "map_error",
            "HttpResponseError",
            "ClientAuthenticationError",
            "ResourceNotFoundError",
            "ResourceExistsError",
            "ResourceNotModifiedError",
        ]
        if self.stream_value:
            errors.extend(["StreamConsumedError", "StreamClosedError"])
        for error in errors:
            file_import.add_submodule_import("exceptions", error, ImportType.SDKCORE)
        if self.code_model.options["azure_arm"]:
            file_import.add_submodule_import("azure.mgmt.core.exceptions", "ARMErrorFormat", ImportType.SDKCORE)
        if self.non_default_errors:
            file_import.add_submodule_import(
                "typing",
                "Type",
                ImportType.STDLIB,
            )
        file_import.add_mutable_mapping_import()
        if self.non_default_error_status_codes:
            file_import.add_submodule_import(
                "typing",
                "cast",
                ImportType.STDLIB,
            )

        if self.has_kwargs_to_pop_with_default(
            self.parameters.kwargs_to_pop, ParameterLocation.HEADER  # type: ignore
        ) or self.has_kwargs_to_pop_with_default(
            self.parameters.kwargs_to_pop, ParameterLocation.QUERY  # type: ignore
        ):
            file_import.add_submodule_import(
                "utils",
                "case_insensitive_dict",
                ImportType.SDKCORE,
            )
        if self.deprecated:
            file_import.add_import("warnings", ImportType.STDLIB)

        relative_path = "..." if async_mode else ".."
        if self.has_etag:
            file_import.add_submodule_import(
                "exceptions",
                "ResourceModifiedError",
                ImportType.SDKCORE,
            )
            if not async_mode:
                file_import.add_submodule_import(f"{relative_path}_vendor", "prep_if_match", ImportType.LOCAL)
                file_import.add_submodule_import(f"{relative_path}_vendor", "prep_if_none_match", ImportType.LOCAL)
        if async_mode:
            file_import.add_submodule_import(
                "rest",
                "AsyncHttpResponse",
                ImportType.SDKCORE,
            )
        else:
            file_import.add_submodule_import(
                "rest",
                "HttpResponse",
                ImportType.SDKCORE,
            )
        if self.code_model.options["builders_visibility"] == "embedded" and not async_mode:
            file_import.merge(self.request_builder.imports())
        file_import.add_submodule_import(
            f"{'' if self.code_model.is_azure_flavor else 'runtime.'}pipeline",
            "PipelineResponse",
            ImportType.SDKCORE,
        )
        file_import.add_submodule_import("rest", "HttpRequest", ImportType.SDKCORE)
        file_import.add_submodule_import("typing", "Callable", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.add_submodule_import("typing", "Dict", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.add_submodule_import("typing", "TypeVar", ImportType.STDLIB, TypingSection.CONDITIONAL)
        if self.code_model.options["tracing"] and self.want_tracing and not async_mode:
            file_import.add_submodule_import(
                "azure.core.tracing.decorator",
                "distributed_trace",
                ImportType.SDKCORE,
            )
        file_import.merge(self.get_request_builder_import(self.request_builder, async_mode))
        if self.overloads:
            file_import.add_submodule_import("typing", "overload", ImportType.STDLIB)
        if self.code_model.options["models_mode"] == "dpg":
            if self.parameters.has_body:
                if self.has_form_data_body:
                    file_import.add_submodule_import(relative_path, "_model_base", ImportType.LOCAL)
                elif xml_serializable(self.parameters.body_parameter.default_content_type):
                    file_import.add_submodule_import(
                        f"{relative_path}_model_base",
                        "_get_element",
                        ImportType.LOCAL,
                    )
                elif json_serializable(self.parameters.body_parameter.default_content_type):
                    file_import.add_submodule_import(
                        f"{relative_path}_model_base",
                        "SdkJSONEncoder",
                        ImportType.LOCAL,
                    )
                    file_import.add_import("json", ImportType.STDLIB)
            if any(xml_serializable(str(r.default_content_type)) for r in self.responses):
                file_import.add_submodule_import(f"{relative_path}_model_base", "_deserialize_xml", ImportType.LOCAL)
            elif any(r.type for r in self.responses):
                file_import.add_submodule_import(f"{relative_path}_model_base", "_deserialize", ImportType.LOCAL)
            if self.default_error_deserialization or self.non_default_errors:
                file_import.add_submodule_import(f"{relative_path}_model_base", "_deserialize", ImportType.LOCAL)
        return file_import

    def get_response_from_status(self, status_code: Optional[Union[str, int]]) -> ResponseType:
        try:
            return next(r for r in self.responses if status_code in r.status_codes)
        except StopIteration as exc:
            raise ValueError(f"Incorrect status code {status_code}, operation {self.name}") from exc

    @property
    def success_status_codes(self) -> Sequence[Union[str, int]]:
        """The list of all successfull status code."""
        return sorted([code for response in self.responses for code in response.status_codes])

    @property
    def filename(self) -> str:
        basename = self.group_name
        if basename == "":
            # in a mixin
            basename = self.code_model.clients[0].legacy_filename

        if basename == "operations" or self.code_model.options["combine_operation_files"]:
            return "_operations"
        return f"_{basename}_operations"

    @property
    def has_stream_response(self) -> bool:
        return any(r.is_stream_response for r in self.responses)

    @classmethod
    def get_request_builder(cls, yaml_data: Dict[str, Any], client: "Client"):
        return client.lookup_request_builder(id(yaml_data))

    @classmethod
    def from_yaml(
        cls,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
    ):
        name = yaml_data["name"]
        request_builder = cls.get_request_builder(yaml_data, client)
        responses = [cast(ResponseType, get_response(r, code_model)) for r in yaml_data["responses"]]
        exceptions = [Response.from_yaml(e, code_model) for e in yaml_data["exceptions"]]
        parameter_list = ParameterList.from_yaml(yaml_data, code_model)
        overloads = [cls.from_yaml(overload, code_model, client) for overload in yaml_data.get("overloads", [])]

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            client=client,
            request_builder=request_builder,
            name=name,
            parameters=parameter_list,
            overloads=overloads,
            responses=responses,
            exceptions=exceptions,
        )


class Operation(OperationBase[Response]):
    def imports(self, async_mode: bool, **kwargs: Any) -> FileImport:
        file_import = super().imports(async_mode, **kwargs)
        if self.abstract:
            return file_import
        if async_mode and self.code_model.options["tracing"] and self.want_tracing:
            file_import.add_submodule_import(
                "azure.core.tracing.decorator_async",
                "distributed_trace_async",
                ImportType.SDKCORE,
            )
        if self.has_response_body and not self.has_optional_return_type and not self.code_model.options["models_mode"]:
            file_import.add_submodule_import("typing", "cast", ImportType.STDLIB)

        return file_import


def get_operation(yaml_data: Dict[str, Any], code_model: "CodeModel", client: "Client") -> "OperationType":
    if yaml_data["discriminator"] == "lropaging":
        from .lro_paging_operation import LROPagingOperation as OperationCls
    elif yaml_data["discriminator"] == "lro":
        from .lro_operation import LROOperation as OperationCls  # type: ignore
    elif yaml_data["discriminator"] == "paging":
        from .paging_operation import PagingOperation as OperationCls  # type: ignore
    else:
        from . import Operation as OperationCls  # type: ignore
    return OperationCls.from_yaml(yaml_data, code_model, client)
