# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional, List, Union
import functools
from jinja2 import Environment

from .utils import get_all_operation_groups_recursively
from ..models import (
    CodeModel,
    OperationGroup,
    RequestBuilder,
    OverloadedRequestBuilder,
    Client,
    FileImport,
)
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
        serialize_namespace: Optional[str] = None,
    ):
        super().__init__(code_model, env, serialize_namespace=serialize_namespace)
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

    def serialize(self) -> str:
        imports = FileImport(self.code_model)
        for operation_group in self.operation_groups:
            imports.merge(
                operation_group.imports(
                    async_mode=self.async_mode,
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
            ),
            request_builder_serializer=RequestBuilderSerializer(
                self.code_model,
                async_mode=False,
            ),
            get_request_builders=self._get_request_builders,
        )
