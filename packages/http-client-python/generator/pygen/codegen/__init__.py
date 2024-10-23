# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from typing import Dict, Any, Union, Optional
from pathlib import Path
import yaml


from .. import Plugin
from ..utils import parse_args
from .models.code_model import CodeModel
from .serializers import JinjaSerializer
from ._utils import DEFAULT_HEADER_TEXT, VALID_PACKAGE_MODE, TYPESPEC_PACKAGE_MODE


def _default_pprint(package_name: str) -> str:
    return " ".join([i.capitalize() for i in package_name.split("-")])


_LOGGER = logging.getLogger(__name__)


class OptionsRetriever:
    OPTIONS_TO_DEFAULT = {
        "azure-arm": False,
        "flavor": "azure",  # need to default to azure in shared code so we don't break swagger generation
        "no-async": False,
        "low-level-client": False,
        "version-tolerant": True,
        "keep-version-file": False,
        "no-namespace-folders": False,
        "basic-setup-py": False,
        "client-side-validation": False,
        "multiapi": False,
        "polymorphic-examples": 5,
        "generate-sample": False,
        "generate-test": False,
        "from-typespec": False,
        "emit-cross-language-definition-file": False,
    }

    @property
    def is_azure_flavor(self) -> bool:
        return self.flavor == "azure"

    def __init__(self, options: Dict[str, Any]) -> None:
        self.options = options

    def __getattr__(self, prop: str) -> Any:
        key = prop.replace("_", "-")
        return self.options.get(key, self.OPTIONS_TO_DEFAULT.get(key))

    @property
    def company_name(self) -> str:
        return self.options.get("company-name", "Microsoft" if self.is_azure_flavor else "")

    @property
    def license_header(self) -> str:
        license_header = self.options.get(
            "header-text",
            (DEFAULT_HEADER_TEXT.format(company_name=self.company_name) if self.company_name else ""),
        )
        if license_header:
            license_header = license_header.replace("\n", "\n# ")
            license_header = (
                "# --------------------------------------------------------------------------\n# " + license_header
            )
            license_header += "\n# --------------------------------------------------------------------------"
        return license_header

    @property
    def show_operations(self) -> bool:
        return self.options.get("show-operations", not self.low_level_client)

    @property
    def _models_mode_default(self) -> str:
        models_mode_default = "none" if self.low_level_client or self.version_tolerant else "msrest"
        if self.options.get("cadl_file") is not None:
            models_mode_default = "dpg"
        return models_mode_default

    @property
    def original_models_mode(self) -> str:
        return self.options.get("models-mode", self._models_mode_default)

    @property
    def models_mode(self) -> Union[str, bool]:
        # switch to falsy value for easier code writing
        return False if self.original_models_mode == "none" else self.original_models_mode

    @property
    def tracing(self) -> bool:
        return self.options.get(
            "tracing",
            self.show_operations and self.is_azure_flavor,
        )

    @property
    def show_send_request(self) -> bool:
        return self.options.get(
            "show-send-request",
            self._low_level_or_version_tolerant,
        )

    @property
    def _low_level_or_version_tolerant(self) -> bool:
        return self.low_level_client or self.version_tolerant

    @property
    def only_path_and_body_params_positional(self) -> bool:
        return self.options.get(
            "only-path-and-body-params-positional",
            self._low_level_or_version_tolerant,
        )

    @property
    def combine_operation_files(self) -> bool:
        return self.options.get(
            "combine-operation-files",
            self.version_tolerant,
        )

    @property
    def package_pprint_name(self) -> str:
        return self.options.get("package-pprint-name") or _default_pprint(str(self.package_name))

    @property
    def default_optional_constants_to_none(self) -> bool:
        return self.options.get(
            "default-optional-constants-to-none",
            self._low_level_or_version_tolerant,
        )

    @property
    def builders_visibility(self) -> str:
        builders_visibility = self.options.get("builders-visibility")
        if builders_visibility is None:
            return "public" if self.low_level_client else "embedded"
        return builders_visibility.lower()

    @property
    def head_as_boolean(self) -> bool:
        head_as_boolean = self.options.get("head-as-boolean", True)
        # Force some options in ARM MODE
        return True if self.azure_arm else head_as_boolean

    @property
    def package_mode(self) -> str:
        return self.options.get("packaging-files-dir") or self.options.get("package-mode", "")

    @property
    def packaging_files_config(self) -> Optional[Dict[str, Any]]:
        packaging_files_config = self.options.get("packaging-files-config")
        if packaging_files_config is None:
            return None
        # packaging-files-config is either a string or a dict
        # if it's a string, we can split on the comma to get the dict
        # otherwise we just return
        try:
            return {k.strip(): v.strip() for k, v in [i.split(":") for i in packaging_files_config.split("|")]}
        except AttributeError:
            return packaging_files_config

    @property
    def package_version(self) -> Optional[str]:
        return str(self.options.get("package-version", ""))


class CodeGenerator(Plugin):
    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.options_retriever = OptionsRetriever(self.options)

    def _validate_code_model_options(self) -> None:
        if self.options_retriever.builders_visibility not in [
            "public",
            "hidden",
            "embedded",
        ]:
            raise ValueError("The value of --builders-visibility must be either 'public', 'hidden', or 'embedded'")

        if self.options_retriever.original_models_mode not in ["msrest", "dpg", "none"]:
            raise ValueError(
                "--models-mode can only be 'msrest', 'dpg' or 'none'. "
                "Pass in 'msrest' if you want msrest models, or "
                "'none' if you don't want any."
            )

        if not self.options_retriever.show_operations and self.options_retriever.builders_visibility == "embedded":
            raise ValueError(
                "Can not embed builders without operations. "
                "Either set --show-operations to True, or change the value of --builders-visibility "
                "to 'public' or 'hidden'."
            )

        if self.options_retriever.basic_setup_py and not self.options_retriever.package_version:
            raise ValueError("--basic-setup-py must be used with --package-version")

        if self.options_retriever.package_mode and not self.options_retriever.package_version:
            raise ValueError("--package-mode must be used with --package-version")

        if not self.options_retriever.show_operations and self.options_retriever.combine_operation_files:
            raise ValueError(
                "Can not combine operation files if you are not showing operations. "
                "If you want operation files, pass in flag --show-operations"
            )

        if self.options_retriever.package_mode:
            if (
                (
                    self.options_retriever.package_mode not in TYPESPEC_PACKAGE_MODE
                    and self.options_retriever.from_typespec
                )
                or (
                    self.options_retriever.package_mode not in VALID_PACKAGE_MODE
                    and not self.options_retriever.from_typespec
                )
            ) and not Path(self.options_retriever.package_mode).exists():
                raise ValueError(
                    f"--package-mode can only be {' or '.join(TYPESPEC_PACKAGE_MODE)} or directory which contains template files"  # pylint: disable=line-too-long
                )

        if self.options_retriever.multiapi and self.options_retriever.version_tolerant:
            raise ValueError(
                "Can not currently generate version tolerant multiapi SDKs. "
                "We are working on creating a new multiapi SDK for version tolerant and it is not available yet."
            )

        if self.options_retriever.client_side_validation and self.options_retriever.version_tolerant:
            raise ValueError("Can not generate version tolerant with --client-side-validation. ")

        if not (self.options_retriever.azure_arm or self.options_retriever.version_tolerant):
            _LOGGER.warning(
                "You are generating with options that would not allow the SDK to be shipped as an official Azure SDK. "
                "Please read https://aka.ms/azsdk/dpcodegen for more details."
            )

        if not self.options_retriever.is_azure_flavor and self.options_retriever.tracing:
            raise ValueError("Can only have tracing turned on for Azure SDKs.")

    @staticmethod
    def remove_cloud_errors(yaml_data: Dict[str, Any]) -> None:
        for client in yaml_data["clients"]:
            for group in client["operationGroups"]:
                for operation in group["operations"]:
                    if not operation.get("exceptions"):
                        continue
                    i = 0
                    while i < len(operation["exceptions"]):
                        exception = operation["exceptions"][i]
                        if (
                            exception.get("schema")
                            and exception["schema"]["language"]["default"]["name"] == "CloudError"
                        ):
                            del operation["exceptions"][i]
                            i -= 1
                        i += 1
        if yaml_data.get("schemas") and yaml_data["schemas"].get("objects"):
            for i in range(len(yaml_data["schemas"]["objects"])):
                obj_schema = yaml_data["schemas"]["objects"][i]
                if obj_schema["language"]["default"]["name"] == "CloudError":
                    del yaml_data["schemas"]["objects"][i]
                    break

    def _build_code_model_options(self) -> Dict[str, Any]:
        flags = [
            "azure_arm",
            "head_as_boolean",
            "license_header",
            "keep_version_file",
            "no_async",
            "no_namespace_folders",
            "basic_setup_py",
            "package_name",
            "package_version",
            "client_side_validation",
            "tracing",
            "multiapi",
            "polymorphic_examples",
            "models_mode",
            "builders_visibility",
            "show_operations",
            "show_send_request",
            "only_path_and_body_params_positional",
            "version_tolerant",
            "low_level_client",
            "combine_operation_files",
            "package_mode",
            "package_pprint_name",
            "packaging_files_config",
            "default_optional_constants_to_none",
            "generate_sample",
            "generate_test",
            "default_api_version",
            "from_typespec",
            "flavor",
            "company_name",
            "emit_cross_language_definition_file",
        ]
        return {f: getattr(self.options_retriever, f) for f in flags}

    def get_yaml(self) -> Dict[str, Any]:
        # cadl file doesn't have to be relative to output folder
        with open(self.options["cadl_file"], "r", encoding="utf-8-sig") as fd:
            return yaml.safe_load(fd.read())

    def get_serializer(self, code_model: CodeModel):
        return JinjaSerializer(code_model, output_folder=self.output_folder)

    def process(self) -> bool:
        # List the input file, should be only one
        self._validate_code_model_options()
        options = self._build_code_model_options()
        yaml_data = self.get_yaml()

        if self.options_retriever.azure_arm:
            self.remove_cloud_errors(yaml_data)

        code_model = CodeModel(yaml_data=yaml_data, options=options)
        if not self.options_retriever.is_azure_flavor and any(client.lro_operations for client in code_model.clients):
            raise ValueError("Only support LROs for Azure SDKs")
        serializer = self.get_serializer(code_model)
        serializer.serialize()

        return True


if __name__ == "__main__":
    # CADL pipeline will call this
    parsed_args, unknown_args = parse_args()
    CodeGenerator(
        output_folder=parsed_args.output_folder,
        cadl_file=parsed_args.cadl_file,
        **unknown_args,
    ).process()
