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

    def __init__(
        self,
        code_model: CodeModel,
        env: Environment,
        async_mode: bool = False,
        *,
        client_namespace: Optional[str] = None
    ):
        self.code_model = code_model
        self.env = env
        self.async_mode = async_mode
        self.client_namespace = code_model.namespace if client_namespace is None else client_namespace

    def init_file_import(self) -> FileImport:
        return FileImport(self.code_model)

    # get namespace of serialize file from client namespace.
    # For async API, serialize namespace will have additional suffix '.aio' compared with client namespace;
    # For models, there will be additional '.models';
    # For operations, there will be additional '.operations' or '._operations';
    @property
    def serialize_namespace(self) -> str:
        return self.code_model.get_serialize_namespace(self.client_namespace, async_mode=self.async_mode)
