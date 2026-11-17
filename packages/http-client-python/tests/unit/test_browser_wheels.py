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
                patch.object(builder, "load_vendored_wheels") as load_wheels,
            ):
                with self.assertRaisesRegex(RuntimeError, "Generator wheel not found") as error:
                    builder.build_browser_wheels()

            self.assertIn(str(dist), str(error.exception))
            load_wheels.assert_not_called()

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

    def test_regular_build_skips_browser_dependencies(self):
        context = SimpleNamespace(env_exe="python")
        with (
            patch.object(builder, "create_venv_with_package_manager", return_value=context),
            patch.object(builder, "install_packages") as install,
            patch.object(builder, "python_run") as run,
            patch.object(builder, "build_browser_wheels") as browser,
            patch.object(builder, "update_vendored_wheels") as update,
        ):
            builder.main()

        install.assert_called_once_with(["build"], context)
        run.assert_called_once_with(context, "build", ["--wheel"], additional_dir="generator")
        browser.assert_not_called()
        update.assert_not_called()

    def test_playground_build_uses_vendored_wheels_without_package_downloads(self):
        context = SimpleNamespace(env_exe="python")
        with (
            patch.object(builder, "create_venv_with_package_manager", return_value=context),
            patch.object(builder, "install_packages") as install,
            patch.object(builder, "python_run") as run,
            patch.object(builder, "build_browser_wheels") as browser,
            patch.object(builder, "update_vendored_wheels") as update,
        ):
            builder.main(playground=True)

        install.assert_called_once_with(["build"], context)
        run.assert_called_once_with(context, "build", ["--wheel"], additional_dir="generator")
        browser.assert_called_once_with()
        update.assert_not_called()

    def test_uv_wheel_refresh_seeds_pip_before_updating_vendored_wheels(self):
        with (
            tempfile.TemporaryDirectory() as directory,
            patch.object(builder, "_ROOT_DIR", Path(directory)),
            patch("package_manager.detect_package_manager", return_value="uv"),
            patch.object(builder.subprocess, "check_call") as create,
            patch.object(builder.subprocess, "run", return_value=SimpleNamespace(returncode=0)) as install,
            patch.object(builder, "python_run") as build,
            patch.object(builder, "update_vendored_wheels") as update,
            patch.object(builder, "build_browser_wheels") as browser,
        ):
            steps = Mock()
            steps.attach_mock(install, "install")
            steps.attach_mock(build, "build")
            steps.attach_mock(update, "update")
            steps.attach_mock(browser, "browser")

            builder.main(update_browser_wheels=True)

            context = update.call_args.args[0]
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
                    call.update(context),
                    call.browser(),
                ],
            )

    def _write_wheel(self, directory, filename, name, version, requires=()):
        path = directory / filename
        metadata = f"Metadata-Version: 2.1\nName: {name}\nVersion: {version}\n"
        metadata += "".join(f"Requires-Dist: {requirement}\n" for requirement in requires)
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr(f"{name}-{version}.dist-info/METADATA", metadata)
        return path

    def _browser_project(self, root):
        (root / "package.json").write_text(json.dumps({"dependencies": {"pyodide": "0.26.2"}}))
        dist = root / "generator" / "dist"
        dist.mkdir(parents=True)
        self._write_wheel(
            dist,
            "pygen-0.1.0-py3-none-any.whl",
            "pygen",
            "0.1.0",
            ["Jinja2==3.1.6", "PyYAML==6.0.1", 'tomli>=1; python_version < "3.11"'],
        )
        vendor = root / "eng" / "playground-wheels"
        vendor.mkdir(parents=True)
        wheels = [
            self._write_wheel(vendor, "jinja2-3.1.6-py3-none-any.whl", "Jinja2", "3.1.6", ["MarkupSafe>=2.0"]),
            self._write_wheel(vendor, "PyYAML-6.0.1-cp312-cp312-pyodide_2024_0_wasm32.whl", "PyYAML", "6.0.1"),
            self._write_wheel(vendor, "MarkupSafe-2.1.5-cp312-cp312-pyodide_2024_0_wasm32.whl", "MarkupSafe", "2.1.5"),
        ]
        hashes = {wheel.name: builder._sha256(wheel) for wheel in wheels}
        (vendor / "wheels.json").write_text(json.dumps({"wheels": hashes}))
        lock = {
            "info": {"python": "3.12.1"},
            "packages": {
                "pyyaml": {"file_name": wheels[1].name, "sha256": hashes[wheels[1].name]},
                "markupsafe": {"file_name": wheels[2].name, "sha256": hashes[wheels[2].name]},
            },
        }
        return dist, vendor, lock

    def test_playground_bundle_contains_vendored_python_and_pyodide_wheels(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dist, vendor, lock = self._browser_project(root)
            browser = dist / "browser"
            browser.mkdir()
            (browser / "stale.whl").touch()
            with (
                patch.object(builder, "_ROOT_DIR", root),
                patch.object(builder, "load_pyodide_lock", return_value=lock),
                patch.object(builder.subprocess, "run", side_effect=AssertionError("unexpected package download")),
                patch.object(urllib.request, "urlopen", side_effect=AssertionError("unexpected network access")),
            ):
                builder.build_browser_wheels()

            expected = sorted(
                [*json.loads((vendor / "wheels.json").read_text())["wheels"], "pygen-0.1.0-py3-none-any.whl"]
            )
            self.assertEqual(json.loads((browser / "manifest.json").read_text()), {"wheels": expected})
            self.assertEqual(sorted(p.name for p in browser.glob("*.whl")), expected)

    def test_playground_bundle_rejects_unverified_or_incomplete_vendored_wheels(self):
        cases = [
            (
                "changed hash",
                lambda vendor, lock: (vendor / "jinja2-3.1.6-py3-none-any.whl").write_bytes(b"changed"),
                "sha256",
            ),
            (
                "runtime mismatch",
                lambda vendor, lock: lock["packages"]["pyyaml"].update(sha256="0" * 64),
                "does not match pinned Pyodide package",
            ),
            (
                "missing dependency",
                lambda vendor, lock: self._remove_vendored(vendor, "jinja2-3.1.6-py3-none-any.whl"),
                "missing Jinja2==3.1.6",
            ),
        ]
        for name, mutate, message in cases:
            with self.subTest(name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                _, vendor, lock = self._browser_project(root)
                mutate(vendor, lock)
                with (
                    patch.object(builder, "_ROOT_DIR", root),
                    patch.object(builder, "load_pyodide_lock", return_value=lock),
                ):
                    with self.assertRaisesRegex(RuntimeError, message):
                        builder.build_browser_wheels()

    def _remove_vendored(self, vendor, filename):
        (vendor / filename).unlink()
        lock_path = vendor / "wheels.json"
        wheels = json.loads(lock_path.read_text())["wheels"]
        del wheels[filename]
        lock_path.write_text(json.dumps({"wheels": wheels}))

    def test_vendored_wheels_satisfy_current_generator_and_pyodide(self):
        package = Path(builder.__file__).resolve().parents[3]
        generator = next((package / "generator" / "dist").glob("pygen-*.whl"), None)
        if generator is None:
            self.skipTest("Build the generator wheel to validate vendored browser dependencies.")
        builder.validate_browser_wheels(generator, builder.load_vendored_wheels(), builder.load_pyodide_lock())


if __name__ == "__main__":
    unittest.main()
