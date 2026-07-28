from abc import ABC
from typing import Generic, TYPE_CHECKING, TypeVar

if TYPE_CHECKING:
    from .serialization import Deserializer, Serializer


TClient = TypeVar("TClient")
TConfig = TypeVar("TConfig")


class ClientMixinABC(ABC, Generic[TClient, TConfig]):
    """DO NOT use this class. It is for internal typing use only."""

    _client: TClient
    _config: TConfig
    _serialize: "Serializer"
    _deserialize: "Deserializer"
