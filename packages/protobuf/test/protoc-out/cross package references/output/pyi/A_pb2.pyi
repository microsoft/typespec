from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class Output(_message.Message):
    __slots__ = ["testOutputField", "secondField"]
    TESTOUTPUTFIELD_FIELD_NUMBER: _ClassVar[int]
    SECONDFIELD_FIELD_NUMBER: _ClassVar[int]
    testOutputField: int
    secondField: str
    def __init__(self, testOutputField: _Optional[int] = ..., secondField: _Optional[str] = ...) -> None: ...
