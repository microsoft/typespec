# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from specs.azure.clientgenerator.core.clientinitialization import (
    HeaderParamClient,
    MultipleParamsClient,
    MixedParamsClient,
    PathParamClient,
    ParamAliasClient,
    ParentClient,
)
from specs.azure.clientgenerator.core.clientinitialization.models import Input


def test_header_param_client():
    with HeaderParamClient("test-name-value") as client:
        client.with_query(id="test-id")
        client.with_body(Input(name="test-name"))


def test_multiple_params_client():
    with MultipleParamsClient("test-name-value", "us-west") as client:
        client.with_query(id="test-id")
        client.with_body(Input(name="test-name"))


def test_mixed_params_client():
    with MixedParamsClient("test-name-value") as client:
        client.with_query(region="us-west", id="test-id")
        client.with_body(Input(name="test-name"), region="us-west")


def test_path_param_client():
    with PathParamClient("sample-blob") as client:
        client.with_query(format="text")
        client.get_standalone()
        client.delete_standalone()


def test_param_alias_client():
    with ParamAliasClient("sample-blob") as client:
        client.with_aliased_name()
        client.with_original_name()


# def test_parent_child_client():
#     with ParentClient() as client:
#         client.child_client.with_query()
#         client.child_client.get_standalone()
#         client.child_client.delete_standalone()
