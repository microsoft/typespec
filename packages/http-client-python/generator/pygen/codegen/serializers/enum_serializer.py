# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional, List
from jinja2 import Environment
from .base_serializer import BaseSerializer
from ..models import FileImport, CodeModel, EnumType


class EnumSerializer(BaseSerializer):

    def __init__(
        self,
        code_model: CodeModel,
        env: Environment,
        async_mode: bool = False,
        *,
        enums: List[EnumType],
        client_namespace: Optional[str] = None
    ):
        super().__init__(code_model, env, async_mode=async_mode, client_namespace=client_namespace)
        self.enums = enums

    def serialize(self) -> str:
        # Generate the enum file
        template = self.env.get_template("enum_container.py.jinja2")
        return template.render(code_model=self.code_model, file_import=FileImport(self.code_model), enums=self.enums)
