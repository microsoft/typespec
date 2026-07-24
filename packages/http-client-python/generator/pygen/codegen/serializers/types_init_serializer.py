# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from jinja2 import Environment

from ..models import CodeModel, ModelType
from ..models.enum_type import EnumType


class TypesInitSerializer:
    def __init__(
        self,
        code_model: CodeModel,
        env: Environment,
        *,
        models: list[ModelType],
        discriminated_bases: list[ModelType],
        enums: list[EnumType],
    ) -> None:
        self.code_model = code_model
        self.env = env
        self.models = models
        self.discriminated_bases = discriminated_bases
        self.enums = enums

    def serialize(self) -> str:
        type_names = [m.name for m in self.models]
        type_names.extend(m.name for m in self.discriminated_bases)
        type_names.extend(e.name for e in self.enums if not e.internal)
        type_names.sort()
        template = self.env.get_template("types_init.py.jinja2")
        return template.render(code_model=self.code_model, types=type_names)
