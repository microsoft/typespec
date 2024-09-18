# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import functools
import json
from typing import List, Optional, Set, Tuple, Dict, Union, Any
from jinja2 import Environment
from ..models import (
    OperationGroup,
    LROOperation,
    PagingOperation,
    TypingSection,
    ImportType,
    CodeModel,
)
from .builder_serializer import get_operation_serializer
from .import_serializer import FileImportSerializer


def _to_string(data: Union[Tuple[Any], List[Any], str]) -> str:
    if isinstance(data, (list, tuple)):
        return "".join([_to_string(item) for item in data])
    return str(data)


def _json_serialize_imports(
    imports: Dict[
        TypingSection,
        Dict[
            ImportType,
            Dict[
                str,
                Set[
                    Optional[
                        Union[
                            str,
                            Tuple[str, str],
                            Tuple[
                                str,
                                Optional[str],
                                Tuple[Tuple[Tuple[int, int], str, Optional[str]]],
                            ],
                        ]
                    ]
                ],
            ],
        ],
    ]
) -> str:
    if not imports:
        return ""

    json_serialize_imports = {}
    # need to make name_import set -> list to make the dictionary json serializable
    # not using an OrderedDict since we're iterating through a set and the order there varies
    # going to sort the list instead

    for typing_section_key, typing_section_value in imports.items():
        json_import_type_dictionary = {}
        for import_type_key, import_type_value in typing_section_value.items():
            json_package_name_dictionary = {}
            for package_name, name_imports in import_type_value.items():
                name_import_ordered_list = []
                if name_imports:
                    name_import_ordered_list = list(name_imports)
                    name_import_ordered_list.sort(
                        key=lambda e: (
                            _to_string(e)  # type: ignore
                            if isinstance(e, (list, tuple))
                            else e if isinstance(e, str) else ""
                        )
                    )
                json_package_name_dictionary[package_name] = name_import_ordered_list
            json_import_type_dictionary[import_type_key] = json_package_name_dictionary
        json_serialize_imports[typing_section_key] = json_import_type_dictionary
    return json.dumps(json_serialize_imports)


def _mixin_imports(
    mixin_operation_group: Optional[OperationGroup],
) -> Tuple[Optional[str], Optional[str]]:
    if not mixin_operation_group:
        return None, None

    sync_mixin_imports = mixin_operation_group.imports_for_multiapi(async_mode=False)
    async_mixin_imports = mixin_operation_group.imports_for_multiapi(async_mode=True)

    return _json_serialize_imports(sync_mixin_imports.to_dict()), _json_serialize_imports(async_mixin_imports.to_dict())


def _mixin_typing_definitions(
    mixin_operation_group: Optional[OperationGroup],
) -> Tuple[Optional[str], Optional[str]]:
    if not mixin_operation_group:
        return None, None

    sync_mixin_imports = mixin_operation_group.imports_for_multiapi(async_mode=False)
    async_mixin_imports = mixin_operation_group.imports_for_multiapi(async_mode=True)
    sync_mixin_typing_definitions = FileImportSerializer(sync_mixin_imports, False).get_typing_definitions()
    async_mixin_typing_definitions = FileImportSerializer(async_mixin_imports, True).get_typing_definitions()

    return sync_mixin_typing_definitions, async_mixin_typing_definitions


class MetadataSerializer:
    def __init__(self, code_model: CodeModel, env: Environment) -> None:
        self.code_model = code_model
        self.client = self.code_model.clients[0]  # we only do one client for multiapi
        self.env = env

    def _choose_api_version(self) -> Tuple[str, List[str]]:
        chosen_version = ""
        total_api_version_set: Set[str] = set()
        for client in self.code_model.clients:
            for operation_group in client.operation_groups:
                total_api_version_set.update(operation_group.api_versions)

        total_api_version_list = list(total_api_version_set)
        total_api_version_list.sort()

        # switching ' to " so json can decode the dict we end up writing to file
        total_api_version_list = [str(api_version).replace("'", '"') for api_version in total_api_version_list]
        if len(total_api_version_list) == 1:
            chosen_version = total_api_version_list[0]
        elif len(total_api_version_list) > 1:
            module_version = self.code_model.namespace.split(".")[-1]
            for api_version in total_api_version_list:
                if "v{}".format(api_version.replace("-", "_")) == module_version:
                    chosen_version = api_version

        return chosen_version, total_api_version_list

    def serialize(self) -> str:
        def _is_lro(operation):
            return isinstance(operation, LROOperation)

        def _is_paging(operation):
            return isinstance(operation, PagingOperation)

        mixin_operation_group: Optional[OperationGroup] = next(
            (
                operation_group
                for client in self.code_model.clients
                for operation_group in client.operation_groups
                if operation_group.is_mixin
            ),
            None,
        )
        mixin_operations = mixin_operation_group.operations if mixin_operation_group else []
        sync_mixin_imports, async_mixin_imports = _mixin_imports(mixin_operation_group)
        (
            sync_mixin_typing_definitions,
            async_mixin_typing_definitions,
        ) = _mixin_typing_definitions(mixin_operation_group)

        chosen_version, total_api_version_list = self._choose_api_version()

        # setting to true, because for multiapi we always generate with a version file with version 0.1.0
        self.code_model.options["package_version"] = "0.1.0"
        template = self.env.get_template("metadata.json.jinja2")

        return template.render(
            code_model=self.code_model,
            chosen_version=chosen_version,
            total_api_version_list=total_api_version_list,
            client=self.client,
            global_parameters=self.client.parameters,
            mixin_operations=mixin_operations,
            any=any,
            is_lro=_is_lro,
            is_paging=_is_paging,
            str=str,
            sync_mixin_imports=sync_mixin_imports,
            async_mixin_imports=async_mixin_imports,
            sync_mixin_typing_definitions=sync_mixin_typing_definitions,
            async_mixin_typing_definitions=async_mixin_typing_definitions,
            sync_client_imports=_json_serialize_imports(self.client.imports_for_multiapi(async_mode=False).to_dict()),
            async_client_imports=_json_serialize_imports(self.client.imports_for_multiapi(async_mode=True).to_dict()),
            sync_config_imports=_json_serialize_imports(
                self.client.config.imports_for_multiapi(async_mode=False).to_dict()
            ),
            async_config_imports=_json_serialize_imports(
                self.client.config.imports_for_multiapi(async_mode=True).to_dict()
            ),
            get_async_operation_serializer=functools.partial(
                get_operation_serializer,
                code_model=self.client.code_model,
                async_mode=True,
            ),
            get_sync_operation_serializer=functools.partial(
                get_operation_serializer,
                code_model=self.client.code_model,
                async_mode=False,
            ),
            has_credential=bool(self.client.credential),
        )
