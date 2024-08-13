# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import List
from jinja2 import Environment

from ..models import FileImport
from .import_serializer import FileImportSerializer
from ..models import CodeModel, RequestBuilderType
from .builder_serializer import RequestBuilderSerializer
from .base_serializer import BaseSerializer


class RequestBuildersSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env: Environment,
        request_builders: List[RequestBuilderType],
    ) -> None:
        super().__init__(code_model, env)
        self.request_builders = request_builders
        self.group_name = request_builders[0].group_name

    @property
    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        for request_builder in self.request_builders:
            if request_builder.group_name == self.group_name:
                file_import.merge(request_builder.imports())
        return file_import

    def serialize_init(self) -> str:
        template = self.env.get_template("rest_init.py.jinja2")
        return template.render(
            code_model=self.code_model,
            request_builders=[r for r in self.request_builders if not r.is_overload],
        )

    def serialize_request_builders(self) -> str:
        template = self.env.get_template("request_builders.py.jinja2")

        return template.render(
            code_model=self.code_model,
            request_builders=[rb for rb in self.request_builders if not rb.abstract],
            imports=FileImportSerializer(
                self.imports,
            ),
            request_builder_serializer=RequestBuilderSerializer(self.code_model, async_mode=False),
        )
