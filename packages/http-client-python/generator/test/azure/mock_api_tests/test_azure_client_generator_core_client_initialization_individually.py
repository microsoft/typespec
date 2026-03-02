# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from specs.azure.clientgenerator.core.clientinitialization.individually import (
    IndividuallyNestedWithHeaderClient,
    IndividuallyNestedWithMixedClient,
    IndividuallyNestedWithMultipleClient,
    IndividuallyNestedWithParamAliasClient,
    IndividuallyNestedWithPathClient,
    IndividuallyNestedWithQueryClient,
)


def test_individually_nested_with_path_client():
    with IndividuallyNestedWithPathClient("test-blob") as client:
        client.with_query(format="text")
        client.get_standalone()
        client.delete_standalone()


def test_individually_nested_with_query_client():
    with IndividuallyNestedWithQueryClient("test-blob") as client:
        client.with_query(format="text")
        client.get_standalone()
        client.delete_standalone()


def test_individually_nested_with_header_client():
    with IndividuallyNestedWithHeaderClient("test-name-value") as client:
        client.with_query(format="text")
        client.get_standalone()
        client.delete_standalone()


def test_individually_nested_with_multiple_client():
    with IndividuallyNestedWithMultipleClient("test-name-value", "us-west") as client:
        client.with_query(format="text")
        client.get_standalone()
        client.delete_standalone()


def test_individually_nested_with_mixed_client():
    with IndividuallyNestedWithMixedClient("test-name-value") as client:
        client.with_query(region="us-west", format="text")
        client.get_standalone(region="us-west")
        client.delete_standalone(region="us-west")


def test_individually_nested_with_param_alias_client():
    with IndividuallyNestedWithParamAliasClient("sample-blob") as client:
        client.with_aliased_name()
        client.with_original_name()
