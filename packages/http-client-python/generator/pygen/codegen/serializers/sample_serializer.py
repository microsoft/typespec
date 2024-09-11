# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from typing import Dict, Any, Union, Tuple
from jinja2 import Environment

from ..models.operation import OperationBase
from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer
from ..models import (
    CodeModel,
    KeyCredentialType,
    TokenCredentialType,
    ImportType,
    OperationGroup,
    Parameter,
    BodyParameter,
    FileImport,
)
from .utils import get_namespace_config, get_namespace_from_package_name

_LOGGER = logging.getLogger(__name__)


class SampleSerializer(BaseSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env: Environment,
        operation_group: OperationGroup,
        operation: OperationBase[Any],
        sample: Dict[str, Any],
        file_name: str,
    ) -> None:
        super().__init__(code_model, env)
        self.operation_group = operation_group
        self.operation = operation
        self.sample = sample
        self.file_name = file_name
        self.sample_params = sample.get("parameters", {})

    def _imports(self) -> FileImportSerializer:
        imports = FileImport(self.code_model)
        namespace_from_package_name = get_namespace_from_package_name(self.code_model.options["package_name"])
        namespace_config = get_namespace_config(self.code_model.namespace, self.code_model.options["multiapi"])
        namespace = namespace_from_package_name or namespace_config
        # mainly for "azure-mgmt-rdbms"
        if not self.code_model.options["multiapi"] and namespace_config.count(".") > namespace_from_package_name.count(
            "."
        ):
            namespace = namespace_config
        client = self.code_model.clients[0]
        imports.add_submodule_import(namespace, client.name, ImportType.LOCAL)
        credential_type = getattr(client.credential, "type", None)
        if isinstance(credential_type, TokenCredentialType):
            imports.add_submodule_import("azure.identity", "DefaultAzureCredential", ImportType.SDKCORE)
        elif isinstance(credential_type, KeyCredentialType):
            imports.add_import("os", ImportType.STDLIB)
            imports.add_submodule_import(
                "credentials",
                "AzureKeyCredential",
                ImportType.SDKCORE,
            )
        for param in self.operation.parameters.positional + self.operation.parameters.keyword_only:
            if not param.client_default_value and not param.optional and param.wire_name in self.sample_params:
                imports.merge(param.type.imports_for_sample())
        return FileImportSerializer(imports, True)

    def _client_params(self) -> Dict[str, Any]:
        # client params
        special_param = {}
        credential_type = getattr(self.code_model.clients[0].credential, "type", None)
        if isinstance(credential_type, TokenCredentialType):
            special_param.update({"credential": "DefaultAzureCredential()"})
        elif isinstance(credential_type, KeyCredentialType):
            special_param.update({"credential": 'AzureKeyCredential(key=os.getenv("AZURE_KEY"))'})

        params = [
            p
            for p in (
                self.code_model.clients[0].parameters.positional + self.code_model.clients[0].parameters.keyword_only
            )
            if not (p.optional or p.client_default_value)
        ]
        client_params = {
            p.client_name: special_param.get(
                p.client_name,
                f'"{self.sample_params.get(p.wire_name) or p.client_name.upper()}"',
            )
            for p in params
        }

        return client_params

    @staticmethod
    def handle_param(param: Union[Parameter, BodyParameter], param_value: Any) -> str:
        if isinstance(param_value, str):
            if any(i in param_value for i in '\r\n"'):
                return f'"""{param_value}"""'

        return param.type.serialize_sample_value(param_value)

    # prepare operation parameters
    def _operation_params(self) -> Dict[str, Any]:
        params = [
            p
            for p in (self.operation.parameters.positional + self.operation.parameters.keyword_only)
            if not p.client_default_value
        ]
        failure_info = "fail to find required param named {}"
        operation_params = {}
        for param in params:
            if not param.optional:
                param_value = self.sample_params.get(param.wire_name)
                if not param_value:
                    raise Exception(failure_info.format(param.client_name))  # pylint: disable=broad-exception-raised
                operation_params[param.client_name] = self.handle_param(param, param_value)
        return operation_params

    def _operation_group_name(self) -> str:
        if self.operation_group.is_mixin:
            return ""
        return f".{self.operation_group.property_name}"

    def _operation_result(self) -> Tuple[str, str]:
        is_response_none = "None" in self.operation.response_type_annotation(async_mode=False)
        lro = ".result()"
        if is_response_none:
            paging, normal_print, return_var = "", "", ""
        else:
            paging = "\n    for item in response:\n        print(item)"
            normal_print = "\n    print(response)"
            return_var = "response = "

        if self.operation.operation_type == "paging":
            return paging, return_var
        if self.operation.operation_type == "lro":
            return lro + normal_print, return_var
        if self.operation.operation_type == "lropaging":
            return lro + paging, return_var
        return normal_print, return_var

    def _operation_name(self) -> str:
        return f".{self.operation.name}"

    def _origin_file(self) -> str:
        name = self.sample.get("x-ms-original-file", "")
        if "specification" in name:
            return "specification" + name.split("specification")[-1]
        return name if self.code_model.options["from_typespec"] else ""

    def serialize(self) -> str:
        operation_result, return_var = self._operation_result()
        return self.env.get_template("sample.py.jinja2").render(
            code_model=self.code_model,
            file_name=self.file_name,
            operation_result=operation_result,
            operation_params=self._operation_params(),
            operation_group_name=self._operation_group_name(),
            operation_name=self._operation_name(),
            imports=self._imports(),
            client_params=self._client_params(),
            origin_file=self._origin_file(),
            return_var=return_var,
        )
