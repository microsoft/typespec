# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import logging
from typing import Dict, Any
import yaml


from .. import Plugin
from ..utils import parse_args
from .models.code_model import CodeModel
from .serializers import JinjaSerializer


_LOGGER = logging.getLogger(__name__)


class CodeGenerator(Plugin):

    @staticmethod
    def sort_exceptions(yaml_data: Dict[str, Any]) -> None:
        for client in yaml_data["clients"]:
            for group in client.get("operationGroups", []):
                for operation in group.get("operations", []):
                    if not operation.get("exceptions"):
                        continue
                    # sort exceptions by status code, first single status code, then range, then default
                    operation["exceptions"] = sorted(
                        operation["exceptions"],
                        key=lambda x: (
                            3
                            if x["statusCodes"][0] == "default"
                            else (1 if isinstance(x["statusCodes"][0], int) else 2)
                        ),
                    )

    @staticmethod
    def remove_cloud_errors(yaml_data: Dict[str, Any]) -> None:
        for client in yaml_data["clients"]:
            for group in client.get("operationGroups", []):
                for operation in group.get("operations", []):
                    if not operation.get("exceptions"):
                        continue
                    i = 0
                    while i < len(operation["exceptions"]):
                        exception = operation["exceptions"][i]
                        if (
                            exception.get("schema")
                            and exception["schema"]["language"]["default"]["name"] == "CloudError"
                        ):
                            del operation["exceptions"][i]
                            i -= 1
                        i += 1
        if yaml_data.get("schemas") and yaml_data["schemas"].get("objects"):
            for i in range(len(yaml_data["schemas"]["objects"])):
                obj_schema = yaml_data["schemas"]["objects"][i]
                if obj_schema["language"]["default"]["name"] == "CloudError":
                    del yaml_data["schemas"]["objects"][i]
                    break

    def get_yaml(self) -> Dict[str, Any]:
        # tsp file doesn't have to be relative to output folder
        with open(self.options["tsp_file"], "r", encoding="utf-8-sig") as fd:
            return yaml.safe_load(fd.read())

    def get_serializer(self, code_model: CodeModel):
        return JinjaSerializer(code_model, output_folder=self.output_folder)

    def process(self) -> bool:
        # List the input file, should be only one
        yaml_data = self.get_yaml()

        self.sort_exceptions(yaml_data)

        if self.options["azure-arm"]:
            self.remove_cloud_errors(yaml_data)

        code_model = CodeModel(yaml_data=yaml_data, options=self.options)
        if self.options["flavor"] != "azure" and any(client.lro_operations for client in code_model.clients):
            raise ValueError("Only support LROs for Azure SDKs")
        serializer = self.get_serializer(code_model)
        serializer.serialize()
        return True


if __name__ == "__main__":
    # TSP pipeline will call this
    parsed_args, unknown_args = parse_args()
    CodeGenerator(
        output_folder=parsed_args.output_folder,
        tsp_file=parsed_args.tsp_file,
        **unknown_args,
    ).process()
