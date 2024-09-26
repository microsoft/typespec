# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

from .base_serializer import BaseSerializer
from ..models import FileImport


class EnumSerializer(BaseSerializer):
    def serialize(self) -> str:
        # Generate the enum file
        template = self.env.get_template("enum_container.py.jinja2")
        return template.render(code_model=self.code_model, file_import=FileImport(self.code_model))
