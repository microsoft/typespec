# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from ..models.imports import FileImport, ImportType
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer


class TypesSerializer(BaseSerializer):
    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        if self.code_model.named_unions:
            file_import.add_submodule_import(
                "typing",
                "Union",
                ImportType.STDLIB,
            )
        for nu in self.code_model.named_unions:
            file_import.merge(nu.imports(relative_path=".", model_typing=True, is_types_file=True))
        return file_import

    def serialize(self) -> str:
        # Generate the models
        template = self.env.get_template("types.py.jinja2")
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(self.imports()),
            serializer=self,
        )
