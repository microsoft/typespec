# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

import pytest

from pygen import OptionsDict


def test_models_mode_none_normalized_via_constructor():
    # models-mode=none must be normalized to falsy False, even when passed
    # through the constructor (not just __setitem__).
    assert OptionsDict({"models-mode": "none"})["models-mode"] is False


def test_models_mode_none_normalized_via_setitem():
    options = OptionsDict()
    options["models-mode"] = "none"
    assert options["models-mode"] is False


def test_constructor_and_setitem_agree():
    via_ctor = OptionsDict({"models-mode": "none"})["models-mode"]
    options = OptionsDict()
    options["models-mode"] = "none"
    via_setitem = options["models-mode"]
    assert via_ctor == via_setitem


def test_generate_typeddict_defaults_to_true():
    assert OptionsDict()["generate-typeddict"] is True


def test_generate_typeddict_can_be_disabled():
    assert OptionsDict({"generate-typeddict": False})["generate-typeddict"] is False


def test_models_mode_none_with_tsp_generates_typeddict_by_default():
    # For TypeSpec input, models-mode=none keeps TypedDict generation on by
    # default. Internally models-mode stays 'none' (falsy); TypedDict-only
    # generation is expressed via generate_typeddict_only.
    options = OptionsDict({"models-mode": "none", "tsp_file": "main.tsp"})
    assert options["models-mode"] is False
    assert options.generate_typeddict_only is True


def test_models_mode_none_with_tsp_and_generate_typeddict_false_is_nothing():
    # Opting out of TypedDicts on top of models-mode=none produces no models.
    options = OptionsDict({"models-mode": "none", "tsp_file": "main.tsp", "generate-typeddict": False})
    assert options["models-mode"] is False
    assert options.generate_typeddict_only is False


def test_models_mode_none_without_tsp_stays_false():
    # Swagger input: models-mode=none must remain "no models", untouched by the
    # generate-typeddict default.
    assert OptionsDict({"models-mode": "none"})["models-mode"] is False


def test_models_mode_dpg_with_tsp_is_unchanged():
    options = OptionsDict({"models-mode": "dpg", "tsp_file": "main.tsp"})
    assert options["models-mode"] == "dpg"


def test_models_mode_typeddict_is_deprecated_but_accepted(caplog):
    import logging

    with caplog.at_level(logging.WARNING):
        options = OptionsDict({"models-mode": "typeddict", "tsp_file": "main.tsp"})
    # Deprecated 'typeddict' is normalized to 'none' (falsy) with TypedDict
    # generation on, i.e. represented via generate_typeddict_only.
    assert options["models-mode"] is False
    assert options["generate-typeddict"] is True
    assert options.generate_typeddict_only is True
    assert any("deprecated" in record.getMessage() for record in caplog.records)


def test_package_mode_validation_uses_from_typespec_from_constructor_any_order():
    with pytest.raises(ValueError):
        OptionsDict({"from-typespec": True, "package-mode": "dataplane", "package-version": "1.0.0"})

    with pytest.raises(ValueError):
        OptionsDict({"package-mode": "dataplane", "from-typespec": True, "package-version": "1.0.0"})


def test_package_mode_typespec_value_succeeds_in_any_constructor_order():
    assert (
        OptionsDict({"from-typespec": True, "package-mode": "azure-dataplane", "package-version": "1.0.0"})[
            "package-mode"
        ]
        == "azure-dataplane"
    )
    assert (
        OptionsDict({"package-mode": "azure-dataplane", "from-typespec": True, "package-version": "1.0.0"})[
            "package-mode"
        ]
        == "azure-dataplane"
    )
