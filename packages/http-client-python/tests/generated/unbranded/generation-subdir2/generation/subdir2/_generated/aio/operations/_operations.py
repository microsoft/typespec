# coding=utf-8
from collections.abc import MutableMapping
from io import IOBase
import json
from typing import Any, Callable, IO, Optional, TypeVar, Union, overload

from corehttp.exceptions import (
    ClientAuthenticationError,
    HttpResponseError,
    ResourceExistsError,
    ResourceNotFoundError,
    ResourceNotModifiedError,
    StreamClosedError,
    StreamConsumedError,
    map_error,
)
from corehttp.rest import AsyncHttpResponse, HttpRequest
from corehttp.runtime import AsyncPipelineClient
from corehttp.runtime.pipeline import PipelineResponse
from corehttp.utils import case_insensitive_dict

from ... import models as _models, types as _types
from ..._utils.model_base import SdkJSONEncoder, _deserialize
from ..._utils.serialization import Deserializer, Serializer
from ..._utils.utils import ClientMixinABC
from ..._validation import api_version_validation
from ...operations._operations import (
    build_added_v1_request,
    build_added_v2_request,
    build_interface_v2_v2_in_interface_request,
)
from .._configuration import AddedClientConfiguration

T = TypeVar("T")
ClsType = Optional[Callable[[PipelineResponse[HttpRequest, AsyncHttpResponse], T, dict[str, Any]], Any]]


class InterfaceV2Operations:  # pylint: disable=docstring-missing-param
    """
    .. warning::
        **DO NOT** instantiate this class directly.

        Instead, you should access the following operations through
        :class:`~generation.subdir2.aio.AddedClient`'s
        :attr:`interface_v2` attribute.
    """

    def __init__(self, *args, **kwargs) -> None:
        input_args = list(args)
        self._client: AsyncPipelineClient = input_args.pop(0) if input_args else kwargs.pop("client")
        self._config: AddedClientConfiguration = input_args.pop(0) if input_args else kwargs.pop("config")
        self._serialize: Serializer = input_args.pop(0) if input_args else kwargs.pop("serializer")
        self._deserialize: Deserializer = input_args.pop(0) if input_args else kwargs.pop("deserializer")

    @overload
    async def v2_in_interface(
        self, body: _models.ModelV2, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV2:
        """v2_in_interface.

        :param body: Required.
        :type body: ~generation.subdir2._generated.models.ModelV2
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    async def v2_in_interface(
        self, body: _types.ModelV2, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV2:
        """v2_in_interface.

        :param body: Required.
        :type body: ~generation.subdir2._generated.types.ModelV2
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    async def v2_in_interface(
        self, body: IO[bytes], *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV2:
        """v2_in_interface.

        :param body: Required.
        :type body: IO[bytes]
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @api_version_validation(
        method_added_on="v2",
        params_added_on={"v2": ["content_type", "accept"]},
        api_versions_list=["v2"],
    )
    async def v2_in_interface(
        self, body: Union[_models.ModelV2, _types.ModelV2, IO[bytes]], **kwargs: Any
    ) -> _models.ModelV2:
        """v2_in_interface.

        :param body: Is either a ModelV2 type or a IO[bytes] type. Required.
        :type body: ~generation.subdir2._generated.models.ModelV2 or
         ~generation.subdir2._generated.types.ModelV2 or IO[bytes]
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.ModelV2] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_interface_v2_v2_in_interface_request(
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
            "version": self._serialize.url("self._config.version", self._config.version, "str"),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _decompress = kwargs.pop("decompress", True)
        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = await self._client.pipeline.run(_request, stream=_stream, **kwargs)

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    await response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            raise HttpResponseError(response=response)

        if _stream:
            deserialized = response.iter_bytes() if _decompress else response.iter_raw()
        else:
            deserialized = _deserialize(_models.ModelV2, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore


class _AddedClientOperationsMixin(
    ClientMixinABC[AsyncPipelineClient[HttpRequest, AsyncHttpResponse], AddedClientConfiguration]
):

    @overload
    async def v1(
        self, body: _models.ModelV1, *, header_v2: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV1:
        """v1.

        :param body: Required.
        :type body: ~generation.subdir2._generated.models.ModelV1
        :keyword header_v2: Required.
        :paramtype header_v2: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV1. The ModelV1 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV1
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    async def v1(
        self, body: _types.ModelV1, *, header_v2: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV1:
        """v1.

        :param body: Required.
        :type body: ~generation.subdir2._generated.types.ModelV1
        :keyword header_v2: Required.
        :paramtype header_v2: str
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV1. The ModelV1 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV1
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    async def v1(
        self, body: IO[bytes], *, header_v2: str, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV1:
        """v1.

        :param body: Required.
        :type body: IO[bytes]
        :keyword header_v2: Required.
        :paramtype header_v2: str
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV1. The ModelV1 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV1
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @api_version_validation(
        params_added_on={"v2": ["header_v2"]},
        api_versions_list=["v1", "v2"],
    )
    async def v1(
        self, body: Union[_models.ModelV1, _types.ModelV1, IO[bytes]], *, header_v2: str, **kwargs: Any
    ) -> _models.ModelV1:
        """v1.

        :param body: Is either a ModelV1 type or a IO[bytes] type. Required.
        :type body: ~generation.subdir2._generated.models.ModelV1 or
         ~generation.subdir2._generated.types.ModelV1 or IO[bytes]
        :keyword header_v2: Required.
        :paramtype header_v2: str
        :return: ModelV1. The ModelV1 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV1
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.ModelV1] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_added_v1_request(
            header_v2=header_v2,
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
            "version": self._serialize.url("self._config.version", self._config.version, "str"),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _decompress = kwargs.pop("decompress", True)
        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = await self._client.pipeline.run(  # type: ignore
            _request, stream=_stream, **kwargs
        )

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    await response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            raise HttpResponseError(response=response)

        if _stream:
            deserialized = response.iter_bytes() if _decompress else response.iter_raw()
        else:
            deserialized = _deserialize(_models.ModelV1, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore

    @overload
    async def v2(
        self, body: _models.ModelV2, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV2:
        """v2.

        :param body: Required.
        :type body: ~generation.subdir2._generated.models.ModelV2
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    async def v2(
        self, body: _types.ModelV2, *, content_type: str = "application/json", **kwargs: Any
    ) -> _models.ModelV2:
        """v2.

        :param body: Required.
        :type body: ~generation.subdir2._generated.types.ModelV2
        :keyword content_type: Body Parameter content-type. Content type parameter for JSON body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @overload
    async def v2(self, body: IO[bytes], *, content_type: str = "application/json", **kwargs: Any) -> _models.ModelV2:
        """v2.

        :param body: Required.
        :type body: IO[bytes]
        :keyword content_type: Body Parameter content-type. Content type parameter for binary body.
         Default value is "application/json".
        :paramtype content_type: str
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """

    @api_version_validation(
        method_added_on="v2",
        params_added_on={"v2": ["content_type", "accept"]},
        api_versions_list=["v2"],
    )
    async def v2(self, body: Union[_models.ModelV2, _types.ModelV2, IO[bytes]], **kwargs: Any) -> _models.ModelV2:
        """v2.

        :param body: Is either a ModelV2 type or a IO[bytes] type. Required.
        :type body: ~generation.subdir2._generated.models.ModelV2 or
         ~generation.subdir2._generated.types.ModelV2 or IO[bytes]
        :return: ModelV2. The ModelV2 is compatible with MutableMapping
        :rtype: ~generation.subdir2._generated.models.ModelV2
        :raises ~corehttp.exceptions.HttpResponseError:
        """
        error_map: MutableMapping = {
            401: ClientAuthenticationError,
            404: ResourceNotFoundError,
            409: ResourceExistsError,
            304: ResourceNotModifiedError,
        }
        error_map.update(kwargs.pop("error_map", {}) or {})

        _headers = case_insensitive_dict(kwargs.pop("headers", {}) or {})
        _params = kwargs.pop("params", {}) or {}

        content_type: Optional[str] = kwargs.pop("content_type", _headers.pop("Content-Type", None))
        cls: ClsType[_models.ModelV2] = kwargs.pop("cls", None)

        content_type = content_type or "application/json"
        _content = None
        if isinstance(body, (IOBase, bytes)):
            _content = body
        else:
            _content = json.dumps(body, cls=SdkJSONEncoder, exclude_readonly=True)  # type: ignore

        _request = build_added_v2_request(
            content_type=content_type,
            content=_content,
            headers=_headers,
            params=_params,
        )
        path_format_arguments = {
            "endpoint": self._serialize.url("self._config.endpoint", self._config.endpoint, "str", skip_quote=True),
            "version": self._serialize.url("self._config.version", self._config.version, "str"),
        }
        _request.url = self._client.format_url(_request.url, **path_format_arguments)

        _decompress = kwargs.pop("decompress", True)
        _stream = kwargs.pop("stream", False)
        pipeline_response: PipelineResponse = await self._client.pipeline.run(  # type: ignore
            _request, stream=_stream, **kwargs
        )

        response = pipeline_response.http_response

        if response.status_code not in [200]:
            if _stream:
                try:
                    await response.read()  # Load the body in memory and close the socket
                except (StreamConsumedError, StreamClosedError):
                    pass
            map_error(status_code=response.status_code, response=response, error_map=error_map)
            raise HttpResponseError(response=response)

        if _stream:
            deserialized = response.iter_bytes() if _decompress else response.iter_raw()
        else:
            deserialized = _deserialize(_models.ModelV2, response.json())

        if cls:
            return cls(pipeline_response, deserialized, {})  # type: ignore

        return deserialized  # type: ignore
