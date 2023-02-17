from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class InputA(_message.Message):
    __slots__ = ["testInputField"]
    TESTINPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    testInputField: str
    def __init__(self, testInputField: _Optional[str] = ...) -> None: ...

class InputB(_message.Message):
    __slots__ = ["testInputField"]
    TESTINPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    testInputField: int
    def __init__(self, testInputField: _Optional[int] = ...) -> None: ...

class Input(_message.Message):
    __slots__ = ["a", "b"]
    A_FIELD_NUMBER: _ClassVar[int]
    B_FIELD_NUMBER: _ClassVar[int]
    a: InputA
    b: InputB
    def __init__(self, a: _Optional[_Union[InputA, _Mapping]] = ..., b: _Optional[_Union[InputB, _Mapping]] = ...) -> None: ...

class Output(_message.Message):
    __slots__ = ["testOutputField", "secondField"]
    TESTOUTPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    SECONDFIELD_FIELD_NUMBER: _ClassVar[int]
    testOutputField: int
    secondField: str
    def __init__(self, testOutputField: _Optional[int] = ..., secondField: _Optional[str] = ...) -> None: ...
