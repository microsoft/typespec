# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json
from typing import Any, List
from .import_serializer import FileImportSerializer, TypingSection
from ..models.imports import MsrestImportType, FileImport
from ..models import (
    ImportType,
    TokenCredentialType,
    Client,
)
from ..models.utils import NamespaceType
from .client_serializer import ClientSerializer, ConfigSerializer
from .base_serializer import BaseSerializer

VERSION_MAP = {
    "msrest": "0.7.1",
    "isodate": "0.6.1",
    "azure-mgmt-core": "1.5.0",
    "azure-core": "1.30.0",
    "typing-extensions": "4.6.0",
    "corehttp": "1.0.0b6",
}

MIN_PYTHON_VERSION = "3.9"
MAX_PYTHON_VERSION = "3.12"


class GeneralSerializer(BaseSerializer):
    """General serializer for SDK root level files"""

    def serialize_setup_file(self) -> str:
        template = self.env.get_template("packaging_templates/setup.py.jinja2")
        params = {
            "VERSION_MAP": VERSION_MAP,
            "MIN_PYTHON_VERSION": MIN_PYTHON_VERSION,
            "MAX_PYTHON_VERSION": MAX_PYTHON_VERSION,
        }
        params.update({"options": self.code_model.options})
        return template.render(code_model=self.code_model, **params)

    def serialize_package_file(self, template_name: str, **kwargs: Any) -> str:
        template = self.env.get_template(template_name)
        package_parts = (
            self.code_model.namespace.split(".")[:-1]
            if self.code_model.is_tsp
            else (self.code_model.options.get("package-name", "")).split("-")[:-1]
        )
        token_credential = any(
            c for c in self.code_model.clients if isinstance(getattr(c.credential, "type", None), TokenCredentialType)
        )
        version = self.code_model.options.get("package-version", "")
        if any(x in version for x in ["a", "b", "rc"]) or version[0] == "0":
            dev_status = "4 - Beta"
        else:
            dev_status = "5 - Production/Stable"
        params = {
            "code_model": self.code_model,
            "dev_status": dev_status,
            "token_credential": token_credential,
            "pkgutil_names": [".".join(package_parts[: i + 1]) for i in range(len(package_parts))],
            "init_names": ["/".join(package_parts[: i + 1]) + "/__init__.py" for i in range(len(package_parts))],
            "client_name": self.code_model.clients[0].name if self.code_model.clients else "",
            "VERSION_MAP": VERSION_MAP,
            "MIN_PYTHON_VERSION": MIN_PYTHON_VERSION,
            "MAX_PYTHON_VERSION": MAX_PYTHON_VERSION,
        }
        params.update({"options": self.code_model.options})
        params.update(kwargs)
        return template.render(file_import=FileImport(self.code_model), **params)

    def serialize_pkgutil_init_file(self) -> str:
        template = self.env.get_template("pkgutil_init.py.jinja2")
        return template.render()

    def serialize_init_file(self, clients: List[Client]) -> str:
        template = self.env.get_template("init.py.jinja2")
        return template.render(
            code_model=self.code_model,
            clients=clients,
            async_mode=self.async_mode,
            serialize_namespace=self.serialize_namespace,
        )

    def serialize_service_client_file(self, clients: List[Client]) -> str:
        template = self.env.get_template("client_container.py.jinja2")

        imports = FileImport(self.code_model)
        for client in clients:
            imports.merge(
                client.imports(
                    self.async_mode,
                    serialize_namespace=self.serialize_namespace,
                    serialize_namespace_type=NamespaceType.CLIENT,
                )
            )

        return template.render(
            code_model=self.code_model,
            clients=clients,
            async_mode=self.async_mode,
            get_serializer=ClientSerializer,
            imports=FileImportSerializer(imports),
            serialize_namespace=self.serialize_namespace,
        )

    def need_utils_utils_file(self) -> str:
        template = self.env.get_template("utils.py.jinja2")
        clients = self.code_model.get_clients(self.client_namespace)

        # configure imports
        file_import = FileImport(self.code_model)
        if self.code_model.need_utils_mixin:
            file_import.add_submodule_import(
                "abc",
                "ABC",
                ImportType.STDLIB,
            )
            file_import.add_msrest_import(
                serialize_namespace=f"{self.serialize_namespace}._utils",
                msrest_import_type=MsrestImportType.SerializerDeserializer,
                typing_section=TypingSection.TYPING,
            )
            file_import.add_submodule_import("typing", "TypeVar", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Generic", ImportType.STDLIB)
        if self.code_model.need_utils_etag(self.client_namespace):
            file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB)
            file_import.add_submodule_import(
                "",
                "MatchConditions",
                ImportType.SDKCORE,
            )
        if self.code_model.need_utils_form_data(self.async_mode, self.client_namespace):
            file_import.add_submodule_import("typing", "IO", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Tuple", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Union", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Mapping", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Dict", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "Any", ImportType.STDLIB)
            file_import.add_submodule_import("typing", "List", ImportType.STDLIB)
            file_import.add_submodule_import(
                ".._utils.model_base",
                "SdkJSONEncoder",
                ImportType.LOCAL,
            )
            file_import.add_submodule_import(
                ".._utils.model_base",
                "Model",
                ImportType.LOCAL,
            )
            file_import.add_import("json", ImportType.STDLIB)

        return template.render(
            code_model=self.code_model,
            imports=FileImportSerializer(
                file_import,
            ),
            async_mode=self.async_mode,
            clients=clients,
            client_namespace=self.client_namespace,
        )

    def serialize_config_file(self, clients: List[Client]) -> str:
        template = self.env.get_template("config_container.py.jinja2")
        imports = FileImport(self.code_model)
        for client in self.code_model.clients:
            imports.merge(
                client.config.imports(
                    self.async_mode,
                    serialize_namespace=self.serialize_namespace,
                    serialize_namespace_type=NamespaceType.CLIENT,
                )
            )
        return template.render(
            code_model=self.code_model,
            async_mode=self.async_mode,
            imports=FileImportSerializer(imports),
            get_serializer=ConfigSerializer,
            clients=clients,
            serialize_namespace=self.serialize_namespace,
        )

    def serialize_version_file(self) -> str:
        template = self.env.get_template("version.py.jinja2")
        return template.render(code_model=self.code_model)

    def serialize_serialization_file(self) -> str:
        template = self.env.get_template("serialization.py.jinja2")
        return template.render(
            code_model=self.code_model,
        )

    def serialize_model_base_file(self) -> str:
        template = self.env.get_template("model_base.py.jinja2")
        return template.render(code_model=self.code_model, file_import=FileImport(self.code_model))

    def serialize_validation_file(self) -> str:
        template = self.env.get_template("validation.py.jinja2")
        return template.render(code_model=self.code_model)

    def serialize_cross_language_definition_file(self) -> str:
        cross_langauge_def_dict = {
            f"{model.client_namespace}.models.{model.name}": model.cross_language_definition_id
            for model in self.code_model.public_model_types
        }
        cross_langauge_def_dict.update(
            {
                f"{self.code_model.namespace}.models.{enum.name}": enum.cross_language_definition_id
                for enum in self.code_model.enums
                if not enum.internal
            }
        )
        for client in self.code_model.clients:
            for operation_group in client.operation_groups:
                for operation in operation_group.operations:
                    if operation.name.startswith("_"):
                        continue
                    cross_langauge_def_dict.update(
                        {
                            f"{self.code_model.namespace}."
                            + (
                                f"{client.name}."
                                if operation_group.is_mixin
                                else f"operations.{operation_group.class_name}."
                            )
                            + f"{operation.name}": operation.cross_language_definition_id
                        }
                    )
                    cross_langauge_def_dict.update(
                        {
                            f"{self.code_model.namespace}.aio."
                            + (
                                f"{client.name}."
                                if operation_group.is_mixin
                                else f"operations.{operation_group.class_name}."
                            )
                            + f"{operation.name}": operation.cross_language_definition_id
                        }
                    )
        return json.dumps(
            {
                "CrossLanguagePackageId": self.code_model.cross_language_package_id,
                "CrossLanguageDefinitionId": cross_langauge_def_dict,
            },
            indent=4,
        )
