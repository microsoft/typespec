# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional

from ..models import CodeModel, ModelType
from ..models.imports import FileImport, ImportType
from ..models.utils import NamespaceType
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer


class UnionsSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env,
        models: Optional[list[ModelType]] = None,
    ):
        super().__init__(code_model=code_model, env=env)
        self._models = models or []

    @property
    def discriminated_base_models(self) -> list[ModelType]:
        """Models that are discriminated bases, rendered as Union aliases."""
        return [m for m in self._models if m.base != "json" and m.discriminated_subtypes]

    def imports(self) -> FileImport:
        file_import = FileImport(self.code_model)
        has_unions = bool(self.code_model.named_unions) or bool(self.discriminated_base_models)
        if has_unions:
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

    def discriminated_subtypes_union(self, model: ModelType) -> str:
        subtypes = list(model.discriminated_subtypes.values())
        subtype_names = [s.name for s in subtypes]
        return f"{model.name} = Union[{', '.join(subtype_names)}]"

    def serialize(self) -> str:
        template = self.env.get_template("unions.py.jinja2")
        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(self.imports()),
            serializer=self,
            discriminated_bases=self.discriminated_base_models,
        )
