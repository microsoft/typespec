import importlib.util
import json
from pathlib import Path
import shutil
from types import SimpleNamespace
import sys
import tempfile
import unittest
from unittest.mock import Mock, call, patch
import urllib.request
import zipfile

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
            with (
                patch.object(builder, "_ROOT_DIR", Path(directory)),
                patch.object(builder, "load_pyodide_lock") as load_lock,
            ):
                with self.assertRaisesRegex(RuntimeError, "Generator wheel not found") as error:
                    builder.build_browser_wheels(SimpleNamespace(env_exe="python"))

            self.assertIn(str(dist), str(error.exception))
            load_lock.assert_not_called()

    def test_reads_pyodide_lock_from_pinned_npm_dependency(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            root = workspace / "packages" / "http-client-python"
            root.mkdir(parents=True)
            (root / "package.json").write_text(json.dumps({"dependencies": {"pyodide": "0.26.2"}}))
            # Hoisted installs place the dependency above the package root.
            pyodide = workspace / "node_modules" / "pyodide"
            pyodide.mkdir(parents=True)
            (pyodide / "package.json").write_text(json.dumps({"version": "0.26.2"}))
            (pyodide / "pyodide-lock.json").write_text(json.dumps({"info": {"python": "3.12.1"}}))
            with patch.object(builder, "_ROOT_DIR", root):
                self.assertEqual(builder.load_pyodide_lock(), {"info": {"python": "3.12.1"}})

                (pyodide / "package.json").write_text(json.dumps({"version": "0.27.0"}))
                with self.assertRaisesRegex(RuntimeError, "does not match pinned version 0.26.2"):
                    builder.load_pyodide_lock()

                shutil.rmtree(pyodide)
                with self.assertRaisesRegex(RuntimeError, "pyodide npm package not found"):
                    builder.load_pyodide_lock()

    def test_placeholder_wheel_is_installable_metadata_for_pip(self):
        package = {
            "name": "MarkupSafe",
            "version": "2.1.5",
            "file_name": "MarkupSafe-2.1.5-cp312-cp312-pyodide_2024_0_wasm32.whl",
            "depends": [],
        }
        with tempfile.TemporaryDirectory() as directory:
            builder.write_placeholder_wheel(Path(directory), package)
            with zipfile.ZipFile(Path(directory) / package["file_name"]) as archive:
                self.assertEqual(
                    sorted(archive.namelist()),
                    [f"MarkupSafe-2.1.5.dist-info/{name}" for name in ("METADATA", "RECORD", "WHEEL")],
                )
                self.assertIn(
                    "Name: MarkupSafe\nVersion: 2.1.5\n", archive.read("MarkupSafe-2.1.5.dist-info/METADATA").decode()
                )
                self.assertIn(
                    "Tag: cp312-cp312-pyodide_2024_0_wasm32\n",
                    archive.read("MarkupSafe-2.1.5.dist-info/WHEEL").decode(),
                )

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

        install.assert_called_once_with(["build", "pip==26.2.2"], context)
        run.assert_called_once_with(context, "build", ["--wheel"], additional_dir="generator")
        browser.assert_called_once_with(context)

    def test_uv_playground_build_seeds_pip_before_preparing_browser_wheels(self):
        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(builder, "_ROOT_DIR", Path(directory)),
            patch("package_manager.detect_package_manager", return_value="uv"),
            patch.object(builder.subprocess, "check_call") as create,
            patch.object(builder.subprocess, "run", return_value=SimpleNamespace(returncode=0)) as install,
            patch.object(builder, "python_run") as build,
            patch.object(builder, "build_browser_wheels") as browser,
        ):
            steps = Mock()
            steps.attach_mock(install, "install")
            steps.attach_mock(build, "build")
            steps.attach_mock(browser, "browser")

            builder.main(playground=True)

            context = browser.call_args.args[0]
            create.assert_called_once_with(["uv", "venv", str(Path(directory) / "venv_build_wheel")])
            self.assertEqual(
                steps.mock_calls,
                [
                    call.install(
                        ["uv", "pip", "install", "--python", context.env_exe, "build", "pip==26.2.2"],
                        capture_output=True,
                        text=True,
                    ),
                    call.build(context, "build", ["--wheel"], additional_dir="generator"),
                    call.browser(context),
                ],
            )

    def test_resolves_for_pyodide_and_publishes_only_pure_python_wheels(self):
        native = [
            {"name": "PyYAML", "version": "6.0.1", "file_name": "PyYAML-6.0.1-cp312-cp312-pyodide_2024_0_wasm32.whl"},
            {
                "name": "MarkupSafe",
                "version": "2.1.5",
                "file_name": "MarkupSafe-2.1.5-cp312-cp312-pyodide_2024_0_wasm32.whl",
            },
        ]
        lock = {"info": {"python": "3.12.1"}, "packages": dict(zip(("pyyaml", "markupsafe"), native))}
        pure = ["pygen-0.1.0-py3-none-any.whl", "black-26.3.1-py3-none-any.whl"]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "package.json").write_text(json.dumps({"dependencies": {"pyodide": "0.26.2"}}))
            dist = root / "generator" / "dist"
            dist.mkdir(parents=True)
            (dist / pure[0]).touch()
            browser = dist / "browser"
            browser.mkdir()
            (browser / "stale.whl").touch()
            unexpected_native = None

            def download(command, *, env, check):
                self.assertTrue(check)
                self.assertIn("--python-version=3.12.1", command)
                self.assertIn("--platform=pyodide_2024_0_wasm32", command)
                self.assertIn("--abi=cp312", command)
                self.assertEqual(env["PIP_INDEX_URL"], "https://example.com/authenticated-feed/")
                self.assertIn("platformdirs==4.3.8", command)
                self.assertFalse([arg for arg in command if "jsdelivr" in arg or arg.startswith("https://")])
                links = Path(
                    next(arg.removeprefix("--find-links=") for arg in command if arg.startswith("--find-links="))
                )
                for package in native:
                    self.assertIn(f"{package['name']}=={package['version']}", command)
                    self.assertTrue((links / package["file_name"]).is_file())
                staging = Path(next(arg.removeprefix("--dest=") for arg in command if arg.startswith("--dest=")))
                staging.mkdir()
                for filename in pure + [p["file_name"] for p in native]:
                    (staging / filename).touch()
                if unexpected_native:
                    (staging / unexpected_native).touch()

            with (
                patch.object(builder, "_ROOT_DIR", root),
                patch.object(builder, "load_pyodide_lock", return_value=lock),
                patch.object(builder.subprocess, "run", side_effect=download),
                patch.object(urllib.request, "urlopen", side_effect=AssertionError("unexpected network access")),
                patch.dict(builder.os.environ, {"PIP_INDEX_URL": "https://example.com/authenticated-feed/"}),
            ):
                builder.build_browser_wheels(SimpleNamespace(env_exe="python"))
                manifest_before_failure = (browser / "manifest.json").read_text()
                unexpected_native = "unsupported-1.0-cp312-cp312-pyodide_2024_0_wasm32.whl"
                with self.assertRaisesRegex(
                    RuntimeError, f"Unsupported native browser dependencies: {unexpected_native}"
                ):
                    builder.build_browser_wheels(SimpleNamespace(env_exe="python"))
                self.assertEqual((browser / "manifest.json").read_text(), manifest_before_failure)

            manifest = json.loads((dist / "browser" / "manifest.json").read_text())
            self.assertEqual(manifest["wheels"], sorted(pure))
            self.assertEqual(set(manifest), {"wheels"})
            self.assertEqual(sorted(p.name for p in (dist / "browser").glob("*.whl")), sorted(pure))


if __name__ == "__main__":
    unittest.main()
