from pathlib import Path
from types import SimpleNamespace
import sys
import tempfile
import unittest
from unittest.mock import patch

SETUP = Path(__file__).resolve().parents[2] / "eng" / "scripts" / "setup"
sys.path.insert(0, str(SETUP))
import package_manager

sys.path.remove(str(SETUP))


class PackageManagerTests(unittest.TestCase):
    def test_pinned_pip_meets_security_minimum(self):
        self.assertGreaterEqual(
            tuple(int(part) for part in package_manager.PIP_VERSION.split(".")),
            package_manager.MINIMUM_VERSIONS["pip"],
        )

    def test_uv_bootstraps_pinned_pip_in_target_environment(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "venv"
            with (
                patch.object(package_manager, "detect_package_manager", return_value="uv"),
                patch.object(package_manager.subprocess, "check_call") as create,
                patch.object(package_manager, "install_packages") as install,
            ):
                context = package_manager.create_venv_with_package_manager(path)

            create.assert_called_once_with(["uv", "venv", str(path)])
            install.assert_called_once_with(["pip==26.2.2"], context, package_manager="uv")
            self.assertEqual(
                package_manager.get_install_command("uv", context),
                ["uv", "pip", "install", "--python", context.env_exe],
            )

    def test_rejects_package_managers_below_security_minimum(self):
        for name, version in [("uv", "0.13.3"), ("pip", "24.0"), ("pip", "26.1.2")]:
            with self.subTest(name=name):

                def run(command, **kwargs):
                    if command[0] == "uv" and name == "pip":
                        raise FileNotFoundError()
                    return SimpleNamespace(stdout=f"{name} {version}\n")

                with patch.object(package_manager.subprocess, "run", side_effect=run):
                    with self.assertRaisesRegex(RuntimeError, "minimum"):
                        package_manager.detect_package_manager()

    def test_accepts_patched_versions(self):
        for name, version in [("uv", "0.13.4"), ("uv", "0.13.6"), ("pip", "26.2.2")]:
            with self.subTest(name=name, version=version):

                def run(command, **kwargs):
                    if command[0] == "uv" and name == "pip":
                        raise FileNotFoundError()
                    return SimpleNamespace(stdout=f"{name} {version}\n")

                with patch.object(package_manager.subprocess, "run", side_effect=run):
                    self.assertEqual(package_manager.detect_package_manager(), name)

    def test_rejects_unverifiable_versions(self):
        for version in ["uv unknown", "uv 0.13.4rc1"]:
            with self.subTest(version=version):
                with patch.object(package_manager.subprocess, "run", return_value=SimpleNamespace(stdout=version)):
                    with self.assertRaisesRegex(RuntimeError, "verify"):
                        package_manager.detect_package_manager()

    def test_checks_python_module_fallback_version(self):
        def run(command, **kwargs):
            if command[0] in ("uv", "pip"):
                raise FileNotFoundError()
            return SimpleNamespace(stdout="pip 26.1.2 from /example (python 3.12)\n")

        with patch.object(package_manager.subprocess, "run", side_effect=run):
            with self.assertRaisesRegex(RuntimeError, "minimum"):
                package_manager.detect_package_manager()

    def test_bootstraps_pinned_pip_with_validated_host_installer(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "venv"
            context = SimpleNamespace(env_exe="venv-python")
            with (
                patch.object(package_manager, "detect_package_manager", return_value="pip"),
                patch.object(package_manager, "ExtendedEnvBuilder") as builder,
                patch.object(package_manager, "install_packages") as install,
            ):
                builder.return_value.context = context
                self.assertIs(package_manager.create_venv_with_package_manager(path), context)

            builder.assert_called_once_with(with_pip=False)
            install.assert_called_once_with(["pip==26.2.2"], context, package_manager="pip")
            self.assertEqual(
                package_manager.get_install_command("pip", context),
                ["pip", "--python", "venv-python", "install"],
            )


if __name__ == "__main__":
    unittest.main()
