# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import List, Dict, Any, Set, Union, Literal, Optional, cast

from .base import BaseType
from .enum_type import EnumType
from .model_type import ModelType, UsageFlags
from .combined_type import CombinedType
from .client import Client
from .request_builder import RequestBuilder, OverloadedRequestBuilder
from .operation_group import OperationGroup
from .utils import NamespaceType
from .._utils import DEFAULT_HEADER_TEXT, DEFAULT_LICENSE_DESCRIPTION


def _is_legacy(options) -> bool:
    return not (options.get("version_tolerant") or options.get("low_level_client"))


def get_all_operation_groups_recursively(clients: List[Client]) -> List[OperationGroup]:
    operation_groups = []
    queue = []
    for client in clients:
        queue.extend(client.operation_groups)
    while queue:
        operation_groups.append(queue.pop(0))
        if operation_groups[-1].operation_groups:
            queue.extend(operation_groups[-1].operation_groups)
    return operation_groups


class ClientNamespaceType:
    def __init__(
        self,
        clients: Optional[List[Client]] = None,
        models: Optional[List[ModelType]] = None,
        enums: Optional[List[EnumType]] = None,
        operation_groups: Optional[List[OperationGroup]] = None,
    ):
        self.clients = clients or []
        self.models = models or []
        self.enums = enums or []
        self.operation_groups = operation_groups or []


class CodeModel:  # pylint: disable=too-many-public-methods, disable=too-many-instance-attributes
    """Top level code model

    :param options: Options of the code model. I.e., whether this is for management generation
    :type options: dict[str, bool]
    :param str module_name: The module name for the client. Is in snake case.
    :param str class_name: The class name for the client. Is in pascal case.
    :param str description: The description of the client
    :param str namespace: The namespace of our module
    :param schemas: The list of schemas we are going to serialize in the models files. Maps their yaml
     id to our created ModelType.
    :type schemas: dict[int, ~autorest.models.ModelType]
    :param sorted_schemas: Our schemas in order by inheritance and alphabet
    :type sorted_schemas: list[~autorest.models.ModelType]
    :param enums: The enums, if any, we are going to serialize. Maps their yaml id to our created EnumType.
    :type enums: Dict[int, ~autorest.models.EnumType]
    :param primitives: List of schemas we've created that are not EnumSchemas or ObjectSchemas. Maps their
     yaml id to our created schemas.
    :type primitives: Dict[int, ~autorest.models.BaseType]
    :param package_dependency: All the dependencies needed in setup.py
    :type package_dependency: Dict[str, str]
    """

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        options: Dict[str, Any],
    ) -> None:
        self.yaml_data = yaml_data
        self.options = options
        self.namespace = self.yaml_data["namespace"]
        self.types_map: Dict[int, BaseType] = {}  # map yaml id to schema
        self._model_types: List[ModelType] = []
        from . import build_type

        for type_yaml in yaml_data.get("types", []):
            build_type(yaml_data=type_yaml, code_model=self)
        self.clients: List[Client] = [
            Client.from_yaml(client_yaml_data, self) for client_yaml_data in yaml_data["clients"]
        ]
        if self.options["models_mode"] and self.model_types:
            self.sort_model_types()
        self.named_unions: List[CombinedType] = [
            t for t in self.types_map.values() if isinstance(t, CombinedType) and t.name
        ]
        self.cross_language_package_id = self.yaml_data.get("crossLanguagePackageId")
        self.for_test: bool = False
        # key is typespec namespace, value is models/clients/opeartion_groups/enums cache in the namespace
        self._client_namespace_types: Dict[str, ClientNamespaceType] = {}
        self.has_subnamespace = False
        self._operations_folder_name: Dict[str, str] = {}
        self._relative_import_path: Dict[str, str] = {}

    @staticmethod
    def get_imported_namespace_for_client(imported_namespace: str, async_mode: bool = False) -> str:
        return imported_namespace + (".aio" if async_mode else "")

    @staticmethod
    def get_imported_namespace_for_model(imported_namespace: str) -> str:
        return imported_namespace + ".models"

    def get_imported_namespace_for_operation(self, imported_namespace: str, async_mode: bool = False) -> str:
        module_namespace = f".{self.operations_folder_name(imported_namespace)}"
        return self.get_imported_namespace_for_client(imported_namespace, async_mode) + module_namespace

    # | serialize_namespace  | imported_namespace   | relative_import_path |
    # |----------------------|----------------------|----------------------|
    # |azure.test.operations | azure.test.operations| .                    |
    # |azure.test.operations | azure.test           | ..                   |
    # |azure.test.operations | azure.test.subtest   | ..subtest            |
    # |azure.test.operations | azure                | ...                  |
    # |azure.test.aio.operations | azure.test       | ...                  |
    # |azure.test.subtest.aio.operations|azure.test | ....                 |
    # |azure.test            |azure.test.subtest    | .subtest             |
    def get_relative_import_path(
        self,
        serialize_namespace: str,
        imported_namespace: Optional[str] = None,
        module_name: Optional[str] = None,
    ) -> str:
        if imported_namespace is None:
            imported_namespace = self.namespace

        key = f"{serialize_namespace}-{imported_namespace}"
        if key not in self._relative_import_path:
            idx = 0
            serialize_namespace_split = serialize_namespace.split(".")
            imported_namespace_split = cast(str, imported_namespace).split(".")
            while idx < min(len(serialize_namespace_split), len(imported_namespace_split)):
                if serialize_namespace_split[idx] != imported_namespace_split[idx]:
                    break
                idx += 1
            self._relative_import_path[key] = "." * (len(serialize_namespace_split[idx:]) + 1) + ".".join(
                imported_namespace_split[idx:]
            )
        result = self._relative_import_path[key]
        if module_name is None:
            return result
        return f"{result}{module_name}" if result.endswith(".") else f"{result}.{module_name}"

    def get_unique_models_alias(self, serialize_namespace: str, imported_namespace: str) -> str:
        if not self.has_subnamespace:
            return "_models"
        relative_path = self.get_relative_import_path(
            serialize_namespace, self.get_imported_namespace_for_model(imported_namespace)
        )
        dot_num = max(relative_path.count(".") - 1, 0)
        parts = [""] + ([p for p in relative_path.split(".") if p] or ["models"])
        return "_".join(parts) + (str(dot_num) if dot_num > 0 else "")

    @property
    def client_namespace_types(self) -> Dict[str, ClientNamespaceType]:
        if not self._client_namespace_types:
            # calculate client namespace types for each kind of client namespace
            for client in self.clients:
                if client.client_namespace not in self._client_namespace_types:
                    self._client_namespace_types[client.client_namespace] = ClientNamespaceType()
                self._client_namespace_types[client.client_namespace].clients.append(client)
            for model in self.model_types:
                if model.client_namespace not in self._client_namespace_types:
                    self._client_namespace_types[model.client_namespace] = ClientNamespaceType()
                self._client_namespace_types[model.client_namespace].models.append(model)
            for enum in self.enums:
                if enum.client_namespace not in self._client_namespace_types:
                    self._client_namespace_types[enum.client_namespace] = ClientNamespaceType()
                self._client_namespace_types[enum.client_namespace].enums.append(enum)
            for operation_group in get_all_operation_groups_recursively(self.clients):
                if operation_group.client_namespace not in self._client_namespace_types:
                    self._client_namespace_types[operation_group.client_namespace] = ClientNamespaceType()
                self._client_namespace_types[operation_group.client_namespace].operation_groups.append(operation_group)

            # here we can check and record whether there are multi kinds of client namespace
            if len(self._client_namespace_types.keys()) > 1:
                self.has_subnamespace = True

            # insert namespace to make sure it is continuous(e.g. ("", "azure", "azure.mgmt", "azure.mgmt.service"))
            longest_namespace = sorted(self._client_namespace_types.keys())[-1]
            namespace_parts = longest_namespace.split(".")
            for idx in range(len(namespace_parts) + 1):
                namespace = ".".join(namespace_parts[:idx])
                if namespace not in self._client_namespace_types:
                    self._client_namespace_types[namespace] = ClientNamespaceType()
        return self._client_namespace_types

    @property
    def has_form_data(self) -> bool:
        return any(og.has_form_data_body for client in self.clients for og in client.operation_groups)

    @property
    def has_etag(self) -> bool:
        return any(client.has_etag for client in self.clients)

    @staticmethod
    def clients_has_operations(clients: List[Client]) -> bool:
        return any(c for c in clients if c.has_operations)

    @property
    def has_operations(self) -> bool:
        return self.clients_has_operations(self.clients)

    @property
    def has_non_abstract_operations(self) -> bool:
        return any(c for c in self.clients if c.has_non_abstract_operations)

    def lookup_request_builder(self, request_builder_id: int) -> Union[RequestBuilder, OverloadedRequestBuilder]:
        """Find the request builder based off of id"""
        for client in self.clients:
            try:
                return client.lookup_request_builder(request_builder_id)
            except KeyError:
                pass
        raise KeyError(f"No request builder with id {request_builder_id} found.")

    @property
    def is_azure_flavor(self) -> bool:
        return self.options["flavor"] == "azure"

    @property
    def rest_layer_name(self) -> str:
        """If we have a separate rest layer, what is its name?"""
        return "rest" if self.options["builders_visibility"] == "public" else "_rest"

    @property
    def client_filename(self) -> str:
        return self.clients[0].filename

    def get_clients(self, client_namespace: str) -> List[Client]:
        """Get all clients in specific namespace"""
        return self.client_namespace_types.get(client_namespace, ClientNamespaceType()).clients

    def is_top_namespace(self, client_namespace: str) -> bool:
        """Whether the namespace is the top namespace. For example, a package named 'azure-mgmt-service',
        'azure.mgmt.service' is the top namespace.
        """
        return client_namespace == self.namespace

    def need_vendored_code(self, async_mode: bool, client_namespace: str) -> bool:
        """Whether we need to vendor code in the _vendor.py in specific namespace"""
        return (
            self.need_vendored_form_data(async_mode, client_namespace)
            or self.need_vendored_etag(client_namespace)
            or self.need_vendored_abstract(client_namespace)
            or self.need_vendored_mixin(client_namespace)
        )

    def need_vendored_form_data(self, async_mode: bool, client_namespace: str) -> bool:
        return (
            (not async_mode)
            and self.is_top_namespace(client_namespace)
            and self.has_form_data
            and self.options["models_mode"] == "dpg"
        )

    def need_vendored_etag(self, client_namespace: str) -> bool:
        return self.is_top_namespace(client_namespace) and self.has_etag

    def need_vendored_abstract(self, client_namespace: str) -> bool:
        return self.is_top_namespace(client_namespace) and self.has_abstract_operations

    def need_vendored_mixin(self, client_namespace: str) -> bool:
        return self.has_mixin(client_namespace)

    def has_mixin(self, client_namespace: str) -> bool:
        return any(c for c in self.get_clients(client_namespace) if c.has_mixin)

    @property
    def has_abstract_operations(self) -> bool:
        return any(c for c in self.clients if c.has_abstract_operations)

    def operations_folder_name(self, client_namespace: str) -> str:
        """Get the name of the operations folder that holds operations."""
        if client_namespace not in self._operations_folder_name:
            name = "operations"
            operation_groups = self.client_namespace_types.get(client_namespace, ClientNamespaceType()).operation_groups
            if self.options["version_tolerant"] and all(og.is_mixin for og in operation_groups):
                name = f"_{name}"
            self._operations_folder_name[client_namespace] = name
        return self._operations_folder_name[client_namespace]

    def get_serialize_namespace(
        self,
        client_namespace: str,
        async_mode: bool = False,
        client_namespace_type: NamespaceType = NamespaceType.CLIENT,
    ) -> str:
        """calculate the namespace for serialization from client namespace"""
        if client_namespace_type == NamespaceType.CLIENT:
            return client_namespace + (".aio" if async_mode else "")
        if client_namespace_type == NamespaceType.MODEL:
            return client_namespace + ".models"

        operations_folder_name = self.operations_folder_name(client_namespace)
        return client_namespace + (".aio." if async_mode else ".") + operations_folder_name

    @property
    def description(self) -> str:
        return self.clients[0].description

    def lookup_type(self, schema_id: int) -> BaseType:
        """Looks to see if the schema has already been created.

        :param int schema_id: The yaml id of the schema
        :return: If created, we return the created schema, otherwise, we throw.
        :rtype: ~autorest.models.BaseType
        :raises KeyError: if schema is not found
        """
        try:
            return next(type for id, type in self.types_map.items() if id == schema_id)
        except StopIteration as exc:
            raise KeyError(f"Couldn't find schema with id {schema_id}") from exc

    @property
    def model_types(self) -> List[ModelType]:
        """All of the model types in this class"""
        if not self._model_types:
            self._model_types = [
                t for t in self.types_map.values() if isinstance(t, ModelType) and t.usage != UsageFlags.Default.value
            ]
        return self._model_types

    @model_types.setter
    def model_types(self, val: List[ModelType]) -> None:
        self._model_types = val

    @staticmethod
    def get_public_model_types(models: List[ModelType]) -> List[ModelType]:
        return [m for m in models if not m.internal and not m.base == "json"]

    @property
    def public_model_types(self) -> List[ModelType]:
        return self.get_public_model_types(self.model_types)

    @property
    def enums(self) -> List[EnumType]:
        """All of the enums"""
        return [t for t in self.types_map.values() if isinstance(t, EnumType)]

    @property
    def core_library(self) -> Literal["azure.core", "corehttp"]:
        return "azure.core" if self.is_azure_flavor else "corehttp"

    def _sort_model_types_helper(
        self,
        current: ModelType,
        seen_schema_names: Set[str],
        seen_schema_yaml_ids: Set[int],
    ):
        if current.id in seen_schema_yaml_ids:
            return []
        if current.name in seen_schema_names:
            raise ValueError(f"We have already generated a schema with name {current.name}")
        ancestors = [current]
        if current.parents:
            for parent in current.parents:
                if parent.id in seen_schema_yaml_ids:
                    continue
                seen_schema_names.add(current.name)
                seen_schema_yaml_ids.add(current.id)
                ancestors = self._sort_model_types_helper(parent, seen_schema_names, seen_schema_yaml_ids) + ancestors
        seen_schema_names.add(current.name)
        seen_schema_yaml_ids.add(current.id)
        return ancestors

    def sort_model_types(self) -> None:
        """Sorts the final object schemas by inheritance and by alphabetical order.

        :return: None
        :rtype: None
        """
        seen_schema_names: Set[str] = set()
        seen_schema_yaml_ids: Set[int] = set()
        sorted_object_schemas: List[ModelType] = []
        for schema in sorted(self.model_types, key=lambda x: x.name.lower()):
            sorted_object_schemas.extend(self._sort_model_types_helper(schema, seen_schema_names, seen_schema_yaml_ids))
        self.model_types = sorted_object_schemas

    @property
    def models_filename(self) -> str:
        """Get the names of the model file(s)"""
        if self.is_legacy:
            return "_models_py3"
        return "_models"

    @property
    def enums_filename(self) -> str:
        """The name of the enums file"""
        if self.is_legacy:
            return f"_{self.clients[0].legacy_filename}_enums"
        return "_enums"

    @property
    def is_legacy(self) -> bool:
        return _is_legacy(self.options)

    @staticmethod
    def has_non_json_models(models: List[ModelType]) -> bool:
        return any(m for m in models if m.base != "json")

    @property
    def is_tsp(self) -> bool:
        return self.options.get("tsp_file") is not None

    @property
    def license_header(self) -> str:
        if self.yaml_data.get("licenseInfo") or not self.is_azure_flavor:
            # typespec unbranded case and azure case with custom license
            license_header = self.yaml_data.get("licenseInfo", {}).get("header", "")
        else:
            # typespec azure case without custom license and swagger case
            license_header = self.options.get("header_text") or DEFAULT_HEADER_TEXT
        if license_header:
            license_header = license_header.replace("\n", "\n# ")
            license_header = (
                "# --------------------------------------------------------------------------\n# " + license_header
            )
            license_header += "\n# --------------------------------------------------------------------------"
        return license_header

    @property
    def license_description(self) -> str:
        if self.yaml_data.get("licenseInfo") or not self.is_azure_flavor:
            # typespec unbranded case and azure case with custom license
            return self.yaml_data.get("licenseInfo", {}).get("description", "")
        # typespec azure case without custom license and swagger case
        return DEFAULT_LICENSE_DESCRIPTION

    @property
    def company_name(self) -> str:
        if self.yaml_data.get("licenseInfo") or not self.is_azure_flavor:
            # typespec unbranded case and azure case with custom license
            return self.yaml_data.get("licenseInfo", {}).get("company", "")
        # typespec azure case without custom license and swagger case
        return "Microsoft Corporation"
