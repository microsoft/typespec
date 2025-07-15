# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Dict, List, Any, TYPE_CHECKING

from .utils import OrderedSet

from .base import BaseModel
from .operation import get_operation
from .imports import FileImport, ImportType, TypingSection, MsrestImportType
from .utils import add_to_pylint_disable, NamespaceType
from .lro_operation import LROOperation
from .lro_paging_operation import LROPagingOperation
from ...utils import NAME_LENGTH_LIMIT

if TYPE_CHECKING:
    from .code_model import CodeModel
    from .client import Client
    from . import OperationType


class OperationGroup(BaseModel):
    """Represent an operation group."""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
        operations: List["OperationType"],
        api_versions: List[str],
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.client = client
        self.identify_name: str = yaml_data["identifyName"]
        self.property_name: str = yaml_data["propertyName"]
        self.operations = operations
        self.api_versions = api_versions
        self.operation_groups: List[OperationGroup] = []
        if self.code_model.options["show-operations"]:
            self.operation_groups = [
                OperationGroup.from_yaml(op_group, code_model, client)
                for op_group in self.yaml_data.get("operationGroups", [])
            ]
            self.link_lro_initial_operations()
        self.client_namespace: str = self.yaml_data.get("clientNamespace", code_model.namespace)
        self.has_parent_operation_group: bool = False
        for og in self.operation_groups:
            og.has_parent_operation_group = True

    @property
    def class_name(self) -> str:
        """The class name of the operation group."""
        if self.is_mixin and not self.code_model.options["multiapi"]:
            return "_" + self.yaml_data["className"]
        return self.yaml_data["className"]

    @property
    def has_abstract_operations(self) -> bool:
        return any(o for o in self.operations if o.abstract) or any(
            operation_group.has_abstract_operations for operation_group in self.operation_groups
        )

    @property
    def has_non_abstract_operations(self) -> bool:
        return any(o for o in self.operations if not o.abstract) or any(
            operation_group.has_non_abstract_operations for operation_group in self.operation_groups
        )

    def base_class(self, async_mode: bool) -> str:
        pipeline_client = (
            f"{'Async' if async_mode else ''}PipelineClient[HttpRequest, {'Async' if async_mode else ''}HttpResponse]"
        )
        base_classes: List[str] = []
        if self.is_mixin:
            base_classes.append(f"ClientMixinABC[{pipeline_client}, {self.client.name}Configuration]")
        return ", ".join(base_classes)

    def imports_for_multiapi(self, async_mode: bool, **kwargs) -> FileImport:
        file_import = FileImport(self.code_model)
        relative_path = ".." if async_mode else "."
        for operation in self.operations:
            file_import.merge(operation.imports_for_multiapi(async_mode, **kwargs))
        if (self.code_model.model_types or self.code_model.enums) and self.code_model.options[
            "models-mode"
        ] == "msrest":
            file_import.add_submodule_import(relative_path, "models", ImportType.LOCAL, alias="_models")
        return file_import

    def pylint_disable(self) -> str:
        retval: str = ""
        if self.has_abstract_operations:
            retval = add_to_pylint_disable(retval, "abstract-class-instantiated")
        if len(self.operations) > 20:
            retval = add_to_pylint_disable(retval, "too-many-public-methods")
        if len(self.class_name) > NAME_LENGTH_LIMIT and self.class_name[0] != "_":
            retval = add_to_pylint_disable(retval, "name-too-long")
        if len(self.operation_groups) > 6:
            retval = add_to_pylint_disable(retval, "too-many-instance-attributes")
        return retval

    @property
    def need_validation(self) -> bool:
        """Whether any of its operations need validation"""
        return any(o for o in self.operations if o.need_validation)

    def imports(self, async_mode: bool, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
        utils_path = self.code_model.get_relative_import_path(
            serialize_namespace,
            f"{self.code_model.namespace}._utils.utils",
        )

        for operation in self.operations:
            file_import.merge(operation.imports(async_mode, **kwargs))
        if not self.code_model.options["combine-operation-files"]:
            for og in self.operation_groups:
                file_import.add_submodule_import(
                    self.code_model.get_relative_import_path(
                        serialize_namespace,
                        self.code_model.get_imported_namespace_for_operation(self.client_namespace, async_mode),
                    ),
                    og.class_name,
                    ImportType.LOCAL,
                )
        else:
            for og in self.operation_groups:
                namespace = self.code_model.get_serialize_namespace(
                    og.client_namespace, async_mode, NamespaceType.OPERATION
                )
                if namespace != serialize_namespace:
                    file_import.add_submodule_import(
                        self.code_model.get_relative_import_path(
                            serialize_namespace,
                            self.code_model.get_imported_namespace_for_operation(og.client_namespace, async_mode),
                        )
                        + f".{og.filename}",
                        og.class_name,
                        ImportType.LOCAL,
                    )
        # for multiapi
        if (
            (self.code_model.public_model_types)
            and self.code_model.options["models-mode"] == "msrest"
            and not self.is_mixin
        ):
            file_import.add_submodule_import(
                self.code_model.get_relative_import_path(serialize_namespace),
                "models",
                ImportType.LOCAL,
                alias="_models",
            )
        file_import.add_submodule_import(
            self.code_model.get_relative_import_path(
                serialize_namespace,
                self.code_model.get_imported_namespace_for_client(self.client.client_namespace, async_mode),
                module_name="_configuration",
            ),
            f"{self.client.name}Configuration",
            ImportType.LOCAL,
        )
        file_import.add_submodule_import(
            "" if self.code_model.is_azure_flavor else "runtime",
            f"{'Async' if async_mode else ''}PipelineClient",
            ImportType.SDKCORE,
        )
        if self.is_mixin:
            file_import.add_submodule_import(
                # XxxMixinABC is always defined in _utils of client namespace
                utils_path,
                "ClientMixinABC",
                ImportType.LOCAL,
            )
            file_import.add_submodule_import(
                "rest",
                "HttpRequest",
                ImportType.SDKCORE,
            )
            file_import.add_submodule_import(
                "rest",
                f"{'Async' if async_mode else ''}HttpResponse",
                ImportType.SDKCORE,
            )
        else:
            file_import.add_msrest_import(
                serialize_namespace=kwargs.get("serialize_namespace", self.code_model.namespace),
                msrest_import_type=MsrestImportType.Serializer,
                typing_section=TypingSection.REGULAR,
            )
            file_import.add_msrest_import(
                serialize_namespace=kwargs.get("serialize_namespace", self.code_model.namespace),
                msrest_import_type=MsrestImportType.SerializerDeserializer,
                typing_section=TypingSection.REGULAR,
            )
        if self.has_abstract_operations:
            file_import.add_submodule_import(
                # raise_if_not_implemented is always defined in _utils of top namespace
                utils_path,
                "raise_if_not_implemented",
                ImportType.LOCAL,
            )
        if all(o.abstract for o in self.operations):
            return file_import
        file_import.add_submodule_import("typing", "TypeVar", ImportType.STDLIB, TypingSection.CONDITIONAL)
        file_import.define_mypy_type("T", "TypeVar('T')")
        type_value = "Optional[Callable[[PipelineResponse[HttpRequest, {}HttpResponse], T, Dict[str, Any]], Any]]"
        file_import.define_mypy_type("ClsType", type_value.format(""), type_value.format("Async"))
        return file_import

    @property
    def filename(self) -> str:
        return self.operations[0].filename if self.operations else "_operations"

    @property
    def is_mixin(self) -> bool:
        """The operation group with no name is the direct client methods."""
        return self.identify_name == ""

    def link_lro_initial_operations(self) -> None:
        """Link each LRO operation to its initial operation"""
        for operation_group in self.operation_groups:
            for operation in operation_group.operations:
                if isinstance(operation, (LROOperation, LROPagingOperation)):
                    operation.initial_operation = self.lookup_operation(id(operation.yaml_data["initialOperation"]))

    def lookup_operation(self, operation_id: int) -> "OperationType":
        try:
            return next(o for og in self.operation_groups for o in og.operations if id(o.yaml_data) == operation_id)
        except StopIteration as exc:
            raise KeyError(f"No operation with id {operation_id} found.") from exc

    @property
    def lro_operations(self) -> List["OperationType"]:
        return [operation for operation in self.operations if operation.operation_type in ("lro", "lropaging")] + [
            operation for operation_group in self.operation_groups for operation in operation_group.lro_operations
        ]

    @property
    def has_operations(self) -> bool:
        return any(operation_group.has_operations for operation_group in self.operation_groups) or bool(self.operations)

    @property
    def has_form_data_body(self) -> bool:
        operations = self.operations + [o for og in self.operation_groups for o in og.operations]
        return any(operation.has_form_data_body for operation in operations)

    @classmethod
    def from_yaml(
        cls,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        client: "Client",
    ) -> "OperationGroup":
        operations = [get_operation(o, code_model, client) for o in yaml_data["operations"]]
        api_versions: OrderedSet[str] = {}
        for operation in operations:
            for api_version in operation.api_versions:
                api_versions[api_version] = None
        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            client=client,
            operations=operations,
            api_versions=list(api_versions.keys()),
        )
