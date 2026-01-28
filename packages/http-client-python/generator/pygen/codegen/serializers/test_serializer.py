# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from typing import Any
from jinja2 import Environment

from .import_serializer import FileImportSerializer
from .base_serializer import BaseSerializer
from ..models import (
    CodeModel,
    ImportType,
    OperationGroup,
    Client,
    OperationType,
    FileImport,
)
from .utils import create_fake_value


def is_lro(operation_type: str) -> bool:
    return operation_type in ("lro", "lropaging")


def is_paging(operation_type: str) -> bool:
    return operation_type in ("paging", "lropaging")


def is_common_operation(operation_type: str) -> bool:
    return operation_type == "operation"


class TestName:
    def __init__(self, code_model: CodeModel, client_name: str, *, async_mode: bool = False) -> None:
        self.code_model = code_model
        self.client_name = client_name
        self.async_mode = async_mode
        # Pre-compute values for render speed optimization
        self.async_suffix_capt = "Async" if async_mode else ""
        self.create_client_name = "create_async_client" if async_mode else "create_client"
        self.prefix = client_name.replace("Client", "")
        is_azure_arm = code_model.options["azure-arm"]
        self.preparer_name = "RandomNameResourceGroupPreparer" if is_azure_arm else self.prefix + "Preparer"
        self.base_test_class_name = (
            "AzureMgmtRecordedTestCase" if is_azure_arm else f"{client_name}TestBase{self.async_suffix_capt}"
        )


class TestCase:
    def __init__(
        self,
        operation_groups: list[OperationGroup],
        params: dict[str, Any],
        operation: OperationType,
        *,
        async_mode: bool = False,
        is_azure_arm: bool = False,
    ) -> None:
        self.operation_groups = operation_groups
        self.operation = operation
        self.async_mode = async_mode
        self.is_azure_arm = is_azure_arm
        # Pre-compute params
        if is_azure_arm:
            self.params = {
                k: ("resource_group.name" if k == "resource_group_name" else v) for k, v in params.items()
            }
        else:
            self.params = params
        # Pre-compute name
        if operation_groups[-1].is_mixin:
            self.name = operation.name
        else:
            self.name = "_".join([og.property_name for og in operation_groups] + [operation.name])
        # Pre-compute operation_group_prefix
        if operation_groups[-1].is_mixin:
            self.operation_group_prefix = ""
        else:
            self.operation_group_prefix = "." + ".".join([og.property_name for og in operation_groups])
        # Pre-compute response
        operation_type = operation.operation_type
        if async_mode:
            if is_lro(operation_type):
                self.response = "response = await (await "
            elif is_common_operation(operation_type):
                self.response = "response = await "
            else:
                self.response = "response = "
        else:
            self.response = "response = "
        # Pre-compute lro_comment
        self.lro_comment = " # call '.result()' to poll until service return final result"
        # Pre-compute operation_suffix
        if is_lro(operation_type):
            extra = ")" if async_mode else ""
            self.operation_suffix = f"{extra}.result(){self.lro_comment}"
        else:
            self.operation_suffix = ""
        # Pre-compute extra_operation
        if is_paging(operation_type):
            async_str = "async " if async_mode else ""
            self.extra_operation = f"result = [r {async_str}for r in response]"
        else:
            self.extra_operation = ""


class Test(TestName):
    def __init__(
        self,
        code_model: CodeModel,
        client_name: str,
        operation_group: OperationGroup,
        testcases: list[TestCase],
        test_class_name: str,
        *,
        async_mode: bool = False,
    ) -> None:
        super().__init__(code_model, client_name, async_mode=async_mode)
        self.operation_group = operation_group
        self.testcases = testcases
        self.test_class_name = test_class_name


class TestGeneralSerializer(BaseSerializer):

    @property
    def aio_str(self) -> str:
        return ".aio" if self.async_mode else ""

    @property
    def test_names(self) -> list[TestName]:
        return [TestName(self.code_model, c.name, async_mode=self.async_mode) for c in self.code_model.clients]

    def add_import_client(self, imports: FileImport) -> None:
        for client in self.code_model.clients:
            imports.add_submodule_import(client.client_namespace + self.aio_str, client.name, ImportType.STDLIB)

    @property
    def import_clients(self) -> FileImportSerializer:
        imports = self.init_file_import()

        imports.add_submodule_import("devtools_testutils", "AzureRecordedTestCase", ImportType.STDLIB)
        if not self.async_mode:
            imports.add_import("functools", ImportType.STDLIB)
            imports.add_submodule_import("devtools_testutils", "PowerShellPreparer", ImportType.STDLIB)
        self.add_import_client(imports)

        return FileImportSerializer(imports, self.async_mode)

    def serialize_conftest(self) -> str:
        return self.env.get_template("conftest.py.jinja2").render(
            test_names=self.test_names,
            code_model=self.code_model,
        )

    def serialize_testpreparer(self) -> str:
        return self.env.get_template("testpreparer.py.jinja2").render(
            test_names=self.test_names,
            imports=self.import_clients,
            code_model=self.code_model,
        )


class TestSerializer(TestGeneralSerializer):
    def __init__(
        self,
        code_model: CodeModel,
        env: Environment,
        *,
        client: Client,
        operation_group: OperationGroup,
        async_mode: bool = False,
    ) -> None:
        super().__init__(code_model, env, async_mode=async_mode)
        self.client = client
        self.operation_group = operation_group

    @property
    def import_test(self) -> FileImportSerializer:
        imports = self.init_file_import()
        test_name = TestName(self.code_model, self.client.name, async_mode=self.async_mode)
        async_suffix = "_async" if self.async_mode else ""
        imports.add_submodule_import(
            "devtools_testutils" if self.code_model.options["azure-arm"] else "testpreparer" + async_suffix,
            test_name.base_test_class_name,
            ImportType.LOCAL,
        )
        imports.add_submodule_import(
            "devtools_testutils" if self.code_model.options["azure-arm"] else "testpreparer",
            test_name.preparer_name,
            ImportType.LOCAL,
        )
        imports.add_submodule_import(
            "devtools_testutils" + self.aio_str,
            "recorded_by_proxy" + async_suffix,
            ImportType.LOCAL,
        )
        if self.code_model.options["azure-arm"]:
            self.add_import_client(imports)
        return FileImportSerializer(imports, self.async_mode)

    @property
    def breadth_search_operation_group(self) -> list[list[OperationGroup]]:
        result = []
        queue = [[self.operation_group]]
        while queue:
            current = queue.pop(0)
            if current[-1].operations:
                result.append(current)
            if current[-1].operation_groups:
                queue.extend([current + [og] for og in current[-1].operation_groups])
        return result

    def get_operation_params(self, operation: OperationType) -> dict[str, Any]:
        operation_params = {}
        required_params = [p for p in operation.parameters.method if not p.optional]
        for param in required_params:
            operation_params[param.client_name] = create_fake_value(param.type)
        return operation_params

    def get_test(self) -> Test:
        testcases = []
        for operation_groups in self.breadth_search_operation_group:
            for operation in operation_groups[-1].operations:
                if operation.internal or operation.is_lro_initial_operation:
                    continue
                operation_params = self.get_operation_params(operation)
                testcase = TestCase(
                    operation_groups=operation_groups,
                    params=operation_params,
                    operation=operation,
                    async_mode=self.async_mode,
                    is_azure_arm=self.code_model.options["azure-arm"],
                )
                testcases.append(testcase)
        if not testcases:
            raise Exception("no public operation to test")  # pylint: disable=broad-exception-raised

        return Test(
            code_model=self.code_model,
            client_name=self.client.name,
            operation_group=self.operation_group,
            testcases=testcases,
            test_class_name=self.test_class_name,
            async_mode=self.async_mode,
        )

    @property
    def test_class_name(self) -> str:
        test_name = TestName(self.code_model, self.client.name, async_mode=self.async_mode)
        class_name = "" if self.operation_group.is_mixin else self.operation_group.class_name
        return f"Test{test_name.prefix}{class_name}{test_name.async_suffix_capt}"

    def serialize_test(self) -> str:
        return self.env.get_template("test.py.jinja2").render(
            imports=self.import_test,
            is_azure_arm=self.code_model.options["azure-arm"],
            license_header=self.code_model.license_header,
            test=self.get_test(),
        )
