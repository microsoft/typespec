# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from ..models import CodeModel
from ..models.imports import FileImport, ImportType
from ..models.utils import NamespaceType
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer


class UnionsSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env,
    ):
        super().__init__(code_model=code_model, env=env)

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        if self.code_model.named_unions:
            file_import.add_submodule_import(
                "typing",
                "Union",
                ImportType.STDLIB,
            )
        for nu in self.code_model.named_unions:
            file_import.merge(
                nu.imports(
                    serialize_namespace=self.serialize_namespace,
                    serialize_namespace_type=NamespaceType.UNIONS_FILE,
                )
            )
        return file_import

    def serialize(self) -> str:
        template = self.env.get_template("unions.py.jinja2")
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(self.imports()),
            serializer=self,
        )
