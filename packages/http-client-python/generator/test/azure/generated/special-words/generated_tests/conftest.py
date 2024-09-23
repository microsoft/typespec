# coding=utf-8
# --------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# Code generated by Microsoft (R) Python Code Generator.
# Changes may cause incorrect behavior and will be lost if the code is regenerated.
# --------------------------------------------------------------------------
import os
import pytest
from dotenv import load_dotenv
from devtools_testutils import (
    test_proxy,
    add_general_regex_sanitizer,
    add_body_key_sanitizer,
    add_header_regex_sanitizer,
)

load_dotenv()


# For security, please avoid record sensitive identity information in recordings
@pytest.fixture(scope="session", autouse=True)
def add_sanitizers(test_proxy):
    specialwords_subscription_id = os.environ.get(
        "SPECIALWORDS_SUBSCRIPTION_ID", "00000000-0000-0000-0000-000000000000"
    )
    specialwords_tenant_id = os.environ.get("SPECIALWORDS_TENANT_ID", "00000000-0000-0000-0000-000000000000")
    specialwords_client_id = os.environ.get("SPECIALWORDS_CLIENT_ID", "00000000-0000-0000-0000-000000000000")
    specialwords_client_secret = os.environ.get("SPECIALWORDS_CLIENT_SECRET", "00000000-0000-0000-0000-000000000000")
    add_general_regex_sanitizer(regex=specialwords_subscription_id, value="00000000-0000-0000-0000-000000000000")
    add_general_regex_sanitizer(regex=specialwords_tenant_id, value="00000000-0000-0000-0000-000000000000")
    add_general_regex_sanitizer(regex=specialwords_client_id, value="00000000-0000-0000-0000-000000000000")
    add_general_regex_sanitizer(regex=specialwords_client_secret, value="00000000-0000-0000-0000-000000000000")

    add_header_regex_sanitizer(key="Set-Cookie", value="[set-cookie;]")
    add_header_regex_sanitizer(key="Cookie", value="cookie;")
    add_body_key_sanitizer(json_path="$..access_token", value="access_token")
