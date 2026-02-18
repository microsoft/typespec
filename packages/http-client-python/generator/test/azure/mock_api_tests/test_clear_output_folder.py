# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from pathlib import Path

GENERATED_PATH = Path(__file__).parent.parent.resolve() / "generated"


def test_clear_output_folder():
    folder = GENERATED_PATH / "authentication-api-key/authentication/apikey/_operations"
    assert folder.exists(), "Operations folder should exist"
    assert not (folder / "to_be_deleted.py").exists(), "File to_be_deleted.py should be deleted after regeneration"

    if (GENERATED_PATH / "generation-subdir").exists():
        assert (GENERATED_PATH / "generation-subdir/generated_tests").exists()
        assert not (GENERATED_PATH / "generation-subdir/generated_tests/to_be_deleted.py").exists()

        assert (GENERATED_PATH / "generation-subdir/generation/subdir/_generated").exists()
        assert not (GENERATED_PATH / "generation-subdir/generation/subdir/_generated/to_be_deleted.py").exists()

        assert (GENERATED_PATH / "generation-subdir/generation/subdir/to_be_kept.py").exists()
