import importlib.util
import io
import json
from pathlib import Path
from types import SimpleNamespace
import sys
import tempfile
import unittest
from unittest.mock import patch

SETUP = Path(__file__).resolve().parents[2] / "eng" / "scripts" / "setup"
sys.path.insert(0, str(SETUP))
spec = importlib.util.spec_from_file_location("build_pygen_wheel", SETUP / "build_pygen_wheel.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
sys.path.remove(str(SETUP))


class BrowserWheelTests(unittest.TestCase):
    def test_missing_generator_wheel_reports_build_prerequisite(self):
        with tempfile.TemporaryDirectory() as directory:
            dist = Path(directory) / "generator" / "dist"
            (Path(directory) / "package.json").write_text(json.dumps({"dependencies": {"pyodide": "314.0.7"}}))
            lock = {"packages": {"pyyaml": {}, "markupsafe": {}}}
            with (
                patch.object(builder, "_ROOT_DIR", Path(directory)),
                patch.object(builder, "urlopen", return_value=io.BytesIO(json.dumps(lock).encode())) as fetch,
            ):
                with self.assertRaisesRegex(RuntimeError, "Generator wheel not found") as error:
                    builder.build_browser_wheels(SimpleNamespace(env_exe="python"))

            self.assertIn(str(dist), str(error.exception))
            fetch.assert_not_called()

    def test_regular_build_skips_browser_dependencies(self):
        context = SimpleNamespace(env_exe="python")
        with (
            patch.object(builder, "create_venv_with_package_manager", return_value=context),
            patch.object(builder, "install_packages") as install,
            patch.object(builder, "python_run") as run,
            patch.object(builder, "build_browser_wheels") as browser,
        ):
            builder.main()

        install.assert_called_once_with(["build"], context)
        run.assert_called_once_with(context, "build", ["--wheel"], additional_dir="generator")
        browser.assert_not_called()

    def test_playground_build_prepares_browser_dependencies(self):
        context = SimpleNamespace(env_exe="python")
        with (
            patch.object(builder, "create_venv_with_package_manager", return_value=context),
            patch.object(builder, "install_packages") as install,
            patch.object(builder, "python_run") as run,
            patch.object(builder, "build_browser_wheels") as browser,
        ):
            builder.main(playground=True)

        install.assert_called_once_with(["build"], context)
        run.assert_called_once_with(context, "build", ["--wheel"], additional_dir="generator")
        browser.assert_called_once_with(context)

    def test_resolves_for_pyodide_and_publishes_only_pure_python_wheels(self):
        native = [
            {"name": "PyYAML", "version": "6.0.3", "file_name": "pyyaml-6.0.3-cp314-cp314-pyodide_2026_0_wasm32.whl"},
            {
                "name": "MarkupSafe",
                "version": "3.0.3",
                "file_name": "markupsafe-3.0.3-cp314-cp314-pyodide_2026_0_wasm32.whl",
            },
        ]
        lock = {"info": {"python": "3.14.2"}, "packages": dict(zip(("pyyaml", "markupsafe"), native))}
        lock["packages"].update(
            {
                "jinja2": {"name": "Jinja2", "version": "3.1.6", "file_name": "jinja2-3.1.6-py3-none-any.whl"},
                "tomli": {"name": "tomli", "version": "2.4.1", "file_name": "tomli-2.4.1-py3-none-any.whl"},
            }
        )
        pure = ["pygen-0.1.0-py3-none-any.whl", "black-26.3.1-py3-none-any.whl"]
        pure.append("tomli-2.0.1-py3-none-any.whl")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "package.json").write_text(json.dumps({"dependencies": {"pyodide": "314.0.7"}}))
            dist = root / "generator" / "dist"
            dist.mkdir(parents=True)
            (dist / pure[0]).touch()

            def download(command, *, env, check):
                self.assertTrue(check)
                self.assertEqual(command[command.index("--python-version") + 1], "3.14.2")
                self.assertEqual(command[command.index("--platform") + 1], "pyodide_2026_0_wasm32")
                self.assertEqual(command[command.index("--abi") + 1], "cp314")
                self.assertEqual(env["PIP_INDEX_URL"], "https://example.com/authenticated-feed/")
                self.assertEqual(
                    Path(command[command.index("--constraint") + 1]).read_text(),
                    "PyYAML==6.0.3\nMarkupSafe==3.0.3\nplatformdirs==4.3.8\n",
                )
                staging = Path(command[command.index("--dest") + 1])
                for filename in pure + [p["file_name"] for p in native] + ["jinja2-3.1.6-py3-none-any.whl"]:
                    (staging / filename).touch()

            with (
                patch.object(builder, "_ROOT_DIR", root),
                patch.object(builder, "urlopen", return_value=io.BytesIO(json.dumps(lock).encode())),
                patch.object(builder.subprocess, "run", side_effect=download),
                patch.dict(builder.os.environ, {"PIP_INDEX_URL": "https://example.com/authenticated-feed/"}),
            ):
                builder.build_browser_wheels(SimpleNamespace(env_exe="python"))

            manifest = json.loads((dist / "browser" / "manifest.json").read_text())
            self.assertEqual(manifest["wheels"], sorted(pure))
            self.assertEqual(manifest["packages"], ["jinja2", "markupsafe", "pyyaml"])
            self.assertEqual(sorted(p.name for p in (dist / "browser").glob("*.whl")), sorted(pure))


if __name__ == "__main__":
    unittest.main()
