# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Dict, List, Any, Optional, Union, TYPE_CHECKING, cast, TypeVar

from .operation import Operation, OperationBase
from .response import PagingResponse, LROPagingResponse, Response
from .request_builder import (
    OverloadedRequestBuilder,
    RequestBuilder,
    get_request_builder,
)
from .imports import ImportType, FileImport, TypingSection
from .parameter_list import ParameterList
from .model_type import ModelType
from .list_type import ListType

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .client import Client

PagingResponseType = TypeVar("PagingResponseType", bound=Union[PagingResponse, LROPagingResponse])


class PagingOperationBase(OperationBase[PagingResponseType]):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
        name: str,
        request_builder: RequestBuilder,
        parameters: ParameterList,
        responses: List[PagingResponseType],
        exceptions: List[Response],
        *,
        overloads: Optional[List[Operation]] = None,
        override_success_response_to_200: bool = False,
    ) -> None:
        super().__init__(
            code_model=code_model,
            client=client,
            yaml_data=yaml_data,
            name=name,
            request_builder=request_builder,
            parameters=parameters,
            responses=responses,
            exceptions=exceptions,
            overloads=overloads,
        )
        self.next_request_builder: Optional[Union[RequestBuilder, OverloadedRequestBuilder]] = (
            get_request_builder(self.yaml_data["nextOperation"], code_model, client)
            if self.yaml_data.get("nextOperation")
            else None
        )
        self.override_success_response_to_200 = override_success_response_to_200
        self.pager_sync: str = yaml_data.get("pagerSync") or f"{self.code_model.core_library}.paging.ItemPaged"
        self.pager_async: str = yaml_data.get("pagerAsync") or f"{self.code_model.core_library}.paging.AsyncItemPaged"

    def _get_attr_name(self, wire_name: str) -> str:
        response_type = self.responses[0].type
        if not response_type:
            raise ValueError(f"Can't find a matching property in response for {wire_name}")
        if response_type.type == "list":
            response_type = cast(ListType, response_type).element_type
        try:
            return next(p.client_name for p in cast(ModelType, response_type).properties if p.wire_name == wire_name)
        except StopIteration as exc:
            raise ValueError(f"Can't find a matching property in response for {wire_name}") from exc

    def get_pager(self, async_mode: bool) -> str:
        return self.responses[0].get_pager(async_mode)

    @property
    def continuation_token_name(self) -> Optional[str]:
        wire_name = self.yaml_data.get("continuationTokenName")
        if not wire_name:
            # That's an ok scenario, it just means no next page possible
            return None
        if self.code_model.options["models_mode"] == "msrest":
            return self._get_attr_name(wire_name)
        return wire_name

    @property
    def item_name(self) -> str:
        wire_name = self.yaml_data["itemName"]
        if self.code_model.options["models_mode"] == "msrest":
            # we don't use the paging model for dpg
            return self._get_attr_name(wire_name)
        return wire_name

    @property
    def item_type(self) -> ModelType:
        try:
            item_type_yaml = self.yaml_data["itemType"]
        except KeyError as e:
            raise ValueError("Only call this for DPG paging model deserialization") from e
        return cast(ModelType, self.code_model.types_map[id(item_type_yaml)])

    @property
    def operation_type(self) -> str:
        return "paging"

    def cls_type_annotation(self, *, async_mode: bool) -> str:
        return f"ClsType[{Response.type_annotation(self.responses[0], async_mode=async_mode)}]"

    def _imports_shared(self, async_mode: bool, **kwargs: Any) -> FileImport:
        file_import = super()._imports_shared(async_mode, **kwargs)
        if async_mode:
            file_import.add_submodule_import("typing", "AsyncIterable", ImportType.STDLIB, TypingSection.CONDITIONAL)
        else:
            file_import.add_submodule_import("typing", "Iterable", ImportType.STDLIB, TypingSection.CONDITIONAL)
        if (
            self.next_request_builder
            and self.code_model.options["builders_visibility"] == "embedded"
            and not async_mode
        ):
            file_import.merge(self.next_request_builder.imports())
        return file_import

    @property
    def has_optional_return_type(self) -> bool:
        return False

    def imports(self, async_mode: bool, **kwargs: Any) -> FileImport:
        if self.abstract:
            return FileImport(self.code_model)
        file_import = self._imports_shared(async_mode, **kwargs)
        file_import.merge(super().imports(async_mode, **kwargs))
        if self.code_model.options["tracing"] and self.want_tracing:
            file_import.add_submodule_import(
                "azure.core.tracing.decorator",
                "distributed_trace",
                ImportType.SDKCORE,
            )
        if self.next_request_builder:
            file_import.merge(self.get_request_builder_import(self.next_request_builder, async_mode))
        elif any(p.is_api_version for p in self.client.parameters):
            file_import.add_import("urllib.parse", ImportType.STDLIB)
            file_import.add_submodule_import(
                "utils",
                "case_insensitive_dict",
                ImportType.SDKCORE,
            )
        if self.code_model.options["models_mode"] == "dpg":
            relative_path = "..." if async_mode else ".."
            file_import.merge(self.item_type.imports(**kwargs))
            if self.default_error_deserialization or any(r.type for r in self.responses):
                file_import.add_submodule_import(f"{relative_path}_model_base", "_deserialize", ImportType.LOCAL)
        return file_import


class PagingOperation(PagingOperationBase[PagingResponse]): ...
