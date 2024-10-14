# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from copy import deepcopy
from typing import List
from ..models.imports import (
    ImportType,
    FileImport,
    ImportModel,
    TypingSection,
    TypeDefinition,
)


def _serialize_package(imports: List[ImportModel], delimiter: str) -> str:
    buffer = []
    if any(i for i in imports if i.submodule_name is None):
        buffer.append(f"import {imports[0].module_name}{f' as {imports[0].alias}' if imports[0].alias else ''}")
    else:
        import_str = ", ".join(
            sorted(
                set(
                    f"{i.submodule_name} as {i.alias}" if i.alias else i.submodule_name for i in imports  # type: ignore
                )
            )
        )
        buffer.append(f"from {imports[0].module_name} import {import_str}")
    return delimiter.join(buffer)


def _serialize_versioned_package(i: ImportModel, delimiter: str) -> str:
    if not i.version_modules:
        return ""
    buffer = []
    for n, (version, module_name, comment) in enumerate(i.version_modules):
        buffer.append("{} sys.version_info >= {}:".format("if" if n == 0 else "elif", version))
        buffer.append(
            f"    from {module_name} import {i.submodule_name}{f' as {i.alias}' if i.alias else ''}"
            f"{f' # {comment}' if comment else ''}"
        )
    buffer.append("else:")
    buffer.append(
        f"    from {i.module_name} import {i.submodule_name}{f' as {i.alias}' if i.alias else ''}" "  # type: ignore"
    )
    return delimiter.join(buffer)


def _serialize_import_type(imports: List[ImportModel], delimiter: str) -> str:
    """Serialize a given import type."""
    import_list = []
    for module_name in sorted(set(i.module_name for i in imports)):
        normal_imports = [i for i in imports if i.module_name == module_name and not i.version_modules]
        versioned_imports = [i for i in imports if i.module_name == module_name and i.version_modules]
        if normal_imports:
            import_list.append(_serialize_package(normal_imports, delimiter))
        for i in versioned_imports:
            import_list.append(_serialize_versioned_package(i, delimiter))
    return delimiter.join(import_list)


def _get_import_clauses(imports: List[ImportModel], delimiter: str) -> List[str]:
    import_clause = []
    for import_type in ImportType:
        imports_with_import_type = [i for i in imports if i.import_type == import_type]
        if imports_with_import_type:
            import_clause.append(_serialize_import_type(imports_with_import_type, delimiter))
    return import_clause


class FileImportSerializer:
    def __init__(self, file_import: FileImport, async_mode: bool = False) -> None:
        self.file_import = file_import
        self.async_mode = async_mode

    def _get_imports_list(self, baseline_typing_section: TypingSection, add_conditional_typing: bool):
        # If this is a python 3 file, our regular imports include the CONDITIONAL category
        # If this is not a python 3 file, our typing imports include the CONDITIONAL category
        file_import_copy = deepcopy(self.file_import)
        if add_conditional_typing and any(self.file_import.get_imports_from_section(TypingSection.CONDITIONAL)):
            # we switch the TypingSection key for the CONDITIONAL typing imports so we can merge
            # the imports together
            for i in file_import_copy.imports:
                if i.typing_section == TypingSection.CONDITIONAL:
                    i.typing_section = baseline_typing_section
        return file_import_copy.get_imports_from_section(baseline_typing_section)

    def _add_type_checking_import(self):
        if any(self.file_import.get_imports_from_section(TypingSection.TYPING)):
            self.file_import.add_submodule_import("typing", "TYPE_CHECKING", ImportType.STDLIB)

    def get_typing_definitions(self) -> str:
        def declare_definition(type_name: str, type_definition: TypeDefinition) -> List[str]:
            ret: List[str] = []
            definition_value = type_definition.async_definition if self.async_mode else type_definition.sync_definition
            ret.append("{} = {}".format(type_name, definition_value))
            return ret

        if not self.file_import.type_definitions:
            return ""
        declarations: List[str] = [""]
        for type_name, value in self.file_import.type_definitions.items():
            declarations.extend(declare_definition(type_name, value))
        return "\n".join(declarations)

    def __str__(self) -> str:
        self._add_type_checking_import()
        regular_imports = ""
        regular_imports_list = self._get_imports_list(
            baseline_typing_section=TypingSection.REGULAR,
            add_conditional_typing=True,
        )

        if regular_imports_list:
            regular_imports = "\n\n".join(_get_import_clauses(regular_imports_list, "\n"))

        typing_imports = ""
        typing_imports_list = self._get_imports_list(
            baseline_typing_section=TypingSection.TYPING,
            add_conditional_typing=False,
        )
        if typing_imports_list:
            typing_imports += "\n\nif TYPE_CHECKING:\n    "
            typing_imports += "\n\n    ".join(_get_import_clauses(typing_imports_list, "\n    "))
        return regular_imports + typing_imports + self.get_typing_definitions()
