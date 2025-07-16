# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import List
from jinja2 import Environment

from ..models import CodeModel, OperationGroup


class OperationsInitSerializer:
    def __init__(
        self,
        code_model: CodeModel,
        operation_groups: List[OperationGroup],
        env: Environment,
        async_mode: bool,
    ) -> None:
        self.code_model = code_model
        self.operation_groups = [og for og in operation_groups if not og.has_parent_operation_group]
        self.env = env
        self.async_mode = async_mode

    def operation_group_imports(self) -> List[str]:
        def _get_filename(operation_group: OperationGroup) -> str:
            return "_operations" if self.code_model.options["combine-operation-files"] else operation_group.filename

        return [
            f"from .{_get_filename(og)} import {og.class_name}  # type: ignore"
            for og in self.operation_groups
            if not og.is_mixin or self.code_model.options["multiapi"]
        ]

    def serialize(self) -> str:
        operation_group_init_template = self.env.get_template("operations_folder_init.py.jinja2")

        return operation_group_init_template.render(
            code_model=self.code_model,
            async_mode=self.async_mode,
            operation_group_imports=self.operation_group_imports,
            operation_groups=self.operation_groups,
        )
