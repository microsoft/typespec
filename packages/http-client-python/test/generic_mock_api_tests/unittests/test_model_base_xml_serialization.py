# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import xml.etree.ElementTree as ET

from typing import (
    List,
    Literal,
    Dict,
)

from specialwords._model_base import (
    _get_element,
    Model,
    rest_field,
    rest_discriminator,
    _deserialize_xml,
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
            metadata: Dict[str, str] = rest_field(name="Metadata", xml={"name": "Metadata"})

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
            age: List[str] = rest_field(name="age", xml={"name": "Age"})

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
            age: List[str] = rest_field(name="age", xml={"name": "Age", "unwrapped": True})

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)

            _xml = {"name": "Data"}

        result = _deserialize_xml(XmlModel, basic_xml)
        assert result.age is None

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
            good_apples: List[str] = rest_field(name="GoodApples", xml={"name": "GoodApples", "itemsName": "Apple"})

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
            good_apples: List[str] = rest_field(
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
            good_apples: List[Apple] = rest_field(name="GoodApples", xml={"name": "GoodApples", "itemsName": "Apple"})

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
            good_apples: List[Apple] = rest_field(
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
            good_apples: List[Apple] = rest_field(
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
            authorization_rules: List[AuthorizationRule] = rest_field(
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
            __mapping__: Dict[str, Model] = {}
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
            metadata: Dict[str, str] = rest_field(name="Metadata", xml={"name": "Metadata"})

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
            good_apples: List[str] = rest_field(name="GoodApples", xml={"name": "GoodApples"})

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
            good_apples: List[str] = rest_field(name="GoodApples", xml={"name": "GoodApples", "unwrapped": True})

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
            good_apples: List[str] = rest_field(name="GoodApples", xml={"name": "GoodApples", "itemsName": "string"})

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
            good_apples: List[str] = rest_field(
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
            good_apples: List[Apple] = rest_field(name="GoodApples", xml={"name": "GoodApples"})

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
            good_apples: List[Apple] = rest_field(name="GoodApples", xml={"name": "GoodApples", "unwrapped": True})

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
            authorization_rules: List[AuthorizationRule] = rest_field(
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
