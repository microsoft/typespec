# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

from pygen.codegen.models import CodeModel, DPGModelType


def get_code_model():
    return CodeModel(
        {
            "clients": [
                {
                    "name": "client",
                    "namespace": "blah",
                    "moduleName": "blah",
                    "parameters": [],
                    "url": "",
                    "operationGroups": [],
                }
            ],
            "namespace": "namespace",
        },
        options={
            "show-send-request": True,
            "builders-visibility": "public",
            "show-operations": True,
            "models-mode": "dpg",
        },
    )


def get_object_schema(name, base_models):
    return DPGModelType(
        yaml_data={"name": name, "type": "model", "snakeCaseName": name},
        code_model=get_code_model(),
        parents=base_models,
    )


def test_pet_cat_kitten_horse_wood():
    """Horse -> Pet <- Cat <- Kitten, Wood"""
    code_model = get_code_model()
    pet = get_object_schema("Pet", None)
    horse = get_object_schema("Horse", [pet])
    cat = get_object_schema("Cat", [pet])
    kitten = get_object_schema("Kitten", [cat])
    wood = get_object_schema("Wood", None)
    code_model.model_types = [wood, horse, cat, pet, kitten]
    code_model.sort_model_types()
    sorted_model_types = code_model.model_types
    # assert pet is before cat
    assert sorted_model_types.index(pet) < sorted_model_types.index(cat)
    # assert pet is before horse
    assert sorted_model_types.index(pet) < sorted_model_types.index(horse)
    # assert cat is before kitten
    assert sorted_model_types.index(cat) < sorted_model_types.index(kitten)
    # assert wood in list
    assert wood in sorted_model_types


def test_multiple_inheritance():
    """CarbonObject <- Person <- Teacher -> Employee, Person <- Kid
    |
    ObjectOnEarth
    """
    code_model = get_code_model()
    carbon_object = get_object_schema("CarbonObject", [])
    object_on_earth = get_object_schema("ObjectOnEarth", [])
    person = get_object_schema("Person", [carbon_object, object_on_earth])
    employee = get_object_schema("Employee", [])
    teacher = get_object_schema("Teacher", [person, employee])
    kid = get_object_schema("Kid", [person])

    code_model.model_types = [
        kid,
        person,
        teacher,
        carbon_object,
        employee,
        object_on_earth,
    ]
    code_model.sort_model_types()
    sorted_model_types = code_model.model_types
    # assert carbon object and object on earth is in front of person
    assert sorted_model_types.index(carbon_object) < sorted_model_types.index(person)
    assert sorted_model_types.index(object_on_earth) < sorted_model_types.index(person)
    # assert person and employee are in front of teacher
    assert sorted_model_types.index(person) < sorted_model_types.index(teacher)
    assert sorted_model_types.index(employee) < sorted_model_types.index(teacher)
    # assert person is before kid
    assert sorted_model_types.index(person) < sorted_model_types.index(kid)
