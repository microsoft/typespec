# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Dict, Optional, List, Any, TYPE_CHECKING, Union

from .base import BaseModel
from .base import BaseType
from .imports import FileImport, ImportType, TypingSection
from .primitive_types import BinaryType, BinaryIteratorType, ByteArraySchema
from .dictionary_type import DictionaryType
from .list_type import ListType
from .model_type import ModelType
from .combined_type import CombinedType

if TYPE_CHECKING:
    from .code_model import CodeModel


class ResponseHeader(BaseModel):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        type: BaseType,
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.wire_name: str = yaml_data["wireName"]
        self.type = type

    @property
    def serialization_type(self) -> str:
        return self.type.serialization_type

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "ResponseHeader":
        from . import build_type

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            type=build_type(yaml_data["type"], code_model),
        )


class Response(BaseModel):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        *,
        headers: Optional[List[ResponseHeader]] = None,
        type: Optional[BaseType] = None,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.status_codes: List[Union[int, str]] = yaml_data["statusCodes"]
        self.headers = headers or []
        self.type = type
        self.nullable = yaml_data.get("nullable")
        self.default_content_type = yaml_data.get("defaultContentType")

    @property
    def result_property(self) -> str:
        field = self.yaml_data.get("resultProperty")
        if field:
            return f'.get("{field}")'
        return ""

    def get_polymorphic_subtypes(self, polymorphic_subtypes: List["ModelType"]) -> None:
        if self.type:
            self.type.get_polymorphic_subtypes(polymorphic_subtypes)

    def get_json_template_representation(self) -> Any:
        if not self.type:
            return None
        if not isinstance(self.type, (DictionaryType, ListType, ModelType)):
            return None
        return self.type.get_json_template_representation()

    @property
    def is_stream_response(self) -> bool:
        """Is the response expected to be streamable, like a download."""
        retval = isinstance(self.type, BinaryIteratorType) or (
            isinstance(self.type, ByteArraySchema)
            and bool(self.default_content_type)
            and self.default_content_type != "application/json"
        )
        return retval

    @property
    def serialization_type(self) -> str:
        if self.type:
            return self.type.serialization_type
        return "None"

    def type_annotation(self, **kwargs: Any) -> str:
        if self.type:
            kwargs["is_operation_file"] = True
            type_annotation = self.type.type_annotation(**kwargs)
            if self.nullable:
                return f"Optional[{type_annotation}]"
            return type_annotation
        return "None"

    def docstring_text(self, **kwargs: Any) -> str:
        if self.nullable and self.type:
            return f"{self.type.docstring_text(**kwargs)} or None"
        return self.type.docstring_text(**kwargs) if self.type else "None"

    def docstring_type(self, **kwargs: Any) -> str:
        if self.nullable and self.type:
            return f"{self.type.docstring_type(**kwargs)} or None"
        return self.type.docstring_type(**kwargs) if self.type else "None"

    def _imports_shared(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        if self.type:
            file_import.merge(self.type.imports(**kwargs))
        if self.nullable:
            file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB)
        if isinstance(self.type, CombinedType) and self.type.name:
            async_mode = kwargs.get("async_mode", False)
            file_import.add_submodule_import(
                "..." if async_mode else "..",
                "_types",
                ImportType.LOCAL,
                TypingSection.TYPING,
            )
        return file_import

    def imports(self, **kwargs: Any) -> FileImport:
        return self._imports_shared(**kwargs)

    def imports_for_multiapi(self, **kwargs: Any) -> FileImport:
        return self._imports_shared(**kwargs)

    def _get_import_type(self, input_path: str) -> ImportType:
        # helper function to return imports for responses based off
        # of whether we're importing from the core library, or users
        # are customizing responses
        return ImportType.SDKCORE if self.code_model.core_library.split(".")[0] in input_path else ImportType.THIRDPARTY

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "Response":
        type = code_model.lookup_type(id(yaml_data["type"])) if yaml_data.get("type") else None
        # use ByteIteratorType if we are returning a binary type
        default_content_type = yaml_data.get("defaultContentType", "application/json")
        if isinstance(type, BinaryType) or (
            isinstance(type, ByteArraySchema) and default_content_type != "application/json"
        ):
            type = BinaryIteratorType(type.yaml_data, type.code_model)
        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            headers=[ResponseHeader.from_yaml(header, code_model) for header in yaml_data["headers"]],
            type=type,
        )

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} {self.status_codes}>"


class PagingResponse(Response):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.item_type = self.code_model.lookup_type(id(self.yaml_data["itemType"]))
        self.pager_sync: str = self.yaml_data.get("pagerSync") or f"{self.code_model.core_library}.paging.ItemPaged"
        default_paging_submodule = f"{'async_' if self.code_model.is_azure_flavor else ''}paging"
        self.pager_async: str = (
            self.yaml_data.get("pagerAsync")
            or f"{self.code_model.core_library}.{default_paging_submodule}.AsyncItemPaged"
        )

    def get_polymorphic_subtypes(self, polymorphic_subtypes: List["ModelType"]) -> None:
        return self.item_type.get_polymorphic_subtypes(polymorphic_subtypes)

    def get_json_template_representation(self) -> Any:
        return self.item_type.get_json_template_representation()

    def get_pager_import_path(self, async_mode: bool) -> str:
        return ".".join(self.get_pager_path(async_mode).split(".")[:-1])

    def get_pager_path(self, async_mode: bool) -> str:
        return self.pager_async if async_mode else self.pager_sync

    def get_pager(self, async_mode: bool) -> str:
        return self.get_pager_path(async_mode).split(".")[-1]

    def type_annotation(self, **kwargs: Any) -> str:
        iterable = "AsyncIterable" if kwargs["async_mode"] else "Iterable"
        return f"{iterable}[{self.item_type.type_annotation(**kwargs)}]"

    def docstring_text(self, **kwargs: Any) -> str:
        base_description = "An iterator like instance of "
        if not self.code_model.options["version_tolerant"]:
            base_description += "either "
        return base_description + self.item_type.docstring_text(**kwargs)

    def docstring_type(self, **kwargs: Any) -> str:
        return f"~{self.get_pager_path(kwargs['async_mode'])}[{self.item_type.docstring_type(**kwargs)}]"

    def _imports_shared(self, **kwargs: Any) -> FileImport:
        file_import = super()._imports_shared(**kwargs)
        async_mode = kwargs.get("async_mode", False)
        pager = self.get_pager(async_mode)
        pager_path = self.get_pager_import_path(async_mode)

        file_import.add_submodule_import(pager_path, pager, self._get_import_type(pager_path))
        return file_import

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = self._imports_shared(**kwargs)
        async_mode = kwargs.get("async_mode")
        if async_mode:
            file_import.add_submodule_import(
                f"{'async_' if self.code_model.is_azure_flavor else ''}paging",
                "AsyncList",
                ImportType.SDKCORE,
            )

        return file_import

    def imports_for_multiapi(self, **kwargs: Any) -> FileImport:
        return self._imports_shared(**kwargs)


class LROResponse(Response):
    def get_poller_path(self, async_mode: bool) -> str:
        return self.yaml_data["pollerAsync"] if async_mode else self.yaml_data["pollerSync"]

    def get_poller(self, async_mode: bool) -> str:
        """Get the name of the poller. Default is LROPoller / AsyncLROPoller"""
        return self.get_poller_path(async_mode).split(".")[-1]

    def get_polling_method_path(self, async_mode: bool) -> str:
        """Get the full name of the poller path. Default are the azure core pollers"""
        return self.yaml_data["pollingMethodAsync"] if async_mode else self.yaml_data["pollingMethodSync"]

    def get_polling_method(self, async_mode: bool) -> str:
        """Get the default pollint method"""
        return self.get_polling_method_path(async_mode).split(".")[-1]

    @staticmethod
    def get_no_polling_method_path(async_mode: bool) -> str:
        """Get the path of the default of no polling method"""
        return f"azure.core.polling.{'Async' if async_mode else ''}NoPolling"

    def get_no_polling_method(self, async_mode: bool) -> str:
        """Get the default no polling method"""
        return self.get_no_polling_method_path(async_mode).split(".")[-1]

    @staticmethod
    def get_base_polling_method_path(async_mode: bool) -> str:
        """Get the base polling method path. Used in docstrings and type annotations."""
        return f"azure.core.polling.{'Async' if async_mode else ''}PollingMethod"

    def get_base_polling_method(self, async_mode: bool) -> str:
        """Get the base polling method."""
        return self.get_base_polling_method_path(async_mode).split(".")[-1]

    def type_annotation(self, **kwargs: Any) -> str:
        return f"{self.get_poller(kwargs.get('async_mode', False))}[{super().type_annotation(**kwargs)}]"

    def docstring_type(self, **kwargs: Any) -> str:
        return f"~{self.get_poller_path(kwargs.get('async_mode', False))}[{super().docstring_type(**kwargs)}]"

    def docstring_text(self, **kwargs) -> str:
        super_text = super().docstring_text(**kwargs)
        base_description = f"An instance of {self.get_poller(kwargs.get('async_mode', False))} that returns "
        if not self.code_model.options["version_tolerant"]:
            base_description += "either "
        return base_description + super_text

    def _imports_shared(self, **kwargs: Any) -> FileImport:
        file_import = super()._imports_shared(**kwargs)
        async_mode = kwargs["async_mode"]
        poller_import_path = ".".join(self.get_poller_path(async_mode).split(".")[:-1])
        poller = self.get_poller(async_mode)
        file_import.add_submodule_import(poller_import_path, poller, self._get_import_type(poller_import_path))
        return file_import

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = self._imports_shared(**kwargs)
        async_mode = kwargs["async_mode"]

        default_polling_method_import_path = ".".join(self.get_polling_method_path(async_mode).split(".")[:-1])
        default_polling_method = self.get_polling_method(async_mode)
        file_import.add_submodule_import(
            default_polling_method_import_path,
            default_polling_method,
            self._get_import_type(default_polling_method_import_path),
        )
        default_no_polling_method_import_path = ".".join(self.get_no_polling_method_path(async_mode).split(".")[:-1])
        default_no_polling_method = self.get_no_polling_method(async_mode)
        file_import.add_submodule_import(
            default_no_polling_method_import_path,
            default_no_polling_method,
            self._get_import_type(default_no_polling_method_import_path),
        )

        base_polling_method_import_path = ".".join(self.get_base_polling_method_path(async_mode).split(".")[:-1])
        base_polling_method = self.get_base_polling_method(async_mode)
        file_import.add_submodule_import(
            base_polling_method_import_path,
            base_polling_method,
            self._get_import_type(base_polling_method_import_path),
        )
        return file_import

    def imports_for_multiapi(self, **kwargs: Any) -> FileImport:
        return self._imports_shared(**kwargs)


class LROPagingResponse(LROResponse, PagingResponse):
    def type_annotation(self, **kwargs: Any) -> str:
        paging_type_annotation = PagingResponse.type_annotation(self, **kwargs)
        return f"{self.get_poller(kwargs.get('async_mode', False))}[{paging_type_annotation}]"

    def docstring_type(self, **kwargs: Any) -> str:
        paging_docstring_type = PagingResponse.docstring_type(self, **kwargs)
        return f"~{self.get_poller_path(kwargs.get('async_mode', False))}[{paging_docstring_type}]"

    def docstring_text(self, **kwargs) -> str:
        base_description = "An instance of LROPoller that returns an iterator like instance of "
        if not self.code_model.options["version_tolerant"]:
            base_description += "either "
        return base_description + Response.docstring_text(self)

    def imports_for_multiapi(self, **kwargs: Any) -> FileImport:
        file_import = LROResponse.imports_for_multiapi(self, **kwargs)
        file_import.merge(PagingResponse.imports_for_multiapi(self, **kwargs))
        return file_import

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = LROResponse.imports(self, **kwargs)
        file_import.merge(PagingResponse.imports(self, **kwargs))
        return file_import


def get_response(yaml_data: Dict[str, Any], code_model: "CodeModel") -> Response:
    if yaml_data["discriminator"] == "lropaging":
        return LROPagingResponse.from_yaml(yaml_data, code_model)
    if yaml_data["discriminator"] == "lro":
        return LROResponse.from_yaml(yaml_data, code_model)
    if yaml_data["discriminator"] == "paging":
        return PagingResponse.from_yaml(yaml_data, code_model)
    return Response.from_yaml(yaml_data, code_model)
