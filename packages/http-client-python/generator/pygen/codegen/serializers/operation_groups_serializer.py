# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional, List, Union
import functools
from jinja2 import Environment

from ..models import (
    CodeModel,
    OperationGroup,
    RequestBuilder,
    OverloadedRequestBuilder,
    FileImport,
)
from ..models.utils import NamespaceType
from .import_serializer import FileImportSerializer
from .builder_serializer import (
    get_operation_serializer,
    RequestBuilderSerializer,
)
from .base_serializer import BaseSerializer


class OperationGroupsSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        operation_groups: List[OperationGroup],
        env: Environment,
        async_mode: bool,
        *,
        client_namespace: Optional[str] = None,
    ):
        super().__init__(code_model, env, async_mode, client_namespace=client_namespace)
        self.operation_groups = operation_groups
        self.async_mode = async_mode

    def _get_request_builders(
        self, operation_group: OperationGroup
    ) -> List[Union[OverloadedRequestBuilder, RequestBuilder]]:
        return [
            r
            for r in operation_group.client.request_builders
            if r.client.name == operation_group.client.name
            and r.group_name == operation_group.identify_name
            and not r.is_overload
            and not r.abstract
            and not r.is_lro  # lro has already initial builder
        ]

    @property
    def serialize_namespace(self) -> str:
        return self.code_model.get_serialize_namespace(
            self.client_namespace, async_mode=self.async_mode, client_namespace_type=NamespaceType.OPERATION
        )

    def serialize(self) -> str:
        imports = FileImport(self.code_model)
        for operation_group in self.operation_groups:
            imports.merge(
                operation_group.imports(
                    async_mode=self.async_mode,
                    serialize_namespace=self.serialize_namespace,
                    serialize_namespace_type=NamespaceType.OPERATION,
                )
            )

        template = self.env.get_or_select_template("operation_groups_container.py.jinja2")

        return template.render(
            code_model=self.code_model,
            operation_groups=self.operation_groups,
            imports=FileImportSerializer(
                imports,
                async_mode=self.async_mode,
            ),
            async_mode=self.async_mode,
            get_operation_serializer=functools.partial(
                get_operation_serializer,
                code_model=self.code_model,
                async_mode=self.async_mode,
                client_namespace=self.client_namespace,
            ),
            request_builder_serializer=RequestBuilderSerializer(
                self.code_model,
                async_mode=False,
                client_namespace=self.client_namespace,
            ),
            get_request_builders=self._get_request_builders,
            need_declare_serializer=any(operation_group.operations for operation_group in self.operation_groups),
        )
