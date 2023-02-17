from foo import bar_pb2 as _bar_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class BarRequest(_message.Message):
    __slots__ = ["empty"]
    EMPTY_FIELD_NUMBER: _ClassVar[int]
    empty: _empty_pb2.Empty
    def __init__(self, empty: _Optional[_Union[_empty_pb2.Empty, _Mapping]] = ...) -> None: ...

class BarResponse(_message.Message):
    __slots__ = ["myExtern"]
    MYEXTERN_FIELD_NUMBER: _ClassVar[int]
    myExtern: _bar_pb2.Bar
    def __init__(self, myExtern: _Optional[_Union[_bar_pb2.Bar, _Mapping]] = ...) -> None: ...
