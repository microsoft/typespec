# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from .import_serializer import FileImportSerializer
from ..models import ImportType, FileImport
from .base_serializer import BaseSerializer


class PatchSerializer(BaseSerializer):
    def serialize(self) -> str:
        template = self.env.get_template("patch.py.jinja2")
        imports = FileImport(self.code_model)
        imports.add_submodule_import("typing", "List", ImportType.STDLIB)
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(imports),
        )
