# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import List, Dict, Any, Set, Union, Literal, Optional

from .base import BaseType
from .enum_type import EnumType
from .model_type import ModelType, UsageFlags
from .combined_type import CombinedType
from .client import Client
from .request_builder import RequestBuilder, OverloadedRequestBuilder
from .operation_group import OperationGroup
from .utils import NamespaceType

def _is_legacy(options) -> bool:
    return not (options.get("version_tolerant") or options.get("low_level_client"))


class ClientNamespaceType:
    def __init__(
        self,
        client_namespace: str,
        clients: List[Client],
        models: List[ModelType],
        enums: List[EnumType],
        operation_groups: List[OperationGroup],
    ):
        self.client_namespace = client_namespace
        self.clients = clients
        self.models = models
        self.enums = enums
        self.operation_groups = operation_groups


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
        *,
        is_subnamespace: bool = False,
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
        self.is_subnamespace = is_subnamespace
        self.named_unions: List[CombinedType] = [
            t for t in self.types_map.values() if isinstance(t, CombinedType) and t.name
        ]
        self.cross_language_package_id = self.yaml_data.get("crossLanguagePackageId")
        self.for_test: bool = False
        self._client_namespace_types: Dict[str, ClientNamespaceType] = {}

    # | serialize_namespace  | imported_namespace | relative_import_path |
    # |----------------------|--------------------|----------------------|
    # |azure.test.operations | azure.test         | ..                   |
    # |azure.test.operations | azure.test.subtest | ..subtest            |
    # |azure.test.operations | azure              | ...                  |
    # |azure.test.aio.operations | azure.test     | ...                  |
    # |azure.test.subtest.aio.operations|azure.test| ....                |
    # |azure.test            |azure.test.subtest  | .subtest             |
    def get_relative_import_path(self, serialize_namespace: str, imported_namespace: Optional[str] = None, *, namespace_type = Optional[NamespaceType] = None) -> str:
        imported_namespace = self.namespace if imported_namespace is None else imported_namespace
        idx = 0
        while idx < min(len(serialize_namespace), len(imported_namespace)):
            if serialize_namespace[idx] != imported_namespace[idx]:
                break
            idx += 1
        return "." * (len(serialize_namespace[idx:].strip(".").split(".")) + 1) + imported_namespace[idx:].strip(".")

    @property
    def client_namespace_types(self) -> Dict[str, ClientNamespaceType]:
        if not self._client_namespace_types:
            for client in self.clients:
                # TODO
                pass
        return self._client_namespace_types

    @property
    def has_form_data(self) -> bool:
        return any(og.has_form_data_body for client in self.clients for og in client.operation_groups)

    @property
    def has_etag(self) -> bool:
        return any(client.has_etag for client in self.clients)

    @property
    def has_operations(self) -> bool:
        return any(c for c in self.clients if c.has_operations)

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

    def need_vendored_code(self, async_mode: bool) -> bool:
        """Whether we need to vendor code in the _vendor.py file for this SDK"""
        if self.has_abstract_operations:
            return True
        if async_mode:
            return self.need_mixin_abc
        return self.need_mixin_abc or self.has_etag or self.has_form_data

    @property
    def need_mixin_abc(self) -> bool:
        return any(c for c in self.clients if c.has_mixin)

    @property
    def has_abstract_operations(self) -> bool:
        return any(c for c in self.clients if c.has_abstract_operations)

    @staticmethod
    def operations_folder_name(self, client_namespace: str) -> str:
        """Get the name of the operations folder that holds operations."""
        name = "operations"
        client_namespace_type = self.client_namespace_types.get(client_namespace)
        operation_groups = client_namespace_type.operation_groups if client_namespace_type else []
        if self.options["version_tolerant"] and not any(
            og for client in self.clients for og in operation_groups if not og.is_mixin
        ):
            name = f"_{name}"
        return name

    @property
    def description(self) -> str:
        return self.clients[0].description

    def lookup_type(self, schema_id: int) -> BaseType:
        """Looks to see if the schema has already been created.

        :param int schema_id: The yaml id of the schema
        :return: If created, we return the created schema, otherwise, we throw.
        :rtype: ~autorest.models.BaseType
        :raises: KeyError if schema is not found
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

    @property
    def public_model_types(self) -> List[ModelType]:
        return [m for m in self.model_types if not m.internal and not m.base == "json"]

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
