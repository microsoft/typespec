# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from collections import namedtuple
import re
from typing import List, Any, Union
from pathlib import Path
from jinja2 import PackageLoader, Environment, FileSystemLoader, StrictUndefined

from ... import ReaderAndWriter
from ..models import (
    OperationGroup,
    RequestBuilder,
    OverloadedRequestBuilder,
    CodeModel,
    Client,
    ModelType,
    EnumType,
)
from .enum_serializer import EnumSerializer
from .general_serializer import GeneralSerializer
from .model_init_serializer import ModelInitSerializer
from .model_serializer import DpgModelSerializer, MsrestModelSerializer
from .operations_init_serializer import OperationsInitSerializer
from .operation_groups_serializer import OperationGroupsSerializer
from .metadata_serializer import MetadataSerializer
from .request_builders_serializer import RequestBuildersSerializer
from .patch_serializer import PatchSerializer
from .sample_serializer import SampleSerializer
from .test_serializer import TestSerializer, TestGeneralSerializer
from .types_serializer import TypesSerializer
from ...utils import to_snake_case
from .._utils import VALID_PACKAGE_MODE
from .utils import (
    extract_sample_name,
    get_namespace_from_package_name,
    get_namespace_config,
)

_LOGGER = logging.getLogger(__name__)

__all__ = [
    "JinjaSerializer",
]

_PACKAGE_FILES = [
    "CHANGELOG.md.jinja2",
    "dev_requirements.txt.jinja2",
    "LICENSE.jinja2",
    "MANIFEST.in.jinja2",
    "README.md.jinja2",
    "setup.py.jinja2",
]

_REGENERATE_FILES = {"setup.py", "MANIFEST.in"}
AsyncInfo = namedtuple("AsyncInfo", ["async_mode", "async_path"])


# extract sub folders. For example, source_file_path is like:
# "xxx/resource-manager/Microsoft.XX/stable/2023-04-01/examples/Compute/createOrUpdate/AKSCompute.json",
# and we want to extract the sub folders after "examples/", which is "compute/create_or_update"
def _sample_output_path(source_file_path: str) -> Path:
    posix_path = Path(source_file_path).as_posix()
    if "examples/" in posix_path:
        after_examples = Path(posix_path.split("examples/", maxsplit=1)[-1]).parent
        return Path("/".join([to_snake_case(i) for i in after_examples.parts]))
    return Path("")


class JinjaSerializer(ReaderAndWriter):
    def __init__(
        self,
        code_model: CodeModel,
        *,
        output_folder: Union[str, Path],
        **kwargs: Any,
    ) -> None:
        super().__init__(output_folder=output_folder, **kwargs)
        self.code_model = code_model

    @property
    def has_aio_folder(self) -> bool:
        return not self.code_model.options["no_async"] and bool(self.code_model.has_operations)

    @property
    def has_operations_folder(self) -> bool:
        return self.code_model.options["show_operations"] and bool(self.code_model.has_operations)

    @property
    def serialize_loop(self) -> List[AsyncInfo]:
        sync_loop = AsyncInfo(async_mode=False, async_path="")
        async_loop = AsyncInfo(async_mode=True, async_path="aio/")
        return [sync_loop, async_loop] if self.has_aio_folder else [sync_loop]

    @property
    def keep_version_file(self) -> bool:
        if self.options.get("keep_version_file"):
            return True
        # If the version file is already there and the version is greater than the current version, keep it.
        try:
            serialized_version_file = self.read_file(self.exec_path(self.code_model.namespace) / "_version.py")
            match = re.search(r'VERSION\s*=\s*"([^"]+)"', str(serialized_version_file))
            serialized_version = match.group(1) if match else ""
        except (FileNotFoundError, IndexError):
            serialized_version = ""
        return serialized_version > self.code_model.options["package_version"]

    def serialize(self) -> None:
        env = Environment(
            loader=PackageLoader("pygen.codegen", "templates"),
            keep_trailing_newline=True,
            line_statement_prefix="##",
            line_comment_prefix="###",
            trim_blocks=True,
            lstrip_blocks=True,
        )

        general_serializer = GeneralSerializer(code_model=self.code_model, env=env, async_mode=False)
        for client_namespace, client_namespace_type in self.code_model.client_namespace_types.items():
            exec_path = self.exec_path(client_namespace)
            if client_namespace == "":
                # Write the setup file
                if self.code_model.options["basic_setup_py"]:
                    self.write_file(exec_path / Path("setup.py"), general_serializer.serialize_setup_file())

                # add packaging files in root namespace (e.g. setup.py, README.md, etc.)
                if self.code_model.options["package_mode"]:
                    self._serialize_and_write_package_files(client_namespace)

                # write apiview-properties.json
                if self.code_model.options.get("emit_cross_language_definition_file"):
                    self.write_file(
                        exec_path / Path("apiview-properties.json"),
                        general_serializer.serialize_cross_language_definition_file(),
                    )

                # add generated samples and generated tests
                if self.code_model.options["show_operations"] and self.code_model.has_operations:
                    if self.code_model.options["generate_sample"]:
                        self._serialize_and_write_sample(env, namespace=client_namespace)
                    if self.code_model.options["generate_test"]:
                        self._serialize_and_write_test(env, namespace=client_namespace)
            elif client_namespace_type.clients:
                # add clients folder if there are clients in this namespace
                self._serialize_client_and_config_files(client_namespace, client_namespace_type.clients, env)
            else:
                # add pkgutil init file if no clients in this namespace
                self.write_file(
                    exec_path / Path("__init__.py"),
                    general_serializer.serialize_pkgutil_init_file(),
                )

            # _model_base.py/_serialization.py/_vendor.py/py.typed/_types.py/_validation.py
            # is always put in top level namespace
            if self.code_model.is_top_namespace(client_namespace):
                self._serialize_and_write_top_level_folder(env=env, namespace=client_namespace)

            # add models folder if there are models in this namespace
            if (
                self.code_model.has_non_json_models(client_namespace_type.models) or client_namespace_type.enums
            ) and self.code_model.options["models_mode"]:
                self._serialize_and_write_models_folder(
                    env=env,
                    namespace=client_namespace,
                    models=client_namespace_type.models,
                    enums=client_namespace_type.enums,
                )

            if not self.code_model.options["models_mode"]:
                # keep models file if users ended up just writing a models file
                model_path = exec_path / Path("models.py")
                if self.read_file(model_path):
                    self.write_file(model_path, self.read_file(model_path))

            # add operations folder if there are operations in this namespace
            if client_namespace_type.operation_groups:
                self._serialize_and_write_operations_folder(
                    client_namespace_type.operation_groups, env=env, namespace=client_namespace
                )
                if self.code_model.options["multiapi"]:
                    self._serialize_and_write_metadata(env=env, namespace=client_namespace)

            # if there are only operations under this namespace, we need to add general __init__.py into `aio` folder
            # to make sure all generated files could be packed into .zip/.whl/.tgz package
            if not client_namespace_type.clients and client_namespace_type.operation_groups and self.has_aio_folder:
                self.write_file(
                    exec_path / Path("aio/__init__.py"),
                    general_serializer.serialize_pkgutil_init_file(),
                )

    def _serialize_and_write_package_files(self, client_namespace: str) -> None:
        root_of_sdk = self.exec_path(client_namespace)
        if self.code_model.options["package_mode"] in VALID_PACKAGE_MODE:
            env = Environment(
                loader=PackageLoader("pygen.codegen", "templates/packaging_templates"),
                undefined=StrictUndefined,
            )

            package_files = _PACKAGE_FILES
        elif Path(self.code_model.options["package_mode"]).exists():
            env = Environment(
                loader=FileSystemLoader(str(Path(self.code_model.options["package_mode"]))),
                keep_trailing_newline=True,
                undefined=StrictUndefined,
            )
            package_files = env.list_templates()
        else:
            return
        serializer = GeneralSerializer(self.code_model, env, async_mode=False)
        params = self.code_model.options["packaging_files_config"] or {}
        for template_name in package_files:
            if not self.code_model.is_azure_flavor and template_name == "dev_requirements.txt.jinja2":
                continue
            file = template_name.replace(".jinja2", "")
            output_name = root_of_sdk / file
            if not self.read_file(output_name) or file in _REGENERATE_FILES:
                if self.keep_version_file and file == "setup.py":
                    # don't regenerate setup.py file if the version file is more up to date
                    continue
                self.write_file(
                    output_name,
                    serializer.serialize_package_file(template_name, **params),
                )

    def _keep_patch_file(self, path_file: Path, env: Environment):
        if self.read_file(path_file):
            self.write_file(path_file, self.read_file(path_file))
        else:
            self.write_file(
                path_file,
                PatchSerializer(env=env, code_model=self.code_model).serialize(),
            )

    def _serialize_and_write_models_folder(
        self, env: Environment, namespace: str, models: List[ModelType], enums: List[EnumType]
    ) -> None:
        # Write the models folder
        models_path = self.exec_path(namespace) / "models"
        serializer = DpgModelSerializer if self.code_model.options["models_mode"] == "dpg" else MsrestModelSerializer
        if self.code_model.has_non_json_models(models):
            self.write_file(
                models_path / Path(f"{self.code_model.models_filename}.py"),
                serializer(code_model=self.code_model, env=env, client_namespace=namespace, models=models).serialize(),
            )
        if enums:
            self.write_file(
                models_path / Path(f"{self.code_model.enums_filename}.py"),
                EnumSerializer(
                    code_model=self.code_model, env=env, client_namespace=namespace, enums=enums
                ).serialize(),
            )
        self.write_file(
            models_path / Path("__init__.py"),
            ModelInitSerializer(code_model=self.code_model, env=env, models=models, enums=enums).serialize(),
        )

        self._keep_patch_file(models_path / Path("_patch.py"), env)

    def _serialize_and_write_rest_layer(self, env: Environment, namespace_path: Path) -> None:
        rest_path = namespace_path / Path(self.code_model.rest_layer_name)
        group_names = {rb.group_name for c in self.code_model.clients for rb in c.request_builders}

        for group_name in group_names:
            request_builders = [
                r for c in self.code_model.clients for r in c.request_builders if r.group_name == group_name
            ]
            self._serialize_and_write_single_rest_layer(env, rest_path, request_builders)
        if not "" in group_names:
            self.write_file(
                rest_path / Path("__init__.py"),
                self.code_model.options["license_header"],
            )

    def _serialize_and_write_single_rest_layer(
        self,
        env: Environment,
        rest_path: Path,
        request_builders: List[Union[RequestBuilder, OverloadedRequestBuilder]],
    ) -> None:
        group_name = request_builders[0].group_name
        output_path = rest_path / Path(group_name) if group_name else rest_path
        # write generic request builders file
        self.write_file(
            output_path / Path("_request_builders.py"),
            RequestBuildersSerializer(
                code_model=self.code_model,
                env=env,
                request_builders=request_builders,
            ).serialize_request_builders(),
        )

        # write rest init file
        self.write_file(
            output_path / Path("__init__.py"),
            RequestBuildersSerializer(
                code_model=self.code_model,
                env=env,
                request_builders=request_builders,
            ).serialize_init(),
        )

    def _serialize_and_write_operations_folder(
        self, operation_groups: List[OperationGroup], env: Environment, namespace: str
    ) -> None:
        operations_folder_name = self.code_model.operations_folder_name(namespace)
        exec_path = self.exec_path(namespace)
        for async_mode, async_path in self.serialize_loop:
            prefix_path = f"{async_path}{operations_folder_name}"
            # write init file
            operations_init_serializer = OperationsInitSerializer(
                code_model=self.code_model, operation_groups=operation_groups, env=env, async_mode=async_mode
            )
            self.write_file(
                exec_path / Path(f"{prefix_path}/__init__.py"),
                operations_init_serializer.serialize(),
            )

            # write operations file
            OgLoop = namedtuple("OgLoop", ["operation_groups", "filename"])
            if self.code_model.options["combine_operation_files"]:
                loops = [OgLoop(operation_groups, "_operations")]
            else:
                loops = [OgLoop([og], og.filename) for og in operation_groups]
            for ogs, filename in loops:
                operation_group_serializer = OperationGroupsSerializer(
                    code_model=self.code_model,
                    operation_groups=ogs,
                    env=env,
                    async_mode=async_mode,
                    client_namespace=namespace,
                )
                self.write_file(
                    exec_path / Path(f"{prefix_path}/{filename}.py"),
                    operation_group_serializer.serialize(),
                )

            # if there was a patch file before, we keep it
            self._keep_patch_file(exec_path / Path(f"{prefix_path}/_patch.py"), env)

    def _serialize_and_write_version_file(
        self,
        namespace: str,
        general_serializer: GeneralSerializer,
    ):
        exec_path = self.exec_path(namespace)

        def _read_version_file(original_version_file_name: str) -> str:
            return self.read_file(exec_path / original_version_file_name)

        def _write_version_file(original_version_file_name: str) -> None:
            self.write_file(
                exec_path / Path("_version.py"),
                _read_version_file(original_version_file_name),
            )

        if self.keep_version_file and _read_version_file("_version.py"):
            _write_version_file(original_version_file_name="_version.py")
        elif self.keep_version_file and _read_version_file("version.py"):
            _write_version_file(original_version_file_name="version.py")
        elif self.code_model.options["package_version"]:
            self.write_file(
                exec_path / Path("_version.py"),
                general_serializer.serialize_version_file(),
            )

    def _serialize_client_and_config_files(
        self,
        namespace: str,
        clients: List[Client],
        env: Environment,
    ) -> None:
        exec_path = self.exec_path(namespace)
        for async_mode, async_path in self.serialize_loop:
            general_serializer = GeneralSerializer(
                code_model=self.code_model, env=env, async_mode=async_mode, client_namespace=namespace
            )
            # when there is client.py, there must be __init__.py
            self.write_file(
                exec_path / Path(f"{async_path}__init__.py"),
                general_serializer.serialize_init_file([c for c in clients if c.has_operations]),
            )

            # if there was a patch file before, we keep it
            self._keep_patch_file(exec_path / Path(f"{async_path}_patch.py"), env)

            if self.code_model.clients_has_operations(clients):

                # write client file
                self.write_file(
                    exec_path / Path(f"{async_path}{self.code_model.client_filename}.py"),
                    general_serializer.serialize_service_client_file(clients),
                )

                # write config file
                self.write_file(
                    exec_path / Path(f"{async_path}_configuration.py"),
                    general_serializer.serialize_config_file(clients),
                )

                # sometimes we need define additional Mixin class for client in _vendor.py
                self._serialize_and_write_vendor_file(env, namespace)

    def _serialize_and_write_vendor_file(self, env: Environment, namespace: str) -> None:
        exec_path = self.exec_path(namespace)
        # write _vendor.py
        for async_mode, async_path in self.serialize_loop:
            if self.code_model.need_vendored_code(async_mode=async_mode, client_namespace=namespace):
                self.write_file(
                    exec_path / Path(f"{async_path}_vendor.py"),
                    GeneralSerializer(
                        code_model=self.code_model, env=env, async_mode=async_mode, client_namespace=namespace
                    ).serialize_vendor_file(),
                )

    def _serialize_and_write_top_level_folder(self, env: Environment, namespace: str) -> None:
        exec_path = self.exec_path(namespace)
        # write _vendor.py
        self._serialize_and_write_vendor_file(env, namespace)

        general_serializer = GeneralSerializer(code_model=self.code_model, env=env, async_mode=False)

        # write _version.py
        self._serialize_and_write_version_file(namespace, general_serializer)

        # write the empty py.typed file
        self.write_file(exec_path / Path("py.typed"), "# Marker file for PEP 561.")

        # write _serialization.py
        if not self.code_model.options["client_side_validation"] and not self.code_model.options["multiapi"]:
            self.write_file(
                exec_path / Path("_serialization.py"),
                general_serializer.serialize_serialization_file(),
            )

        # write _model_base.py
        if self.code_model.options["models_mode"] == "dpg":
            self.write_file(
                exec_path / Path("_model_base.py"),
                general_serializer.serialize_model_base_file(),
            )

        # write _validation.py
        if any(og for client in self.code_model.clients for og in client.operation_groups if og.need_validation):
            self.write_file(
                exec_path / Path("_validation.py"),
                general_serializer.serialize_validation_file(),
            )

        # write _types.py
        if self.code_model.named_unions:
            self.write_file(
                exec_path / Path("_types.py"),
                TypesSerializer(code_model=self.code_model, env=env).serialize(),
            )

    def _serialize_and_write_metadata(self, env: Environment, namespace: str) -> None:
        metadata_serializer = MetadataSerializer(self.code_model, env, client_namespace=namespace)
        self.write_file(self.exec_path(namespace) / Path("_metadata.json"), metadata_serializer.serialize())

    @property
    def _namespace_from_package_name(self) -> str:
        return get_namespace_from_package_name(self.code_model.options["package_name"])

    def _name_space(self) -> str:
        if self.code_model.namespace.count(".") >= self._namespace_from_package_name.count("."):
            return self.code_model.namespace

        return self._namespace_from_package_name

    @property
    def exec_path_compensation(self) -> Path:
        """Assume the process is running in the root folder of the package. If not, we need the path compensation."""
        return (
            Path("../" * (self._name_space().count(".") + 1))
            if self.code_model.options["no_namespace_folders"]
            else Path(".")
        )

    def exec_path_for_test_sample(self, namespace: str) -> Path:
        return self.exec_path_compensation / Path(*namespace.split("."))

    def exec_path(self, namespace: str) -> Path:
        if self.code_model.options["no_namespace_folders"] and not self.code_model.options["multiapi"]:
            return Path(".")
        return self.exec_path_compensation / Path(*namespace.split("."))

    @property
    def _additional_folder(self) -> Path:
        namespace_config = get_namespace_config(self.code_model.namespace, self.code_model.options["multiapi"])
        num_of_namespace = namespace_config.count(".") + 1
        num_of_package_namespace = self._namespace_from_package_name.count(".") + 1
        if num_of_namespace > num_of_package_namespace:
            return Path("/".join(namespace_config.split(".")[num_of_package_namespace:]))
        return Path("")

    def _serialize_and_write_sample(self, env: Environment, namespace: str):
        out_path = self.exec_path_for_test_sample(namespace) / Path("generated_samples")
        for client in self.code_model.clients:
            for op_group in client.operation_groups:
                for operation in op_group.operations:
                    if (
                        self.code_model.options["multiapi"]
                        and operation.api_versions[0] != self.code_model.options["default_api_version"]
                    ):
                        continue
                    samples = operation.yaml_data.get("samples")
                    if not samples or operation.name.startswith("_"):
                        continue
                    for value in samples.values():
                        file = value.get("x-ms-original-file", "sample.json")
                        file_name = to_snake_case(extract_sample_name(file)) + ".py"
                        try:
                            self.write_file(
                                out_path / self._additional_folder / _sample_output_path(file) / file_name,
                                SampleSerializer(
                                    code_model=self.code_model,
                                    env=env,
                                    operation_group=op_group,
                                    operation=operation,
                                    sample=value,
                                    file_name=file_name,
                                ).serialize(),
                            )
                        except Exception as e:  # pylint: disable=broad-except
                            # sample generation shall not block code generation, so just log error
                            log_error = f"error happens in sample {file}: {e}"
                            _LOGGER.error(log_error)

    def _serialize_and_write_test(self, env: Environment, namespace: str):
        self.code_model.for_test = True
        out_path = self.exec_path_for_test_sample(namespace) / Path("generated_tests")
        general_serializer = TestGeneralSerializer(code_model=self.code_model, env=env)
        self.write_file(out_path / "conftest.py", general_serializer.serialize_conftest())
        if not self.code_model.options["azure_arm"]:
            for async_mode in (True, False):
                async_suffix = "_async" if async_mode else ""
                general_serializer.async_mode = async_mode
                self.write_file(
                    out_path / f"testpreparer{async_suffix}.py",
                    general_serializer.serialize_testpreparer(),
                )

        for client in self.code_model.clients:
            for og in client.operation_groups:
                if self.code_model.options["multiapi"] and any(
                    o.api_versions[0] != self.code_model.options["default_api_version"] for o in og.operations
                ):
                    continue
                test_serializer = TestSerializer(self.code_model, env, client=client, operation_group=og)
                for async_mode in (True, False):
                    try:
                        test_serializer.async_mode = async_mode
                        self.write_file(
                            out_path / f"{to_snake_case(test_serializer.test_class_name)}.py",
                            test_serializer.serialize_test(),
                        )
                    except Exception as e:  # pylint: disable=broad-except
                        # test generation shall not block code generation, so just log error
                        log_error = f"error happens in test generation for operation group {og.class_name}: {e}"
                        _LOGGER.error(log_error)
        self.code_model.for_test = False
