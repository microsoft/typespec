# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from typing import (
    Any,
    Callable,
    Dict,
    List,
    Optional,
    TYPE_CHECKING,
    Union,
    Generic,
    TypeVar,
    cast,
)
from abc import abstractmethod
from collections.abc import MutableSequence
from enum import Enum

from .request_builder_parameter import (
    RequestBuilderBodyParameter,
    RequestBuilderParameter,
)
from .parameter import (
    ParameterLocation,
    BodyParameter,
    Parameter,
    ParameterMethodLocation,
    ClientParameter,
    ConfigParameter,
)

ParameterType = TypeVar("ParameterType", bound=Union[Parameter, RequestBuilderParameter])
BodyParameterType = TypeVar("BodyParameterType", bound=Union[BodyParameter, RequestBuilderBodyParameter])

if TYPE_CHECKING:
    from .code_model import CodeModel


class ParameterImplementation(Enum):
    METHOD = "method"
    CLIENT = "client"


_LOGGER = logging.getLogger(__name__)


def method_signature_helper(positional: List[str], keyword_only: Optional[List[str]], kwarg_params: List[str]):
    keyword_only = keyword_only or []
    return positional + keyword_only + kwarg_params


def _sort(params):
    return sorted(params, key=lambda x: not (x.client_default_value or x.optional), reverse=True)


class _ParameterListBase(
    MutableSequence, Generic[ParameterType, BodyParameterType]
):  # pylint: disable=too-many-public-methods
    """Base class for all of our different ParameterList classes"""

    def __init__(
        self,
        yaml_data: Dict[str, Any],
        code_model: "CodeModel",
        parameters: List[ParameterType],
        body_parameter: Optional[BodyParameterType] = None,
    ) -> None:
        self.yaml_data = yaml_data
        self.code_model = code_model
        self.parameters = parameters or []
        self._body_parameter = body_parameter

    # MutableSequence

    def __getitem__(self, index):
        if isinstance(index, str):
            raise TypeError(f"{index} is invalid type")
        return self.parameters[index]

    def __len__(self) -> int:
        return len(self.parameters)

    def __setitem__(self, index, parameter):
        self.parameters[index] = parameter

    def __delitem__(self, index):
        del self.parameters[index]

    def insert(self, index: int, value: ParameterType) -> None:
        self.parameters.insert(index, value)

    # Parameter helpers

    @staticmethod
    @abstractmethod
    def parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], ParameterType]:
        """Callable for creating parameters"""

    @staticmethod
    @abstractmethod
    def body_parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], BodyParameterType]:
        """Callable for creating body parameters"""

    @property
    def grouped(self) -> List[Union[ParameterType, BodyParameterType]]:
        """All parameters that are inside a parameter group"""
        params: List[Union[ParameterType, BodyParameterType]] = [p for p in self.parameters if p.grouped_by]
        if self.has_body and self.body_parameter.grouped_by:
            params.append(self.body_parameter)
        return params

    @property
    def has_form_data_body(self):
        return self.has_body and self.body_parameter.is_form_data

    @property
    def has_body(self) -> bool:
        """Whether there is a body parameter in the parameter list"""
        return bool(self._body_parameter)

    @property
    def path(self) -> List[ParameterType]:
        """All path parameters"""
        return [p for p in self.parameters if p.location in (ParameterLocation.PATH, ParameterLocation.ENDPOINT_PATH)]

    @property
    def query(self) -> List[ParameterType]:
        """All query parameters"""
        return [p for p in self.parameters if p.location == ParameterLocation.QUERY]

    @property
    def headers(self) -> List[ParameterType]:
        """All header parameters"""
        return [p for p in self.parameters if p.location == ParameterLocation.HEADER]

    @property
    def constant(self) -> List[Union[ParameterType, BodyParameterType]]:
        """All constant parameters"""
        return [p for p in self.parameters if p.constant]

    @property
    def positional(self) -> List[Union[ParameterType, BodyParameterType]]:
        """All positional parameters"""
        return _sort(
            [p for p in self.unsorted_method_params if p.method_location == ParameterMethodLocation.POSITIONAL]
        )

    @property
    def keyword_only(self) -> List[Union[ParameterType, BodyParameterType]]:
        """All keyword only parameters"""
        return _sort(
            [p for p in self.unsorted_method_params if p.method_location == ParameterMethodLocation.KEYWORD_ONLY]
        )

    @property
    def kwarg(self) -> List[Union[ParameterType, BodyParameterType]]:
        """All kwargs"""
        return _sort([p for p in self.unsorted_method_params if p.method_location == ParameterMethodLocation.KWARG])

    @property
    def body_parameter(self) -> BodyParameterType:
        """The body parameter of the parameter list. Will only ever be at most one."""
        if not self._body_parameter:
            raise ValueError("There is no body parameter")
        return self._body_parameter

    @property
    @abstractmethod
    def implementation(self) -> str:
        """Whether this is a client or a method parameter"""

    @property
    def unsorted_method_params(self) -> List[Union[ParameterType, BodyParameterType]]:
        """Method params before sorting"""
        method_params: List[Union[ParameterType, BodyParameterType]] = [
            p
            for p in self.parameters
            if p.in_method_signature
            and p.implementation == self.implementation
            and (self.code_model.is_legacy or not p.hide_in_method)
        ]
        if self._body_parameter:
            if self._body_parameter.in_method_signature:
                method_params.append(self._body_parameter)
            try:
                # i am a multipart body parameter
                # Only legacy generates operations with me, so I will follow the legacy rules
                # I will splat out my entries as individual entries
                method_params.extend(self._body_parameter.entries)  # type: ignore
            except AttributeError:
                pass
        return method_params

    @property
    def method(self) -> List[Union[ParameterType, BodyParameterType]]:
        """Sorted method params. First positional, then keyword only, then kwarg"""
        return self.positional + self.keyword_only + self.kwarg

    def method_signature(self, async_mode: bool) -> List[str]:
        """Method signature for this parameter list."""
        return method_signature_helper(
            positional=self.method_signature_positional(async_mode),
            keyword_only=self.method_signature_keyword_only(async_mode),
            kwarg_params=self.method_signature_kwargs,
        )

    def method_signature_positional(self, async_mode: bool) -> List[str]:
        """Signature for positional parameters"""
        return [parameter.method_signature(async_mode) for parameter in self.positional]

    def method_signature_keyword_only(self, async_mode: bool) -> List[str]:
        """Signature for keyword only parameters"""
        result = [
            parameter.method_signature(async_mode)
            for parameter in self.keyword_only
            if not parameter.hide_in_operation_signature
        ]
        return ["*,"] + result if result else []

    @property
    def method_signature_kwargs(self) -> List[str]:
        """Signature for kwargs"""
        return ["**kwargs: Any"]

    @property
    def kwargs_to_pop(self) -> List[Union[ParameterType, BodyParameterType]]:
        """Method kwargs we want to pop"""
        # don't want to pop bodies unless it's a constant
        kwargs_to_pop = self.kwarg
        return [k for k in kwargs_to_pop if k.location != ParameterLocation.BODY or k.constant]

    @property
    def call(self) -> List[str]:
        """How to pass in parameters to call the operation"""
        retval = [p.client_name for p in self.method if p.method_location == ParameterMethodLocation.POSITIONAL]
        retval.extend(
            [
                f"{p.client_name}={p.client_name}"
                for p in self.method
                if p.method_location == ParameterMethodLocation.KEYWORD_ONLY
            ]
        )
        retval.append("**kwargs")
        return retval

    @classmethod
    def from_yaml(cls, yaml_data: Dict[str, Any], code_model: "CodeModel"):
        parameters = [cls.parameter_creator()(parameter, code_model) for parameter in yaml_data["parameters"]]
        body_parameter = None
        if yaml_data.get("bodyParameter"):
            body_parameter = cls.body_parameter_creator()(yaml_data["bodyParameter"], code_model)
        return cls(
            yaml_data,
            code_model,
            parameters=parameters,
            body_parameter=body_parameter,
        )


class _ParameterList(_ParameterListBase[Parameter, BodyParameter]):

    @staticmethod
    def parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], Parameter]:
        return Parameter.from_yaml

    @staticmethod
    def body_parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], BodyParameter]:
        return BodyParameter.from_yaml

    @property
    def implementation(self) -> str:
        return "Method"

    @property
    def path(self) -> List[Parameter]:
        return [k for k in super().path if k.location == ParameterLocation.ENDPOINT_PATH]


class ParameterList(_ParameterList):
    """ParameterList is the parameter list for Operation classes"""


class _RequestBuilderParameterList(_ParameterListBase[RequestBuilderParameter, RequestBuilderBodyParameter]):
    """_RequestBuilderParameterList is base parameter list for RequestBuilder classes"""

    @staticmethod
    def parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], RequestBuilderParameter]:
        return RequestBuilderParameter.from_yaml

    @staticmethod
    def body_parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], RequestBuilderBodyParameter]:
        return RequestBuilderBodyParameter.from_yaml

    @property
    def implementation(self) -> str:
        return "Method"

    @property
    def unsorted_method_params(
        self,
    ) -> List[Union[RequestBuilderParameter, RequestBuilderBodyParameter]]:
        # don't have access to client params in request builder
        retval = [
            p
            for p in super().unsorted_method_params
            if not (p.location == ParameterLocation.BODY and cast(RequestBuilderBodyParameter, p).is_partial_body)
        ]
        retval.extend([p for p in self.parameters if p.implementation == "Client" and p.in_method_signature])
        return retval

    @property
    def path(self) -> List[RequestBuilderParameter]:
        return [p for p in super().path if p.location != ParameterLocation.ENDPOINT_PATH]

    @property
    def constant(
        self,
    ) -> List[Union[RequestBuilderParameter, RequestBuilderBodyParameter]]:
        """All constant parameters"""
        return [p for p in super().constant if p.location != ParameterLocation.ENDPOINT_PATH]


class RequestBuilderParameterList(_RequestBuilderParameterList):
    """Parameter list for Request Builder"""


class OverloadedRequestBuilderParameterList(_RequestBuilderParameterList):
    """Parameter list for OverloadedRequestBuilder"""


class _ClientGlobalParameterList(_ParameterListBase[ParameterType, BodyParameter]):  # pylint: disable=abstract-method
    """Base parameter list for client and config classes"""

    @staticmethod
    def body_parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], BodyParameter]:
        return BodyParameter.from_yaml

    @property
    def implementation(self) -> str:
        return "Client"

    @property
    def credential(self) -> Optional[ParameterType]:
        try:
            return next(p for p in self.parameters if p.client_name == "credential")
        except StopIteration:
            return None

    @property
    def path(self) -> List[ParameterType]:
        return [p for p in super().path if p.location == ParameterLocation.ENDPOINT_PATH]


class ClientGlobalParameterList(_ClientGlobalParameterList[ClientParameter]):
    """Parameter list for Client class"""

    @staticmethod
    def parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], ClientParameter]:
        return ClientParameter.from_yaml

    @property
    def path(self) -> List[ClientParameter]:
        return [p for p in super().path if not p.is_host]

    @property
    def host(self) -> Optional[ClientParameter]:
        """Get the host parameter"""
        try:
            return next(p for p in self.parameters if p.is_host)
        except StopIteration:
            return None


class ConfigGlobalParameterList(_ClientGlobalParameterList[ConfigParameter]):
    """Parameter list for config"""

    @staticmethod
    def parameter_creator() -> Callable[[Dict[str, Any], "CodeModel"], ConfigParameter]:
        return ConfigParameter.from_yaml

    @property
    def implementation(self) -> str:
        return "Client"
