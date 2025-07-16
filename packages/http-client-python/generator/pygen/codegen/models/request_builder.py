# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import (
    Any,
    Callable,
    Dict,
    TypeVar,
    TYPE_CHECKING,
    Union,
    Optional,
    Sequence,
    cast,
)
from abc import abstractmethod

from .base_builder import BaseBuilder
from .utils import add_to_pylint_disable
from .parameter_list import (
    RequestBuilderParameterList,
    OverloadedRequestBuilderParameterList,
)
from .imports import FileImport, ImportType, TypingSection, MsrestImportType
from ...utils import NAME_LENGTH_LIMIT

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .client import Client

ParameterListType = TypeVar(
    "ParameterListType",
    bound=Union[RequestBuilderParameterList, OverloadedRequestBuilderParameterList],
)


class RequestBuilderBase(BaseBuilder[ParameterListType, Sequence["RequestBuilder"]]):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
        name: str,
        parameters: ParameterListType,
        *,
        overloads: Optional[Sequence["RequestBuilder"]] = None,
    ) -> None:
        super().__init__(
            code_model=code_model,
            client=client,
            yaml_data=yaml_data,
            name=name,
            parameters=parameters,
            overloads=overloads,
        )
        self.overloads: Sequence["RequestBuilder"] = overloads or []
        self.url: str = yaml_data["url"]
        self.method: str = yaml_data["method"]
        self.want_tracing = False

    @property
    def has_form_data_body(self):
        return self.parameters.has_form_data_body

    @property
    def is_lro(self) -> bool:
        return self.yaml_data.get("discriminator") in ("lro", "lropaging")

    def pylint_disable(self, async_mode: bool) -> str:
        if len(self.name) > NAME_LENGTH_LIMIT:
            return add_to_pylint_disable("", "name-too-long")
        return ""

    def response_type_annotation(self, **kwargs) -> str:
        return "HttpRequest"

    def response_docstring_text(self, **kwargs) -> str:
        return (
            f"Returns an :class:`~{self.response_docstring_type()}` that you will pass to the client's "
            + "`send_request` method. See https://aka.ms/azsdk/dpcodegen/python/send_request for how to "
            + "incorporate this response into your code flow."
        )

    def response_docstring_type(self, **kwargs) -> str:
        return f"~{self.code_model.core_library}.rest.HttpRequest"

    def imports(self, **kwargs) -> FileImport:
        file_import = FileImport(self.code_model)
        if self.abstract:
            return file_import
        for parameter in self.parameters.method:
            file_import.merge(parameter.imports(async_mode=False, **kwargs))

        file_import.add_submodule_import(
            "rest",
            "HttpRequest",
            ImportType.SDKCORE,
        )

        if self.parameters.headers or self.parameters.query:
            file_import.add_submodule_import(
                "utils",
                "case_insensitive_dict",
                ImportType.SDKCORE,
            )
        file_import.add_submodule_import("typing", "Any", ImportType.STDLIB, typing_section=TypingSection.CONDITIONAL)
        file_import.add_msrest_import(
            serialize_namespace=kwargs.get("serialize_namespace", self.code_model.namespace),
            msrest_import_type=MsrestImportType.Serializer,
            typing_section=TypingSection.REGULAR,
        )
        if self.overloads and self.code_model.options["builders-visibility"] != "embedded":
            file_import.add_submodule_import("typing", "overload", ImportType.STDLIB)
        return file_import

    @staticmethod
    @abstractmethod
    def parameter_list_type() -> Callable[[Dict[str, Any], "CodeModel"], ParameterListType]: ...

    @classmethod
    def get_name(
        cls,
        name: str,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
    ) -> str:
        additional_mark = ""
        if code_model.options["combine-operation-files"] and code_model.options["builders-visibility"] == "embedded":
            additional_mark = yaml_data["groupName"] or client.yaml_data["builderPadName"]
        names = [
            "build",
            additional_mark,
            name,
            "request",
        ]
        return "_".join([n for n in names if n])

    @classmethod
    def from_yaml(
        cls,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
    ):
        # when combine embedded builders into one operation file, we need to avoid duplicated build function name.
        # So add operation group name is effective method

        overloads = [
            cast(RequestBuilder, RequestBuilder.from_yaml(rb_yaml_data, code_model, client))
            for rb_yaml_data in yaml_data.get("overloads", [])
        ]
        parameter_list = cls.parameter_list_type()(yaml_data, code_model)

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            client=client,
            name=cls.get_name(yaml_data["name"], yaml_data, code_model, client),
            parameters=parameter_list,
            overloads=overloads,
        )


class RequestBuilder(RequestBuilderBase[RequestBuilderParameterList]):
    @staticmethod
    def parameter_list_type() -> Callable[[Dict[str, Any], "CodeModel"], RequestBuilderParameterList]:
        return RequestBuilderParameterList.from_yaml


class OverloadedRequestBuilder(RequestBuilderBase[OverloadedRequestBuilderParameterList]):
    @staticmethod
    def parameter_list_type() -> Callable[[Dict[str, Any], "CodeModel"], OverloadedRequestBuilderParameterList]:
        return OverloadedRequestBuilderParameterList.from_yaml


def get_request_builder(
    yaml_data: Dict[str, Any], code_model: "CodeModel", client: "Client"
) -> Union[RequestBuilder, OverloadedRequestBuilder]:
    if yaml_data.get("overloads"):
        return OverloadedRequestBuilder.from_yaml(yaml_data, code_model, client)
    return RequestBuilder.from_yaml(yaml_data, code_model, client)
