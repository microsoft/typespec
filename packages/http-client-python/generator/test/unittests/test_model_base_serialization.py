# ------------------------------------
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# ------------------------------------
import copy
import decimal
import json
import datetime
from pathlib import Path
from typing import (
    Any,
    Iterable,
    List,
    Literal,
    Dict,
    Mapping,
    Sequence,
    Set,
    Tuple,
    Optional,
    overload,
    Union,
)
import pytest
import isodate
import sys
from enum import Enum

from specialwords._model_base import (
    SdkJSONEncoder,
    Model,
    rest_field,
    _is_model,
    rest_discriminator,
    _deserialize,
)

if sys.version_info >= (3, 9):
    from collections.abc import MutableMapping
else:
    from typing import MutableMapping  # type: ignore  # pylint: disable=ungrouped-imports
JSON = MutableMapping[str, Any]  # pylint: disable=unsubscriptable-object


class BasicResource(Model):
    platform_update_domain_count: int = rest_field(
        name="platformUpdateDomainCount"
    )  # How many times the platform update domain has been counted
    platform_fault_domain_count: int = rest_field(
        name="platformFaultDomainCount"
    )  # How many times the platform fault domain has been counted
    virtual_machines: List[Any] = rest_field(name="virtualMachines")  # List of virtual machines

    @overload
    def __init__(
        self,
        *,
        platform_update_domain_count: int,
        platform_fault_domain_count: int,
        virtual_machines: List[Any],
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class Pet(Model):
    name: str = rest_field()  # my name
    species: str = rest_field()  # my species

    @overload
    def __init__(self, *, name: str, species: str): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_model_and_dict_equal():
    dict_response = {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "virtualMachines": [],
    }
    model = BasicResource(
        platform_update_domain_count=5,
        platform_fault_domain_count=3,
        virtual_machines=[],
    )

    assert model == dict_response
    assert (
        model.platform_update_domain_count
        == model["platformUpdateDomainCount"]
        == dict_response["platformUpdateDomainCount"]
        == 5
    )
    assert (
        model.platform_fault_domain_count
        == model["platformFaultDomainCount"]
        == dict_response["platformFaultDomainCount"]
        == 3
    )
    assert model.virtual_machines == model["virtualMachines"] == dict_response["virtualMachines"]


def test_json_roundtrip():
    dict_response = {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "virtualMachines": [],
    }
    model = BasicResource(
        platform_update_domain_count=5,
        platform_fault_domain_count=3,
        virtual_machines=[],
    )
    with pytest.raises(TypeError):
        json.dumps(model)
    assert (
        json.dumps(dict(model))
        == '{"platformUpdateDomainCount": 5, "platformFaultDomainCount": 3, "virtualMachines": []}'
    )
    assert json.loads(json.dumps(dict(model))) == model == dict_response


def test_has_no_property():
    dict_response = {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "virtualMachines": [],
        "noProp": "bonjour!",
    }
    model = BasicResource(dict_response)
    assert (
        model.platform_update_domain_count
        == model["platformUpdateDomainCount"]
        == dict_response["platformUpdateDomainCount"]
        == 5
    )
    assert not hasattr(model, "no_prop")
    with pytest.raises(AttributeError) as ex:
        model.no_prop

    assert str(ex.value) == "'BasicResource' object has no attribute 'no_prop'"
    assert model["noProp"] == dict_response["noProp"] == "bonjour!"

    # let's add it to model now

    class BasicResourceWithProperty(BasicResource):
        no_prop: str = rest_field(name="noProp")

    model = BasicResourceWithProperty(
        platform_update_domain_count=5,
        platform_fault_domain_count=3,
        virtual_machines=[],
        no_prop="bonjour!",
    )
    assert model.no_prop == model["noProp"] == dict_response["noProp"] == "bonjour!"


def test_original_and_attr_name_same():
    class MyModel(Model):
        hello: str = rest_field()

        @overload
        def __init__(self, *, hello: str): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    dict_response = {"hello": "nihao"}
    model = MyModel(hello="nihao")
    assert model.hello == model["hello"] == dict_response["hello"]


class OptionalModel(Model):
    optional_str: Optional[str] = rest_field()
    optional_time: Optional[datetime.time] = rest_field()
    optional_dict: Optional[Dict[str, Optional[Pet]]] = rest_field(name="optionalDict")
    optional_model: Optional[Pet] = rest_field()
    optional_myself: Optional["OptionalModel"] = rest_field()

    @overload
    def __init__(
        self,
        *,
        optional_str: Optional[str] = None,
        optional_time: Optional[datetime.time] = None,
        optional_dict: Optional[Dict[str, Optional[Pet]]] = None,
        optional_myself: Optional["OptionalModel"] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_optional_property():
    dict_response = {
        "optional_str": "hello!",
        "optional_time": None,
        "optionalDict": {
            "Eugene": {
                "name": "Eugene",
                "species": "Dog",
            },
            "Lady": None,
        },
        "optional_model": None,
        "optional_myself": {
            "optional_str": None,
            "optional_time": "11:34:56",
            "optionalDict": None,
            "optional_model": {"name": "Lady", "species": "Newt"},
            "optional_myself": None,
        },
    }

    model = OptionalModel(dict_response)
    assert model.optional_str == model["optional_str"] == "hello!"
    assert model.optional_time == model["optional_time"] == None
    assert (
        model.optional_dict
        == model["optionalDict"]
        == {
            "Eugene": {
                "name": "Eugene",
                "species": "Dog",
            },
            "Lady": None,
        }
    )
    assert model.optional_dict
    assert model.optional_dict["Eugene"].name == model.optional_dict["Eugene"]["name"] == "Eugene"
    assert model.optional_dict["Lady"] is None

    assert (
        model.optional_myself
        == model["optional_myself"]
        == {
            "optional_str": None,
            "optional_time": "11:34:56",
            "optionalDict": None,
            "optional_model": {"name": "Lady", "species": "Newt"},
            "optional_myself": None,
        }
    )
    assert model.optional_myself
    assert model.optional_myself.optional_str is None
    assert model.optional_myself.optional_time == datetime.time(11, 34, 56)
    assert model.optional_myself.optional_dict is None
    assert model.optional_myself.optional_model
    assert model.optional_myself.optional_model.name == "Lady"
    assert model.optional_myself.optional_model.species == "Newt"
    assert model.optional_myself.optional_myself is None


def test_model_pass_in_none():
    model = OptionalModel(optional_str=None)
    assert model.optional_str == None
    with pytest.raises(KeyError):
        model["optionalStr"]


def test_modify_dict():
    model = BasicResource(
        platform_update_domain_count=5,
        platform_fault_domain_count=3,
        virtual_machines=[],
    )

    # now let's modify the model as a dict
    model["platformUpdateDomainCount"] = 100
    assert model.platform_update_domain_count == model["platformUpdateDomainCount"] == 100


def test_modify_property():
    dict_response = {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "virtualMachines": [],
    }
    model = BasicResource(
        platform_update_domain_count=5,
        platform_fault_domain_count=3,
        virtual_machines=[],
    )

    # now let's modify the model through it's properties
    model.platform_fault_domain_count = 2000
    model["platformFaultDomainCount"]
    assert model.platform_fault_domain_count == model["platformFaultDomainCount"] == 2000


def test_property_is_a_type():
    class Fish(Model):
        name: str = rest_field()
        species: Literal["Salmon", "Halibut"] = rest_field()

        @overload
        def __init__(self, *, name: str, species: Literal["Salmon", "Halibut"]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Fishery(Model):
        fish: Fish = rest_field()

        @overload
        def __init__(self, *, fish: Fish): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    fishery = Fishery({"fish": {"name": "Benjamin", "species": "Salmon"}})
    assert isinstance(fishery.fish, Fish)
    assert fishery.fish.name == fishery.fish["name"] == fishery["fish"]["name"] == "Benjamin"
    assert fishery.fish.species == fishery.fish["species"] == fishery["fish"]["species"] == "Salmon"


def test_datetime_deserialization():
    class DatetimeModel(Model):
        datetime_value: datetime.datetime = rest_field(name="datetimeValue")

        @overload
        def __init__(self, *, datetime_value: datetime.datetime): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "9999-12-31T23:59:59.999Z"
    val = isodate.parse_datetime(val_str)
    model = DatetimeModel({"datetimeValue": val_str})
    assert model["datetimeValue"] == val_str
    assert model.datetime_value == val

    class BaseModel(Model):
        my_prop: DatetimeModel = rest_field(name="myProp")

    model = BaseModel({"myProp": {"datetimeValue": val_str}})
    assert isinstance(model.my_prop, DatetimeModel)
    model.my_prop["datetimeValue"]
    assert model.my_prop["datetimeValue"] == model["myProp"]["datetimeValue"] == val_str
    assert model.my_prop.datetime_value == val


def test_date_deserialization():
    class DateModel(Model):
        date_value: datetime.date = rest_field(name="dateValue")

        @overload
        def __init__(self, *, date_value: datetime.date): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "2016-02-29"
    val = isodate.parse_date(val_str)
    model = DateModel({"dateValue": val_str})
    assert model["dateValue"] == val_str
    assert model.date_value == val

    class BaseModel(Model):
        my_prop: DateModel = rest_field(name="myProp")

    model = BaseModel({"myProp": {"dateValue": val_str}})
    assert isinstance(model.my_prop, DateModel)
    assert model.my_prop["dateValue"] == model["myProp"]["dateValue"] == val_str
    assert model.my_prop.date_value == val


def test_time_deserialization():
    class TimeModel(Model):
        time_value: datetime.time = rest_field(name="timeValue")

        @overload
        def __init__(self, *, time_value: datetime.time): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "11:34:56"
    val = datetime.time(11, 34, 56)
    model = TimeModel({"timeValue": val_str})
    assert model["timeValue"] == val_str
    assert model.time_value == val

    class BaseModel(Model):
        my_prop: TimeModel = rest_field(name="myProp")

    model = BaseModel({"myProp": {"timeValue": val_str}})
    assert isinstance(model.my_prop, TimeModel)
    assert model.my_prop["timeValue"] == model["myProp"]["timeValue"] == val_str
    assert model.my_prop.time_value == val


class SimpleRecursiveModel(Model):
    name: str = rest_field()
    me: "SimpleRecursiveModel" = rest_field()

    @overload
    def __init__(self, *, name: str, me: "SimpleRecursiveModel"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_model_recursion():
    dict_response = {"name": "Snoopy", "me": {"name": "Egg", "me": {"name": "Chicken"}}}

    model = SimpleRecursiveModel(dict_response)
    assert model["name"] == model.name == "Snoopy"
    assert model["me"] == {"name": "Egg", "me": {"name": "Chicken"}}
    assert isinstance(model.me, SimpleRecursiveModel)
    assert model.me["name"] == model.me.name == "Egg"
    assert model.me["me"] == {"name": "Chicken"}
    assert model.me.me.name == "Chicken"


def test_dictionary_deserialization():
    class DictionaryModel(Model):
        prop: Dict[str, datetime.datetime] = rest_field()

        @overload
        def __init__(self, *, prop: datetime.datetime): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "9999-12-31T23:59:59.999Z"
    val = isodate.parse_datetime(val_str)
    dict_response = {"prop": {"datetime": val_str}}
    model = DictionaryModel(dict_response)
    assert model["prop"] == {"datetime": val_str}
    assert model.prop == {"datetime": val}


def test_attr_and_rest_case():
    class ModelTest(Model):
        our_attr: str = rest_field(name="ourAttr")

        @overload
        def __init__(self, *, our_attr: str): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    test_model = ModelTest({"ourAttr": "camel"})
    assert test_model.our_attr == test_model["ourAttr"] == "camel"

    test_model = ModelTest(ModelTest({"ourAttr": "camel"}))
    assert test_model.our_attr == test_model["ourAttr"] == "camel"

    test_model = ModelTest(our_attr="snake")
    assert test_model.our_attr == test_model["ourAttr"] == "snake"


def test_dictionary_deserialization_model():
    class DictionaryModel(Model):
        prop: Dict[str, Pet] = rest_field()

        @overload
        def __init__(self, *, prop: Dict[str, Pet]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    dict_response = {
        "prop": {
            "Eugene": {
                "name": "Eugene",
                "species": "Dog",
            },
            "Lady": {
                "name": "Lady",
                "species": "Newt",
            },
        }
    }

    model = DictionaryModel(dict_response)
    assert model["prop"] == {
        "Eugene": {
            "name": "Eugene",
            "species": "Dog",
        },
        "Lady": {
            "name": "Lady",
            "species": "Newt",
        },
    }
    assert model.prop == {
        "Eugene": Pet({"name": "Eugene", "species": "Dog"}),
        "Lady": Pet({"name": "Lady", "species": "Newt"}),
    }
    assert model.prop["Eugene"].name == model.prop["Eugene"]["name"] == "Eugene"
    assert model.prop["Eugene"].species == model.prop["Eugene"]["species"] == "Dog"
    assert model.prop["Lady"].name == model.prop["Lady"]["name"] == "Lady"
    assert model.prop["Lady"].species == model.prop["Lady"]["species"] == "Newt"


def test_list_deserialization():
    class ListModel(Model):
        prop: List[datetime.datetime] = rest_field()

        @overload
        def __init__(self, *, prop: List[datetime.datetime]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "9999-12-31T23:59:59.999Z"
    val = isodate.parse_datetime(val_str)
    dict_response = {"prop": [val_str, val_str]}
    model = ListModel(dict_response)
    assert model["prop"] == [val_str, val_str]
    assert model.prop == [val, val]


def test_list_deserialization_model():
    class ListModel(Model):
        prop: List[Pet] = rest_field()

        @overload
        def __init__(self, *, prop: List[Pet]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    dict_response = {
        "prop": [
            {"name": "Eugene", "species": "Dog"},
            {"name": "Lady", "species": "Newt"},
        ]
    }
    model = ListModel(dict_response)
    assert model["prop"] == [
        {"name": "Eugene", "species": "Dog"},
        {"name": "Lady", "species": "Newt"},
    ]
    assert model.prop == [
        Pet({"name": "Eugene", "species": "Dog"}),
        Pet({"name": "Lady", "species": "Newt"}),
    ]
    assert len(model.prop) == 2
    assert model.prop[0].name == model.prop[0]["name"] == "Eugene"
    assert model.prop[0].species == model.prop[0]["species"] == "Dog"
    assert model.prop[1].name == model.prop[1]["name"] == "Lady"
    assert model.prop[1].species == model.prop[1]["species"] == "Newt"


def test_set_deserialization():
    class SetModel(Model):
        prop: Set[datetime.datetime] = rest_field()

        @overload
        def __init__(self, *, prop: Set[datetime.datetime]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "9999-12-31T23:59:59.999Z"
    val = isodate.parse_datetime(val_str)
    dict_response = {"prop": set([val_str, val_str])}
    model = SetModel(dict_response)
    assert model["prop"] == set([val_str, val_str])
    assert model.prop == set([val, val])


def test_tuple_deserialization():
    class TupleModel(Model):
        prop: Tuple[str, datetime.datetime] = rest_field()

        @overload
        def __init__(self, *, prop: Tuple[str, datetime.datetime]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    val_str = "9999-12-31T23:59:59.999Z"
    val = isodate.parse_datetime(val_str)
    dict_response = {"prop": (val_str, val_str)}
    model = TupleModel(dict_response)
    assert model["prop"] == (val_str, val_str)
    assert model.prop == (val_str, val)


def test_list_of_tuple_deserialization_model():
    class Owner(Model):
        name: str = rest_field()
        pet: Pet = rest_field()

        @overload
        def __init__(self, *, name: str, pet: Pet): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class ListOfTupleModel(Model):
        prop: List[Tuple[Pet, Owner]] = rest_field()

        @overload
        def __init__(self, *, prop: List[Tuple[Pet, Owner]]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    eugene = {"name": "Eugene", "species": "Dog"}
    lady = {"name": "Lady", "species": "Newt"}
    giacamo = {"name": "Giacamo", "pet": eugene}
    elizabeth = {"name": "Elizabeth", "pet": lady}

    dict_response: Dict[str, Any] = {"prop": [(eugene, giacamo), (lady, elizabeth)]}
    model = ListOfTupleModel(dict_response)
    assert (
        model["prop"]
        == model.prop
        == [(eugene, giacamo), (lady, elizabeth)]
        == [(Pet(eugene), Owner(giacamo)), (Pet(lady), Owner(elizabeth))]
    )
    assert len(model.prop[0]) == len(model["prop"][0]) == 2
    assert model.prop[0][0].name == model.prop[0][0]["name"] == "Eugene"
    assert model.prop[0][0].species == model.prop[0][0]["species"] == "Dog"
    assert model.prop[0][1].name == "Giacamo"
    assert model.prop[0][1].pet == model.prop[0][0]
    assert model.prop[0][1].pet.name == model.prop[0][1]["pet"]["name"] == "Eugene"
    assert model.prop[1][0] == model.prop[1][1].pet


class RecursiveModel(Model):
    name: str = rest_field()
    list_of_me: Optional[List["RecursiveModel"]] = rest_field(name="listOfMe")
    dict_of_me: Optional[Dict[str, "RecursiveModel"]] = rest_field(name="dictOfMe")
    dict_of_list_of_me: Optional[Dict[str, List["RecursiveModel"]]] = rest_field(name="dictOfListOfMe")
    list_of_dict_of_me: Optional[List[Dict[str, "RecursiveModel"]]] = rest_field(name="listOfDictOfMe")

    @overload
    def __init__(
        self,
        *,
        name: str,
        list_of_me: Optional[List["RecursiveModel"]] = None,
        dict_of_me: Optional[Dict[str, "RecursiveModel"]] = None,
        dict_of_list_of_me: Optional[Dict[str, List["RecursiveModel"]]] = None,
        list_of_dict_of_me: Optional[List[Dict[str, "RecursiveModel"]]] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_model_recursion_complex():
    dict_response = {
        "name": "it's me!",
        "listOfMe": [
            {
                "name": "it's me!",
                "listOfMe": None,
                "dictOfMe": None,
                "dictOfListOfMe": None,
                "listOfDictOfMe": None,
            }
        ],
        "dictOfMe": {
            "me": {
                "name": "it's me!",
                "listOfMe": None,
                "dictOfMe": None,
                "dictOfListOfMe": None,
                "listOfDictOfMe": None,
            }
        },
        "dictOfListOfMe": {
            "many mes": [
                {
                    "name": "it's me!",
                    "listOfMe": None,
                    "dictOfMe": None,
                    "dictOfListOfMe": None,
                    "listOfDictOfMe": None,
                }
            ]
        },
        "listOfDictOfMe": [
            {
                "me": {
                    "name": "it's me!",
                    "listOfMe": None,
                    "dictOfMe": None,
                    "dictOfListOfMe": None,
                    "listOfDictOfMe": None,
                }
            }
        ],
    }

    model = RecursiveModel(dict_response)
    assert model.name == model["name"] == "it's me!"
    assert model["listOfMe"] == [
        {
            "name": "it's me!",
            "listOfMe": None,
            "dictOfMe": None,
            "dictOfListOfMe": None,
            "listOfDictOfMe": None,
        }
    ]
    assert model.list_of_me == [
        RecursiveModel(
            {
                "name": "it's me!",
                "listOfMe": None,
                "dictOfMe": None,
                "dictOfListOfMe": None,
                "listOfDictOfMe": None,
            }
        )
    ]
    assert model.list_of_me
    assert model.list_of_me[0].name == "it's me!"
    assert model.list_of_me[0].list_of_me is None
    assert isinstance(model.list_of_me, List)
    assert isinstance(model.list_of_me[0], RecursiveModel)

    assert model["dictOfMe"] == {
        "me": {
            "name": "it's me!",
            "listOfMe": None,
            "dictOfMe": None,
            "dictOfListOfMe": None,
            "listOfDictOfMe": None,
        }
    }
    assert model.dict_of_me == {
        "me": RecursiveModel(
            {
                "name": "it's me!",
                "listOfMe": None,
                "dictOfMe": None,
                "dictOfListOfMe": None,
                "listOfDictOfMe": None,
            }
        )
    }

    assert isinstance(model.dict_of_me, Dict)
    assert isinstance(model.dict_of_me["me"], RecursiveModel)

    assert model["dictOfListOfMe"] == {
        "many mes": [
            {
                "name": "it's me!",
                "listOfMe": None,
                "dictOfMe": None,
                "dictOfListOfMe": None,
                "listOfDictOfMe": None,
            }
        ]
    }
    assert model.dict_of_list_of_me == {
        "many mes": [
            RecursiveModel(
                {
                    "name": "it's me!",
                    "listOfMe": None,
                    "dictOfMe": None,
                    "dictOfListOfMe": None,
                    "listOfDictOfMe": None,
                }
            )
        ]
    }
    assert isinstance(model.dict_of_list_of_me, Dict)
    assert isinstance(model.dict_of_list_of_me["many mes"], List)
    assert isinstance(model.dict_of_list_of_me["many mes"][0], RecursiveModel)

    assert model["listOfDictOfMe"] == [
        {
            "me": {
                "name": "it's me!",
                "listOfMe": None,
                "dictOfMe": None,
                "dictOfListOfMe": None,
                "listOfDictOfMe": None,
            }
        }
    ]
    assert model.list_of_dict_of_me == [
        {
            "me": RecursiveModel(
                {
                    "name": "it's me!",
                    "listOfMe": None,
                    "dictOfMe": None,
                    "dictOfListOfMe": None,
                    "listOfDictOfMe": None,
                }
            )
        }
    ]
    assert isinstance(model.list_of_dict_of_me, List)
    assert isinstance(model.list_of_dict_of_me[0], Dict)
    assert isinstance(model.list_of_dict_of_me[0]["me"], RecursiveModel)

    assert model.as_dict() == model == dict_response


def test_literals():
    class LiteralModel(Model):
        species: Literal["Mongoose", "Eagle", "Penguin"] = rest_field()
        age: Literal[1, 2, 3] = rest_field()

        @overload
        def __init__(
            self,
            *,
            species: Literal["Mongoose", "Eagle", "Penguin"],
            age: Literal[1, 2, 3],
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    dict_response = {"species": "Mongoose", "age": 3}
    model = LiteralModel(dict_response)
    assert model.species == model["species"] == "Mongoose"
    assert model.age == model["age"] == 3

    dict_response = {"species": "invalid", "age": 5}
    model = LiteralModel(dict_response)
    assert model["species"] == "invalid"
    assert model["age"] == 5

    assert model.species == "invalid"

    assert model.age == 5


def test_deserialization_callback_override():
    def _callback(obj):
        return [str(entry) for entry in obj]

    class MyModel(Model):
        prop: Sequence[float] = rest_field()

        @overload
        def __init__(self, *, prop: Sequence[float]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    model_without_callback = MyModel(prop=[1.3, 2.4, 3.5])
    assert model_without_callback.prop == [1.3, 2.4, 3.5]
    assert model_without_callback["prop"] == [1.3, 2.4, 3.5]

    class MyModel2(Model):
        prop: Sequence[int] = rest_field(type=_callback)

        @overload
        def __init__(self, *, prop: Any): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    model_with_callback = MyModel2(prop=[1.3, 2.4, 3.5])
    assert model_with_callback.prop == ["1.3", "2.4", "3.5"]
    # since the deserialize function is not roundtrip-able, once we deserialize
    # the serialized version is the same
    assert model_with_callback["prop"] == [1.3, 2.4, 3.5]


def test_deserialization_callback_override_parent():
    class ParentNoCallback(Model):
        prop: Sequence[float] = rest_field()

        @overload
        def __init__(self, *, prop: Sequence[float]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    def _callback(obj):
        return set([str(entry) for entry in obj])

    class ChildWithCallback(ParentNoCallback):
        prop: Sequence[float] = rest_field(type=_callback)

        @overload
        def __init__(self, *, prop: Sequence[float]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    parent_model = ParentNoCallback(prop=[1, 1, 2, 3])
    assert parent_model.prop == parent_model["prop"] == [1, 1, 2, 3]

    child_model = ChildWithCallback(prop=[1, 1, 2, 3])
    assert child_model.prop == set(["1", "1", "2", "3"])
    assert child_model["prop"] == [1, 1, 2, 3]


def test_inheritance_basic():
    def _callback(obj):
        return [str(e) for e in obj]

    class Parent(Model):
        parent_prop: List[int] = rest_field(name="parentProp", type=_callback)
        prop: str = rest_field()

        @overload
        def __init__(self, *, parent_prop: List[int], prop: str): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Child(Parent):
        pass

    c = Child(parent_prop=[1, 2, 3], prop="hello")
    assert c == {"parentProp": [1, 2, 3], "prop": "hello"}
    assert c.parent_prop == ["1", "2", "3"]
    assert c.prop == "hello"


class ParentA(Model):
    prop: float = rest_field()

    @overload
    def __init__(self, *, prop: Any): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class ParentB(ParentA):
    prop: str = rest_field()
    bcd_prop: Optional[List["ParentB"]] = rest_field(name="bcdProp")

    @overload
    def __init__(self, *, prop: Any, bcd_prop: Optional[List["ParentB"]] = None): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class ParentC(ParentB):
    prop: float = rest_field()
    cd_prop: ParentA = rest_field(name="cdProp")

    @overload
    def __init__(self, *, prop: Any, bcd_prop: List[ParentB], cd_prop: ParentA, **kwargs): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class ChildD(ParentC):
    d_prop: Tuple[ParentA, ParentB, ParentC, Optional["ChildD"]] = rest_field(name="dProp")

    @overload
    def __init__(
        self,
        *,
        prop: Any,
        bcd_prop: List[ParentB],
        cd_prop: ParentA,
        d_prop: Tuple[ParentA, ParentB, ParentC, Optional["ChildD"]],
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_model_dict_comparisons():
    class Inner(Model):
        prop: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        inner: Inner = rest_field()

        @overload
        def __init__(
            self,
            *,
            inner: Inner,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    def _tests(outer):
        assert outer.inner.prop == outer["inner"].prop == outer.inner["prop"] == outer["inner"]["prop"] == "hello"
        assert outer.inner == outer["inner"] == {"prop": "hello"}
        assert outer == {"inner": {"prop": "hello"}}

    _tests(Outer(inner=Inner(prop="hello")))
    _tests(Outer({"inner": {"prop": "hello"}}))


def test_model_dict_comparisons_list():
    class Inner(Model):
        prop: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        inner: List[Inner] = rest_field()

        @overload
        def __init__(
            self,
            *,
            inner: List[Inner],
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    def _tests(outer):
        assert (
            outer.inner[0].prop
            == outer["inner"][0].prop
            == outer.inner[0]["prop"]
            == outer["inner"][0]["prop"]
            == "hello"
        )
        assert outer.inner == outer["inner"] == [{"prop": "hello"}]
        assert outer == {"inner": [{"prop": "hello"}]}

    _tests(Outer(inner=[Inner(prop="hello")]))
    _tests(Outer({"inner": [{"prop": "hello"}]}))


def test_model_dict_comparisons_dict():
    class Inner(Model):
        prop: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        inner: Dict[str, Inner] = rest_field()

        @overload
        def __init__(
            self,
            *,
            inner: Dict[str, Inner],
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    def _tests(outer):
        assert (
            outer.inner["key"].prop
            == outer["inner"]["key"].prop
            == outer.inner["key"]["prop"]
            == outer["inner"]["key"]["prop"]
            == "hello"
        )
        assert outer.inner == outer["inner"] == {"key": {"prop": "hello"}}
        with pytest.raises(AttributeError):
            outer.inner.key
        assert outer.inner["key"] == outer["inner"]["key"] == {"prop": "hello"}
        assert outer == {"inner": {"key": {"prop": "hello"}}}

    _tests(Outer(inner={"key": Inner(prop="hello")}))
    _tests(Outer({"inner": {"key": {"prop": "hello"}}}))


def test_inheritance_4_levels():
    a = ParentA(prop=3.4)
    assert a.prop == 3.4
    assert a["prop"] == 3.4
    assert a == {"prop": 3.4}
    assert isinstance(a, Model)

    b = ParentB(prop=3.4, bcd_prop=[ParentB(prop=4.3)])
    assert b.prop == "3.4"
    assert b["prop"] == 3.4
    assert b.bcd_prop == [ParentB(prop=4.3)]
    assert b["bcdProp"] != [{"prop": 4.3, "bcdProp": None}]
    assert b["bcdProp"] == [{"prop": 4.3}]
    assert b.bcd_prop
    assert b.bcd_prop[0].prop == "4.3"
    assert b.bcd_prop[0].bcd_prop is None
    assert b == {"prop": 3.4, "bcdProp": [{"prop": 4.3}]}
    assert isinstance(b, ParentB)
    assert isinstance(b, ParentA)

    c = ParentC(prop=3.4, bcd_prop=[b], cd_prop=a)
    assert c.prop == c["prop"] == 3.4
    assert c.bcd_prop == [b]
    assert c.bcd_prop
    assert isinstance(c.bcd_prop[0], ParentB)
    assert c["bcdProp"] == [b] == [{"prop": 3.4, "bcdProp": [{"prop": 4.3}]}]
    assert c.cd_prop == a
    assert c["cdProp"] == a == {"prop": 3.4}
    assert isinstance(c.cd_prop, ParentA)

    d = ChildD(
        prop=3.4,
        bcd_prop=[b],
        cd_prop=a,
        d_prop=(
            a,
            b,
            c,
            ChildD(prop=3.4, bcd_prop=[b], cd_prop=a, d_prop=(a, b, c, None)),
        ),
    )
    assert d == {
        "prop": 3.4,
        "bcdProp": [b],
        "cdProp": a,
        "dProp": (
            a,
            b,
            c,
            {"prop": 3.4, "bcdProp": [b], "cdProp": a, "dProp": (a, b, c, None)},
        ),
    }
    assert d.prop == d["prop"] == 3.4
    assert d.bcd_prop == [b]
    assert d.bcd_prop
    assert isinstance(d.bcd_prop[0], ParentB)
    assert d.cd_prop == a
    assert isinstance(d.cd_prop, ParentA)
    assert d.d_prop[0] == a  # at a
    assert isinstance(d.d_prop[0], ParentA)
    assert d.d_prop[1] == b
    assert isinstance(d.d_prop[1], ParentB)
    assert d.d_prop[2] == c
    assert isinstance(d.d_prop[2], ParentC)
    assert isinstance(d.d_prop[3], ChildD)

    assert isinstance(d.d_prop[3].d_prop[0], ParentA)
    assert isinstance(d.d_prop[3].d_prop[1], ParentB)
    assert isinstance(d.d_prop[3].d_prop[2], ParentC)
    assert d.d_prop[3].d_prop[3] is None


def test_multiple_inheritance_basic():
    class ParentOne(Model):
        parent_one_prop: str = rest_field(name="parentOneProp")

        @overload
        def __init__(
            self,
            *,
            parent_one_prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class ParentTwo(Model):
        parent_two_prop: int = rest_field(name="parentTwoProp", type=lambda x: str(x))

        @overload
        def __init__(
            self,
            *,
            parent_two_prop: int,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Child(ParentOne, ParentTwo):
        @overload
        def __init__(
            self,
            *,
            parent_one_prop: str,
            parent_two_prop: int,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    c = Child(parent_one_prop="Hello", parent_two_prop=3)
    assert c == {"parentOneProp": "Hello", "parentTwoProp": 3}
    assert c.parent_one_prop == "Hello"
    assert c.parent_two_prop == "3"
    assert isinstance(c, Child)
    assert isinstance(c, ParentOne)
    assert isinstance(c, ParentTwo)


def test_multiple_inheritance_mro():
    class A(Model):
        prop: str = rest_field()

        @overload
        def __init__(self, *, prop: str) -> None: ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class B(Model):
        prop: int = rest_field(type=lambda x: int(x))

        @overload
        def __init__(self, *, prop: str) -> None: ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class C(A, B):
        pass

    assert A(prop="1").prop == "1"
    assert B(prop="1").prop == 1
    assert C(prop="1").prop == "1"  # A should take precedence over B


class Feline(Model):
    meows: bool = rest_field()
    hisses: bool = rest_field()
    siblings: Optional[List["Feline"]] = rest_field()

    @overload
    def __init__(
        self,
        *,
        meows: bool,
        hisses: bool,
        siblings: Optional[List["Feline"]] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class Owner(Model):
    first_name: str = rest_field(name="firstName", type=lambda x: x.capitalize())
    last_name: str = rest_field(name="lastName", type=lambda x: x.capitalize())

    @overload
    def __init__(
        self,
        *,
        first_name: str,
        last_name: str,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class PetModel(Model):
    name: str = rest_field()
    owner: Owner = rest_field()

    @overload
    def __init__(self, *, name: str, owner: Owner): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class Cat(PetModel, Feline):
    likes_milk: bool = rest_field(name="likesMilk", type=lambda x: True)

    @overload
    def __init__(
        self,
        *,
        name: str,
        owner: Owner,
        meows: bool,
        hisses: bool,
        likes_milk: bool,
        siblings: Optional[List[Feline]],
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class CuteThing(Model):
    how_cute_am_i: float = rest_field(name="howCuteAmI")

    @overload
    def __init__(self, *, how_cute_am_i: float): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class Kitten(Cat, CuteThing):
    eats_mice_yet: bool = rest_field(name="eatsMiceYet")

    @overload
    def __init__(
        self,
        *,
        name: str,
        owner: Owner,
        meows: bool,
        hisses: bool,
        likes_milk: bool,
        siblings: Optional[List[Feline]],
        how_cute_am_i: float,
        eats_mice_yet: bool,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_multiple_inheritance_complex():
    cat = Cat(
        name="Stephanie",
        owner=Owner(first_name="cecil", last_name="cai"),  # gets capitalized in attr
        meows=True,
        hisses=True,
        likes_milk=False,  # likes_milk will change to True on the attribute
        siblings=[Feline(meows=True, hisses=False)],
    )
    assert cat == {
        "name": "Stephanie",
        "owner": {
            "firstName": "cecil",
            "lastName": "cai",
        },
        "meows": True,
        "hisses": True,
        "likesMilk": False,
        "siblings": [
            {
                "meows": True,
                "hisses": False,
            }
        ],
    }
    assert cat.name == "Stephanie"
    assert isinstance(cat.owner, Owner)
    assert cat.owner.first_name == "Cecil"
    assert cat.owner.last_name == "Cai"
    assert cat.meows
    assert cat.hisses
    assert cat.likes_milk
    assert cat.siblings
    assert len(cat.siblings) == 1
    assert isinstance(cat.siblings[0], Feline)

    kitten = Kitten(
        name="Stephanie",
        owner=Owner(first_name="cecil", last_name="cai"),  # gets capitalized in attr
        meows=True,
        hisses=True,
        likes_milk=False,  # likes_milk will change to True on the attribute
        siblings=[Feline(meows=True, hisses=False)],
        how_cute_am_i=1.0,
        eats_mice_yet=True,
    )
    assert kitten != {
        "name": "Stephanie",
        "owner": {
            "firstName": "cecil",
            "lastName": "cai",
        },
        "meows": True,
        "hisses": True,
        "likesMilk": False,
        "siblings": [{"meows": True, "hisses": False, "siblings": None}],  # we don't automatically set None here
        "howCuteAmI": 1.0,
        "eatsMiceYet": True,
    }
    assert kitten == {
        "name": "Stephanie",
        "owner": {
            "firstName": "cecil",
            "lastName": "cai",
        },
        "meows": True,
        "hisses": True,
        "likesMilk": False,
        "siblings": [
            {
                "meows": True,
                "hisses": False,
            }
        ],
        "howCuteAmI": 1.0,
        "eatsMiceYet": True,
    }
    assert kitten.name == "Stephanie"
    assert isinstance(kitten.owner, Owner)
    assert kitten.owner.first_name == "Cecil"
    assert kitten.owner.last_name == "Cai"
    assert kitten.meows
    assert kitten.hisses
    assert kitten.likes_milk
    assert kitten.siblings
    assert len(kitten.siblings) == 1
    assert isinstance(kitten.siblings[0], Feline)
    assert kitten.eats_mice_yet
    assert kitten.how_cute_am_i == 1.0
    assert isinstance(kitten, PetModel)
    assert isinstance(kitten, Cat)
    assert isinstance(kitten, Feline)
    assert isinstance(kitten, CuteThing)


class A(Model):
    b: "B" = rest_field()

    @overload
    def __init__(self, b: "B"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class B(Model):
    c: "C" = rest_field()

    @overload
    def __init__(self, *, c: "C"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class C(Model):
    d: str = rest_field()

    @overload
    def __init__(self, *, d: str): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_nested_creation():
    a = A({"b": {"c": {"d": "hello"}}})
    assert isinstance(a["b"], Model)
    assert isinstance(a["b"]["c"], Model)
    assert a["b"]["c"] == a["b"].c == a.b.c == {"d": "hello"}

    assert (
        a["b"]["c"]["d"]
        == a["b"].c.d
        == a.b["c"].d
        == a["b"]["c"].d
        == a["b"].c["d"]
        == a.b["c"]["d"]
        == a.b.c.d
        == "hello"
    )


def test_nested_setting():
    a = A({"b": {"c": {"d": "hello"}}})

    # set with dict
    a["b"]["c"]["d"] = "setwithdict"
    assert (
        a["b"]["c"]["d"]
        == a["b"].c.d
        == a.b["c"].d
        == a["b"]["c"].d
        == a["b"].c["d"]
        == a.b["c"]["d"]
        == a.b.c.d
        == "setwithdict"
    )

    # set with attr
    a.b.c.d = "setwithattr"
    assert a["b"]["c"]["d"] == "setwithattr"
    assert (
        a["b"]["c"]["d"]
        == a["b"].c.d
        == a.b["c"].d
        == a["b"]["c"].d
        == a["b"].c["d"]
        == a.b["c"]["d"]
        == a.b.c.d
        == "setwithattr"
    )


class BaseModel(Model):
    inner_model: "InnerModel" = rest_field(name="innerModel")

    @overload
    def __init__(self, *, inner_model: "InnerModel"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class InnerModel(Model):
    datetime_field: datetime.datetime = rest_field(name="datetimeField")

    @overload
    def __init__(self, *, datetime_field: datetime.datetime): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_nested_deserialization():
    serialized_datetime = "9999-12-31T23:59:59.999Z"

    model = BaseModel({"innerModel": {"datetimeField": serialized_datetime}})
    assert model.inner_model["datetimeField"] == model["innerModel"]["datetimeField"] == serialized_datetime
    assert (
        model.inner_model.datetime_field
        == model["innerModel"].datetime_field
        == isodate.parse_datetime(serialized_datetime)
    )

    new_serialized_datetime = "2022-12-31T23:59:59.999Z"
    model.inner_model.datetime_field = isodate.parse_datetime(new_serialized_datetime)
    assert model.inner_model["datetimeField"] == "2022-12-31T23:59:59.999000Z"


class X(Model):
    y: "Y" = rest_field()

    @overload
    def __init__(self, *, y: "Y"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class Y(Model):
    z: "Z" = rest_field()

    @overload
    def __init__(self, *, z: "Z"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class Z(Model):
    z_val: datetime.datetime = rest_field(name="zVal")

    @overload
    def __init__(self, *, z_val: datetime.datetime): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_nested_update():
    serialized_datetime = "9999-12-31T23:59:59.999Z"
    parsed_datetime = isodate.parse_datetime(serialized_datetime)
    x = X({"y": {"z": {"zVal": serialized_datetime}}})
    assert x.y.z.z_val == x["y"].z.z_val == x.y["z"].z_val == x["y"]["z"].z_val == parsed_datetime
    assert x.y.z["zVal"] == x.y["z"]["zVal"] == x["y"].z["zVal"] == x["y"]["z"]["zVal"] == serialized_datetime


def test_deserialization_is():
    # test without datetime deserialization
    a = A({"b": {"c": {"d": "hello"}}})
    assert a.b is a.b
    assert a.b.c is a.b.c
    assert a.b.c.d is a.b.c.d

    serialized_datetime = "9999-12-31T23:59:59.999Z"
    x = X({"y": {"z": {"zVal": serialized_datetime}}})
    assert x.y is x.y
    assert x.y.z is x.y.z

    assert x.y.z.z_val == isodate.parse_datetime(serialized_datetime)


class InnerModelWithReadonly(Model):
    normal_property: str = rest_field(name="normalProperty")
    readonly_property: str = rest_field(name="readonlyProperty", visibility=["read"])

    @overload
    def __init__(self, *, normal_property: str): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class ModelWithReadonly(Model):
    normal_property: str = rest_field(name="normalProperty")
    readonly_property: str = rest_field(name="readonlyProperty", visibility=["read"])
    inner_model: InnerModelWithReadonly = rest_field(name="innerModel")

    @overload
    def __init__(self, *, normal_property: str): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


def test_readonly():
    # we pass the dict to json, so readonly shouldn't show up in the JSON version
    value = {
        "normalProperty": "normal",
        "readonlyProperty": "readonly",
        "innerModel": {"normalProperty": "normal", "readonlyProperty": "readonly"},
    }
    model = ModelWithReadonly(value)
    assert model.as_dict(exclude_readonly=True) == {
        "normalProperty": "normal",
        "innerModel": {"normalProperty": "normal"},
    }
    assert json.loads(json.dumps(model, cls=SdkJSONEncoder)) == value
    assert model == value
    assert model["readonlyProperty"] == model.readonly_property == "readonly"
    assert model["innerModel"]["readonlyProperty"] == model.inner_model.readonly_property == "readonly"


def test_readonly_set():
    value = {
        "normalProperty": "normal",
        "readonlyProperty": "readonly",
        "innerModel": {"normalProperty": "normal", "readonlyProperty": "readonly"},
    }

    model = ModelWithReadonly(value)
    assert model.normal_property == model["normalProperty"] == "normal"
    assert model.readonly_property == model["readonlyProperty"] == "readonly"
    assert model.inner_model.normal_property == model.inner_model["normalProperty"] == "normal"
    assert model.inner_model.readonly_property == model.inner_model["readonlyProperty"] == "readonly"

    assert model.as_dict(exclude_readonly=True) == {
        "normalProperty": "normal",
        "innerModel": {"normalProperty": "normal"},
    }
    assert json.loads(json.dumps(model, cls=SdkJSONEncoder)) == value

    model["normalProperty"] = "setWithDict"
    model["readonlyProperty"] = "setWithDict"
    model.inner_model["normalProperty"] = "setWithDict"
    model.inner_model["readonlyProperty"] = "setWithDict"

    assert model.normal_property == model["normalProperty"] == "setWithDict"
    assert model.readonly_property == model["readonlyProperty"] == "setWithDict"
    assert model.inner_model.normal_property == model.inner_model["normalProperty"] == "setWithDict"
    assert model.inner_model.readonly_property == model.inner_model["readonlyProperty"] == "setWithDict"
    assert model.as_dict(exclude_readonly=True) == {
        "normalProperty": "setWithDict",
        "innerModel": {"normalProperty": "setWithDict"},
    }
    assert json.loads(json.dumps(model, cls=SdkJSONEncoder)) == {
        "normalProperty": "setWithDict",
        "readonlyProperty": "setWithDict",
        "innerModel": {
            "normalProperty": "setWithDict",
            "readonlyProperty": "setWithDict",
        },
    }


def test_incorrect_initialization():
    class MyModel(Model):
        id: int = rest_field()
        field: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            id: int,
            field: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    with pytest.raises(TypeError):
        MyModel(1, "field")

    with pytest.raises(TypeError):
        MyModel(id=1, field="field", unknown="me")


def test_serialization_initialization_and_setting():
    serialized_datetime = "9999-12-31T23:59:59.999000Z"
    parsed_datetime = isodate.parse_datetime(serialized_datetime)

    # pass in parsed
    z = Z(z_val=parsed_datetime)
    assert z.z_val == parsed_datetime
    assert z["zVal"] == serialized_datetime

    # pass in dict
    z = Z({"zVal": serialized_datetime})
    assert z.z_val == parsed_datetime
    assert z["zVal"] == serialized_datetime

    # assert setting
    serialized_datetime = "2022-12-31T23:59:59.999000Z"
    z.z_val = isodate.parse_datetime(serialized_datetime)
    assert z["zVal"] == serialized_datetime


def test_copy_of_input():
    class TestModel(Model):
        data: List[int] = rest_field()

        @overload
        def __init__(self, *, data: List[int]): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    raw = [1, 2, 3]
    m = TestModel(data=raw)
    assert not m.data is raw
    assert m.data == raw
    raw.append(4)
    assert m.data == [1, 2, 3]


def test_inner_model_custom_serializer():
    class InnerModel(Model):
        prop: str = rest_field(type=lambda x: x[::-1])

        @overload
        def __init__(self, *, prop: str): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class OuterModel(Model):
        inner: InnerModel = rest_field()

        @overload
        def __init__(self, *, inner: InnerModel): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    outer = OuterModel({"inner": {"prop": "hello"}})
    assert outer.inner["prop"] == outer["inner"]["prop"] == "hello"
    assert outer.inner.prop == outer["inner"].prop == "olleh"  # cspell: ignore olleh


def test_default_value():
    class MyModel(Model):
        prop_default_str: str = rest_field(name="propDefaultStr", default="hello")
        prop_optional_str: Optional[str] = rest_field(name="propOptionalStr", default=None)
        prop_default_int: int = rest_field(name="propDefaultInt", default=1)
        prop_optional_int: Optional[int] = rest_field(name="propOptionalInt", default=None)

        @overload
        def __init__(
            self,
            *,
            prop_default_str: str = "hello",
            prop_optional_str: Optional[str] = "propOptionalStr",
            prop_default_int: int = 1,
            prop_optional_int: Optional[int] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    my_model = MyModel()
    assert my_model.prop_default_str == my_model["propDefaultStr"] == "hello"
    assert my_model.prop_optional_str is my_model["propOptionalStr"] is None
    assert my_model.prop_default_int == my_model["propDefaultInt"] == 1
    assert my_model.prop_optional_int is my_model["propOptionalInt"] is None
    assert my_model == {
        "propDefaultStr": "hello",
        "propOptionalStr": None,
        "propDefaultInt": 1,
        "propOptionalInt": None,
    }

    my_model = MyModel(prop_default_str="goodbye")
    assert my_model.prop_default_str == my_model["propDefaultStr"] == "goodbye"
    assert my_model.prop_optional_str is my_model["propOptionalStr"] is None
    assert my_model.prop_default_int == my_model["propDefaultInt"] == 1
    assert my_model.prop_optional_int is my_model["propOptionalInt"] is None
    assert my_model == {
        "propDefaultStr": "goodbye",
        "propOptionalStr": None,
        "propDefaultInt": 1,
        "propOptionalInt": None,
    }

    my_model = MyModel(prop_optional_int=4)
    assert my_model.prop_default_str == my_model["propDefaultStr"] == "hello"
    assert my_model.prop_optional_str is my_model["propOptionalStr"] is None
    assert my_model.prop_default_int == my_model["propDefaultInt"] == 1
    assert my_model.prop_optional_int == my_model["propOptionalInt"] == 4
    assert my_model == {
        "propDefaultStr": "hello",
        "propOptionalStr": None,
        "propDefaultInt": 1,
        "propOptionalInt": 4,
    }

    my_model = MyModel({"propDefaultInt": 5})
    assert my_model.prop_default_str == my_model["propDefaultStr"] == "hello"
    assert my_model.prop_optional_str is my_model["propOptionalStr"] is None
    assert my_model.prop_default_int == my_model["propDefaultInt"] == 5
    assert my_model.prop_optional_int is my_model["propOptionalInt"] is None
    assert my_model == {
        "propDefaultStr": "hello",
        "propOptionalStr": None,
        "propDefaultInt": 5,
        "propOptionalInt": None,
    }


def test_pass_models_in_dict():
    class Inner(Model):
        str_property: str = rest_field(name="strProperty")

        @overload
        def __init__(
            self,
            *,
            str_property: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        inner_property: Inner = rest_field(name="innerProperty")

        @overload
        def __init__(
            self,
            *,
            inner_property: Inner,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    def _tests(model: Outer):
        assert (
            {"innerProperty": {"strProperty": "hello"}}
            == {"innerProperty": Inner(str_property="hello")}
            == {"innerProperty": Inner({"strProperty": "hello"})}
            == Outer(inner_property=Inner(str_property="hello"))
            == Outer(inner_property=Inner({"strProperty": "hello"}))
            == Outer({"innerProperty": {"strProperty": "hello"}})
            == Outer({"innerProperty": Inner(str_property="hello")})
            == Outer({"innerProperty": Inner({"strProperty": "hello"})})
            == model
        )

    _tests(Outer(inner_property=Inner(str_property="hello")))
    _tests(Outer(inner_property=Inner({"strProperty": "hello"})))
    _tests(Outer({"innerProperty": {"strProperty": "hello"}}))
    _tests(Outer({"innerProperty": Inner(str_property="hello")}))
    _tests(Outer({"innerProperty": Inner({"strProperty": "hello"})}))


def test_mutability_list():
    class Inner(Model):
        str_property: str = rest_field(name="strProperty")

        @overload
        def __init__(
            self,
            *,
            str_property: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Middle(Model):
        inner_property: List[Inner] = rest_field(name="innerProperty")
        prop: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            inner_property: List[Inner],
            prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        middle_property: Middle = rest_field(name="middleProperty")

        @overload
        def __init__(
            self,
            *,
            middle_property: Model,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    original_dict = {
        "middleProperty": {
            "innerProperty": [{"strProperty": "hello"}],
            "prop": "original",
        }
    }
    model = Outer(original_dict)
    assert model is not original_dict

    # set with dict syntax
    assert model.middle_property is model["middleProperty"]
    middle_property = model.middle_property
    middle_property["prop"] = "new"
    assert model["middleProperty"] is model.middle_property is middle_property
    assert model["middleProperty"]["prop"] == model.middle_property.prop == "new"

    # set with attr syntax
    middle_property.prop = "newest"
    assert model["middleProperty"] is model.middle_property is middle_property
    assert model["middleProperty"]["prop"] == model.middle_property.prop == "newest"

    # modify innerproperty list
    assert model["middleProperty"]["innerProperty"][0] is model.middle_property.inner_property[0]
    assert (
        model["middleProperty"]["innerProperty"][0]
        is model.middle_property["innerProperty"][0]
        is model["middleProperty"].inner_property[0]
        is model.middle_property.inner_property[0]
    )
    inner_property = model["middleProperty"]["innerProperty"][0]

    # set with dict syntax
    inner_property["strProperty"] = "nihao"
    assert (
        model["middleProperty"]["innerProperty"][0]
        is model.middle_property["innerProperty"][0]
        is model["middleProperty"].inner_property[0]
        is model.middle_property.inner_property[0]
    )
    assert (
        model["middleProperty"]["innerProperty"][0]["strProperty"]
        == model.middle_property["innerProperty"][0]["strProperty"]
        == model["middleProperty"].inner_property[0]["strProperty"]
        == model.middle_property.inner_property[0]["strProperty"]
        == model["middleProperty"]["innerProperty"][0].str_property
        == model.middle_property["innerProperty"][0].str_property
        == model["middleProperty"].inner_property[0].str_property
        == model.middle_property.inner_property[0].str_property
        == "nihao"
    )


def test_mutability_dict():
    class Inner(Model):
        str_property: str = rest_field(name="strProperty")

        @overload
        def __init__(
            self,
            *,
            str_property: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Middle(Model):
        inner_property: Dict[str, Inner] = rest_field(name="innerProperty")
        prop: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            inner_property: Dict[str, Inner],
            prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        middle_property: Middle = rest_field(name="middleProperty")

        @overload
        def __init__(
            self,
            *,
            middle_property: Model,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    original_dict = {
        "middleProperty": {
            "innerProperty": {"inner": {"strProperty": "hello"}},
            "prop": "original",
        }
    }
    model = Outer(original_dict)
    assert model is not original_dict

    # set with dict syntax
    assert model.middle_property is model["middleProperty"]
    middle_property = model.middle_property
    middle_property["prop"] = "new"
    assert model["middleProperty"] is model.middle_property is middle_property
    assert (
        model["middleProperty"]["prop"]
        == model["middleProperty"].prop
        == model.middle_property.prop
        == model.middle_property["prop"]
        == "new"
    )

    # set with attr syntax
    middle_property.prop = "newest"
    assert model["middleProperty"] is model.middle_property is middle_property
    assert model["middleProperty"]["prop"] == model.middle_property.prop == "newest"

    # modify innerproperty list
    assert model["middleProperty"]["innerProperty"]["inner"] is model.middle_property.inner_property["inner"]
    assert (
        model["middleProperty"]["innerProperty"]["inner"]
        is model.middle_property["innerProperty"]["inner"]
        is model["middleProperty"].inner_property["inner"]
        is model.middle_property.inner_property["inner"]
    )
    inner_property = model["middleProperty"]["innerProperty"]["inner"]

    # set with dict syntax
    inner_property["strProperty"] = "nihao"
    assert (
        model["middleProperty"]["innerProperty"]["inner"]
        is model.middle_property["innerProperty"]["inner"]
        is model["middleProperty"].inner_property["inner"]
        is model.middle_property.inner_property["inner"]
    )
    assert (
        model["middleProperty"]["innerProperty"]["inner"]["strProperty"]
        == model.middle_property["innerProperty"]["inner"]["strProperty"]
        == model["middleProperty"].inner_property["inner"]["strProperty"]
        == model.middle_property.inner_property["inner"]["strProperty"]
        == model["middleProperty"]["innerProperty"]["inner"].str_property
        == model.middle_property["innerProperty"]["inner"].str_property
        == model["middleProperty"].inner_property["inner"].str_property
        == model.middle_property.inner_property["inner"].str_property
        == "nihao"
    )


def test_del_model():
    class TestModel(Model):
        x: Optional[int] = rest_field()

    my_dict = {}
    my_dict["x"] = None

    assert my_dict["x"] is None

    my_model = TestModel({})
    my_model["x"] = None

    assert my_model["x"] is my_model.x is None

    my_model = TestModel({"x": 7})
    my_model.x = None

    assert "x" not in my_model
    assert my_model.x is None

    with pytest.raises(KeyError):
        del my_model["x"]
    my_model.x = 8

    del my_model["x"]
    assert "x" not in my_model
    assert my_model.x is my_model.get("x") is None

    with pytest.raises(AttributeError):
        del my_model.x
    my_model.x = None
    assert "x" not in my_model
    assert my_model.x is my_model.get("x") is None


def test_pop_model():
    class Inner(Model):
        str_property: str = rest_field(name="strProperty")

        @overload
        def __init__(
            self,
            *,
            str_property: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Middle(Model):
        inner_property: Dict[str, Inner] = rest_field(name="innerProperty")
        prop: str = rest_field()

        @overload
        def __init__(
            self,
            *,
            inner_property: Dict[str, Inner],
            prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class Outer(Model):
        middle_property: Middle = rest_field(name="middleProperty")

        @overload
        def __init__(
            self,
            *,
            middle_property: Model,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    original_dict = {
        "middleProperty": {
            "innerProperty": {"inner": {"strProperty": "hello"}},
            "prop": "original",
        }
    }
    model_dict = Outer(original_dict)  # model we will access with dict syntax
    model_attr = Outer(original_dict)  # model we will access with attr syntax

    assert model_dict is not original_dict is not model_attr
    assert (
        original_dict["middleProperty"]["innerProperty"]["inner"].pop("strProperty")
        == model_dict["middleProperty"]["innerProperty"]["inner"].pop("strProperty")
        == model_attr.middle_property.inner_property["inner"].pop("strProperty")
        == "hello"
    )

    with pytest.raises(KeyError):
        original_dict["middleProperty"]["innerProperty"]["inner"].pop("strProperty")
    with pytest.raises(KeyError):
        model_dict["middleProperty"]["innerProperty"]["inner"].pop("strProperty")
    with pytest.raises(KeyError):
        model_attr.middle_property.inner_property["inner"].pop("strProperty")


def test_contains():
    class ParentA(Model):
        a_prop: str = rest_field(name="aProp")

        @overload
        def __init__(
            self,
            *,
            a_prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class ParentB(Model):
        b_prop: str = rest_field(name="bProp")

        @overload
        def __init__(
            self,
            *,
            b_prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    class ChildC(ParentA, ParentB):
        c_prop: str = rest_field(name="cProp")

        @overload
        def __init__(
            self,
            *,
            a_prop: str,
            b_prop: str,
            c_prop: str,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    parent_a_dict = {"aProp": "a"}
    assert "aProp" in parent_a_dict

    parent_a = ParentA(parent_a_dict)
    assert "aProp" in parent_a
    assert not "a_prop" in parent_a

    parent_a.a_prop = None  # clear it out
    assert "aProp" not in parent_a

    parent_b_dict = {"bProp": "b"}
    assert "bProp" in parent_b_dict

    parent_b = ParentB(parent_b_dict)
    assert "bProp" in parent_b
    assert "b_prop" not in parent_b

    parent_b.b_prop = None  # clear it out
    assert "bProp" not in parent_b

    props = ["aProp", "bProp", "cProp"]
    child_c_dict = {"aProp": "a", "bProp": "b", "cProp": "c"}
    assert all(p for p in props if p in child_c_dict)

    child_c = ChildC(child_c_dict)
    assert all(p for p in props if p in child_c)
    assert not any(p for p in ["a_prop", "b_prop", "c_prop"] if p in child_c)

    child_c.a_prop = None
    child_c.b_prop = None
    child_c.c_prop = None

    assert not any(p for p in props if p in child_c)


def test_iter():
    dict_response = {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "virtualMachines": [],
    }
    assert isinstance(iter(dict_response), Iterable)
    model = BasicResource(dict_response)
    assert isinstance(iter(model), Iterable)

    assert (
        list(iter(dict_response))
        == list(iter(model))
        == ["platformUpdateDomainCount", "platformFaultDomainCount", "virtualMachines"]
    )


def test_len():
    dict_response = {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3,
        "virtualMachines": [],
    }
    model = BasicResource(dict_response)
    assert len(dict_response) == len(model) == 3

    dict_response.pop("platformUpdateDomainCount")
    model.pop("platformUpdateDomainCount")
    assert len(dict_response) == len(model) == 2


def test_keys():
    class Inner(Model):
        str_prop: str = rest_field(name="strProp")

    class Outer(Model):
        inner_prop: Inner = rest_field(name="innerProp")

    outer_dict = {"innerProp": {"strProp": "hello"}}
    outer = Outer(outer_dict)
    assert outer.keys() == outer_dict.keys()
    outer_dict["newProp"] = "hello"
    outer["newProp"] = "hello"

    assert outer.keys() == outer_dict.keys()

    outer_dict.pop("newProp")
    outer.pop("newProp")
    assert outer_dict.keys() == outer.keys()


def test_values():
    class Inner(Model):
        str_prop: str = rest_field(name="strProp")

    class Outer(Model):
        inner_prop: Inner = rest_field(name="innerProp")

    outer_dict = {"innerProp": {"strProp": "hello"}}
    outer = Outer(outer_dict)

    assert list(outer.values()) == list(outer_dict.values())
    assert len(outer.values()) == len(outer_dict.values()) == 1
    assert list(outer.values())[0]["strProp"] == list(outer_dict.values())[0]["strProp"] == "hello"

    outer_dict["innerProp"]["strProp"] = "goodbye"
    outer.inner_prop.str_prop = "goodbye"

    assert list(outer.inner_prop.values()) == list(outer_dict["innerProp"].values())


def test_items():
    class Inner(Model):
        str_prop: str = rest_field(name="strProp")

    class Outer(Model):
        inner_prop: Inner = rest_field(name="innerProp")

    outer_dict = {"innerProp": {"strProp": "hello"}}
    outer = Outer(outer_dict)

    assert list(outer.items()) == list(outer_dict.items())

    outer_dict["innerProp"]["strProp"] = "goodbye"
    outer.inner_prop.str_prop = "goodbye"

    assert list(outer.inner_prop.items()) == list(outer_dict["innerProp"].items())

    outer_dict["newProp"] = "bonjour"
    outer["newProp"] = "bonjour"

    assert list(outer.items()) == list(outer_dict.items())


def test_get():
    class MyModel(Model):
        prop: str = rest_field()
        rest_prop: str = rest_field(name="restProp")

    my_dict = {"prop": "hello", "restProp": "bonjour"}
    my_model = MyModel(my_dict)

    assert my_dict.get("prop") == my_model.get("prop") == "hello"
    my_dict["prop"] = "nihao"
    my_model.prop = "nihao"

    assert my_dict.get("prop") == my_model.get("prop") == "nihao"

    my_dict["restProp"] = "buongiorno"
    my_model.rest_prop = "buongiorno"

    assert my_dict.get("restProp") == my_model.get("restProp") == "buongiorno"
    assert my_dict.get("rest_prop") is None  # attr case should not work here

    my_dict["newProp"] = "i'm new"
    my_model["newProp"] = "i'm new"

    assert my_dict.get("newProp") == my_model.get("newProp") == "i'm new"
    assert my_dict.get("nonexistent") is my_model.get("nonexistent") is None

    assert my_dict.get("nonexistent", 0) == my_model.get("nonexistent", 0) == 0


def test_pop():
    class MyModel(Model):
        prop: str = rest_field()
        rest_prop: str = rest_field(name="restProp")

    my_dict = {"prop": "hello", "restProp": "bonjour"}
    my_model = MyModel(my_dict)

    assert my_dict.pop("prop") == my_model.pop("prop") == "hello"
    with pytest.raises(KeyError):
        my_dict.pop("prop")
    with pytest.raises(KeyError):
        my_model.pop("prop")

    my_dict["prop"] = "nihao"
    my_model.prop = "nihao"

    assert my_dict.pop("prop") == my_model.pop("prop") == "nihao"

    with pytest.raises(KeyError):
        my_dict.pop("prop")
    with pytest.raises(KeyError):
        my_model.pop("prop")

    my_dict["restProp"] = "buongiorno"
    my_model.rest_prop = "buongiorno"

    assert my_dict.pop("restProp") == my_model.pop("restProp") == "buongiorno"
    with pytest.raises(KeyError):
        my_dict.pop("rest_prop")  # attr case should not work here

    my_dict["newProp"] = "i'm new"
    my_model["newProp"] = "i'm new"

    assert my_dict.pop("newProp") == my_model.pop("newProp") == "i'm new"
    assert my_dict.pop("nonexistent", 0) == my_model.pop("nonexistent", 0) == 0


def test_popitem():
    class ModelA(Model):
        a_str_prop: str = rest_field(name="aStrProp")

    class ModelB(Model):
        b_str_prop: str = rest_field(name="bStrProp")

    class ModelC(Model):
        c_str_prop: str = rest_field(name="cStrProp")

    class MainModel(Model):
        a_prop: ModelA = rest_field(name="aProp")
        b_prop: ModelB = rest_field(name="bProp")
        c_prop: ModelC = rest_field(name="cProp")

    my_dict = {
        "aProp": {"aStrProp": "a"},
        "bProp": {"bStrProp": "b"},
        "cProp": {"cStrProp": "c"},
    }

    def _tests(my_dict: Dict[str, Any], my_model: MainModel):
        my_dict = copy.deepcopy(my_dict)  # so we don't get rid of the dict each time we run tests

        # pop c prop
        dict_popitem = my_dict.popitem()
        model_popitem = my_model.popitem()
        assert dict_popitem[0] == model_popitem[0] == "cProp"
        assert dict_popitem[1]["cStrProp"] == model_popitem[1]["cStrProp"] == model_popitem[1].c_str_prop == "c"

        # pop b prop
        dict_popitem = my_dict.popitem()
        model_popitem = my_model.popitem()
        assert dict_popitem[0] == model_popitem[0] == "bProp"
        assert dict_popitem[1]["bStrProp"] == model_popitem[1]["bStrProp"] == model_popitem[1].b_str_prop == "b"

        # pop a prop
        dict_popitem = my_dict.popitem()
        model_popitem = my_model.popitem()
        assert dict_popitem[0] == model_popitem[0] == "aProp"
        assert dict_popitem[1]["aStrProp"] == model_popitem[1]["aStrProp"] == model_popitem[1].a_str_prop == "a"

        with pytest.raises(KeyError):
            my_dict.popitem()

        with pytest.raises(KeyError):
            my_model.popitem()

    _tests(my_dict, MainModel(my_dict))
    _tests(
        my_dict,
        MainModel(
            a_prop=ModelA(a_str_prop="a"),
            b_prop=ModelB(b_str_prop="b"),
            c_prop=ModelC(c_str_prop="c"),
        ),
    )


def test_clear():
    class ModelA(Model):
        a_str_prop: str = rest_field(name="aStrProp")

    class ModelB(Model):
        b_str_prop: str = rest_field(name="bStrProp")

    class ModelC(Model):
        c_str_prop: str = rest_field(name="cStrProp")

    class MainModel(Model):
        a_prop: ModelA = rest_field(name="aProp")
        b_prop: ModelB = rest_field(name="bProp")
        c_prop: ModelC = rest_field(name="cProp")

    my_dict = {
        "aProp": {"aStrProp": "a"},
        "bProp": {"bStrProp": "b"},
        "cProp": {"cStrProp": "c"},
    }

    def _tests(my_dict: Dict[str, Any], my_model: MainModel):
        my_dict = copy.deepcopy(my_dict)  # so we don't get rid of the dict each time we run tests

        assert my_dict["aProp"] == my_model.a_prop == my_model["aProp"] == {"aStrProp": "a"}
        my_dict.clear()
        my_model.clear()
        assert my_dict == my_model == {}

        assert my_model.a_prop is None
        assert my_model.b_prop is None
        assert my_model.c_prop is None

        my_dict.clear()
        my_model.clear()
        assert my_dict == my_model == {}

    _tests(my_dict, MainModel(my_dict))
    _tests(
        my_dict,
        MainModel(
            a_prop=ModelA(a_str_prop="a"),
            b_prop=ModelB(b_str_prop="b"),
            c_prop=ModelC(c_str_prop="c"),
        ),
    )


def test_update():
    class ModelA(Model):
        a_str_prop: str = rest_field(name="aStrProp")

    class ModelB(Model):
        b_str_prop: str = rest_field(name="bStrProp")

    class ModelC(Model):
        c_str_prop: str = rest_field(name="cStrProp")

    class MainModel(Model):
        a_prop: ModelA = rest_field(name="aProp")
        b_prop: ModelB = rest_field(name="bProp")
        c_prop: ModelC = rest_field(name="cProp")

    my_dict = {
        "aProp": {"aStrProp": "a"},
        "bProp": {"bStrProp": "b"},
        "cProp": {"cStrProp": "c"},
    }

    def _tests(my_dict: Dict[str, Any], my_model: MainModel):
        my_dict = copy.deepcopy(my_dict)  # so we don't get rid of the dict each time we run tests

        assert my_dict["aProp"] == my_model.a_prop == my_model["aProp"] == {"aStrProp": "a"}
        my_dict.update({"aProp": {"aStrProp": "newA"}})
        my_model.a_prop.update({"aStrProp": "newA"})
        assert my_dict["aProp"] == my_model.a_prop == my_model["aProp"] == {"aStrProp": "newA"}

        my_dict["bProp"].update({"newBProp": "hello"})
        my_model.b_prop.update({"newBProp": "hello"})

        assert my_dict["bProp"] == my_model.b_prop == my_model["bProp"] == {"bStrProp": "b", "newBProp": "hello"}

        my_dict.update({"dProp": "hello"})
        my_model.update({"dProp": "hello"})

        assert my_dict["dProp"] == my_model["dProp"] == "hello"

    _tests(my_dict, MainModel(my_dict))
    _tests(
        my_dict,
        MainModel(
            a_prop=ModelA(a_str_prop="a"),
            b_prop=ModelB(b_str_prop="b"),
            c_prop=ModelC(c_str_prop="c"),
        ),
    )


def test_setdefault():
    class Inner(Model):
        str_prop: str = rest_field(name="strProp", default="modelDefault")

    class Outer(Model):
        inner_prop: Inner = rest_field(name="innerProp")

    og_dict = {"innerProp": {}}
    og_dict["innerProp"].setdefault("strProp", "actualDefault")
    og_model = Outer(og_dict)
    og_model.inner_prop.setdefault("strProp", "actualDefault")

    assert og_dict["innerProp"] == og_model["innerProp"] == og_model.inner_prop == {"strProp": "actualDefault"}

    assert (
        og_dict["innerProp"].setdefault("strProp")
        == og_model["innerProp"].setdefault("strProp")
        == og_model.inner_prop.setdefault("strProp")
        == "actualDefault"
    )

    assert og_dict.setdefault("newProp") is og_model.setdefault("newProp") is None
    assert og_dict["newProp"] is og_model["newProp"] is None


def test_repr():
    class ModelA(Model):
        a_str_prop: str = rest_field(name="aStrProp")

    class ModelB(Model):
        b_str_prop: str = rest_field(name="bStrProp")

    class ModelC(Model):
        c_str_prop: str = rest_field(name="cStrProp")

    class MainModel(Model):
        a_prop: ModelA = rest_field(name="aProp")
        b_prop: ModelB = rest_field(name="bProp")
        c_prop: ModelC = rest_field(name="cProp")

    my_dict = {
        "aProp": {"aStrProp": "a"},
        "bProp": {"bStrProp": "b"},
        "cProp": {"cStrProp": "c"},
    }

    assert repr(my_dict) == repr(MainModel(my_dict))


##### REWRITE BODY COMPLEX INTO THIS FILE #####


def test_complex_basic():
    class Basic(Model):
        id: Optional[int] = rest_field(default=None)
        name: Optional[str] = rest_field(default=None)
        color: Optional[Literal["cyan", "Magenta", "YELLOW", "blacK"]] = rest_field(default=None)

        @overload
        def __init__(
            self,
            *,
            id: Optional[int] = None,
            name: Optional[str] = None,
            color: Optional[Literal["cyan", "Magenta", "YELLOW", "blacK"]] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    basic = Basic(id=2, name="abc", color="Magenta")
    assert basic == {"id": 2, "name": "abc", "color": "Magenta"}

    basic.id = 3
    basic.name = "new_name"
    basic.color = "blacK"

    assert basic == {"id": 3, "name": "new_name", "color": "blacK"}

    basic["id"] = 4
    basic["name"] = "newest_name"
    basic["color"] = "YELLOW"

    assert basic == {"id": 4, "name": "newest_name", "color": "YELLOW"}


def test_complex_boolean_wrapper():
    class BooleanWrapper(Model):
        field_true: Optional[bool] = rest_field(default=None)
        field_false: Optional[bool] = rest_field(default=None)

        @overload
        def __init__(
            self,
            *,
            field_true: Optional[bool] = None,
            field_false: Optional[bool] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    bool_model = BooleanWrapper(field_true=True, field_false=False)
    assert bool_model == {"field_true": True, "field_false": False}
    bool_model.field_true = False
    bool_model.field_false = True
    assert bool_model == {"field_true": False, "field_false": True}

    bool_model["field_true"] = True
    bool_model["field_false"] = False
    assert bool_model == {"field_true": True, "field_false": False}


def test_complex_byte_wrapper():
    class ByteWrapper(Model):
        default: Optional[bytes] = rest_field(default=None)
        base64: Optional[bytes] = rest_field(default=None, format="base64")
        base64url: Optional[bytes] = rest_field(default=None, format="base64url")
        list_base64: Optional[List[bytes]] = rest_field(default=None, format="base64")
        map_base64url: Optional[Dict[str, bytes]] = rest_field(default=None, format="base64url")

        @overload
        def __init__(
            self,
            *,
            default: Optional[bytes] = None,
            base64: Optional[bytes] = None,
            base64url: Optional[bytes] = None,
            list_base64: Optional[List[bytes]] = None,
            map_base64url: Optional[Dict[str, bytes]] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    byte_string = bytes("test", "utf-8")
    mod = ByteWrapper(
        default=byte_string,
        base64=byte_string,
        base64url=byte_string,
        list_base64=[byte_string, byte_string],
        map_base64url={"key1": byte_string, "key2": byte_string},
    )
    decoded = "dGVzdA=="
    decoded_urlsafe = "dGVzdA"

    def _tests(mod: ByteWrapper):
        assert mod == {
            "default": decoded,
            "base64": decoded,
            "base64url": decoded_urlsafe,
            "list_base64": [decoded, decoded],
            "map_base64url": {"key1": decoded_urlsafe, "key2": decoded_urlsafe},
        }
        assert mod.default == byte_string
        assert mod.base64 == byte_string
        assert mod.base64url == byte_string
        assert mod.list_base64 == [byte_string, byte_string]
        assert mod.map_base64url == {"key1": byte_string, "key2": byte_string}
        assert mod["default"] == decoded
        assert mod["base64"] == decoded
        assert mod["base64url"] == decoded_urlsafe
        assert mod["list_base64"] == [decoded, decoded]
        assert mod["map_base64url"] == {
            "key1": decoded_urlsafe,
            "key2": decoded_urlsafe,
        }

    _tests(mod)
    mod.default = byte_string
    mod.base64 = byte_string
    mod.base64url = byte_string
    mod.list_base64 = [byte_string, byte_string]
    mod.map_base64url = {"key1": byte_string, "key2": byte_string}
    _tests(mod)
    mod["default"] = decoded
    mod["base64"] = decoded
    mod["base64url"] = decoded_urlsafe
    mod["list_base64"] = [decoded, decoded]
    mod["map_base64url"] = {"key1": decoded_urlsafe, "key2": decoded_urlsafe}
    _tests(mod)


def test_complex_byte_array_wrapper():
    class ByteArrayWrapper(Model):
        default: Optional[bytearray] = rest_field(default=None)
        base64: Optional[bytearray] = rest_field(default=None, format="base64")
        base64url: Optional[bytearray] = rest_field(default=None, format="base64url")
        list_base64: Optional[List[bytearray]] = rest_field(default=None, format="base64")
        map_base64url: Optional[Dict[str, bytearray]] = rest_field(default=None, format="base64url")

        @overload
        def __init__(
            self,
            *,
            default: Optional[bytearray] = None,
            base64: Optional[bytearray] = None,
            base64url: Optional[bytearray] = None,
            list_base64: Optional[List[bytearray]] = None,
            map_base64url: Optional[Dict[str, bytearray]] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    byte_array = bytearray("test".encode("utf-8"))
    decoded = "dGVzdA=="
    decoded_urlsafe = "dGVzdA"

    def _tests(model: ByteArrayWrapper):
        assert model == {
            "default": decoded,
            "base64": decoded,
            "base64url": decoded_urlsafe,
            "list_base64": [decoded, decoded],
            "map_base64url": {"key1": decoded_urlsafe, "key2": decoded_urlsafe},
        }
        assert model.default == byte_array
        assert model.base64 == byte_array
        assert model.base64url == byte_array
        assert model.list_base64 == [byte_array, byte_array]
        assert model.map_base64url == {"key1": byte_array, "key2": byte_array}
        assert model["default"] == decoded
        assert model["base64"] == decoded
        assert model["base64url"] == decoded_urlsafe
        assert model["list_base64"] == [decoded, decoded]
        assert model["map_base64url"] == {
            "key1": decoded_urlsafe,
            "key2": decoded_urlsafe,
        }

    _tests(
        ByteArrayWrapper(
            default=byte_array,
            base64=byte_array,
            base64url=byte_array,
            list_base64=[byte_array, byte_array],
            map_base64url={"key1": byte_array, "key2": byte_array},
        )
    )
    _tests(
        ByteArrayWrapper(
            {
                "default": decoded,
                "base64": decoded,
                "base64url": decoded_urlsafe,
                "list_base64": [decoded, decoded],
                "map_base64url": {"key1": decoded_urlsafe, "key2": decoded_urlsafe},
            }
        )
    )


def test_complex_datetime_wrapper():
    class DatetimeWrapper(Model):
        default: datetime.datetime = rest_field(default=None)
        rfc3339: datetime.datetime = rest_field(default=None, format="rfc3339")
        rfc7231: datetime.datetime = rest_field(default=None, format="rfc7231")
        unix: datetime.datetime = rest_field(default=None, format="unix-timestamp")
        list_rfc3339: List[datetime.datetime] = rest_field(default=None, format="rfc3339")
        dict_rfc7231: Dict[str, datetime.datetime] = rest_field(default=None, format="rfc7231")

        @overload
        def __init__(
            self,
            *,
            default: Optional[datetime.datetime] = None,
            rfc3339: Optional[datetime.datetime] = None,
            rfc7231: Optional[datetime.datetime] = None,
            unix: Optional[datetime.datetime] = None,
            list_rfc3339: Optional[List[datetime.datetime]] = None,
            dict_rfc7231: Optional[Dict[str, datetime.datetime]] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    rfc3339 = "2023-06-27T06:11:09Z"
    rfc7231 = "Tue, 27 Jun 2023 06:11:09 GMT"
    unix = 1687846269
    dt = datetime.datetime(2023, 6, 27, 6, 11, 9, tzinfo=datetime.timezone.utc)

    def _tests(model: DatetimeWrapper):
        assert model["default"] == rfc3339
        assert model["rfc3339"] == rfc3339
        assert model["rfc7231"] == rfc7231
        assert model["unix"] == unix
        assert model["list_rfc3339"] == [rfc3339, rfc3339]
        assert model["dict_rfc7231"] == {"key1": rfc7231, "key2": rfc7231}
        assert model.default == model.rfc3339 == model.rfc7231 == model.unix == dt
        assert model.list_rfc3339 == [dt, dt]
        assert model.dict_rfc7231 == {"key1": dt, "key2": dt}

    _tests(
        DatetimeWrapper(
            default=dt,
            rfc3339=dt,
            rfc7231=dt,
            unix=dt,
            list_rfc3339=[dt, dt],
            dict_rfc7231={"key1": dt, "key2": dt},
        )
    )
    _tests(
        DatetimeWrapper(
            {
                "default": rfc3339,
                "rfc3339": rfc3339,
                "rfc7231": rfc7231,
                "unix": unix,
                "list_rfc3339": [rfc3339, rfc3339],
                "dict_rfc7231": {"key1": rfc7231, "key2": rfc7231},
            }
        )
    )


def test_complex_date_wrapper():
    class DateWrapper(Model):
        field: datetime.date = rest_field(default=None)
        leap: datetime.date = rest_field(default=None)

        @overload
        def __init__(
            self,
            *,
            field: Optional[datetime.date] = None,
            leap: Optional[datetime.date] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    field = "0001-01-01"
    leap = "2016-02-29"

    def _tests(model: DateWrapper):
        assert model.field == isodate.parse_date(field)
        assert model["field"] == field

        assert model.leap == isodate.parse_date(leap)
        assert model["leap"] == leap

        model.field = isodate.parse_date(leap)
        assert model.field == isodate.parse_date(leap)
        assert model["field"] == leap

        model["field"] = field
        assert model.field == isodate.parse_date(field)
        assert model["field"] == field

    _tests(DateWrapper({"field": field, "leap": leap}))
    _tests(DateWrapper(field=isodate.parse_date(field), leap=isodate.parse_date(leap)))


class DictionaryWrapper(Model):
    default_program: Dict[str, str] = rest_field(name="defaultProgram", default=None)

    @overload
    def __init__(
        self,
        *,
        default_program: Optional[Dict[str, str]] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


default_program = {
    "txt": "notepad",
    "bmp": "mspaint",
    "xls": "excel",
    "exe": "",
    "": None,
}


@pytest.mark.parametrize(
    "model",
    [
        DictionaryWrapper({"defaultProgram": default_program}),
        DictionaryWrapper(default_program=default_program),
    ],
)
def test_complex_dictionary_wrapper(model: DictionaryWrapper):
    assert model == {"defaultProgram": default_program}
    assert model.default_program == model["defaultProgram"] == default_program


@pytest.mark.parametrize(
    "model",
    [DictionaryWrapper({"defaultProgram": {}}), DictionaryWrapper(default_program={})],
)
def test_complex_dictionary_wrapper_empty(model: DictionaryWrapper):
    assert model == {"defaultProgram": {}}
    assert model.default_program == model["defaultProgram"] == {}


@pytest.mark.parametrize(
    "model",
    [
        DictionaryWrapper({"defaultProgram": None}),
        DictionaryWrapper(default_program=None),
    ],
)
def test_complex_dictionary_wrapper_none(model: DictionaryWrapper):
    assert model == {"defaultProgram": None}
    assert model.default_program is None


class ArrayWrapper(Model):
    array: Optional[List[str]] = rest_field(default=None)

    @overload
    def __init__(
        self,
        *,
        array: Optional[List[str]] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


array_value = [
    "1, 2, 3, 4",
    "",
    None,
    "&S#$(*Y",
    "The quick brown fox jumps over the lazy dog",
]


@pytest.mark.parametrize("model", [ArrayWrapper(array=array_value), ArrayWrapper({"array": array_value})])
def test_complex_array_wrapper(model: ArrayWrapper):
    assert model == {"array": array_value}
    assert model.array == model["array"] == array_value

    model.array = None
    with pytest.raises(KeyError):
        model["array"]
    assert model.array is None

    model["array"] = [1, 2, 3, 4, 5]
    assert model.array == ["1", "2", "3", "4", "5"]
    assert model["array"] == [1, 2, 3, 4, 5]


@pytest.mark.parametrize("model", [ArrayWrapper(array=[]), ArrayWrapper({"array": []})])
def test_complex_array_wrapper_empty(model: ArrayWrapper):
    assert model == {"array": []}
    assert model.array == model["array"] == []

    model.array = ["bonjour"]
    assert model.array == model["array"] == ["bonjour"]


@pytest.mark.parametrize("model", [ArrayWrapper(array=None), ArrayWrapper({"array": None})])
def test_complex_array_wrapper_none(model: ArrayWrapper):
    assert model == {"array": None}
    assert model.array is model["array"] is None

    model.array = ["bonjour"]
    assert model.array == model["array"] == ["bonjour"]


class PetComplex(Model):
    id: Optional[int] = rest_field(default=None)
    name: Optional[str] = rest_field(default=None)

    @overload
    def __init__(
        self,
        *,
        id: Optional[int] = None,
        name: Optional[str] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class DogComplex(PetComplex):
    food: Optional[str] = rest_field(default=None)

    @overload
    def __init__(
        self,
        *,
        id: Optional[int] = None,
        name: Optional[str] = None,
        food: Optional[str] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


class CatComplex(PetComplex):
    color: Optional[str] = rest_field(default=None)
    hates: Optional[List[DogComplex]] = rest_field(default=None)

    @overload
    def __init__(
        self,
        *,
        id: Optional[int] = None,
        name: Optional[str] = None,
        food: Optional[str] = None,
        color: Optional[str] = None,
        hates: Optional[List[DogComplex]] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any], /): ...

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


@pytest.mark.parametrize(
    "model",
    [
        CatComplex(
            id=2,
            name="Siamese",
            hates=[
                DogComplex(id=1, name="Potato", food="tomato"),
                DogComplex(id=-1, name="Tomato", food="french fries"),
            ],
        ),
        CatComplex(
            id=2,
            name="Siamese",
            hates=[
                DogComplex(id=1, name="Potato", food="tomato"),
                {"id": -1, "name": "Tomato", "food": "french fries"},
            ],
        ),
        CatComplex(
            id=2,
            name="Siamese",
            hates=[
                {"id": 1, "name": "Potato", "food": "tomato"},
                {"id": -1, "name": "Tomato", "food": "french fries"},
            ],
        ),
    ],
)
def test_complex_inheritance(model):
    assert model.id == model["id"] == 2
    assert model.name == model["name"] == "Siamese"
    assert model.hates
    assert model.hates[1] == model["hates"][1] == {"id": -1, "name": "Tomato", "food": "french fries"}
    model["breed"] = "persian"
    model["color"] = "green"
    with pytest.raises(AttributeError):
        model.breed
    assert model == {
        "id": 2,
        "name": "Siamese",
        "color": "green",
        "breed": "persian",
        "hates": [
            DogComplex(id=1, name="Potato", food="tomato"),
            DogComplex(id=-1, name="Tomato", food="french fries"),
        ],
    }


def test_required_prop_not_passed():
    class ModelWithRequiredProperty(Model):
        required_property: int = rest_field(name="requiredProperty")

        @overload
        def __init__(
            self,
            *,
            required_property: int,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    model = ModelWithRequiredProperty()
    assert model.required_property is None
    with pytest.raises(KeyError):
        model["requiredProperty"]

    model = ModelWithRequiredProperty({})
    assert model.required_property is None
    with pytest.raises(KeyError):
        model["requiredProperty"]


def test_null_serialization(core_library):
    dict_response = {
        "name": "it's me!",
        "listOfMe": [
            {
                "name": "it's me!",
            }
        ],
        "dictOfMe": {
            "me": {
                "name": "it's me!",
            }
        },
        "dictOfListOfMe": {
            "many mes": [
                {
                    "name": "it's me!",
                }
            ]
        },
        "listOfDictOfMe": None,
    }
    model = RecursiveModel(dict_response)
    assert json.loads(json.dumps(model, cls=SdkJSONEncoder)) == dict_response

    assert model.as_dict() == dict_response

    model.list_of_me = core_library.serialization.NULL
    model.dict_of_me = None
    model.list_of_dict_of_me = [
        {
            "me": {
                "name": "it's me!",
            }
        }
    ]
    model.dict_of_list_of_me["many mes"][0].list_of_me = core_library.serialization.NULL
    model.dict_of_list_of_me["many mes"][0].dict_of_me = None
    model.list_of_dict_of_me[0]["me"].list_of_me = core_library.serialization.NULL
    model.list_of_dict_of_me[0]["me"].dict_of_me = None

    assert json.loads(json.dumps(model, cls=SdkJSONEncoder)) == {
        "name": "it's me!",
        "listOfMe": None,
        "dictOfListOfMe": {
            "many mes": [
                {
                    "name": "it's me!",
                    "listOfMe": None,
                }
            ]
        },
        "listOfDictOfMe": [
            {
                "me": {
                    "name": "it's me!",
                    "listOfMe": None,
                }
            }
        ],
    }

    assert model.as_dict() == {
        "name": "it's me!",
        "listOfMe": None,
        "dictOfListOfMe": {
            "many mes": [
                {
                    "name": "it's me!",
                    "listOfMe": None,
                }
            ]
        },
        "listOfDictOfMe": [
            {
                "me": {
                    "name": "it's me!",
                    "listOfMe": None,
                }
            }
        ],
    }


class UnionBaseModel(Model):
    name: str = rest_field()

    @overload
    def __init__(self, *, name: str): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UnionModel1(UnionBaseModel):
    prop1: int = rest_field()

    @overload
    def __init__(self, *, name: str, prop1: int): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class UnionModel2(UnionBaseModel):
    prop2: int = rest_field()

    @overload
    def __init__(self, *, name: str, prop2: int): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


MyNamedUnion = Union["UnionModel1", "UnionModel2"]


class ModelWithNamedUnionProperty(Model):
    named_union: "MyNamedUnion" = rest_field(name="namedUnion")

    @overload
    def __init__(self, *, named_union: "MyNamedUnion"): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


class ModelWithSimpleUnionProperty(Model):
    simple_union: Union[int, List[int]] = rest_field(name="simpleUnion")

    @overload
    def __init__(self, *, simple_union: Union[int, List[int]]): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)


def test_union():
    simple = ModelWithSimpleUnionProperty(simple_union=1)
    assert simple.simple_union == simple["simpleUnion"] == 1
    simple = ModelWithSimpleUnionProperty(simple_union=[1, 2])
    assert simple.simple_union == simple["simpleUnion"] == [1, 2]
    named = ModelWithNamedUnionProperty()
    assert not _is_model(named.named_union)
    named.named_union = UnionModel1(name="model1", prop1=1)
    assert _is_model(named.named_union)
    assert named.named_union == named["namedUnion"] == {"name": "model1", "prop1": 1}
    named = ModelWithNamedUnionProperty(named_union=UnionModel2(name="model2", prop2=2))
    assert named.named_union == named["namedUnion"] == {"name": "model2", "prop2": 2}
    named = ModelWithNamedUnionProperty({"namedUnion": {"name": "model2", "prop2": 2}})
    assert named.named_union == named["namedUnion"] == {"name": "model2", "prop2": 2}


def test_as_dict():
    class CatComplex(PetComplex):
        color: Optional[str] = rest_field(default=None)
        hates: Optional[List[DogComplex]] = rest_field(default=None, visibility=["read"])

        @overload
        def __init__(
            self,
            *,
            id: Optional[int] = None,
            name: Optional[str] = None,
            food: Optional[str] = None,
            color: Optional[str] = None,
            hates: Optional[List[DogComplex]] = None,
        ): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    model = CatComplex(
        id=2,
        name="Siamese",
        hates=[
            DogComplex(id=1, name="Potato", food="tomato"),
            DogComplex(id=-1, name="Tomato", food="french fries"),
        ],
    )
    assert model.as_dict(exclude_readonly=True) == {
        "id": 2,
        "name": "Siamese",
        "color": None,
    }


class Fish(Model):
    __mapping__: Dict[str, Model] = {}
    age: int = rest_field()
    kind: Literal[None] = rest_discriminator(name="kind")

    @overload
    def __init__(
        self,
        *,
        age: int,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.kind: Literal[None] = None


class Shark(Fish, discriminator="shark"):
    __mapping__: Dict[str, Model] = {}
    kind: Literal["shark"] = rest_discriminator(name="kind")
    sharktype: Literal[None] = rest_discriminator(name="sharktype")

    @overload
    def __init__(
        self,
        *,
        age: int,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.kind: Literal["shark"] = "shark"
        self.sharktype: Literal[None] = None


class GoblinShark(Shark, discriminator="goblin"):
    sharktype: Literal["goblin"] = rest_discriminator(name="sharktype")

    @overload
    def __init__(
        self,
        *,
        age: int,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.sharktype: Literal["goblin"] = "goblin"


class Salmon(Fish, discriminator="salmon"):
    kind: Literal["salmon"] = rest_discriminator(name="kind")
    friends: Optional[List["Fish"]] = rest_field()
    hate: Optional[Dict[str, "Fish"]] = rest_field()
    partner: Optional["Fish"] = rest_field()

    @overload
    def __init__(
        self,
        *,
        age: int,
        friends: Optional[List["Fish"]] = None,
        hate: Optional[Dict[str, "Fish"]] = None,
        partner: Optional["Fish"] = None,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.kind: Literal["salmon"] = "salmon"


class SawShark(Shark, discriminator="saw"):
    sharktype: Literal["saw"] = rest_discriminator(name="sharktype")

    @overload
    def __init__(
        self,
        *,
        age: int,
    ): ...

    @overload
    def __init__(self, mapping: Mapping[str, Any]): ...

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.sharktype: Literal["saw"] = "saw"


def test_discriminator():
    input = {
        "age": 1,
        "kind": "salmon",
        "partner": {
            "age": 2,
            "kind": "shark",
            "sharktype": "saw",
        },
        "friends": [
            {
                "age": 2,
                "kind": "salmon",
                "partner": {
                    "age": 3,
                    "kind": "salmon",
                },
                "hate": {
                    "key1": {
                        "age": 4,
                        "kind": "salmon",
                    },
                    "key2": {
                        "age": 2,
                        "kind": "shark",
                        "sharktype": "goblin",
                    },
                },
            },
            {
                "age": 3,
                "kind": "shark",
                "sharktype": "goblin",
            },
        ],
        "hate": {
            "key3": {
                "age": 3,
                "kind": "shark",
                "sharktype": "saw",
            },
            "key4": {
                "age": 2,
                "kind": "salmon",
                "friends": [
                    {
                        "age": 1,
                        "kind": "salmon",
                    },
                    {
                        "age": 4,
                        "kind": "shark",
                        "sharktype": "goblin",
                    },
                ],
            },
        },
    }

    model = Salmon(input)
    assert model == input
    assert model.partner.age == 2
    assert model.partner == SawShark(age=2)
    assert model.friends[0].hate["key2"] == GoblinShark(age=2)


def test_body_bytes_format():
    assert json.dumps(bytes("test", "utf-8"), cls=SdkJSONEncoder) == '"dGVzdA=="'
    assert json.dumps(bytearray("test", "utf-8"), cls=SdkJSONEncoder) == '"dGVzdA=="'
    assert json.dumps(bytes("test", "utf-8"), cls=SdkJSONEncoder, format="base64") == '"dGVzdA=="'
    assert json.dumps(bytes("test", "utf-8"), cls=SdkJSONEncoder, format="base64url") == '"dGVzdA"'
    assert json.dumps(bytearray("test", "utf-8"), cls=SdkJSONEncoder, format="base64") == '"dGVzdA=="'
    assert json.dumps(bytearray("test", "utf-8"), cls=SdkJSONEncoder, format="base64url") == '"dGVzdA"'

    assert (
        json.dumps([bytes("test", "utf-8"), bytes("test", "utf-8")], cls=SdkJSONEncoder) == '["dGVzdA==", "dGVzdA=="]'
    )
    assert (
        json.dumps([bytearray("test", "utf-8"), bytearray("test", "utf-8")], cls=SdkJSONEncoder)
        == '["dGVzdA==", "dGVzdA=="]'
    )
    assert (
        json.dumps(
            [bytes("test", "utf-8"), bytes("test", "utf-8")],
            cls=SdkJSONEncoder,
            format="base64",
        )
        == '["dGVzdA==", "dGVzdA=="]'
    )
    assert (
        json.dumps(
            [bytes("test", "utf-8"), bytes("test", "utf-8")],
            cls=SdkJSONEncoder,
            format="base64url",
        )
        == '["dGVzdA", "dGVzdA"]'
    )
    assert (
        json.dumps(
            [bytearray("test", "utf-8"), bytearray("test", "utf-8")],
            cls=SdkJSONEncoder,
            format="base64",
        )
        == '["dGVzdA==", "dGVzdA=="]'
    )
    assert (
        json.dumps(
            [bytearray("test", "utf-8"), bytearray("test", "utf-8")],
            cls=SdkJSONEncoder,
            format="base64url",
        )
        == '["dGVzdA", "dGVzdA"]'
    )

    assert (
        json.dumps(
            {"a": bytes("test", "utf-8"), "b": bytes("test", "utf-8")},
            cls=SdkJSONEncoder,
        )
        == '{"a": "dGVzdA==", "b": "dGVzdA=="}'
    )
    assert (
        json.dumps(
            {"a": bytearray("test", "utf-8"), "b": bytearray("test", "utf-8")},
            cls=SdkJSONEncoder,
        )
        == '{"a": "dGVzdA==", "b": "dGVzdA=="}'
    )
    assert (
        json.dumps(
            {"a": bytes("test", "utf-8"), "b": bytes("test", "utf-8")},
            cls=SdkJSONEncoder,
            format="base64",
        )
        == '{"a": "dGVzdA==", "b": "dGVzdA=="}'
    )
    assert (
        json.dumps(
            {"a": bytes("test", "utf-8"), "b": bytes("test", "utf-8")},
            cls=SdkJSONEncoder,
            format="base64url",
        )
        == '{"a": "dGVzdA", "b": "dGVzdA"}'
    )
    assert (
        json.dumps(
            {"a": bytearray("test", "utf-8"), "b": bytearray("test", "utf-8")},
            cls=SdkJSONEncoder,
            format="base64",
        )
        == '{"a": "dGVzdA==", "b": "dGVzdA=="}'
    )
    assert (
        json.dumps(
            {"a": bytearray("test", "utf-8"), "b": bytearray("test", "utf-8")},
            cls=SdkJSONEncoder,
            format="base64url",
        )
        == '{"a": "dGVzdA", "b": "dGVzdA"}'
    )


def test_decimal_deserialization():
    class DecimalModel(Model):
        decimal_value: decimal.Decimal = rest_field(name="decimalValue")

        @overload
        def __init__(self, *, decimal_value: decimal.Decimal): ...

        @overload
        def __init__(self, mapping: Mapping[str, Any], /): ...

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    model = DecimalModel({"decimalValue": 0.33333})
    assert model["decimalValue"] == 0.33333
    assert model.decimal_value == decimal.Decimal("0.33333")

    class BaseModel(Model):
        my_prop: DecimalModel = rest_field(name="myProp")

    model = BaseModel({"myProp": {"decimalValue": 0.33333}})
    assert isinstance(model.my_prop, DecimalModel)
    assert model.my_prop["decimalValue"] == model["myProp"]["decimalValue"] == 0.33333
    assert model.my_prop.decimal_value == decimal.Decimal("0.33333")


def test_decimal_serialization():
    assert json.dumps(decimal.Decimal("0.33333"), cls=SdkJSONEncoder) == "0.33333"
    assert (
        json.dumps([decimal.Decimal("0.33333"), decimal.Decimal("0.33333")], cls=SdkJSONEncoder) == "[0.33333, 0.33333]"
    )
    assert (
        json.dumps(
            {"a": decimal.Decimal("0.33333"), "b": decimal.Decimal("0.33333")},
            cls=SdkJSONEncoder,
        )
        == '{"a": 0.33333, "b": 0.33333}'
    )


def test_int_as_str_deserialization():
    class IntAsStrModel(Model):
        int_as_str_value: int = rest_field(name="intAsStrValue", format="str")

    model = IntAsStrModel({"intAsStrValue": "123"})
    assert model["intAsStrValue"] == "123"
    assert model.int_as_str_value == 123

    class BaseModel(Model):
        my_prop: IntAsStrModel = rest_field(name="myProp")

    model = BaseModel({"myProp": {"intAsStrValue": "123"}})
    assert isinstance(model.my_prop, IntAsStrModel)
    assert model.my_prop["intAsStrValue"] == model["myProp"]["intAsStrValue"] == "123"
    assert model.my_prop.int_as_str_value == 123


def test_deserialize():
    expected = {"name": "name", "role": "role"}
    result = _deserialize(JSON, expected)
    assert result == expected


def test_enum_deserialization():
    class MyEnum(Enum):
        A = "a"
        B = "b"

    class ModelWithEnumProperty(Model):
        enum_property: Union[str, MyEnum] = rest_field(name="enumProperty")
        enum_property_optional: Optional[Union[str, MyEnum]] = rest_field(name="enumPropertyOptional")
        enum_property_optional_none: Optional[Union[str, MyEnum]] = rest_field(name="enumPropertyOptionalNone")

    raw_input = {
        "enumProperty": "a",
        "enumPropertyOptional": "b",
        "enumPropertyOptionalNone": None,
    }

    def check_func(target: ModelWithEnumProperty):
        assert target.enum_property == MyEnum.A
        assert target["enumProperty"] == "a"
        assert isinstance(target.enum_property, Enum)
        assert isinstance(target["enumProperty"], str)

        assert target.enum_property_optional == MyEnum.B
        assert target["enumPropertyOptional"] == "b"
        assert isinstance(target.enum_property_optional, Enum)
        assert isinstance(target["enumPropertyOptional"], str)

        assert target.enum_property_optional_none is None
        assert target["enumPropertyOptionalNone"] is None

    model = ModelWithEnumProperty(raw_input)
    check_func(model)

    result = _deserialize(List[ModelWithEnumProperty], [raw_input])
    for item in result:
        check_func(item)


def test_not_mutating_original_dict():
    class MyInnerModel(Model):
        property: str = rest_field()

    class MyModel(Model):
        property: MyInnerModel = rest_field()

    origin = {"property": {"property": "hello"}}

    dpg_model = MyModel(origin)
    assert dpg_model["property"]["property"] == "hello"

    origin["property"]["property"] = "world"
    assert dpg_model["property"]["property"] == "hello"


def test_model_init_io():
    class BytesModel(Model):
        property: bytes = rest_field()

    JPG = Path(__file__).parent.parent / "data/image.jpg"
    with open(JPG, "rb") as f:
        b = BytesModel({"property": f})
        assert b.property == f
        assert b["property"] == f
    with open(JPG, "rb") as f:
        b = BytesModel(property=f)
        assert b.property == f
        assert b["property"] == f


def test_additional_properties_serialization():
    value = {
        "name": "test",
        "modelProp": {"name": "test"},
        "stringProp": "string",
        "intProp": 1,
        "floatProp": 1.0,
        "boolProp": True,
        "listProp": [1, 2, 3],
        "dictProp": {"key": "value"},
        "noneProp": None,
        "datetimeProp": "2023-06-27T06:11:09Z",
        "durationProp": "P1D",
    }

    class NormalModel(Model):
        prop: str = rest_field(name="name")

    class AdditionalPropertiesModel(Model):
        name: str = rest_field(name="name")

    model = AdditionalPropertiesModel(name="test")
    prop = NormalModel(prop="test")
    model["modelProp"] = prop
    model["stringProp"] = "string"
    model["intProp"] = 1
    model["floatProp"] = 1.0
    model["boolProp"] = True
    model["listProp"] = [1, 2, 3]
    model["dictProp"] = {"key": "value"}
    model["noneProp"] = None
    model["datetimeProp"] = datetime.datetime(2023, 6, 27, 6, 11, 9, tzinfo=datetime.timezone.utc)
    model["durationProp"] = datetime.timedelta(days=1)

    assert json.loads(json.dumps(model, cls=SdkJSONEncoder)) == value
