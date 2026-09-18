# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from ..models import CodeModel, CombinedType
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

    @property
    def named_unions(self) -> list[CombinedType]:
        result: list[CombinedType] = []
        definitions: dict[str, str] = {}
        for union in self.code_model.named_unions:
            if not union.name:
                continue
            definition = union.type_definition()
            if union.name in definitions:
                if definitions[union.name] != definition:
                    raise ValueError(f"Conflicting definitions for named union {union.name}")
            else:
                result.append(union)
                definitions[union.name] = definition
        return result

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        if self.named_unions:
            file_import.add_submodule_import(
                "typing",
                "TypeAlias",
                ImportType.STDLIB,
            )
            file_import.add_submodule_import(
                "typing",
                "Union",
                ImportType.STDLIB,
            )
        for nu in self.named_unions:
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
            named_unions=self.named_unions,
            imports=FileImportSerializer(self.imports()),
            serializer=self,
        )
