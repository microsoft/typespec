# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import sys
import importlib


def main(namespace):
    sdk = importlib.import_module(namespace)
    return sdk._patch.__all__  # pylint: disable=protected-access


if __name__ == "__main__":
    patched = ",".join(main(sys.argv[1]))
    output_folder = sys.argv[2]
    with open(f"{output_folder}/.temp_folder/patched.txt", "w", encoding="utf-8-sig") as f:
        f.write(patched)
