#!/usr/bin/env python

# --------------------------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.
# --------------------------------------------------------------------------------------------

# This script is used to execute sphinx documentation build within a tox environment.
# It uses a central sphinx configuration and validates docstrings by running sphinx-build.

from subprocess import check_call, CalledProcessError
import os
import logging
import sys
from pathlib import Path
from util import run_check

logging.getLogger().setLevel(logging.INFO)

# Get the central Sphinx config directory
SPHINX_CONF_DIR = os.path.abspath(os.path.dirname(__file__))


def _create_minimal_index_rst(docs_dir, package_name, module_names):
    """Create a minimal index.rst file for sphinx to process."""
    index_rst_content = f"""{package_name}
{"=" * len(package_name)}

"""

    for module_name in module_names:
        index_rst_content += f"""
{module_name}
{"-" * len(module_name)}

.. automodule:: {module_name}
   :members:
   :undoc-members:
   :show-inheritance:

"""

    index_rst_path = docs_dir / "index.rst"
    with open(index_rst_path, "w") as f:
        f.write(index_rst_content)


def _single_dir_sphinx(mod):
    """Run sphinx-build on a single package directory."""

    # Find the actual Python package directories
    package_dirs = [
        d for d in mod.iterdir() if d.is_dir() and not d.name.startswith("_") and (d / "__init__.py").exists()
    ]

    if not package_dirs:
        logging.info(f"No Python package found in {mod}, skipping sphinx build")
        return True

    # Get the main package directory
    main_package = package_dirs[0]

    # Find submodules
    module_names = []
    for item in main_package.iterdir():
        if item.is_dir() and (item / "__init__.py").exists():
            module_names.append(f"{main_package.name}.{item.name}")

    # If no submodules, just use the main package
    if not module_names:
        module_names = [main_package.name]

    # Create docs directory structure
    docs_dir = mod / "docs"
    docs_dir.mkdir(exist_ok=True)

    # Create index.rst with the correct module names
    _create_minimal_index_rst(docs_dir, mod.stem, module_names)

    # Set up output directory
    output_dir = mod / "_build" / "html"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Add the package to sys.path so sphinx can import it
    sys.path.insert(0, str(mod.absolute()))

    try:
        result = check_call(
            [
                sys.executable,
                "-m",
                "sphinx",
                "-b",
                "html",  # Build HTML output
                "-c",
                SPHINX_CONF_DIR,  # Use central config
                "-W",  # Treat warnings as errors
                "--keep-going",  # Continue to get all errors
                "-E",  # Don't use cached environment
                "-q",  # Quiet mode (only show warnings/errors)
                str(docs_dir.absolute()),  # Source directory
                str(output_dir.absolute()),  # Output directory
            ]
        )
        logging.info(f"Sphinx build completed successfully for {mod.stem}")
        return True
    except CalledProcessError as e:
        logging.error(f"{mod.stem} exited with sphinx build error {e.returncode}")
        return False
    finally:
        # Remove from sys.path
        if str(mod.absolute()) in sys.path:
            sys.path.remove(str(mod.absolute()))


if __name__ == "__main__":
    run_check("sphinx", _single_dir_sphinx, "Sphinx documentation build")
