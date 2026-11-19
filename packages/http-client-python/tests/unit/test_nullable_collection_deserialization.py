# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

from typing import Optional, Union
import xml.etree.ElementTree as ET

import pytest

from specialwords._utils.model_base import Model, rest_field

NullableList = Optional[list[Optional[str]]]
ListWithNullableItems = list[Optional[str]]


@pytest.mark.parametrize("use_field_plan", [False, True])
def test_nullable_items_do_not_make_missing_xml_collections_optional(use_field_plan):
    fields = {
        "required": list[Optional[str]],
        "nested": list[list[Optional[str]]],
        "dictionaries": list[dict[str, Optional[str]]],
        "optional": Optional[list[str]],
        "both_nullable": Optional[list[Optional[str]]],
        "nullable_alias": "NullableList",
        "required_alias": "ListWithNullableItems",
    }
    model_type = type(
        f"XmlCollections{use_field_plan}",
        (Model,),
        {
            "__module__": __name__,
            "__annotations__": fields,
            "_xml": {"name": "Payload"} if use_field_plan else {},
            **{name: rest_field(xml={"name": name, "unwrapped": True}) for name in fields},
        },
    )

    result = model_type(ET.fromstring("<Payload/>"))

    assert result.required == []
    assert result.nested == []
    assert result.dictionaries == []
    assert result.required_alias == []
    assert result.optional is None
    assert result.both_nullable is None
    assert result.nullable_alias is None


def test_nullable_collection_items_keep_field_format():
    class EncodedCollections(Model):
        items: list[Optional[bytes]] = rest_field(format="base64url")
        values: dict[str, Optional[bytes]] = rest_field(format="base64url")
        nested: list[list[Optional[bytes]]] = rest_field(format="base64url")

    result = EncodedCollections(
        {"items": [None, "_w"], "values": {"null": None, "data": "_w"}, "nested": [[None, "_w"]]}
    )

    assert result.items == [None, b"\xff"]
    assert result.values == {"null": None, "data": b"\xff"}
    assert result.nested == [[None, b"\xff"]]


class Child(Model):
    value: str = rest_field()


def test_nullable_model_items_keep_mapping_deserialization():
    class Collections(Model):
        items: list[Optional[Child]] = rest_field()
        values: dict[str, Optional[Child]] = rest_field()

    result = Collections({"items": [None, {"value": "item"}], "values": {"null": None, "data": {"value": "entry"}}})

    assert result["items"][0] is None
    assert isinstance(result["items"][1], Child)
    assert result["items"][1].value == "item"
    assert result["values"]["null"] is None
    assert isinstance(result["values"]["data"], Child)
    assert result["values"]["data"].value == "entry"


@pytest.mark.parametrize(
    "encoding,encoded",
    [
        ("commaDelimited", "blue,green"),
        ("pipeDelimited", "blue|green"),
        ("spaceDelimited", "blue green"),
        ("newlineDelimited", "blue\ngreen"),
    ],
)
@pytest.mark.parametrize("item_type,kind", [(Optional[str], "String"), (Optional[Union[str, int]], "Union")])
def test_delimited_nullable_items_deserialize_as_arrays(encoding, encoded, item_type, kind):
    model_type = type(
        f"EncodedNullable{encoding}{kind}",
        (Model,),
        {
            "__module__": __name__,
            "__annotations__": {"items": list[item_type], "nullable_items": Optional[list[item_type]]},
            "items": rest_field(format=encoding),
            "nullable_items": rest_field(format=encoding),
        },
    )

    for value, expected in [(encoded, ["blue", "green"]), (["blue", "green"], ["blue", "green"]), ("", []), ([], [])]:
        assert model_type({"items": value}).items == expected
        assert model_type(items=value).items == expected

    explicit_null = model_type({"nullable_items": None})
    omitted = model_type(nullable_items=None)
    assert explicit_null.nullable_items is None
    assert "nullable_items" in explicit_null
    assert omitted.nullable_items is None
    assert "nullable_items" not in omitted
