# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any, Dict, TYPE_CHECKING, TypeVar, Generic, Union, List, Optional

from .base import BaseModel
from .parameter_list import ClientGlobalParameterList, ConfigGlobalParameterList
from .imports import FileImport, ImportType, TypingSection, MsrestImportType
from .utils import add_to_pylint_disable
from .operation_group import OperationGroup
from .request_builder import (
    RequestBuilder,
    OverloadedRequestBuilder,
    get_request_builder,
)
from .parameter import Parameter, ParameterMethodLocation, ParameterLocation
from .lro_operation import LROOperation
from .lro_paging_operation import LROPagingOperation
from ...utils import extract_original_name, NAME_LENGTH_LIMIT

ParameterListType = TypeVar(
    "ParameterListType",
    bound=Union[ClientGlobalParameterList, ConfigGlobalParameterList],
)

if TYPE_CHECKING:
    from .code_model import CodeModel
    from . import OperationType


class _ClientConfigBase(Generic[ParameterListType], BaseModel):
    """The service client base. Shared across our Client and Config type"""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        parameters: ParameterListType,
    ):
        super().__init__(yaml_data, code_model)
        self.parameters = parameters
        self.url: str = self.yaml_data["url"]  # the base endpoint of the client. Can be parameterized or not
        self.legacy_filename: str = self.yaml_data.get("legacyFilename", "client")
        self.client_namespace: str = self.yaml_data.get("clientNamespace", code_model.namespace)

    @property
    def description(self) -> str:
        return self.yaml_data["description"]

    @property
    def name(self) -> str:
        return self.yaml_data["name"]


class Client(_ClientConfigBase[ClientGlobalParameterList]):  # pylint: disable=too-many-public-methods
    """Model representing our service client"""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        parameters: ClientGlobalParameterList,
        *,
        is_subclient: bool = False,
    ):
        super().__init__(yaml_data, code_model, parameters)
        self.operation_groups: List[OperationGroup] = []
        self.config = Config.from_yaml(yaml_data, self.code_model)
        self.is_subclient = is_subclient
        self.request_builders = self._build_request_builders()
        if self.code_model.options["show-operations"]:
            self.operation_groups = [
                OperationGroup.from_yaml(op_group, code_model, self)
                for op_group in self.yaml_data.get("operationGroups", [])
            ]
            self.link_lro_initial_operations()
        self.request_id_header_name = self.yaml_data.get("requestIdHeaderName", None)
        self.has_etag: bool = yaml_data.get("hasEtag", False)

        # update the host parameter value. In later logic, SDK will overwrite it
        # with value from cloud_setting if users don't provide it.
        if self.need_cloud_setting:
            for p in self.parameters.parameters:
                if p.location == ParameterLocation.ENDPOINT_PATH:
                    p.client_default_value = None
                    p.optional = True
                    break

    @property
    def need_cloud_setting(self) -> bool:
        return bool(
            self.code_model.options.get("azure-arm", False)
            and self.credential_scopes is not None
            and self.endpoint_parameter is not None
        )

    @property
    def endpoint_parameter(self) -> Optional[Parameter]:
        return next((p for p in self.parameters.parameters if p.location == ParameterLocation.ENDPOINT_PATH), None)

    def _build_request_builders(
        self,
    ) -> List[Union[RequestBuilder, OverloadedRequestBuilder]]:
        request_builders: List[Union[RequestBuilder, OverloadedRequestBuilder]] = []

        def add_og_request_builder(og: Dict[str, Any]):
            for operation_yaml in og["operations"]:
                request_builder = get_request_builder(
                    operation_yaml,
                    code_model=self.code_model,
                    client=self,
                )
                if operation_yaml.get("isLroInitialOperation"):
                    # we want to change the name
                    request_builder.name = request_builder.get_name(
                        extract_original_name(request_builder.yaml_data["name"]),
                        request_builder.yaml_data,
                        request_builder.code_model,
                        request_builder.client,
                    )
                if request_builder.overloads:
                    request_builders.extend(request_builder.overloads)
                request_builders.append(request_builder)
                if operation_yaml.get("nextOperation"):
                    # i am a paging operation and i have a next operation.
                    # Make sure to include my next operation
                    request_builders.append(
                        get_request_builder(
                            operation_yaml["nextOperation"],
                            code_model=self.code_model,
                            client=self,
                        )
                    )

        queue = self.yaml_data.get("operationGroups", []).copy()
        while queue:
            now = queue.pop(0)
            add_og_request_builder(now)
            if now.get("operationGroups"):
                queue.extend(now["operationGroups"])

        return request_builders

    def pipeline_class(self, async_mode: bool) -> str:
        if self.code_model.options["azure-arm"]:
            if async_mode:
                return "AsyncARMPipelineClient"
            return "ARMPipelineClient"
        if async_mode:
            return "AsyncPipelineClient"
        return "PipelineClient"

    @property
    def credential(self) -> Optional[Parameter]:
        """The credential param, if one exists"""
        return self.parameters.credential

    @property
    def send_request_name(self) -> str:
        """Name of the send request function"""
        return "send_request" if self.code_model.options["show-send-request"] else "_send_request"

    @property
    def has_parameterized_host(self) -> bool:
        """Whether the base url is parameterized or not"""
        return not any(p for p in self.parameters if p.is_host)

    def pylint_disable(self) -> str:
        retval = ""
        if not any(
            p
            for p in self.parameters.parameters
            if p.is_api_version
            and p.client_name == "api_version"
            and p.method_location in [ParameterMethodLocation.KEYWORD_ONLY, ParameterMethodLocation.KWARG]
        ):
            retval = add_to_pylint_disable(retval, "client-accepts-api-version-keyword")
        if len(self.operation_groups) > 6:
            retval = add_to_pylint_disable(retval, "too-many-instance-attributes")
        if len(self.name) > NAME_LENGTH_LIMIT:
            retval = add_to_pylint_disable(retval, "name-too-long")
        return retval

    @property
    def filename(self) -> str:
        """Name of the file for the client"""
        if self.code_model.options["version-tolerant"] or self.code_model.options["low-level-client"]:
            return "_client"
        return f"_{self.legacy_filename}"

    def lookup_request_builder(self, request_builder_id: int) -> Union[RequestBuilder, OverloadedRequestBuilder]:
        """Find the request builder based off of id"""
        try:
            return next(rb for rb in self.request_builders if id(rb.yaml_data) == request_builder_id)
        except StopIteration as exc:
            raise KeyError(f"No request builder with id {request_builder_id} found.") from exc

    def lookup_operation(self, operation_id: int) -> "OperationType":
        try:
            return next(o for og in self.operation_groups for o in og.operations if id(o.yaml_data) == operation_id)
        except StopIteration as exc:
            raise KeyError(f"No operation with id {operation_id} found.") from exc

    def _imports_shared(self, async_mode: bool, **kwargs) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.add_submodule_import("typing", "Any", ImportType.STDLIB, TypingSection.CONDITIONAL)
        if self.code_model.options["azure-arm"]:
            file_import.add_submodule_import("azure.mgmt.core", self.pipeline_class(async_mode), ImportType.SDKCORE)
        else:
            file_import.add_submodule_import(
                "" if self.code_model.is_azure_flavor else "runtime",
                self.pipeline_class(async_mode),
                ImportType.SDKCORE,
            )

        for gp in self.parameters:
            if gp.method_location == ParameterMethodLocation.KWARG:
                continue
            file_import.merge(
                gp.imports(
                    async_mode,
                    is_operation_file=True,
                    **kwargs,
                )
            )
        file_import.add_submodule_import(
            "._configuration",
            f"{self.name}Configuration",
            ImportType.LOCAL,
        )
        serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
        file_import.add_msrest_import(
            serialize_namespace=serialize_namespace,
            msrest_import_type=MsrestImportType.SerializerDeserializer,
            typing_section=TypingSection.REGULAR,
        )
        file_import.add_submodule_import(
            "pipeline" if self.code_model.is_azure_flavor else "runtime",
            "policies",
            ImportType.SDKCORE,
        )
        if self.code_model.options["azure-arm"]:
            async_prefix = "Async" if async_mode else ""
            file_import.add_submodule_import(
                "azure.mgmt.core.policies",
                f"{async_prefix}ARMAutoResourceProviderRegistrationPolicy",
                ImportType.SDKCORE,
            )

        # import for "Self"
        file_import.add_submodule_import(
            "typing_extensions",
            "Self",
            ImportType.STDLIB,
        )
        if self.need_cloud_setting:
            file_import.add_submodule_import("typing", "cast", ImportType.STDLIB)
            file_import.add_submodule_import("azure.core.settings", "settings", ImportType.SDKCORE)
            file_import.add_submodule_import("azure.mgmt.core.tools", "get_arm_endpoints", ImportType.SDKCORE)
        return file_import

    @property
    def has_mixin(self) -> bool:
        """Do we want a mixin ABC class for typing purposes?"""
        return any(og for og in self.operation_groups if og.is_mixin)

    @property
    def lro_operations(self) -> List["OperationType"]:
        """all LRO operations in this SDK?"""
        return [operation for operation_group in self.operation_groups for operation in operation_group.lro_operations]

    @property
    def has_public_lro_operations(self) -> bool:
        """Are there any public LRO operations in this SDK?"""
        return any(not operation.internal for operation in self.lro_operations)

    @property
    def has_operations(self) -> bool:
        return any(operation_group.has_operations for operation_group in self.operation_groups)

    def link_lro_initial_operations(self) -> None:
        """Link each LRO operation to its initial operation"""
        for operation_group in self.operation_groups:
            for operation in operation_group.operations:
                if isinstance(operation, (LROOperation, LROPagingOperation)):
                    operation.initial_operation = self.lookup_operation(id(operation.yaml_data["initialOperation"]))

    @property
    def has_abstract_operations(self) -> bool:
        """Whether there is abstract operation in any operation group."""
        return any(og.has_abstract_operations for og in self.operation_groups)

    @property
    def has_non_abstract_operations(self) -> bool:
        """Whether there is non-abstract operation in any operation group."""
        return any(og.has_non_abstract_operations for og in self.operation_groups)

    def imports(self, async_mode: bool, **kwargs) -> FileImport:
        file_import = self._imports_shared(async_mode, **kwargs)
        if async_mode:
            file_import.add_submodule_import("typing", "Awaitable", ImportType.STDLIB)
            file_import.add_submodule_import(
                "rest",
                "AsyncHttpResponse",
                ImportType.SDKCORE,
                TypingSection.CONDITIONAL,
            )
        else:
            file_import.add_submodule_import(
                "rest",
                "HttpResponse",
                ImportType.SDKCORE,
                TypingSection.CONDITIONAL,
            )
        file_import.add_submodule_import(
            "rest",
            "HttpRequest",
            ImportType.SDKCORE,
            TypingSection.CONDITIONAL,
        )
        serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
        for og in self.operation_groups:
            suffix = f".{og.filename}" if (not self.code_model.options["multiapi"]) and og.is_mixin else ""
            file_import.add_submodule_import(
                self.code_model.get_relative_import_path(
                    serialize_namespace,
                    self.code_model.get_imported_namespace_for_operation(og.client_namespace, async_mode),
                )
                + suffix,
                og.class_name,
                ImportType.LOCAL,
            )

        if self.code_model.model_types and self.code_model.options["models-mode"] == "msrest":
            path_to_models = ".." if async_mode else "."
            file_import.add_submodule_import(path_to_models, "models", ImportType.LOCAL, alias="_models")
        elif self.code_model.options["models-mode"] == "msrest":
            # in this case, we have client_models = {} in the service client, which needs a type annotation
            # this import will always be commented, so will always add it to the typing section
            file_import.add_submodule_import("typing", "Dict", ImportType.STDLIB)
        file_import.add_submodule_import("copy", "deepcopy", ImportType.STDLIB)
        return file_import

    def imports_for_multiapi(self, async_mode: bool, **kwargs) -> FileImport:
        file_import = self._imports_shared(async_mode, **kwargs)
        file_import.add_submodule_import("typing", "Optional", ImportType.STDLIB, TypingSection.CONDITIONAL)
        try:
            mixin_operation = next(og for og in self.operation_groups if og.is_mixin)
            file_import.add_submodule_import("._operations_mixin", mixin_operation.class_name, ImportType.LOCAL)
        except StopIteration:
            pass
        file_import.add_submodule_import("azure.profiles", "KnownProfiles", import_type=ImportType.SDKCORE)
        file_import.add_submodule_import("azure.profiles", "ProfileDefinition", import_type=ImportType.SDKCORE)
        file_import.add_submodule_import(
            "azure.profiles.multiapiclient",
            "MultiApiClientMixin",
            import_type=ImportType.SDKCORE,
        )
        return file_import

    @property
    def credential_scopes(self) -> Optional[List[str]]:
        """Credential scopes for this client"""

        if self.credential:
            if hasattr(getattr(self.credential.type, "policy", None), "credential_scopes"):
                return self.credential.type.policy.credential_scopes  # type: ignore
            for t in getattr(self.credential.type, "types", []):
                if hasattr(getattr(t, "policy", None), "credential_scopes"):
                    return t.policy.credential_scopes
        return None

    @classmethod
    def from_yaml(
        cls,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        *,
        is_subclient: bool = False,
    ) -> "Client":
        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            parameters=ClientGlobalParameterList.from_yaml(yaml_data, code_model),
            is_subclient=is_subclient,
        )


class Config(_ClientConfigBase[ConfigGlobalParameterList]):
    """Model representing our Config type."""

    def pylint_disable(self) -> str:
        retval = add_to_pylint_disable("", "too-many-instance-attributes") if self.code_model.is_azure_flavor else ""
        if len(self.name) > NAME_LENGTH_LIMIT:
            retval = add_to_pylint_disable(retval, "name-too-long")
        return retval

    @property
    def description(self) -> str:
        return (
            f"Configuration for {self.yaml_data['name']}.\n\n."
            "Note that all parameters used to create this instance are saved as instance attributes."
        )

    @property
    def sdk_moniker(self) -> str:
        package_name = self.code_model.options.get("package-name")
        if package_name and package_name.startswith("azure-"):
            package_name = package_name[len("azure-") :]
        return package_name if package_name else self.yaml_data["name"].lower()

    @property
    def name(self) -> str:
        return f"{super().name}Configuration"

    def _imports_shared(self, async_mode: bool, **kwargs: Any) -> FileImport:
        file_import = FileImport(self.code_model)
        file_import.add_submodule_import(
            "pipeline" if self.code_model.is_azure_flavor else "runtime",
            "policies",
            ImportType.SDKCORE,
        )
        file_import.add_submodule_import("typing", "Any", ImportType.STDLIB, TypingSection.CONDITIONAL)
        if self.code_model.options.get("package-version"):
            serialize_namespace = kwargs.get("serialize_namespace", self.code_model.namespace)
            file_import.add_submodule_import(
                self.code_model.get_relative_import_path(serialize_namespace, module_name="_version"),
                "VERSION",
                ImportType.LOCAL,
            )
        if self.code_model.options["azure-arm"]:
            policy = "AsyncARMChallengeAuthenticationPolicy" if async_mode else "ARMChallengeAuthenticationPolicy"
            file_import.add_submodule_import("azure.mgmt.core.policies", "ARMHttpLoggingPolicy", ImportType.SDKCORE)
            file_import.add_submodule_import("azure.mgmt.core.policies", policy, ImportType.SDKCORE)

        return file_import

    def imports(self, async_mode: bool, **kwargs) -> FileImport:
        file_import = self._imports_shared(async_mode, **kwargs)
        for gp in self.parameters:
            if gp.method_location == ParameterMethodLocation.KWARG and gp not in self.parameters.kwargs_to_pop:
                continue
            file_import.merge(
                gp.imports(
                    async_mode=async_mode,
                    **kwargs,
                )
            )
        return file_import

    def imports_for_multiapi(self, async_mode: bool, **kwargs: Any) -> FileImport:
        file_import = self._imports_shared(async_mode, **kwargs)
        for gp in self.parameters:
            if (
                gp.method_location == ParameterMethodLocation.KWARG
                and gp not in self.parameters.kwargs_to_pop
                and gp.client_name == "api_version"
            ):
                continue
            file_import.merge(
                gp.imports_for_multiapi(
                    async_mode=async_mode,
                    **kwargs,
                )
            )
        return file_import

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "Config":
        return cls(
            yaml_data=yaml_data,
            code_model=code_model,
            parameters=ConfigGlobalParameterList.from_yaml(yaml_data, code_model),
        )
