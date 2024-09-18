# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from typing import List, Optional, Any, Union
from pathlib import Path
from jinja2 import PackageLoader, Environment, FileSystemLoader, StrictUndefined

from ... import ReaderAndWriter
from ..models import (
    OperationGroup,
    RequestBuilder,
    OverloadedRequestBuilder,
    CodeModel,
    Client,
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
    get_all_operation_groups_recursively,
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

    def _serialize_namespace_level(self, env: Environment, namespace_path: Path, clients: List[Client]) -> None:
        # if there was a patch file before, we keep it
        self._keep_patch_file(namespace_path / Path("_patch.py"), env)
        if self.has_aio_folder:
            self._keep_patch_file(namespace_path / Path("aio") / Path("_patch.py"), env)

        if self.has_operations_folder:
            self._keep_patch_file(
                namespace_path / Path(self.code_model.operations_folder_name) / Path("_patch.py"),
                env,
            )
            if self.has_aio_folder:
                self._keep_patch_file(
                    namespace_path / Path("aio") / Path(self.code_model.operations_folder_name) / Path("_patch.py"),
                    env,
                )
        self._serialize_and_write_top_level_folder(env=env, namespace_path=namespace_path, clients=clients)

        if any(c for c in self.code_model.clients if c.operation_groups):
            if self.code_model.options["builders_visibility"] != "embedded":
                self._serialize_and_write_rest_layer(env=env, namespace_path=namespace_path)
            if self.has_aio_folder:
                self._serialize_and_write_aio_top_level_folder(
                    env=env,
                    namespace_path=namespace_path,
                    clients=clients,
                )

        if self.has_operations_folder:
            self._serialize_and_write_operations_folder(clients, env=env, namespace_path=namespace_path)
            if self.code_model.options["multiapi"]:
                self._serialize_and_write_metadata(env=env, namespace_path=namespace_path)
        if self.code_model.options["package_mode"]:
            self._serialize_and_write_package_files(namespace_path=namespace_path)

        if (
            self.code_model.options["show_operations"]
            and self.code_model.has_operations
            and self.code_model.options["generate_sample"]
        ):
            self._serialize_and_write_sample(env, namespace_path)

        if (
            self.code_model.options["show_operations"]
            and self.code_model.has_operations
            and self.code_model.options["generate_test"]
        ):
            self._serialize_and_write_test(env, namespace_path)

    def serialize(self) -> None:
        env = Environment(
            loader=PackageLoader("pygen.codegen", "templates"),
            keep_trailing_newline=True,
            line_statement_prefix="##",
            line_comment_prefix="###",
            trim_blocks=True,
            lstrip_blocks=True,
        )

        namespace_path = (
            Path(".") if self.code_model.options["no_namespace_folders"] else Path(*self._name_space().split("."))
        )

        p = namespace_path.parent
        general_serializer = GeneralSerializer(code_model=self.code_model, env=env, async_mode=False)
        while p != Path("."):
            # write pkgutil init file
            self.write_file(
                p / Path("__init__.py"),
                general_serializer.serialize_pkgutil_init_file(),
            )
            p = p.parent

        # serialize main module
        self._serialize_namespace_level(
            env,
            namespace_path,
            [c for c in self.code_model.clients if c.has_operations],
        )
        # serialize sub modules
        for (
            subnamespace,
            clients,
        ) in self.code_model.subnamespace_to_clients.items():
            subnamespace_path = namespace_path / Path(subnamespace)
            self._serialize_namespace_level(env, subnamespace_path, [c for c in clients if c.has_operations])

        if self.code_model.options["models_mode"] and (self.code_model.model_types or self.code_model.enums):
            self._keep_patch_file(namespace_path / Path("models") / Path("_patch.py"), env)

        if self.code_model.options["models_mode"] and (self.code_model.model_types or self.code_model.enums):
            self._serialize_and_write_models_folder(env=env, namespace_path=namespace_path)
        if not self.code_model.options["models_mode"]:
            # keep models file if users ended up just writing a models file
            if self.read_file(namespace_path / Path("models.py")):
                self.write_file(
                    namespace_path / Path("models.py"),
                    self.read_file(namespace_path / Path("models.py")),
                )
        if self.code_model.named_unions:
            self.write_file(
                namespace_path / Path("_types.py"),
                TypesSerializer(code_model=self.code_model, env=env).serialize(),
            )

    def _serialize_and_write_package_files(self, namespace_path: Path) -> None:
        root_of_sdk = self._package_root_folder(namespace_path)
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

    def _serialize_and_write_models_folder(self, env: Environment, namespace_path: Path) -> None:
        # Write the models folder
        models_path = namespace_path / Path("models")
        serializer = DpgModelSerializer if self.code_model.options["models_mode"] == "dpg" else MsrestModelSerializer
        if self.code_model.model_types:
            self.write_file(
                models_path / Path(f"{self.code_model.models_filename}.py"),
                serializer(code_model=self.code_model, env=env).serialize(),
            )
        if self.code_model.enums:
            self.write_file(
                models_path / Path(f"{self.code_model.enums_filename}.py"),
                EnumSerializer(code_model=self.code_model, env=env).serialize(),
            )
        self.write_file(
            models_path / Path("__init__.py"),
            ModelInitSerializer(code_model=self.code_model, env=env).serialize(),
        )

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

    def _serialize_and_write_operations_file(
        self,
        env: Environment,
        clients: List[Client],
        namespace_path: Path,
        operation_group: Optional[OperationGroup] = None,
    ) -> None:
        filename = operation_group.filename if operation_group else "_operations"
        # write first sync file
        operation_group_serializer = OperationGroupsSerializer(
            code_model=self.code_model,
            clients=clients,
            env=env,
            async_mode=False,
            operation_group=operation_group,
        )
        self.write_file(
            namespace_path / Path(self.code_model.operations_folder_name) / Path(f"{filename}.py"),
            operation_group_serializer.serialize(),
        )

        if self.has_aio_folder:
            # write async operation group and operation files
            operation_group_async_serializer = OperationGroupsSerializer(
                code_model=self.code_model,
                clients=clients,
                env=env,
                async_mode=True,
                operation_group=operation_group,
            )
            self.write_file(
                (namespace_path / Path("aio") / Path(self.code_model.operations_folder_name) / Path(f"{filename}.py")),
                operation_group_async_serializer.serialize(),
            )

    def _serialize_and_write_operations_folder(
        self, clients: List[Client], env: Environment, namespace_path: Path
    ) -> None:
        # write sync operations init file
        operations_init_serializer = OperationsInitSerializer(
            code_model=self.code_model, clients=clients, env=env, async_mode=False
        )
        self.write_file(
            namespace_path / Path(self.code_model.operations_folder_name) / Path("__init__.py"),
            operations_init_serializer.serialize(),
        )

        # write async operations init file
        if self.has_aio_folder:
            operations_async_init_serializer = OperationsInitSerializer(
                code_model=self.code_model, clients=clients, env=env, async_mode=True
            )
            self.write_file(
                namespace_path / Path("aio") / Path(self.code_model.operations_folder_name) / Path("__init__.py"),
                operations_async_init_serializer.serialize(),
            )

        if self.code_model.options["combine_operation_files"]:
            self._serialize_and_write_operations_file(
                env=env,
                namespace_path=namespace_path,
                clients=clients,
            )
        else:
            for operation_group in get_all_operation_groups_recursively(self.code_model.clients):
                self._serialize_and_write_operations_file(
                    env=env,
                    namespace_path=namespace_path,
                    operation_group=operation_group,
                    clients=clients,
                )

    def _serialize_and_write_version_file(
        self,
        namespace_path: Path,
        general_serializer: GeneralSerializer,
    ):
        def _read_version_file(original_version_file_name: str) -> str:
            return self.read_file(namespace_path / original_version_file_name)

        def _write_version_file(original_version_file_name: str) -> None:
            self.write_file(
                namespace_path / Path("_version.py"),
                _read_version_file(original_version_file_name),
            )

        keep_version_file = self.code_model.options["keep_version_file"]
        if keep_version_file and _read_version_file("_version.py"):
            _write_version_file(original_version_file_name="_version.py")
        elif keep_version_file and _read_version_file("version.py"):
            _write_version_file(original_version_file_name="version.py")
        elif self.code_model.options["package_version"]:
            self.write_file(
                namespace_path / Path("_version.py"),
                general_serializer.serialize_version_file(),
            )

    def _serialize_client_and_config_files(
        self,
        namespace_path: Path,
        general_serializer: GeneralSerializer,
        async_mode: bool,
        clients: List[Client],
    ) -> None:
        if self.code_model.has_operations:
            namespace_path = namespace_path / Path("aio") if async_mode else namespace_path
            self.write_file(
                namespace_path / Path(f"{self.code_model.client_filename}.py"),
                general_serializer.serialize_service_client_file(clients),
            )
            self.write_file(
                namespace_path / Path("_configuration.py"),
                general_serializer.serialize_config_file(clients),
            )

    def _serialize_and_write_top_level_folder(
        self, env: Environment, namespace_path: Path, clients: List[Client]
    ) -> None:
        general_serializer = GeneralSerializer(code_model=self.code_model, env=env, async_mode=False)

        self.write_file(
            namespace_path / Path("__init__.py"),
            general_serializer.serialize_init_file(clients),
        )

        # Write the service client
        self._serialize_client_and_config_files(namespace_path, general_serializer, async_mode=False, clients=clients)
        if self.code_model.need_vendored_code(async_mode=False):
            self.write_file(
                namespace_path / Path("_vendor.py"),
                general_serializer.serialize_vendor_file(clients),
            )

        self._serialize_and_write_version_file(namespace_path, general_serializer)

        # write the empty py.typed file
        self.write_file(namespace_path / Path("py.typed"), "# Marker file for PEP 561.")

        if not self.code_model.options["client_side_validation"] and not self.code_model.options["multiapi"]:
            self.write_file(
                namespace_path / Path("_serialization.py"),
                general_serializer.serialize_serialization_file(),
            )
        if self.code_model.options["models_mode"] == "dpg":
            self.write_file(
                namespace_path / Path("_model_base.py"),
                general_serializer.serialize_model_base_file(),
            )

        if any(og for client in self.code_model.clients for og in client.operation_groups if og.need_validation):
            self.write_file(
                namespace_path / Path("_validation.py"),
                general_serializer.serialize_validation_file(),
            )
        if self.code_model.options.get("emit_cross_language_definition_file"):
            self.write_file(
                Path("./apiview_mapping_python.json"),
                general_serializer.serialize_cross_language_definition_file(),
            )

        # Write the setup file
        if self.code_model.options["basic_setup_py"]:
            self.write_file(Path("setup.py"), general_serializer.serialize_setup_file())

    def _serialize_and_write_aio_top_level_folder(
        self, env: Environment, namespace_path: Path, clients: List[Client]
    ) -> None:
        aio_general_serializer = GeneralSerializer(code_model=self.code_model, env=env, async_mode=True)

        aio_path = namespace_path / Path("aio")

        # Write the __init__ file
        self.write_file(
            aio_path / Path("__init__.py"),
            aio_general_serializer.serialize_init_file(clients),
        )

        # Write the service client
        self._serialize_client_and_config_files(
            namespace_path, aio_general_serializer, async_mode=True, clients=clients
        )
        if self.code_model.need_vendored_code(async_mode=True):
            self.write_file(
                aio_path / Path("_vendor.py"),
                aio_general_serializer.serialize_vendor_file(clients),
            )

    def _serialize_and_write_metadata(self, env: Environment, namespace_path: Path) -> None:
        metadata_serializer = MetadataSerializer(self.code_model, env)
        self.write_file(namespace_path / Path("_metadata.json"), metadata_serializer.serialize())

    @property
    def _namespace_from_package_name(self) -> str:
        return get_namespace_from_package_name(self.code_model.options["package_name"])

    def _name_space(self) -> str:
        if self.code_model.namespace.count(".") >= self._namespace_from_package_name.count("."):
            return self.code_model.namespace

        return self._namespace_from_package_name

    # find root folder where "setup.py" is
    def _package_root_folder(self, namespace_path: Path) -> Path:
        return namespace_path / Path("../" * (self._name_space().count(".") + 1))

    @property
    def _additional_folder(self) -> Path:
        namespace_config = get_namespace_config(self.code_model.namespace, self.code_model.options["multiapi"])
        num_of_namespace = namespace_config.count(".") + 1
        num_of_package_namespace = self._namespace_from_package_name.count(".") + 1
        if num_of_namespace > num_of_package_namespace:
            return Path("/".join(namespace_config.split(".")[num_of_package_namespace:]))
        return Path("")

    def _serialize_and_write_sample(self, env: Environment, namespace_path: Path):
        out_path = self._package_root_folder(namespace_path) / Path("generated_samples")
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

    def _serialize_and_write_test(self, env: Environment, namespace_path: Path):
        self.code_model.for_test = True
        out_path = self._package_root_folder(namespace_path) / Path("generated_tests")
        general_serializer = TestGeneralSerializer(code_model=self.code_model, env=env)
        self.write_file(out_path / "conftest.py", general_serializer.serialize_conftest())
        if not self.code_model.options["azure_arm"]:
            for is_async in (True, False):
                async_suffix = "_async" if is_async else ""
                general_serializer.is_async = is_async
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
                for is_async in (True, False):
                    try:
                        test_serializer.is_async = is_async
                        self.write_file(
                            out_path / f"{to_snake_case(test_serializer.test_class_name)}.py",
                            test_serializer.serialize_test(),
                        )
                    except Exception as e:  # pylint: disable=broad-except
                        # test generation shall not block code generation, so just log error
                        log_error = f"error happens in test generation for operation group {og.class_name}: {e}"
                        _LOGGER.error(log_error)
        self.code_model.for_test = False
