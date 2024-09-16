# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import List

from . import utils
from ..models import Client, ParameterMethodLocation
from .parameter_serializer import ParameterSerializer, PopKwargType
from ...utils import build_policies


class ClientSerializer:
    def __init__(self, client: Client) -> None:
        self.client = client
        self.parameter_serializer = ParameterSerializer()

    def _init_signature(self, async_mode: bool) -> str:
        pylint_disable = ""
        if not self.client.parameters.credential:
            pylint_disable = "  # pylint: disable=missing-client-constructor-parameter-credential"
        return self.parameter_serializer.serialize_method(
            function_def="def",
            method_name="__init__",
            need_self_param=True,
            method_param_signatures=self.client.parameters.method_signature(async_mode),
            pylint_disable=pylint_disable,
        )

    def init_signature_and_response_type_annotation(self, async_mode: bool) -> str:
        init_signature = self._init_signature(async_mode)
        return utils.method_signature_and_response_type_annotation_template(
            method_signature=init_signature,
            response_type_annotation="None",
        )

    def pop_kwargs_from_signature(self) -> List[str]:
        return self.parameter_serializer.pop_kwargs_from_signature(
            self.client.parameters.kwargs_to_pop,
            check_kwarg_dict=False,
            pop_headers_kwarg=PopKwargType.NO,
            pop_params_kwarg=PopKwargType.NO,
        )

    def class_definition(self) -> str:
        class_name = self.client.name
        base_class = ""
        if self.client.has_mixin:
            base_class = f"{class_name}OperationsMixin"
        pylint_disable = self.client.pylint_disable()
        if base_class:
            return f"class {class_name}({base_class}):{pylint_disable}"
        return f"class {class_name}:{pylint_disable}"

    def property_descriptions(self, async_mode: bool) -> List[str]:
        retval: List[str] = []
        operations_folder = ".aio.operations." if async_mode else ".operations."
        for og in [og for og in self.client.operation_groups if not og.is_mixin]:
            retval.append(f":ivar {og.property_name}: {og.class_name} operations")
            property_type = f"{self.client.code_model.namespace}{operations_folder}{og.class_name}"
            retval.append(f":vartype {og.property_name}: {property_type}")
        for param in self.client.parameters.method:
            retval.append(f":{param.description_keyword} {param.client_name}: {param.description}")
            retval.append(
                f":{param.docstring_type_keyword} {param.client_name}: {param.docstring_type(async_mode=async_mode)}"
            )
        if self.client.has_public_lro_operations:
            retval.append(
                ":keyword int polling_interval: Default waiting time between two polls for LRO operations "
                "if no Retry-After header is present."
            )
        retval = [s.replace("\\", "\\\\") for s in retval]
        retval.append('"""')
        return retval

    def initialize_config(self) -> str:
        config_name = f"{self.client.name}Configuration"
        config_call = ", ".join(
            [
                f"{p.client_name}={p.client_name}"
                for p in self.client.config.parameters.method
                if p.method_location != ParameterMethodLocation.KWARG
            ]
            + ["**kwargs"]
        )
        return f"self._config = {config_name}({config_call})"

    @property
    def host_variable_name(self) -> str:
        try:
            return next(p for p in self.client.parameters if p.is_host).client_name
        except StopIteration:
            return "_endpoint"

    @property
    def should_init_super(self) -> bool:
        return any(og for og in self.client.operation_groups if og.is_mixin and og.has_abstract_operations)

    def initialize_pipeline_client(self, async_mode: bool) -> List[str]:
        result = []
        pipeline_client_name = self.client.pipeline_class(async_mode)
        endpoint_name = "base_url" if self.client.code_model.is_azure_flavor else "endpoint"
        params = {
            endpoint_name: self.host_variable_name,
            "policies": "_policies",
        }
        if not self.client.code_model.is_legacy and self.client.request_id_header_name:
            result.append(f'kwargs["request_id_header_name"] = "{self.client.request_id_header_name}"')
        policies = build_policies(
            self.client.code_model.options["azure_arm"],
            async_mode,
            is_azure_flavor=self.client.code_model.is_azure_flavor,
            tracing=self.client.code_model.options["tracing"],
        )
        result.extend(
            [
                "_policies = kwargs.pop('policies', None)",
                "if _policies is None:",
                f'    _policies = [{",".join(policies)}]',
                f"self._client: {pipeline_client_name} = {pipeline_client_name}("
                f"{', '.join(f'{k}={v}' for k, v in params.items())}, **kwargs)",
            ]
        )
        return result

    def serializers_and_operation_groups_properties(self) -> List[str]:
        retval = []

        def _get_client_models_value(models_dict_name: str) -> str:
            if self.client.code_model.model_types:
                return f"{{k: v for k, v in {models_dict_name}.__dict__.items() if isinstance(v, type)}}"
            return "{}"

        is_msrest_model = self.client.code_model.options["models_mode"] == "msrest"
        if is_msrest_model:
            add_private_models = len(self.client.code_model.model_types) != len(
                self.client.code_model.public_model_types
            )
            model_dict_name = f"_models.{self.client.code_model.models_filename}" if add_private_models else "_models"
            retval.append(
                f"client_models{': Dict[str, Any]' if not self.client.code_model.model_types else ''}"
                f" = {_get_client_models_value(model_dict_name)}"
            )
            if add_private_models and self.client.code_model.model_types:
                update_dict = "{k: v for k, v in _models.__dict__.items() if isinstance(v, type)}"
                retval.append(f"client_models.update({update_dict})")
        client_models_str = "client_models" if is_msrest_model else ""
        retval.append(f"self._serialize = Serializer({client_models_str})")
        retval.append(f"self._deserialize = Deserializer({client_models_str})")
        if not self.client.code_model.options["client_side_validation"]:
            retval.append("self._serialize.client_side_validation = False")
        operation_groups = [og for og in self.client.operation_groups if not og.is_mixin]
        for og in operation_groups:
            if og.code_model.options["multiapi"]:
                api_version = f", '{og.api_versions[0]}'" if og.api_versions else ", None"
            else:
                api_version = ""
            retval.extend(
                [
                    f"self.{og.property_name} = {og.class_name}(",
                    f"    self._client, self._config, self._serialize, self._deserialize{api_version}",
                    ")",
                ]
            )
        return retval

    def _send_request_signature(self) -> str:
        send_request_signature = [
            "request: HttpRequest, *, stream: bool = False,"
        ] + self.client.parameters.method_signature_kwargs
        return self.parameter_serializer.serialize_method(
            function_def="def",
            method_name=self.client.send_request_name,
            need_self_param=True,
            method_param_signatures=send_request_signature,
        )

    def send_request_signature_and_response_type_annotation(self, async_mode: bool) -> str:
        send_request_signature = self._send_request_signature()
        return utils.method_signature_and_response_type_annotation_template(
            method_signature=send_request_signature,
            response_type_annotation=("Awaitable[AsyncHttpResponse]" if async_mode else "HttpResponse"),
        )

    def _example_make_call(self, async_mode: bool) -> List[str]:
        http_response = "AsyncHttpResponse" if async_mode else "HttpResponse"
        retval = [f">>> response = {'await ' if async_mode else ''}client.{self.client.send_request_name}(request)"]
        retval.append(f"<{http_response}: 200 OK>")
        return retval

    def _request_builder_example(self, async_mode: bool) -> List[str]:
        retval = [
            "We have helper methods to create requests specific to this service in "
            + f"`{self.client.code_model.namespace}.{self.client.code_model.rest_layer_name}`."
        ]
        retval.append("Use these helper methods to create the request you pass to this method.")
        retval.append("")

        request_builder = self.client.request_builders[0]
        request_builder_signature = ", ".join(request_builder.parameters.call)
        if request_builder.group_name:
            rest_imported = request_builder.group_name
            request_builder_name = f"{request_builder.group_name}.{request_builder.name}"
        else:
            rest_imported = request_builder.name
            request_builder_name = request_builder.name
        full_path = f"{self.client.code_model.namespace}.{self.client.code_model.rest_layer_name}"
        retval.append(f">>> from {full_path} import {rest_imported}")
        retval.append(f">>> request = {request_builder_name}({request_builder_signature})")
        retval.append(f"<HttpRequest [{request_builder.method}], url: '{request_builder.url}'>")
        retval.extend(self._example_make_call(async_mode))
        return retval

    def _rest_request_example(self, async_mode: bool) -> List[str]:
        retval = [f">>> from {self.client.code_model.core_library}.rest import HttpRequest"]
        retval.append('>>> request = HttpRequest("GET", "https://www.example.org/")')
        retval.append("<HttpRequest [GET], url: 'https://www.example.org/'>")
        retval.extend(self._example_make_call(async_mode))
        return retval

    def send_request_description(self, async_mode: bool) -> List[str]:
        rest_library = f"{self.client.code_model.core_library}.rest"
        retval = ['"""Runs the network request through the client\'s chained policies.']
        retval.append("")
        if self.client.code_model.options["builders_visibility"] != "embedded":
            retval.extend(self._request_builder_example(async_mode))
        else:
            retval.extend(self._rest_request_example(async_mode))
        retval.append("")
        retval.append("For more information on this code flow, see https://aka.ms/azsdk/dpcodegen/python/send_request")
        retval.append("")
        retval.append(":param request: The network request you want to make. Required.")
        retval.append(f":type request: ~{rest_library}.HttpRequest")
        retval.append(":keyword bool stream: Whether the response payload will be streamed. Defaults to False.")
        retval.append(":return: The response of your network call. Does not do error handling on your response.")
        http_response = "AsyncHttpResponse" if async_mode else "HttpResponse"
        retval.append(f":rtype: ~{rest_library}.{http_response}")
        retval.append('"""')
        return retval

    def serialize_path(self) -> List[str]:
        return self.parameter_serializer.serialize_path(self.client.parameters.path, "self._serialize")


class ConfigSerializer:
    def __init__(self, client: Client) -> None:
        self.client = client
        self.parameter_serializer = ParameterSerializer()

    def _init_signature(self, async_mode: bool) -> str:
        return self.parameter_serializer.serialize_method(
            function_def="def",
            method_name="__init__",
            need_self_param=True,
            method_param_signatures=self.client.config.parameters.method_signature(async_mode),
        )

    def init_signature_and_response_type_annotation(self, async_mode: bool) -> str:
        init_signature = self._init_signature(async_mode)
        return utils.method_signature_and_response_type_annotation_template(
            method_signature=init_signature,
            response_type_annotation="None",
        )

    def pop_kwargs_from_signature(self) -> List[str]:
        return self.parameter_serializer.pop_kwargs_from_signature(
            self.client.config.parameters.kwargs_to_pop,
            check_kwarg_dict=False,
            pop_headers_kwarg=PopKwargType.NO,
            pop_params_kwarg=PopKwargType.NO,
        )

    def set_constants(self) -> List[str]:
        return [
            f"self.{p.client_name} = {p.client_default_value_declaration}"
            for p in self.client.config.parameters.constant
            if p not in self.client.config.parameters.method
        ]

    def check_required_parameters(self) -> List[str]:
        return [
            f"if {p.client_name} is None:\n" f"    raise ValueError(\"Parameter '{p.client_name}' must not be None.\")"
            for p in self.client.config.parameters.method
            if not (p.optional or p.constant)
        ]

    def property_descriptions(self, async_mode: bool) -> List[str]:
        retval: List[str] = []
        for p in self.client.config.parameters.method:
            retval.append(f":{p.description_keyword} {p.client_name}: {p.description}")
            retval.append(f":{p.docstring_type_keyword} {p.client_name}: {p.docstring_type(async_mode=async_mode)}")
        retval.append('"""')
        return retval
