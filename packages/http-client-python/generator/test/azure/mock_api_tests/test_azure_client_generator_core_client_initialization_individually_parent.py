# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from specs.azure.clientgenerator.core.clientinitialization.individuallyparent import IndividuallyParentClient


def test_individually_parent_nested_with_path_client():
    with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        client.individually_parent_nested_with_path_client.with_query(format="text")
        client.individually_parent_nested_with_path_client.get_standalone()
        client.individually_parent_nested_with_path_client.delete_standalone()


def test_individually_parent_nested_with_query_client():
    with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        client.individually_parent_nested_with_query_client.with_query(format="text")
        client.individually_parent_nested_with_query_client.get_standalone()
        client.individually_parent_nested_with_query_client.delete_standalone()


def test_individually_parent_nested_with_header_client():
    with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        client.individually_parent_nested_with_header_client.with_query(format="text")
        client.individually_parent_nested_with_header_client.get_standalone()
        client.individually_parent_nested_with_header_client.delete_standalone()


def test_individually_parent_nested_with_multiple_client():
    with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        client.individually_parent_nested_with_multiple_client.with_query(format="text")
        client.individually_parent_nested_with_multiple_client.get_standalone()
        client.individually_parent_nested_with_multiple_client.delete_standalone()


def test_individually_parent_nested_with_mixed_client():
    with IndividuallyParentClient("test-blob", "test-name-value", "us-west") as client:
        client.individually_parent_nested_with_mixed_client.with_query(region="us-west", format="text")
        client.individually_parent_nested_with_mixed_client.get_standalone(region="us-west")
        client.individually_parent_nested_with_mixed_client.delete_standalone(region="us-west")


def test_individually_parent_nested_with_param_alias_client():
    with IndividuallyParentClient("sample-blob", "test-name-value", "us-west") as client:
        client.individually_parent_nested_with_param_alias_client.with_aliased_name()
        client.individually_parent_nested_with_param_alias_client.with_original_name()
