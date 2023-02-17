from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class InputType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
    FOO: _ClassVar[InputType]
    BAR: _ClassVar[InputType]

class InputTypeWithAlias(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = []
    BAZ: _ClassVar[InputTypeWithAlias]
    QUX: _ClassVar[InputTypeWithAlias]
    FUZ: _ClassVar[InputTypeWithAlias]
FOO: InputType
BAR: InputType
BAZ: InputTypeWithAlias
QUX: InputTypeWithAlias
FUZ: InputTypeWithAlias

class Input(_message.Message):
    __slots__ = ["testInputField", "type", "aliased"]
    TESTINPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    ALIASED_FIELD_NUMBER: _ClassVar[int]
    testInputField: str
    type: InputType
    aliased: InputTypeWithAlias
    def __init__(self, testInputField: _Optional[str] = ..., type: _Optional[_Union[InputType, str]] = ..., aliased: _Optional[_Union[InputTypeWithAlias, str]] = ...) -> None: ...

class Output(_message.Message):
    __slots__ = ["testOutputField", "secondField"]
    TESTOUTPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    SECONDFIELD_FIELD_NUMBER: _ClassVar[int]
    testOutputField: int
    secondField: str
    def __init__(self, testOutputField: _Optional[int] = ..., secondField: _Optional[str] = ...) -> None: ...
