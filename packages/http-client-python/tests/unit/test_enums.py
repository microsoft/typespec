# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from enum import Enum, EnumMeta
from specialwords.extensiblestrings import models as extensible_strings_models


class _CaseInsensitiveEnumMeta(EnumMeta):
    def __getitem__(self, name):
        return super().__getitem__(name.upper())

    def __getattr__(cls, name):
        """Return the enum member matching `name`
        We use __getattr__ instead of descriptors or inserting into the enum
        class' __dict__ in order to support `name` and `value` being both
        properties for enum members (which live in the class' __dict__) and
        enum members themselves.
        """
        try:
            return cls._member_map_[name.upper()]
        except KeyError:
            raise AttributeError(name)


class EnumsWithCallableNames(str, Enum, metaclass=_CaseInsensitiveEnumMeta):
    """Gets the unit of measurement."""

    COUNT = "count"
    ENCODE = "encode"
    FIND = "find"
    JOIN = "join"


def test_count():
    assert EnumsWithCallableNames.COUNT == "count"
    assert callable(EnumsWithCallableNames.count)


def test_encode():
    assert EnumsWithCallableNames.ENCODE == "encode"
    assert callable(EnumsWithCallableNames.encode)


def test_find():
    assert EnumsWithCallableNames.FIND == "find"
    assert callable(EnumsWithCallableNames.find)


def test_join():
    assert EnumsWithCallableNames.JOIN == "join"
    assert callable(EnumsWithCallableNames.join)


def test_extensible_strings_enum_with_special_words():
    assert extensible_strings_models.ExtensibleString.AND == "and"
    assert extensible_strings_models.ExtensibleString.AS == "as"
    assert extensible_strings_models.ExtensibleString.ASSERT == "assert"
    assert extensible_strings_models.ExtensibleString.ASYNC == "async"
    assert extensible_strings_models.ExtensibleString.AWAIT == "await"
    assert extensible_strings_models.ExtensibleString.BREAK == "break"
    assert extensible_strings_models.ExtensibleString.CLASS == "class"
    assert extensible_strings_models.ExtensibleString.CONSTRUCTOR == "constructor"
    assert extensible_strings_models.ExtensibleString.CONTINUE == "continue"
    assert extensible_strings_models.ExtensibleString.DEF == "def"
    assert extensible_strings_models.ExtensibleString.DEL == "del"
    assert extensible_strings_models.ExtensibleString.ELIF == "elif"
    assert extensible_strings_models.ExtensibleString.ELSE == "else"
    assert extensible_strings_models.ExtensibleString.EXCEPT == "except"
    assert extensible_strings_models.ExtensibleString.EXEC == "exec"
    assert extensible_strings_models.ExtensibleString.FINALLY == "finally"
    assert extensible_strings_models.ExtensibleString.FOR == "for"
    assert extensible_strings_models.ExtensibleString.FROM == "from"
    assert extensible_strings_models.ExtensibleString.GLOBAL == "global"
    assert extensible_strings_models.ExtensibleString.IF == "if"
    assert extensible_strings_models.ExtensibleString.IMPORT == "import"
    assert extensible_strings_models.ExtensibleString.IN == "in"
    assert extensible_strings_models.ExtensibleString.IS == "is"
    assert extensible_strings_models.ExtensibleString.LAMBDA == "lambda"
    assert extensible_strings_models.ExtensibleString.NOT == "not"
    assert extensible_strings_models.ExtensibleString.OR == "or"
    assert extensible_strings_models.ExtensibleString.PASS == "pass"
    assert extensible_strings_models.ExtensibleString.RAISE == "raise"
    assert extensible_strings_models.ExtensibleString.RETURN == "return"
    assert extensible_strings_models.ExtensibleString.TRY == "try"
    assert extensible_strings_models.ExtensibleString.WHILE == "while"
    assert extensible_strings_models.ExtensibleString.WITH == "with"
    assert extensible_strings_models.ExtensibleString.YIELD == "yield"
