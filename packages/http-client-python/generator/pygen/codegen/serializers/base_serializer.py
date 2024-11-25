# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Optional
from jinja2 import Environment
from ..models import (
    FileImport,
    CodeModel,
)


class BaseSerializer:
    """Base serializer for SDK root level files"""

    def __init__(self, code_model: CodeModel, env: Environment, *, serialize_namespace: Optional[str] = None):
        self.code_model = code_model
        self.env = env
        self.serialize_namespace = serialize_namespace or code_model.namespace

    def init_file_import(self) -> FileImport:
        return FileImport(self.code_model)
