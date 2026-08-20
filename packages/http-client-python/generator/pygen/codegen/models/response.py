# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional, Any, TYPE_CHECKING, Union

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
        yaml_data: dict[str, Any],
        code_model: "CodeModel",
        type: BaseType,
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.wire_name: str = yaml_data["wireName"]
        self.type = type

    def serialization_type(self, **kwargs: Any) -> str:
        return self.type.serialization_type(**kwargs)

    @classmethod
    def from_yaml(cls, yaml_data: dict[str, Any], code_model: "CodeModel") -> "ResponseHeader":
        from . import build_type

        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            type=build_type(yaml_data["type"], code_model),
        )


class Response(BaseModel):
    def __init__(
        self,
        yaml_data: dict[str, Any],
        code_model: "CodeModel",
        *,
        headers: Optional[list[ResponseHeader]] = None,
        type: Optional[BaseType] = None,
    ) -> None:
        super().__init__(yaml_data=yaml_data, code_model=code_model)
        self.status_codes: list[Union[int, str, list[int]]] = yaml_data["statusCodes"]
        self.headers = headers or []
        self.type = type
        self.nullable = yaml_data.get("nullable")
        self.default_content_type = yaml_data.get("defaultContentType")
        streaming = yaml_data.get("streaming")
        self.streaming_kind: Optional[str] = streaming["kind"] if streaming else None
        self.streaming_events: list[tuple[Optional[str], BaseType]] = []
        self._streaming_terminal_event: Optional[str] = streaming.get("terminalEvent") if streaming else None
        # Named / model ``@terminalEvent`` events: deserialized and yielded like any other event,
        # then iteration stops. The bare string-constant sentinel (``_streaming_terminal_event``)
        # stops WITHOUT yielding and is matched on event ``data`` instead of the event name.
        self.terminal_event_names: list[str] = []
        if streaming:
            self.streaming_events = [
                (event.get("eventType"), self.code_model.lookup_type(id(event["itemType"])))
                for event in streaming.get("events", [])
            ]
            self.terminal_event_names = [
                event["eventType"]
                for event in streaming.get("events", [])
                if event.get("isTerminal") and event.get("eventType") is not None
            ]

    @property
    def result_property(self) -> str:
        field = self.yaml_data.get("resultProperty")
        if field:
            return "".join([f'.get("{field}", {{}})' for field in field.split(".")])
        return ""

    def get_polymorphic_subtypes(self, polymorphic_subtypes: list["ModelType"]) -> None:
        if self.type:
            if isinstance(self.type, CombinedType):
                target = self.type.target_model_subtype((ModelType,))
                if target:
                    target.get_polymorphic_subtypes(polymorphic_subtypes)
            else:
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
    def is_structured_stream(self) -> bool:
        """Is the response a structured (JSONL / SSE) stream rendered as Stream[T] / AsyncStream[T]."""
        return self.streaming_kind is not None

    @property
    def terminal_event(self) -> Optional[str]:
        """Terminal event marker for a heterogeneous SSE stream, if any.

        TCGC ``sseMetadata`` supplies this marker directly. For compatibility with
        older metadata, a string-literal member of the item union is used as a fallback.
        """
        if self.streaming_kind != "sse":
            return None
        if self._streaming_terminal_event is not None:
            return self._streaming_terminal_event
        if not isinstance(self.type, CombinedType):
            return None
        from .constant_type import ConstantType

        for member in self.type.types:
            if isinstance(member, ConstantType) and isinstance(member.value, str):
                return member.value
        return None

    def stream_class_name(self, async_mode: bool) -> str:
        return "AsyncStream" if async_mode else "Stream"

    @property
    def stream_item_type(self) -> Optional[BaseType]:
        if len(self.streaming_events) == 1:
            return self.streaming_events[0][1]
        return self.type

    def serialization_type(self, **kwargs: Any) -> str:
        if self.type:
            return self.type.serialization_type(**kwargs)
        return "None"

    def stream_item_annotation(self, **kwargs: Any) -> str:
        """Valid type expression for a structured stream's item type.

        A named ``CombinedType`` (``@events`` union) renders its ``type_annotation`` as the
        ``_unions.<Name>`` alias, which is a module-level variable and therefore rejected by
        pyright/mypy inside ``Stream[...]`` ("Variable not allowed in type expression"). Expand
        the union inline (``Union[Model, ...]`` / the single member) so the annotation is a
        valid type expression.
        """
        item_type = self.stream_item_type
        if isinstance(item_type, CombinedType):
            return item_type.type_definition(**kwargs)
        return item_type.type_annotation(**kwargs) if item_type else "None"

    def type_annotation(self, **kwargs: Any) -> str:
        if self.is_structured_stream and self.type:
            kwargs["is_operation_file"] = True
            kwargs["is_response"] = True
            stream_class = self.stream_class_name(kwargs.get("async_mode", False))
            return f"{stream_class}[{self.stream_item_annotation(**kwargs)}]"
        if self.type:
            kwargs["is_operation_file"] = True
            kwargs["is_response"] = True
            type_annotation = self.type.type_annotation(**kwargs)
            if self.nullable:
                return f"Optional[{type_annotation}]"
            return type_annotation
        return "None"

    def docstring_text(self, **kwargs: Any) -> str:
        kwargs["is_response"] = True
        if self.is_structured_stream and self.type:
            stream_class = self.stream_class_name(kwargs.get("async_mode", False))
            item_type = self.stream_item_type or self.type
            return f"An instance of {stream_class} that iterates over {item_type.docstring_text(**kwargs)}"
        if self.nullable and self.type:
            return f"{self.type.docstring_text(**kwargs)} or None"
        return self.type.docstring_text(**kwargs) if self.type else "None"

    def docstring_type(self, **kwargs: Any) -> str:
        kwargs["is_response"] = True
        if self.is_structured_stream and self.type:
            stream_class = self.stream_class_name(kwargs.get("async_mode", False))
            item_type = (self.stream_item_type or self.type).docstring_type(**kwargs)
            return f"~{self.code_model.namespace}.{stream_class}[{item_type}]"
        if self.nullable and self.type:
            return f"{self.type.docstring_type(**kwargs)} or None"
        return self.type.docstring_type(**kwargs) if self.type else "None"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        item_type = self.stream_item_type if self.is_structured_stream else self.type
        # For a structured stream whose item type is a named ``@events`` union, the annotation
        # is expanded inline (see ``stream_item_annotation``), so import the union member types
        # rather than the ``_unions`` alias.
        if self.is_structured_stream and isinstance(item_type, CombinedType):
            for member in item_type.types:
                file_import.merge(member.imports(**kwargs))
            # ``Union`` is only needed when the inline expansion actually yields a union of
            # 2+ distinct member types (a single member collapses to that member; a union of
            # only literals collapses to a single ``Literal[...]``).
            distinct = list(dict.fromkeys(m.type_annotation(**kwargs) for m in item_type.types))
            all_constant = all(t.type == "constant" for t in item_type.types)
            if len(distinct) > 1 and not all_constant:
                file_import.add_submodule_import("typing", "Union", ImportType.STDLIB)
        elif item_type:
            file_import.merge(item_type.imports(**kwargs))
            if not self.is_structured_stream and isinstance(item_type, CombinedType) and item_type.name:
                serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
                file_import.add_submodule_import(
                    self.code_model.get_relative_import_path(serialize_namespace),
                    "_unions",
                    ImportType.LOCAL,
                    TypingSection.TYPING,
                )
        if self.nullable:
            file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB)
        if self.is_structured_stream:
            stream_class = self.stream_class_name(kwargs.get("async_mode", False))
            serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
            relative_path = self.code_model.get_relative_import_path(
                serialize_namespace, module_name="_utils.streaming_base"
            )
            file_import.add_submodule_import(relative_path, stream_class, ImportType.LOCAL)
            if self.streaming_kind == "sse":
                file_import.add_import("json", ImportType.STDLIB)
                for _event_type, event_item_type in self.streaming_events:
                    file_import.merge(event_item_type.imports(**kwargs))
        return file_import

    def _get_import_type(self, input_path: str) -> ImportType:
        # helper function to return imports for responses based off
        # of whether we're importing from the core library, or users
        # are customizing responses
        return ImportType.SDKCORE if self.code_model.core_library.split(".")[0] in input_path else ImportType.THIRDPARTY

    @classmethod
    def from_yaml(cls, yaml_data: dict[str, Any], code_model: "CodeModel") -> "Response":
        streaming = yaml_data.get("streaming")
        if streaming:
            return cls(
                yaml_data=yaml_data,
                code_model=code_model,
                headers=[ResponseHeader.from_yaml(header, code_model) for header in yaml_data["headers"]],
                type=code_model.lookup_type(id(streaming["itemType"])),
            )
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

    def get_polymorphic_subtypes(self, polymorphic_subtypes: list["ModelType"]) -> None:
        if isinstance(self.item_type, CombinedType):
            target = self.item_type.target_model_subtype((ModelType,))
            if target:
                target.get_polymorphic_subtypes(polymorphic_subtypes)
        else:
            self.item_type.get_polymorphic_subtypes(polymorphic_subtypes)

    def get_json_template_representation(self) -> Any:
        return self.item_type.get_json_template_representation()

    def get_pager_import_path(self, async_mode: bool) -> str:
        return ".".join(self.get_pager_path(async_mode).split(".")[:-1])

    def get_pager_path(self, async_mode: bool) -> str:
        return self.pager_async if async_mode else self.pager_sync

    def get_pager(self, async_mode: bool) -> str:
        return self.get_pager_path(async_mode).split(".")[-1]

    def type_annotation(self, **kwargs: Any) -> str:
        iterable = "AsyncItemPaged" if kwargs["async_mode"] else "ItemPaged"
        return f"{iterable}[{self._item_type_annotation(**kwargs)}]"

    def _item_type_annotation(self, **kwargs: Any) -> str:
        # When the page item is a ListType, render the outer `List`/`list`
        # wrapper here using the operation-file alias decision so a list page
        # item rendered inside an operation file named `list` uses the `List`
        # alias (avoiding the built-in `list` shadowed by `List = list`).
        # Recurse into the element type without is_operation_file so nested
        # generated model types keep their forward-reference quoting
        # (e.g. ItemPaged[List["_models.Product"]]).
        if isinstance(self.item_type, ListType):
            use_list_import = self.code_model.has_operation_named_list
            list_type = "List" if use_list_import else "list"
            return f"{list_type}[{self.item_type.element_type.type_annotation(**kwargs)}]"
        return self.item_type.type_annotation(**kwargs)

    def docstring_text(self, **kwargs: Any) -> str:
        base_description = "An iterator like instance of "
        if not self.code_model.options["version-tolerant"]:
            base_description += "either "
        return base_description + self.item_type.docstring_text(**kwargs)

    def docstring_type(self, **kwargs: Any) -> str:
        return f"~{self.get_pager_path(kwargs['async_mode'])}[{self.item_type.docstring_type(**kwargs)}]"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        async_mode = kwargs.get("async_mode", False)
        pager = self.get_pager(async_mode)
        pager_path = self.get_pager_import_path(async_mode)

        file_import.add_submodule_import(pager_path, pager, self._get_import_type(pager_path))
        async_mode = kwargs.get("async_mode")
        if async_mode:
            file_import.add_submodule_import(
                f"{'async_' if self.code_model.is_azure_flavor else ''}paging",
                "AsyncList",
                ImportType.SDKCORE,
            )

        return file_import


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
        return self.get_no_polling_method_path(async_mode).rsplit(".", maxsplit=1)[-1]

    @staticmethod
    def get_base_polling_method_path(async_mode: bool) -> str:
        """Get the base polling method path. Used in docstrings and type annotations."""
        return f"azure.core.polling.{'Async' if async_mode else ''}PollingMethod"

    def get_base_polling_method(self, async_mode: bool) -> str:
        """Get the base polling method."""
        return self.get_base_polling_method_path(async_mode).rsplit(".", maxsplit=1)[-1]

    def type_annotation(self, **kwargs: Any) -> str:
        return f"{self.get_poller(kwargs.get('async_mode', False))}[{super().type_annotation(**kwargs)}]"

    def docstring_type(self, **kwargs: Any) -> str:
        return f"~{self.get_poller_path(kwargs.get('async_mode', False))}[{super().docstring_type(**kwargs)}]"

    def docstring_text(self, **kwargs) -> str:
        super_text = super().docstring_text(**kwargs)
        base_description = f"An instance of {self.get_poller(kwargs.get('async_mode', False))} that returns "
        if not self.code_model.options["version-tolerant"]:
            base_description += "either "
        return base_description + super_text

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        async_mode = kwargs["async_mode"]
        poller_import_path = ".".join(self.get_poller_path(async_mode).split(".")[:-1])
        poller = self.get_poller(async_mode)
        file_import.add_submodule_import(poller_import_path, poller, self._get_import_type(poller_import_path))
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


class LROPagingResponse(LROResponse, PagingResponse):
    def type_annotation(self, **kwargs: Any) -> str:
        paging_type_annotation = PagingResponse.type_annotation(self, **kwargs)
        return f"{self.get_poller(kwargs.get('async_mode', False))}[{paging_type_annotation}]"

    def docstring_type(self, **kwargs: Any) -> str:
        paging_docstring_type = PagingResponse.docstring_type(self, **kwargs)
        return f"~{self.get_poller_path(kwargs.get('async_mode', False))}[{paging_docstring_type}]"

    def docstring_text(self, **kwargs) -> str:
        base_description = "An instance of LROPoller that returns an iterator like instance of "
        if not self.code_model.options["version-tolerant"]:
            base_description += "either "
        return base_description + Response.docstring_text(self)

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = LROResponse.imports(self, **kwargs)
        file_import.merge(PagingResponse.imports(self, **kwargs))
        return file_import


def get_response(yaml_data: dict[str, Any], code_model: "CodeModel") -> Response:
    if yaml_data["discriminator"] == "lropaging":
        return LROPagingResponse.from_yaml(yaml_data, code_model)
    if yaml_data["discriminator"] == "lro":
        return LROResponse.from_yaml(yaml_data, code_model)
    if yaml_data["discriminator"] == "paging":
        return PagingResponse.from_yaml(yaml_data, code_model)
    return Response.from_yaml(yaml_data, code_model)
