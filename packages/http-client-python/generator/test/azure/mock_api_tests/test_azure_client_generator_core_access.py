# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.clientgenerator.core.access import AccessClient
from specs.azure.clientgenerator.core.access import models


@pytest.fixture
def client():
    with AccessClient() as client:
        yield client


def test_no_decorator_in_public(client: AccessClient):
    result = client.public_operation.no_decorator_in_public(name="sample")
    assert result == models.NoDecoratorModelInPublic(name="sample")


def test_public_decorator_in_public(client: AccessClient):
    result = client.public_operation.public_decorator_in_public(name="sample")
    assert result == models.PublicDecoratorModelInPublic(name="sample")


def test_no_decorator_in_internal(client: AccessClient):
    result = client.internal_operation._no_decorator_in_internal(name="sample")
    assert result == models._models.NoDecoratorModelInInternal(name="sample")

    with pytest.raises(ImportError):
        from specs.azure.clientgenerator.core.access.models import NoDecoratorModelInInternal

    with pytest.raises(AttributeError):
        client.internal_operation.no_decorator_in_internal(name="sample")


def test_internal_decorator_in_internal(client: AccessClient):
    result = client.internal_operation._internal_decorator_in_internal(name="sample")
    assert result == models._models.InternalDecoratorModelInInternal(name="sample")

    with pytest.raises(ImportError):
        from specs.azure.clientgenerator.core.access.models import InternalDecoratorModelInInternal

    with pytest.raises(AttributeError):
        client.internal_operation.internal_decorator_in_internal(name="sample")


def test_public_decorator_in_internal(client: AccessClient):
    result = client.internal_operation._public_decorator_in_internal(name="sample")
    assert result == models.PublicDecoratorModelInInternal(name="sample")

    with pytest.raises(AttributeError):
        client.internal_operation.public_decorator_in_internal(name="sample")


def test_public(client: AccessClient):
    result = client.shared_model_in_operation.public(name="sample")
    assert result == models.SharedModel(name="sample")


def test_internal(client: AccessClient):
    result = client.shared_model_in_operation._internal(name="sample")
    assert result == models.SharedModel(name="sample")

    with pytest.raises(AttributeError):
        client.shared_model_in_operation.internal(name="sample")


def test_operation(client: AccessClient):
    result = client.relative_model_in_operation._operation(name="Madge")
    assert result == models._models.OuterModel(name="Madge", inner=models._models.InnerModel(name="Madge"))

    with pytest.raises(ImportError):
        from specs.azure.clientgenerator.core.access.models import OuterModel

    with pytest.raises(ImportError):
        from specs.azure.clientgenerator.core.access.models import InnerModel

    with pytest.raises(AttributeError):
        client.shared_model_in_operation.operation(name="sample")


def test_discriminator(client: AccessClient):
    result = client.relative_model_in_operation._discriminator(kind="real")
    assert result == models._models.RealModel(name="Madge", kind="real")

    with pytest.raises(ImportError):
        from specs.azure.clientgenerator.core.access.models import RealModel

    with pytest.raises(AttributeError):
        client.shared_model_in_operation.discriminator(kind="real")
