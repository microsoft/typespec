import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tarfile
from types import SimpleNamespace
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

SETUP = Path(__file__).resolve().parents[2] / "eng" / "scripts" / "setup"
sys.path.insert(0, str(SETUP))
spec = importlib.util.spec_from_file_location("build_pygen_wheel_feed", SETUP / "build_pygen_wheel.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
sys.path.remove(str(SETUP))


class BrowserFeedTests(unittest.TestCase):
    def test_reads_pinned_pyodide_lock_from_hoisted_npm_package(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "packages" / "emitter"
            root.mkdir(parents=True)
            (root / "package.json").write_text(json.dumps({"dependencies": {"pyodide": "0.26.2"}}))
            package = Path(directory) / "node_modules" / "pyodide"
            package.mkdir(parents=True)
            (package / "package.json").write_text(json.dumps({"version": "0.26.2"}))
            (package / "pyodide-lock.json").write_text(json.dumps({"info": {"python": "3.12.1"}}))
            with patch.object(builder, "_ROOT_DIR", root):
                self.assertEqual(builder.load_pyodide_lock()["info"]["python"], "3.12.1")
                (package / "package.json").write_text(json.dumps({"version": "0.27.0"}))
                with self.assertRaisesRegex(RuntimeError, "does not match pinned version"):
                    builder.load_pyodide_lock()

    def test_downloads_only_hash_pinned_packages_from_configured_feed(self):
        context = SimpleNamespace(env_exe="python")
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(builder.subprocess, "run") as run:
                builder.download_browser_requirements(context, Path(directory), {"info": {"python": "3.12.1"}})
        command = run.call_args.args[0]
        self.assertIn("--require-hashes", command)
        self.assertIn("--no-deps", command)
        self.assertIn("--no-binary=pyyaml,markupsafe", command)
        self.assertNotIn("cdn.jsdelivr.net", " ".join(command))
        self.assertTrue(run.call_args.kwargs["check"])

    def test_rejects_non_universal_wheels(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "unsafe-1.0-cp312-cp312-linux_x86_64.whl"
            path.touch()
            with self.assertRaisesRegex(RuntimeError, "Unsupported browser wheel"):
                builder.check_pure_wheels(Path(directory))

    def test_rejects_native_content_in_a_pure_wheel(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "unsafe-1.0-py3-none-any.whl"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("unsafe/native.so", b"native")
            with self.assertRaisesRegex(RuntimeError, "Unsupported browser wheel contents"):
                builder.check_pure_wheels(Path(directory))

    def test_download_failure_preserves_existing_bundle(self):
        context = SimpleNamespace(env_exe="python")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dist = root / "generator" / "dist"
            browser = dist / "browser"
            browser.mkdir(parents=True)
            (dist / "pygen-0.1.0-py3-none-any.whl").touch()
            (browser / "manifest.json").write_text("previous")
            with (
                patch.object(builder, "_ROOT_DIR", root),
                patch.object(builder, "load_pyodide_lock", return_value={"info": {"python": "3.12.1"}}),
                patch.object(
                    builder, "download_browser_requirements", side_effect=subprocess.CalledProcessError(1, "pip")
                ),
            ):
                with self.assertRaises(subprocess.CalledProcessError):
                    builder.build_browser_wheels(context)
            self.assertEqual((browser / "manifest.json").read_text(), "previous")

    def test_rejects_unsafe_source_archive_paths(self):
        for name in ("../escape", "package/../../escape", "package\\..\\escape", "C:/escape"):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                archive = root / "package.tar.gz"
                with tarfile.open(archive, "w:gz") as tar:
                    member = tarfile.TarInfo(name)
                    member.size = 1
                    tar.addfile(member, io.BytesIO(b"x"))
                with self.assertRaisesRegex(RuntimeError, "Unsafe source archive"):
                    builder.extract_source(archive, root / "output")

    def test_playground_build_installs_wheel_build_tools(self):
        context = SimpleNamespace(env_exe="python")
        with (
            patch.object(builder, "create_venv_with_package_manager", return_value=context),
            patch.object(builder, "install_packages") as install,
            patch.object(builder, "python_run"),
            patch.object(builder, "build_browser_wheels") as browser,
        ):
            builder.main(playground=True)
        install.assert_called_once_with(["build", "wheel", "setuptools==83.0.0", "pip==26.2.2"], context)
        browser.assert_called_once_with(context)

    def test_regular_build_does_not_download_browser_dependencies(self):
        context = SimpleNamespace(env_exe="python")
        with (
            patch.object(builder, "create_venv_with_package_manager", return_value=context),
            patch.object(builder, "install_packages"),
            patch.object(builder, "python_run"),
            patch.object(builder, "build_browser_wheels") as browser,
        ):
            builder.main()
        browser.assert_not_called()


if __name__ == "__main__":
    unittest.main()
