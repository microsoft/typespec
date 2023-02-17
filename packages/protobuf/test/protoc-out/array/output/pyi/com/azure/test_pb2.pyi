from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class Input(_message.Message):
    __slots__ = ["testInputField"]
    TESTINPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    testInputField: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, testInputField: _Optional[_Iterable[str]] = ...) -> None: ...

class Output(_message.Message):
    __slots__ = ["testOutputField", "secondField"]
    TESTOUTPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    SECONDFIELD_FIELD_NUMBER: _ClassVar[int]
    testOutputField: _containers.RepeatedScalarFieldContainer[int]
    secondField: str
    def __init__(self, testOutputField: _Optional[_Iterable[int]] = ..., secondField: _Optional[str] = ...) -> None: ...
