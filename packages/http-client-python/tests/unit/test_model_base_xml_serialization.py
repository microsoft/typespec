# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import xml.etree.ElementTree as ET

from typing import Literal, Optional

from specialwords._utils.model_base import (
    _get_element,
    Model,
    rest_field,
    rest_discriminator,
    _deserialize_xml,
    _xml_deser_str,
)


def assert_xml_equals(x1, x2):
    ET.dump(x1)
    ET.dump(x2)

    assert x1.tag == x2.tag
    assert (x1.text or "").strip() == (x2.text or "").strip()
    # assert x1.tail == x2.tail # Swagger does not change tail
    assert x1.attrib == x2.attrib
    assert len(x1) == len(x2)
    for c1, c2 in zip(x1, x2):
        assert_xml_equals(c1, c2)


class TestXmlDeserialization:
    def test_basic(self):
        """Test an ultra basic XML."""
        basic_xml = """<?xml version="1.0"?>
            <Data country="france">
                <Int>12</Int>
                <EmptyInt/>
                <Float>12.34</Float>
                <EmptyFloat/>
                <Bool>true</Bool>
                <EmptyBool/>
                <String>test</String>
                <EmptyString/>
            </Data>"""

        class XmlModel(Model):
            int_field: int = rest_field(name="int", xml={"name": "Int"})
            empty_int: int = rest_field(name="empty_int", xml={"name": "EmptyInt"})
            float_field: float = rest_field(name="float", xml={"name": "Float"})
            empty_float: float = rest_field(name="empty_float", xml={"name": "EmptyFloat"})
            bool_field: bool = rest_field(name="bool", xml={"name": "Bool"})
            empty_bool: bool = rest_field(name="empty_bool", xml={"name": "EmptyBool"})
            string: str = rest_field(name="string", xml={"name": "String"})
            empty_string: str = rest_field(name="empty_string", xml={"name": "EmptyString"})
            not_set: str = rest_field(name="not_set", xml={"name": "NotSet"})
            country: str = rest_field(name="country", xml={"name": "country", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)

        assert result.int_field == 12
        assert result.empty_int is None
        assert result.float_field == 12.34
        assert result.empty_float is None
        assert result.bool_field is True
        assert result.empty_bool is None
        assert result.string == "test"
        assert result.country == "france"
        assert result.empty_string == ""
        assert result.not_set is None

    def test_basic_unicode(self):
        """Test a XML with unicode."""
        basic_xml = """<?xml version="1.0" encoding="utf-8"?>
            <Data language="français"/>"""

        class XmlModel(Model):
            language: str = rest_field(name="language", xml={"name": "language", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)

        assert result.language == "français"

    def test_basic_text(self):
        """Test a XML with unicode."""
        basic_xml = """<?xml version="1.0" encoding="utf-8"?>
            <Data language="english">I am text</Data>"""

        class XmlModel(Model):
            language: str = rest_field(name="language", xml={"name": "language", "attribute": True})
            content: str = rest_field(name="content", xml={"name": "content", "text": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)

        assert result.language == "english"
        assert result.content == "I am text"

    def test_dict_type(self):
        """Test dict type."""
        basic_xml = """<?xml version="1.0"?>
            <Data>
                <Metadata>
                  <Key1>value1</Key1>
                  <Key2>value2</Key2>
                </Metadata>
            </Data>"""

        class XmlModel(Model):
            metadata: dict[str, str] = rest_field(name="Metadata", xml={"name": "Metadata"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)

        assert len(result.metadata) == 2
        assert result.metadata["Key1"] == "value1"
        assert result.metadata["Key2"] == "value2"

    def test_basic_empty_list(self):
        """Test an basic XML with an empty node."""
        basic_xml = """<?xml version="1.0"?>
            <Data>
                <Age/>
            </Data>"""

        class XmlModel(Model):
            age: list[str] = rest_field(name="age", xml={"name": "Age"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)
        assert result.age == []

    def test_basic_empty_list_unwrapped(self):
        """Test an basic XML with an empty node."""
        basic_xml = """<?xml version="1.0"?>
            <Data/>"""

        class XmlModel(Model):
            age: list[str] = rest_field(name="age", xml={"name": "Age", "unwrapped": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)
        assert result.age == []

    def test_list_wrapped_items_name_basic_types(self):
        """Test XML list and wrap, items is basic type and there is itemsName."""

        basic_xml = """<?xml version="1.0"?>
            <AppleBarrel>
                <GoodApples>
                  <Apple>granny</Apple>
                  <Apple>fuji</Apple>
                </GoodApples>
            </AppleBarrel>"""

        class AppleBarrel(Model):
            good_apples: list[str] = rest_field(name="GoodApples", xml={"name": "GoodApples", "itemsName": "Apple"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        result = _deserialize_xml(AppleBarrel, basic_xml)
        assert result.good_apples == ["granny", "fuji"]

    def test_list_not_wrapped_items_name_basic_types(self):
        """Test XML list and no wrap, items is basic type and there is itemsName."""

        basic_xml = """<?xml version="1.0"?>
            <AppleBarrel>
                <Apple>granny</Apple>
                <Apple>fuji</Apple>
            </AppleBarrel>"""

        class AppleBarrel(Model):
            good_apples: list[str] = rest_field(
                name="GoodApples",
                xml={"name": "GoodApples", "unwrapped": True, "itemsName": "Apple"},
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        result = _deserialize_xml(AppleBarrel, basic_xml)
        assert result.good_apples == ["granny", "fuji"]

    def test_list_wrapped_items_name_complex_types(self):
        """Test XML list and wrap, items is ref and there is itemsName."""

        basic_xml = """<?xml version="1.0"?>
            <AppleBarrel>
                <GoodApples>
                  <Apple name="granny"/>
                  <Apple name="fuji"/>
                </GoodApples>
            </AppleBarrel>"""

        class Apple(Model):
            name: str = rest_field(name="name", xml={"name": "name", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Apple"}

        class AppleBarrel(Model):
            good_apples: list[Apple] = rest_field(name="GoodApples", xml={"name": "GoodApples", "itemsName": "Apple"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        result = _deserialize_xml(AppleBarrel, basic_xml)
        assert [apple.name for apple in result.good_apples] == ["granny", "fuji"]

    def test_list_not_wrapped_items_name_complex_types(self):
        """Test XML list and wrap, items is ref and there is itemsName."""

        basic_xml = """<?xml version="1.0"?>
            <AppleBarrel>
                <Apple name="granny"/>
                <Apple name="fuji"/>
            </AppleBarrel>"""

        class Apple(Model):
            name: str = rest_field(name="name", xml={"name": "name", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Apple"}

        class AppleBarrel(Model):
            good_apples: list[Apple] = rest_field(
                name="GoodApples",
                xml={"name": "GoodApples", "unwrapped": True, "itemsName": "Apple"},
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        result = _deserialize_xml(AppleBarrel, basic_xml)
        assert [apple.name for apple in result.good_apples] == ["granny", "fuji"]

    def test_list_not_wrapped_items_name_complex_types(self):
        """Test XML list and wrap, items is ref and there is itemsName."""

        basic_xml = """<?xml version="1.0"?>
            <AppleBarrel>
                <Apple name="granny"/>
                <Apple name="fuji"/>
            </AppleBarrel>"""

        class Apple(Model):
            name: str = rest_field(name="name", xml={"name": "name", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Apple"}

        class AppleBarrel(Model):
            good_apples: list[Apple] = rest_field(
                name="GoodApples",
                xml={"name": "GoodApples", "unwrapped": True, "itemsName": "Apple"},
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        result = _deserialize_xml(AppleBarrel, basic_xml)
        assert [apple.name for apple in result.good_apples] == ["granny", "fuji"]

    def test_basic_additional_properties(self):
        """Test additional properties."""
        basic_xml = """<?xml version="1.0"?>
            <Data>
                <add1>text</add1>
                <add2>
                    <add2>a</add2>
                    <add2>b</add2>
                    <add2>c</add2>
                </add2>
                <add3>
                    <a>a</a>
                    <b>b</b>
                </add3>
            </Data>"""

        class XmlModel(Model):
            name: str = rest_field(name="name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)

        assert result.name is None
        assert result["add1"] == "text"
        assert result["add2"] == ["a", "b", "c"]
        assert result["add3"] == {"a": "a", "b": "b"}

    def test_basic_namespace(self):
        """Test an ultra basic XML."""
        basic_xml = """<?xml version="1.0"?>
            <Data xmlns:fictional="http://characters.example.com">
                <fictional:Age>37</fictional:Age>
            </Data>"""

        class XmlModel(Model):
            age: int = rest_field(
                name="age",
                xml={
                    "name": "Age",
                    "prefix": "fictional",
                    "ns": "http://characters.example.com",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)
        assert result.age == 37

    def test_complex_namespace(self):
        """Test recursive namespace."""
        basic_xml = """<?xml version="1.0"?>
            <entry xmlns="http://www.w3.org/2005/Atom" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
                <author>
                    <name>lmazuel</name>
                </author>
                <AuthorizationRules xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
                    <AuthorizationRule i:type="SharedAccessAuthorizationRule">
                        <KeyName>testpolicy</KeyName>
                    </AuthorizationRule>
                </AuthorizationRules>
                <MessageCountDetails xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
                    <d2p1:ActiveMessageCount xmlns:d2p1="http://schemas.microsoft.com/netservices/2011/06/servicebus">12</d2p1:ActiveMessageCount>
                </MessageCountDetails>
            </entry>"""

        class QueueDescriptionResponseAuthor(Model):
            name: str = rest_field(name="name", xml={"ns": "http://www.w3.org/2005/Atom"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"ns": "http://www.w3.org/2005/Atom"}

        class AuthorizationRule(Model):
            type: str = rest_field(
                name="type",
                xml={
                    "attribute": True,
                    "prefix": "i",
                    "ns": "http://www.w3.org/2001/XMLSchema-instance",
                },
            )
            key_name: str = rest_field(
                name="KeyName",
                xml={"ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect"},
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect"}

        class MessageCountDetails(Model):
            active_message_count: int = rest_field(
                name="ActiveMessageCount",
                xml={
                    "prefix": "d2p1",
                    "ns": "http://schemas.microsoft.com/netservices/2011/06/servicebus",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {
                "name": "CountDetails",
                "ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect",
            }

        class XmlRoot(Model):
            author: QueueDescriptionResponseAuthor = rest_field(name="author")
            authorization_rules: list[AuthorizationRule] = rest_field(
                name="AuthorizationRules",
                xml={
                    "ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect",
                },
            )
            message_count_details: MessageCountDetails = rest_field(
                name="MessageCountDetails",
                xml={
                    "ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "entry", "ns": "http://www.w3.org/2005/Atom"}

        result = _deserialize_xml(XmlRoot, basic_xml)

        assert result.author.name == "lmazuel"
        assert result.authorization_rules[0].key_name == "testpolicy"
        assert result.authorization_rules[0].type == "SharedAccessAuthorizationRule"
        assert result.message_count_details.active_message_count == 12

    def test_polymorphic_deserialization(self):
        basic_xml = """<?xml version="1.0"?>
            <entry xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                <Filter xsi:type="CorrelationFilter">
                    <CorrelationId>12</CorrelationId>
                </Filter>
            </entry>"""

        class RuleFilter(Model):
            __mapping__: dict[str, Model] = {}
            type: Literal[None] = rest_discriminator(
                name="type",
                xml={
                    "attribute": True,
                    "prefix": "xsi",
                    "ns": "http://www.w3.org/2001/XMLSchema-instance",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.type: Literal[None] = None

            _xml = {"name": "Filter"}

        class CorrelationFilter(RuleFilter):
            type: Literal["CorrelationFilter"] = rest_discriminator(
                name="type",
                xml={
                    "attribute": True,
                    "prefix": "xsi",
                    "ns": "http://www.w3.org/2001/XMLSchema-instance",
                },
            )
            correlation_id: int = rest_field(name="CorrelationId")

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.type: Literal["CorrelationFilter"] = "CorrelationFilter"

        class SqlFilter(RuleFilter):
            type: Literal["SqlFilter"] = rest_discriminator(
                name="type",
                xml={
                    "attribute": True,
                    "prefix": "xsi",
                    "ns": "http://www.w3.org/2001/XMLSchema-instance",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.type: Literal["SqlFilter"] = "SqlFilter"

        class XmlRoot(Model):
            filter: RuleFilter = rest_field(name="Filter")

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "entry"}

        result = _deserialize_xml(XmlRoot, basic_xml)

        assert isinstance(result.filter, CorrelationFilter)
        assert result.filter.correlation_id == 12

    def test_enumeration_results(self):
        """Test deserializing an Azure Blob Storage EnumerationResults XML payload."""
        xml_payload = '<?xml version="1.0" encoding="utf-8"?><EnumerationResults ServiceEndpoint="https://service.blob.core.windows.net/" ContainerName="my-container-108f32e8"><Delimiter>/</Delimiter><Blobs /><NextMarker /></EnumerationResults>'

        class EnumerationResults(Model):
            service_endpoint: str = rest_field(
                name="ServiceEndpoint", xml={"name": "ServiceEndpoint", "attribute": True}
            )
            container_name: str = rest_field(name="ContainerName", xml={"name": "ContainerName", "attribute": True})
            delimiter: str = rest_field(name="Delimiter", xml={"name": "Delimiter"})
            blobs: list[str] = rest_field(name="Blobs", xml={"name": "Blobs"})
            next_marker: str = rest_field(name="NextMarker", xml={"name": "NextMarker"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "EnumerationResults"}

        result = _deserialize_xml(EnumerationResults, xml_payload)

        assert result.service_endpoint == "https://service.blob.core.windows.net/"
        assert result.container_name == "my-container-108f32e8"
        assert result.delimiter == "/"
        assert result.blobs == []
        assert result.next_marker == ""

    def test_enumeration_results_nested_empty_list(self):
        """Test deserializing XML where a container element holds a nested empty list (e.g. Blobs/BlobPrefixes)."""
        xml_payload = '<?xml version="1.0" encoding="utf-8"?><EnumerationResults ServiceEndpoint="https://service.blob.core.windows.net/" ContainerName="my-container"><Delimiter>/</Delimiter><Blobs><BlobPrefixes /></Blobs><NextMarker /></EnumerationResults>'

        class BlobPrefix(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "BlobPrefix"}

        class BlobsSegment(Model):
            blob_prefixes: list[BlobPrefix] = rest_field(
                name="BlobPrefixes", xml={"name": "BlobPrefixes", "itemsName": "BlobPrefix"}
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Blobs"}

        class EnumerationResults(Model):
            service_endpoint: str = rest_field(
                name="ServiceEndpoint", xml={"name": "ServiceEndpoint", "attribute": True}
            )
            container_name: str = rest_field(name="ContainerName", xml={"name": "ContainerName", "attribute": True})
            delimiter: str = rest_field(name="Delimiter", xml={"name": "Delimiter"})
            blobs: BlobsSegment = rest_field(name="Blobs", xml={"name": "Blobs"})
            next_marker: str = rest_field(name="NextMarker", xml={"name": "NextMarker"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "EnumerationResults"}

        result = _deserialize_xml(EnumerationResults, xml_payload)

        assert result.service_endpoint == "https://service.blob.core.windows.net/"
        assert result.container_name == "my-container"
        assert result.delimiter == "/"
        assert result.blobs.blob_prefixes == []
        assert result.next_marker == ""

    def test_enumeration_results_azure_sdk_pattern(self):
        """Test the real Azure SDK model pattern where BlobsSegment has two unwrapped list fields."""
        # Both blob_prefixes and blob_items are unwrapped lists (items appear directly in <Blobs>).
        # With <Blobs />, no matching children are found so both are None.
        xml_payload = '<?xml version="1.0" encoding="utf-8"?><EnumerationResults ServiceEndpoint="https://service.blob.core.windows.net/" ContainerName="my-container"><Delimiter>/</Delimiter><Blobs /><NextMarker /></EnumerationResults>'

        class BlobPrefix(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "BlobPrefix"}

        class BlobItem(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Blob"}

        class BlobsSegment(Model):
            blob_prefixes: list[BlobPrefix] = rest_field(
                name="blob_prefixes", xml={"name": "BlobPrefix", "unwrapped": True}
            )
            blob_items: list[BlobItem] = rest_field(name="blob_items", xml={"name": "Blob", "unwrapped": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Blobs"}

        class EnumerationResults(Model):
            service_endpoint: str = rest_field(
                name="ServiceEndpoint", xml={"name": "ServiceEndpoint", "attribute": True}
            )
            container_name: str = rest_field(name="ContainerName", xml={"name": "ContainerName", "attribute": True})
            delimiter: str = rest_field(name="Delimiter", xml={"name": "Delimiter"})
            blobs: BlobsSegment = rest_field(name="Blobs", xml={"name": "Blobs"})
            next_marker: str = rest_field(name="NextMarker", xml={"name": "NextMarker"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "EnumerationResults"}

        result = _deserialize_xml(EnumerationResults, xml_payload)

        assert result.service_endpoint == "https://service.blob.core.windows.net/"
        assert result.container_name == "my-container"
        assert result.delimiter == "/"
        assert isinstance(result.blobs, BlobsSegment)
        # With <Blobs />, no <BlobPrefix> or <Blob> children exist → unwrapped non-optional lists default to []
        assert result.blobs.blob_prefixes == []
        assert result.blobs.blob_items == []
        assert result.next_marker == ""

    def test_enumeration_results_azure_sdk_pattern_optional(self):
        """Test the Azure SDK pattern where unwrapped list fields are Optional[list[X]].

        When the type is Optional[list[X]], empty unwrapped lists should stay None
        (the element is absent, and None is a valid value for the optional type).
        """
        xml_payload = '<?xml version="1.0" encoding="utf-8"?><EnumerationResults ServiceEndpoint="https://service.blob.core.windows.net/" ContainerName="my-container"><Delimiter>/</Delimiter><Blobs /><NextMarker /></EnumerationResults>'

        class BlobPrefix(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "BlobPrefix"}

        class BlobItem(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Blob"}

        class BlobsSegment(Model):
            blob_prefixes: Optional[list[BlobPrefix]] = rest_field(
                name="blob_prefixes", xml={"name": "BlobPrefix", "unwrapped": True}
            )
            blob_items: Optional[list[BlobItem]] = rest_field(
                name="blob_items", xml={"name": "Blob", "unwrapped": True}
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Blobs"}

        class EnumerationResults(Model):
            service_endpoint: str = rest_field(
                name="ServiceEndpoint", xml={"name": "ServiceEndpoint", "attribute": True}
            )
            container_name: str = rest_field(name="ContainerName", xml={"name": "ContainerName", "attribute": True})
            delimiter: str = rest_field(name="Delimiter", xml={"name": "Delimiter"})
            blobs: BlobsSegment = rest_field(name="Blobs", xml={"name": "Blobs"})
            next_marker: str = rest_field(name="NextMarker", xml={"name": "NextMarker"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "EnumerationResults"}

        result = _deserialize_xml(EnumerationResults, xml_payload)

        assert result.service_endpoint == "https://service.blob.core.windows.net/"
        assert result.container_name == "my-container"
        assert result.delimiter == "/"
        assert isinstance(result.blobs, BlobsSegment)
        # With <Blobs />, no <BlobPrefix> or <Blob> children exist → Optional lists stay None
        assert result.blobs.blob_prefixes is None
        assert result.blobs.blob_items is None
        assert result.next_marker == ""

    def test_customized_subclass_does_not_break_generated_xml_deserialization(self):
        """Regression test: a downstream customized subclass that re-annotates a Model
        field must not corrupt the parent (generated) class's XML deserialization.

        When a customization (such as
        ``azure.storage.fileshare._models.Metrics`` in azure-sdk-for-python)
        subclasses a generated model and re-annotates a nested Model field
        to a strict custom class, instantiating the customized subclass
        populates the *shared* ``_RestField._type`` (via ``Model.__new__``)
        from the custom annotation.  Previously, ``_build_xml_field_plan``
        would then precompute that custom Model class as the deserializer
        for the *generated* class too, and ``_init_from_xml`` would invoke
        ``CustomChild(<ET.Element>)`` directly — which raises if the custom
        ``__init__`` enforces a strict signature.
        """
        xml = """<?xml version="1.0" encoding="utf-8"?>
            <Metrics>
                <Enabled>true</Enabled>
                <RetentionPolicy>
                    <Enabled>true</Enabled>
                    <Days>5</Days>
                </RetentionPolicy>
            </Metrics>"""

        class RetentionPolicy(Model):
            enabled: bool = rest_field(name="Enabled", xml={"name": "Enabled"})
            days: Optional[int] = rest_field(name="Days", xml={"name": "Days"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "RetentionPolicy"}

        class Metrics(Model):
            enabled: bool = rest_field(name="Enabled", xml={"name": "Enabled"})
            retention_policy: Optional[RetentionPolicy] = rest_field(
                name="RetentionPolicy", xml={"name": "RetentionPolicy"}
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Metrics"}

        class CustomRetentionPolicy(RetentionPolicy):
            def __init__(self, enabled: bool = False, days: Optional[int] = None) -> None:
                if enabled and days is None:
                    raise ValueError("If policy is enabled, 'days' must be specified.")
                super().__init__(enabled=enabled, days=days)

        class CustomMetrics(Metrics):
            # Re-annotating with the custom subclass is what triggers the
            # shared _RestField._type to be resolved against CustomRetentionPolicy.
            retention_policy: CustomRetentionPolicy = CustomRetentionPolicy()  # noqa: F811

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

        # Instantiate the customized subclass FIRST so that the shared
        # ``_RestField`` for ``retention_policy`` on the parent Metrics gets
        # its ``_type`` populated from the custom annotation.
        CustomMetrics()

        # Deserializing into the parent (generated-style) Metrics class
        # must NOT invoke ``CustomRetentionPolicy(<ET.Element>)``.
        result = _deserialize_xml(Metrics, xml)
        assert result.enabled is True
        assert result.retention_policy is not None

    def test_enumeration_results_blobs_unwrapped(self):
        """Test what happens when the blobs field itself is declared with unwrapped=True."""
        # When a non-list model field uses unwrapped=True, the matching XML elements are collected
        # as a list and stored as-is (the field receives a list of ET.Element objects).
        xml_payload = '<?xml version="1.0" encoding="utf-8"?><EnumerationResults ServiceEndpoint="https://service.blob.core.windows.net/" ContainerName="my-container"><Delimiter>/</Delimiter><Blobs /><NextMarker /></EnumerationResults>'

        class BlobPrefix(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "BlobPrefix"}

        class BlobsSegment(Model):
            blob_prefixes: list[BlobPrefix] = rest_field(
                name="BlobPrefixes", xml={"name": "BlobPrefixes", "itemsName": "BlobPrefix"}
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Blobs"}

        class EnumerationResults(Model):
            service_endpoint: str = rest_field(
                name="ServiceEndpoint", xml={"name": "ServiceEndpoint", "attribute": True}
            )
            container_name: str = rest_field(name="ContainerName", xml={"name": "ContainerName", "attribute": True})
            delimiter: str = rest_field(name="Delimiter", xml={"name": "Delimiter"})
            # unwrapped=True on a model-typed field: the deserialization collects matching XML
            # elements as a list (rather than deserializing them into the model).
            blobs: BlobsSegment = rest_field(name="Blobs", xml={"name": "Blobs", "unwrapped": True})
            next_marker: str = rest_field(name="NextMarker", xml={"name": "NextMarker"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "EnumerationResults"}

        result = _deserialize_xml(EnumerationResults, xml_payload)

        assert result.service_endpoint == "https://service.blob.core.windows.net/"
        assert result.container_name == "my-container"
        assert result.delimiter == "/"
        # unwrapped=True on a model field collects matching elements; <Blobs /> is found so it
        # returns a list containing the raw ET.Element instead of a deserialized BlobsSegment.
        assert isinstance(result.blobs, list)
        assert len(result.blobs) == 1
        assert isinstance(result.blobs[0], ET.Element)
        assert result.next_marker == ""


class TestXmlSerialization:
    def test_basic(self):
        """Test an ultra basic XML."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <Data country="france">
                <Age>37</Age>
            </Data>"""
        )

        class XmlModel(Model):
            age: int = rest_field(xml={"name": "Age"})
            country: str = rest_field(xml={"name": "country", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(age=37, country="france")
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_basic_unicode(self):
        """Test a XML with unicode."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0" encoding="utf-8"?>
            <Data language="français"/>""".encode(
                "utf-8"
            )
        )

        class XmlModel(Model):
            language: str = rest_field(xml={"name": "language", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(language="français")
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_nested_unicode(self):
        class XmlModel(Model):
            message_text: str = rest_field(name="MessageText", xml={"name": "MessageText"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Message"}

        xml_model_no_unicode = XmlModel(message_text="message1")
        xml_element = _get_element(xml_model_no_unicode)
        xml_content = ET.tostring(xml_element, encoding="utf8")
        assert (
            xml_content
            == b"<?xml version='1.0' encoding='utf8'?>\n<Message><MessageText>message1</MessageText></Message>"
        )

        xml_model_with_unicode = XmlModel(message_text="message1㚈")
        xml_element = _get_element(xml_model_with_unicode)
        xml_content = ET.tostring(xml_element, encoding="utf8")
        assert (
            xml_content
            == b"<?xml version='1.0' encoding='utf8'?>\n<Message><MessageText>message1\xe3\x9a\x88</MessageText></Message>"
        )

    def test_type_basic(self):
        """Test basic types."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <Data>
                <Age>37</Age>
                <Enabled>true</Enabled>
            </Data>"""
        )

        class XmlModel(Model):
            age: int = rest_field(name="age", xml={"name": "Age"})
            enabled: bool = rest_field(name="enabled", xml={"name": "Enabled"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(age=37, enabled=True)
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_basic_text(self):
        """Test a XML with unicode."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0" encoding="utf-8"?>
            <Data language="english">I am text</Data>"""
        )

        class XmlModel(Model):
            language: str = rest_field(name="language", xml={"name": "language", "attribute": True})
            content: str = rest_field(name="content", xml={"text": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(language="english", content="I am text")
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_dict_type(self):
        """Test dict type."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <Data>
                <Metadata>
                  <Key1>value1</Key1>
                  <Key2>value2</Key2>
                </Metadata>
            </Data>"""
        )

        class XmlModel(Model):
            metadata: dict[str, str] = rest_field(name="Metadata", xml={"name": "Metadata"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(
            metadata={
                "Key1": "value1",
                "Key2": "value2",
            }
        )
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_additional_properties(self):
        """Test additional properties."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <Data>
                <Name>test</Name>
                <add1>text</add1>
                <add2>
                    <add2>a</add2>
                    <add2>b</add2>
                    <add2>c</add2>
                </add2>
                <add3>
                    <a>a</a>
                    <b>b</b>
                </add3>
            </Data>"""
        )

        class XmlModel(Model):
            name: str = rest_field(name="name", xml={"name": "Name"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(
            {
                "name": "test",
                "add1": "text",
                "add2": ["a", "b", "c"],
                "add3": {"a": "a", "b": "b"},
            }
        )
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_list_wrapped_basic_types(self):
        """Test XML list and wrap, items is basic type and there is no itemsName."""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <GoodApples>
                  <GoodApples>granny</GoodApples>
                  <GoodApples>fuji</GoodApples>
                </GoodApples>
            </AppleBarrel>"""
        )

        class AppleBarrel(Model):
            good_apples: list[str] = rest_field(name="GoodApples", xml={"name": "GoodApples"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        xml_model = AppleBarrel(good_apples=["granny", "fuji"])
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_list_not_wrapped_basic_types(self):
        """Test XML list and no wrap, items is basic type and there is no itemsName."""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <GoodApples>granny</GoodApples>
                <GoodApples>fuji</GoodApples>
            </AppleBarrel>"""
        )

        class AppleBarrel(Model):
            good_apples: list[str] = rest_field(name="GoodApples", xml={"name": "GoodApples", "unwrapped": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        xml_model = AppleBarrel(good_apples=["granny", "fuji"])
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_list_wrapped_basic_types_items_name(self):
        """Test XML list and wrap, items is basic type and itemsName."""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <GoodApples>
                  <string>granny</string>
                  <string>fuji</string>
                </GoodApples>
            </AppleBarrel>"""
        )

        class AppleBarrel(Model):
            good_apples: list[str] = rest_field(name="GoodApples", xml={"name": "GoodApples", "itemsName": "string"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        xml_model = AppleBarrel(good_apples=["granny", "fuji"])
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_list_not_wrapped_basic_types_items_name(self):
        """Test XML list and no wrap, items is basic type and itemsName."""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <string>granny</string>
                <string>fuji</string>
            </AppleBarrel>"""
        )

        class AppleBarrel(Model):
            good_apples: list[str] = rest_field(
                name="GoodApples",
                xml={"name": "GoodApples", "unwrapped": True, "itemsName": "string"},
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        xml_model = AppleBarrel(good_apples=["granny", "fuji"])
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_list_wrapped_complex_types(self):
        """Test XML list and wrap, items is ref."""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <GoodApples>
                  <Apple name="granny"/>
                  <Apple name="fuji"/>
                </GoodApples>
            </AppleBarrel>"""
        )

        class Apple(Model):
            name: str = rest_field(name="name", xml={"name": "name", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Apple"}

        class AppleBarrel(Model):
            good_apples: list[Apple] = rest_field(name="GoodApples", xml={"name": "GoodApples"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "AppleBarrel"}

        test = AppleBarrel({"GoodApples": [{"name": "granny"}, {"name": "fuji"}]})
        xml_model = AppleBarrel(good_apples=[Apple(name="granny"), Apple(name="fuji")])
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_list_not_wrapped_complex_types(self):
        """Test XML list and wrap, items is ref."""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <Apple name="granny"/>
                <Apple name="fuji"/>
            </AppleBarrel>"""
        )

        class Apple(Model):
            name: str = rest_field(name="name", xml={"name": "name", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Apple"}

        class AppleBarrel(Model):
            good_apples: list[Apple] = rest_field(name="GoodApples", xml={"name": "GoodApples", "unwrapped": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

        xml_model = AppleBarrel(good_apples=[Apple(name="granny"), Apple(name="fuji")])
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_two_complex_same_type(self):
        """Two different attribute are same type"""

        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <AppleBarrel>
                <EuropeanApple name="granny"/>
                <USAApple name="fuji"/>
            </AppleBarrel>"""
        )

        class Apple(Model):
            name: str = rest_field(name="name", xml={"name": "name", "attribute": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Apple"}

        class AppleBarrel(Model):
            eu_apple: Apple = rest_field(name="EuropeanApple", xml={"name": "EuropeanApple"})
            us_apple: Apple = rest_field(name="USAApple", xml={"name": "USAApple"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

        xml_model = AppleBarrel(
            eu_apple=Apple(name="granny"),
            us_apple=Apple(name="fuji"),
        )
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_basic_namespace(self):
        """Test an ultra basic XML."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <Data xmlns:fictional="http://characters.example.com">
                <fictional:Age>37</fictional:Age>
            </Data>"""
        )

        class XmlModel(Model):
            age: int = rest_field(
                name="age",
                xml={
                    "name": "Age",
                    "prefix": "fictional",
                    "ns": "http://characters.example.com",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        xml_model = XmlModel(
            age=37,
        )
        assert_xml_equals(_get_element(xml_model), basic_xml)

    def test_complex_namespace(self):
        """Test recursive namespace."""
        basic_xml = ET.fromstring(
            """<?xml version="1.0"?>
            <entry xmlns="http://www.w3.org/2005/Atom" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
                <author>
                    <name>lmazuel</name>
                </author>
                <AuthorizationRules xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
                    <AuthorizationRule i:type="SharedAccessAuthorizationRule">
                        <KeyName>testpolicy</KeyName>
                    </AuthorizationRule>
                </AuthorizationRules>
                <MessageCountDetails xmlns="http://schemas.microsoft.com/netservices/2010/10/servicebus/connect">
                    <d2p1:ActiveMessageCount xmlns:d2p1="http://schemas.microsoft.com/netservices/2011/06/servicebus">12</d2p1:ActiveMessageCount>
                </MessageCountDetails>
            </entry>"""
        )

        class QueueDescriptionResponseAuthor(Model):
            name: str = rest_field(name="name", xml={"ns": "http://www.w3.org/2005/Atom"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"ns": "http://www.w3.org/2005/Atom"}

        class AuthorizationRule(Model):
            type: str = rest_field(
                name="type",
                xml={
                    "attribute": True,
                    "prefix": "i",
                    "ns": "http://www.w3.org/2001/XMLSchema-instance",
                },
            )
            key_name: str = rest_field(
                name="KeyName",
                xml={"ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect"},
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect"}

        class MessageCountDetails(Model):
            active_message_count: int = rest_field(
                name="ActiveMessageCount",
                xml={
                    "prefix": "d2p1",
                    "ns": "http://schemas.microsoft.com/netservices/2011/06/servicebus",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {
                "name": "CountDetails",
                "ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect",
            }

        class XmlRoot(Model):
            author: QueueDescriptionResponseAuthor = rest_field(name="author")
            authorization_rules: list[AuthorizationRule] = rest_field(
                name="AuthorizationRules",
                xml={
                    "ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect",
                },
            )
            message_count_details: MessageCountDetails = rest_field(
                name="MessageCountDetails",
                xml={
                    "ns": "http://schemas.microsoft.com/netservices/2010/10/servicebus/connect",
                },
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "entry", "ns": "http://www.w3.org/2005/Atom"}

        xml_model = XmlRoot(
            author=QueueDescriptionResponseAuthor(name="lmazuel"),
            authorization_rules=[AuthorizationRule(type="SharedAccessAuthorizationRule", key_name="testpolicy")],
            message_count_details=MessageCountDetails(active_message_count=12),
        )
        assert_xml_equals(_get_element(xml_model), basic_xml)


class TestXmlDeserializerAttribute:
    """Tests for the rest_field(deserializer=...) fast-path deserialization."""

    def test_scalar_deserializers(self):
        """Test that explicit deserializer functions work for scalar types."""
        from specialwords._utils.model_base import (
            _xml_deser_str,
            _xml_deser_int,
            _xml_deser_float,
            _xml_deser_bool,
        )

        basic_xml = """<?xml version="1.0"?>
            <Data country="france">
                <Name>test</Name>
                <Count>42</Count>
                <Price>12.34</Price>
                <Active>true</Active>
            </Data>"""

        class XmlModel(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"}, deserializer=_xml_deser_str)
            count: int = rest_field(name="Count", xml={"name": "Count"}, deserializer=_xml_deser_int)
            price: float = rest_field(name="Price", xml={"name": "Price"}, deserializer=_xml_deser_float)
            active: bool = rest_field(name="Active", xml={"name": "Active"}, deserializer=_xml_deser_bool)
            country: str = rest_field(
                name="country", xml={"name": "country", "attribute": True}, deserializer=_xml_deser_str
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)
        assert result.name == "test"
        assert result.count == 42
        assert result.price == 12.34
        assert result.active is True
        assert result.country == "france"

    def test_datetime_deserializers(self):
        """Test datetime deserializer variants."""
        from specialwords._utils.model_base import (
            _xml_deser_datetime,
            _xml_deser_datetime_rfc7231,
        )

        basic_xml = """<?xml version="1.0"?>
            <Data>
                <Created>2023-01-15T10:30:00Z</Created>
                <Modified>Sun, 15 Jan 2023 10:30:00 GMT</Modified>
            </Data>"""

        class XmlModel(Model):
            created: str = rest_field(name="Created", xml={"name": "Created"}, deserializer=_xml_deser_datetime)
            modified: str = rest_field(
                name="Modified", xml={"name": "Modified"}, deserializer=_xml_deser_datetime_rfc7231
            )

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        import datetime

        result = _deserialize_xml(XmlModel, basic_xml)
        assert isinstance(result.created, datetime.datetime)
        assert result.created.year == 2023
        assert isinstance(result.modified, datetime.datetime)
        assert result.modified.year == 2023

    def test_field_plan_with_deserializers(self):
        """Test that field plan is built and used when _xml is present."""
        from specialwords._utils.model_base import _xml_deser_str, _xml_deser_int

        basic_xml = """<?xml version="1.0"?>
            <Item>
                <Name>widget</Name>
                <Qty>100</Qty>
            </Item>"""

        class Item(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"}, deserializer=_xml_deser_str)
            qty: int = rest_field(name="Qty", xml={"name": "Qty"}, deserializer=_xml_deser_int)

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Item"}

        result = _deserialize_xml(Item, basic_xml)
        assert hasattr(Item, "_xml_field_plan")
        assert len(Item._xml_field_plan) == 2
        assert result.name == "widget"
        assert result.qty == 100

    def test_mixed_deserializer_and_model_fields(self):
        """Test models with both scalar deserializers and nested model fields."""
        from specialwords._utils.model_base import _xml_deser_str, _xml_deser_int

        basic_xml = """<?xml version="1.0"?>
            <Container>
                <Name>my-container</Name>
                <Item>
                    <Name>widget</Name>
                    <Count>5</Count>
                </Item>
            </Container>"""

        class Item(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"}, deserializer=_xml_deser_str)
            count: int = rest_field(name="Count", xml={"name": "Count"}, deserializer=_xml_deser_int)

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Item"}

        class Container(Model):
            name: str = rest_field(name="Name", xml={"name": "Name"}, deserializer=_xml_deser_str)
            item: Item = rest_field(name="Item", xml={"name": "Item"})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Container"}

        result = _deserialize_xml(Container, basic_xml)
        assert result.name == "my-container"
        assert result.item.name == "widget"
        assert result.item.count == 5

    def test_no_field_plan_without_xml(self):
        """Non-XML models should not get _xml_field_plan."""

        class JsonModel(Model):
            name: str = rest_field(name="name")
            count: int = rest_field(name="count")

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

        m = JsonModel({"name": "test", "count": 42})
        assert not hasattr(JsonModel, "_xml_field_plan")
        assert m.name == "test"
        assert m.count == 42

    def test_enum_deserializer(self):
        """Test that _xml_deser_enum_or_str works for enum fields."""
        import functools
        from enum import Enum
        from specialwords._utils.model_base import _xml_deser_enum_or_str

        class BlobType(str, Enum):
            BLOCK_BLOB = "BlockBlob"
            PAGE_BLOB = "PageBlob"
            APPEND_BLOB = "AppendBlob"

        class BlobItem(Model):
            _xml = {"name": "Blob"}

            name: str = rest_field(
                name="Name",
                xml={"name": "Name"},
                deserializer=_xml_deser_str,
            )
            blob_type: str = rest_field(
                name="BlobType",
                xml={"name": "BlobType"},
                deserializer=functools.partial(_xml_deser_enum_or_str, BlobType),
            )

        xml = """<?xml version="1.0"?>
            <Blob>
                <Name>myblob</Name>
                <BlobType>BlockBlob</BlobType>
            </Blob>"""
        root = ET.fromstring(xml)
        blob = BlobItem._deserialize(root, [])
        assert blob.name == "myblob"
        assert blob.blob_type == BlobType.BLOCK_BLOB
        assert isinstance(blob.blob_type, BlobType)

    def test_enum_deserializer_unknown_value(self):
        """Test that _xml_deser_enum_or_str falls back to str for unknown values."""
        import functools
        from enum import Enum
        from specialwords._utils.model_base import _xml_deser_enum_or_str

        class Status(str, Enum):
            ACTIVE = "active"
            INACTIVE = "inactive"

        class Item(Model):
            _xml = {"name": "Item"}

            status: str = rest_field(
                name="Status",
                xml={"name": "Status"},
                deserializer=functools.partial(_xml_deser_enum_or_str, Status),
            )

        xml = """<?xml version="1.0"?>
            <Item>
                <Status>unknown_value</Status>
            </Item>"""
        root = ET.fromstring(xml)
        item = Item._deserialize(root, [])
        assert item.status == "unknown_value"
        assert isinstance(item.status, str)
        assert not isinstance(item.status, Status)
