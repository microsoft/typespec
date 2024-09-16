# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Dict, Optional, List, TYPE_CHECKING, TypeVar, Union
from .imports import FileImport
from .operation import OperationBase, Operation
from .response import LROPagingResponse, LROResponse, Response
from .imports import ImportType, TypingSection
from .request_builder import RequestBuilder
from .parameter_list import ParameterList

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .client import Client
    from . import OperationType

LROResponseType = TypeVar("LROResponseType", bound=Union[LROResponse, LROPagingResponse])


class LROOperationBase(OperationBase[LROResponseType]):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
        name: str,
        request_builder: RequestBuilder,
        parameters: ParameterList,
        responses: List[LROResponseType],
        exceptions: List[Response],
        *,
        overloads: Optional[List[Operation]] = None,
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
        if not self.name.lstrip("_").startswith("begin"):
            self.name = ("_begin" if self.internal else "begin_") + self.name
        self.lro_options: Dict[str, Any] = self.yaml_data.get("lroOptions", {})
        self._initial_operation: Optional["OperationType"] = None

    @property
    def initial_operation(self) -> "OperationType":
        if not self._initial_operation:
            raise ValueError("You need to first call client.link_lro_initial_operations before accessing")
        return self._initial_operation

    @initial_operation.setter
    def initial_operation(self, val: "OperationType") -> None:
        self._initial_operation = val

    @property
    def operation_type(self) -> str:
        return "lro"

    @property
    def has_optional_return_type(self) -> bool:
        return False

    @property
    def lro_response(self) -> Optional[LROResponseType]:
        responses_with_bodies = [r for r in self.responses if r.type]
        num_response_schemas = {id(r.type.yaml_data) for r in responses_with_bodies if r.type}
        response = None
        if len(num_response_schemas) > 1:
            # choose the response that has a status code of 200
            try:
                response = next(r for r in responses_with_bodies if 200 in r.status_codes)
            except StopIteration as exc:
                raise ValueError(
                    "Your swagger is invalid because you have multiple response schemas for LRO"
                    + f" method {self.name} and none of them have a 200 status code."
                ) from exc

        elif num_response_schemas:
            response = responses_with_bodies[0]
        return response

    def response_type_annotation(self, **kwargs) -> str:
        lro_response = self.lro_response or next(iter(self.responses), None)
        if lro_response:
            return lro_response.type_annotation(**kwargs)
        return "None"

    def cls_type_annotation(self, *, async_mode: bool) -> str:
        """We don't want the poller to show up in ClsType, so we call super() on response type annotation"""
        return f"ClsType[{Response.type_annotation(self.responses[0], async_mode=async_mode)}]"

    def get_poller_with_response_type(self, async_mode: bool) -> str:
        return self.response_type_annotation(async_mode=async_mode)

    def get_poller(self, async_mode: bool) -> str:
        return self.responses[0].get_poller(async_mode)

    def get_polling_method(self, async_mode: bool) -> str:
        return self.responses[0].get_polling_method(async_mode)

    def get_base_polling_method(self, async_mode: bool) -> str:
        return self.responses[0].get_base_polling_method(async_mode)

    def get_base_polling_method_path(self, async_mode: bool) -> str:
        return self.responses[0].get_base_polling_method_path(async_mode)

    def get_no_polling_method(self, async_mode: bool) -> str:
        return self.responses[0].get_no_polling_method(async_mode)

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
        if (
            self.code_model.options["models_mode"] == "dpg"
            and self.lro_response
            and self.lro_response.type
            and self.lro_response.type.type == "model"
        ):
            # used in the case if initial operation returns none
            # but final call returns a model
            relative_path = "..." if async_mode else ".."
            file_import.add_submodule_import(f"{relative_path}_model_base", "_deserialize", ImportType.LOCAL)
        file_import.add_submodule_import("typing", "Union", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.add_submodule_import("typing", "cast", ImportType.STDLIB)
        return file_import


class LROOperation(LROOperationBase[LROResponse]): ...
