# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import TypeVar, Dict, List
from .client import Client
from .operation_group import OperationGroup

from enum import Enum

T = TypeVar("T")
OrderedSet = Dict[T, None]


def add_to_description(description: str, entry: str) -> str:
    if description:
        return f"{description} {entry}"
    return entry


def add_to_pylint_disable(curr_str: str, entry: str) -> str:
    if curr_str:
        return f"{curr_str},{entry}"
    return f"  # pylint: disable={entry}"


class NamespaceType(str, Enum):
    """Special signal for impports"""

    NONE = "none"
    MODEL = "model"
    OPERATION = "operation"

def get_all_operation_groups_recursively(clients: List[Client]) -> List[OperationGroup]:
    operation_groups = []
    queue = []
    for client in clients:
        queue.extend(client.operation_groups)
    while queue:
        operation_groups.append(queue.pop(0))
        if operation_groups[-1].operation_groups:
            queue.extend(operation_groups[-1].operation_groups)
    return operation_groups
