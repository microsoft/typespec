from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class Input(_message.Message):
    __slots__ = ["testInputField"]
    TESTINPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    testInputField: str
    def __init__(self, testInputField: _Optional[str] = ...) -> None: ...

class FooResponse(_message.Message):
    __slots__ = []
    def __init__(self) -> None: ...
