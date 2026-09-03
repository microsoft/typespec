# coding=utf-8
# --------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------
"""Customize generated code here.

Follow our quickstart for examples: https://aka.ms/azsdk/python/dpcodegen/python/customize
"""

from typing import Type
import geojson
from .._utils.model_base import TYPE_HANDLER_REGISTRY


@TYPE_HANDLER_REGISTRY.register_serializer(geojson.Feature)
def feature_serializer(obj: geojson.Feature) -> dict:
    """Serialize a geojson.Feature to a dict.

    :param obj: The geojson.Feature object to serialize.
    :type obj: geojson.Feature
    :return: The serialized feature as a dictionary.
    :rtype: dict
    """
    return {
        "type": obj.type,
        "geometry": {"type": obj.geometry.type, "coordinates": obj.geometry.coordinates},
        "properties": obj.properties,
        "id": obj.id,
    }


@TYPE_HANDLER_REGISTRY.register_deserializer(geojson.Feature)
def feature_deserializer(cls: Type[geojson.Feature], data: dict) -> geojson.Feature:
    """Deserialize a dict to a geojson.Feature.

    :param data: The dictionary data to deserialize.
    :type data: dict
    :return: The deserialized geojson.Feature object.
    :rtype: geojson.Feature
    """
    return cls(
        type=data.get("type"),
        geometry=geojson.geometry.Geometry(  # type: ignore
            type=data["geometry"].get("type"), coordinates=data["geometry"].get("coordinates")
        ),
        properties=data.get("properties"),
        id=data.get("id"),
    )


__all__: list[str] = []  # Add all objects you want publicly available to users at this package level


def patch_sdk():
    """Do not remove from this file.

    `patch_sdk` is a last resort escape hatch that allows you to do customizations
    you can't accomplish using the techniques described in
    https://aka.ms/azsdk/python/dpcodegen/python/customize
    """
