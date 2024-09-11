# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from abc import abstractmethod
from typing import (
    Optional,
    Any,
    Dict,
    TYPE_CHECKING,
    List,
    Generic,
    TypeVar,
    Union,
    cast,
)

from .imports import FileImport, ImportType, TypingSection
from .base import BaseType

if TYPE_CHECKING:
    from .code_model import CodeModel


class _CredentialPolicyBaseType:
    """Base class for our different credential policy types.

    Inherited by our BearerTokenCredentialPolicy and KeyCredentialPolicy types.
    """

    def __init__(self, yaml_data: Dict[str, Any], code_model: "CodeModel") -> None:
        self.yaml_data = yaml_data
        self.code_model = code_model

    @abstractmethod
    def call(self, async_mode: bool) -> str:
        """
        How to call this credential policy. Used to initialize the credential policy in the config file.
        """


class BearerTokenCredentialPolicyType(_CredentialPolicyBaseType):
    """Credential policy type representing BearerTokenCredentialPolicy"""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        credential_scopes: List[str],
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.credential_scopes = credential_scopes

    def call(self, async_mode: bool) -> str:
        policy_name = f"{'Async' if async_mode else ''}BearerTokenCredentialPolicy"
        return f"policies.{policy_name}(self.credential, *self.credential_scopes, **kwargs)"

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "BearerTokenCredentialPolicyType":
        return cls(yaml_data, code_model, yaml_data["credentialScopes"])


class ARMChallengeAuthenticationPolicyType(BearerTokenCredentialPolicyType):
    """Credential policy type representing ARMChallengeAuthenticationPolicy"""

    def call(self, async_mode: bool) -> str:
        policy_name = f"{'Async' if async_mode else ''}ARMChallengeAuthenticationPolicy"
        return f"{policy_name}(self.credential, *self.credential_scopes, **kwargs)"


class KeyCredentialPolicyType(_CredentialPolicyBaseType):
    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        key: str,
        scheme: Optional[str] = None,
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.key = key
        self.scheme = scheme

    @property
    def credential_name(self) -> str:
        return "AzureKeyCredential" if self.code_model.is_azure_flavor else "ServiceKeyCredential"

    def call(self, async_mode: bool) -> str:
        params = f'"{self.key}", '
        if self.scheme:
            params += f'prefix="{self.scheme}", '
        return f"policies.{self.credential_name}Policy(self.credential, {params}**kwargs)"

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "KeyCredentialPolicyType":
        return cls(yaml_data, code_model, yaml_data["key"], yaml_data.get("scheme", None))


CredentialPolicyType = TypeVar(
    "CredentialPolicyType",
    bound=Union[
        BearerTokenCredentialPolicyType,
        ARMChallengeAuthenticationPolicyType,
        KeyCredentialPolicyType,
    ],
)


class CredentialType(Generic[CredentialPolicyType], BaseType):
    """Store info about the type of the credential. Can be either an KeyCredential or a TokenCredential"""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        policy: CredentialPolicyType,
    ) -> None:
        super().__init__(yaml_data, code_model)
        self.policy = policy

    def description(self, *, is_operation_file: bool) -> str:
        return ""

    def get_json_template_representation(
        self,
        *,
        client_default_value_declaration: Optional[str] = None,
    ) -> Any:
        raise TypeError("You should not try to get a JSON template representation of a CredentialSchema")

    def docstring_text(self, **kwargs: Any) -> str:
        return "credential"

    @property
    def serialization_type(self) -> str:
        return self.docstring_type()

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel") -> "CredentialType":
        from . import build_type

        return cls(
            yaml_data,
            code_model,
            policy=cast(CredentialPolicyType, build_type(yaml_data["policy"], code_model)),
        )


class TokenCredentialType(CredentialType[Union[BearerTokenCredentialPolicyType, ARMChallengeAuthenticationPolicyType]]):
    """Type of a token credential. Used by BearerAuth and ARMChallenge policies"""

    def type_annotation(self, **kwargs: Any) -> str:
        if kwargs.get("async_mode"):
            return '"AsyncTokenCredential"'
        return '"TokenCredential"'

    @property
    def type_description(self) -> str:
        return "TokenCredential"

    @property
    def credentials_subfolder(self) -> str:
        return "credentials_async" if self.code_model.is_azure_flavor else "credentials"

    def docstring_type(self, **kwargs: Any) -> str:
        if kwargs.get("async_mode"):
            return f"~{self.code_model.core_library}.{self.credentials_subfolder}.AsyncTokenCredential"
        return f"~{self.code_model.core_library}.credentials.TokenCredential"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        if kwargs.get("async_mode"):
            file_import.add_submodule_import(
                self.credentials_subfolder,
                "AsyncTokenCredential",
                ImportType.SDKCORE,
                typing_section=TypingSection.TYPING,
            )
        else:
            file_import.add_submodule_import(
                "credentials",
                "TokenCredential",
                ImportType.SDKCORE,
                typing_section=TypingSection.TYPING,
            )
        return file_import

    @property
    def instance_check_template(self) -> str:
        return "hasattr({}, 'get_token')"


class KeyCredentialType(CredentialType[KeyCredentialPolicyType]):
    """Type for an KeyCredential"""

    def docstring_type(self, **kwargs: Any) -> str:
        return f"~{self.code_model.core_library}.credentials.{self.policy.credential_name}"

    def type_annotation(self, **kwargs: Any) -> str:
        return self.policy.credential_name

    @property
    def instance_check_template(self) -> str:
        return "isinstance({}, " + f"{self.policy.credential_name})"

    def imports(self, **kwargs: Any) -> FileImport:
        file_import = super().imports(**kwargs)
        file_import.add_submodule_import(
            "credentials",
            self.policy.credential_name,
            ImportType.SDKCORE,
            typing_section=TypingSection.CONDITIONAL,
        )
        return file_import
