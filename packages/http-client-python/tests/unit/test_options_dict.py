# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

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
