# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.discriminatedunion import DiscriminatedClient
from typetest.discriminatedunion import models


@pytest.fixture
def client():
    with DiscriminatedClient() as client:
        yield client


@pytest.fixture
def cat_body():
    """Cat model for testing."""
    return models.Cat(name="Whiskers", meow=True)


@pytest.fixture
def dog_body():
    """Dog model for testing."""
    return models.Dog(name="Rex", bark=False)


# Tests for No Envelope / Default (inline discriminator with "kind")
@pytest.mark.skip(reason="After completely support discriminated unions, enable these tests")
class TestNoEnvelopeDefault:
    """Test discriminated union with inline discriminator (no envelope)."""

    def test_get_default_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with default (no query param or kind=cat).

        Expected response:
        {
            "kind": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        result = client.no_envelope.default.get()
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_kind_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with kind=cat query parameter.

        Expected response:
        {
            "kind": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        result = client.no_envelope.default.get(kind="cat")
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_kind_dog(self, client: DiscriminatedClient, dog_body: models.Dog):
        """Test getting dog with kind=dog query parameter.

        Expected response:
        {
            "kind": "dog",
            "name": "Rex",
            "bark": false
        }
        """
        result = client.no_envelope.default.get(kind="dog")
        assert result == dog_body
        assert isinstance(result, models.Dog)

    def test_put_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test sending cat with inline discriminator.

        Expected request:
        {
            "kind": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        result = client.no_envelope.default.put(cat_body)
        assert result == cat_body
        assert isinstance(result, models.Cat)


# Tests for No Envelope / Custom Discriminator (inline with custom "type" property)
@pytest.mark.skip(reason="After completely support discriminated unions, enable these tests")
class TestNoEnvelopeCustomDiscriminator:
    """Test discriminated union with inline discriminator and custom discriminator property name."""

    def test_get_default_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with default (no query param or type=cat).

        Expected response:
        {
            "type": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        result = client.no_envelope.custom_discriminator.get()
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_type_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with type=cat query parameter.

        Expected response:
        {
            "type": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        result = client.no_envelope.custom_discriminator.get(type="cat")
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_type_dog(self, client: DiscriminatedClient, dog_body: models.Dog):
        """Test getting dog with type=dog query parameter.

        Expected response:
        {
            "type": "dog",
            "name": "Rex",
            "bark": false
        }
        """
        result = client.no_envelope.custom_discriminator.get(type="dog")
        assert result == dog_body
        assert isinstance(result, models.Dog)

    def test_put_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test sending cat with inline custom discriminator.

        Expected request:
        {
            "type": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        result = client.no_envelope.custom_discriminator.put(cat_body)
        assert result == cat_body
        assert isinstance(result, models.Cat)


# Tests for Envelope / Object / Default (envelope with "kind" and "value")
@pytest.mark.skip(reason="After completely support discriminated unions, enable these tests")
class TestEnvelopeObjectDefault:
    """Test discriminated union with default envelope serialization."""

    def test_get_default_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with default (no query param or kind=cat).

        Expected response:
        {
            "kind": "cat",
            "value": {
                "name": "Whiskers",
                "meow": true
            }
        }
        """
        result = client.envelope.object.default.get()
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_kind_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with kind=cat query parameter.

        Expected response:
        {
            "kind": "cat",
            "value": {
                "name": "Whiskers",
                "meow": true
            }
        }
        """
        result = client.envelope.object.default.get(kind="cat")
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_kind_dog(self, client: DiscriminatedClient, dog_body: models.Dog):
        """Test getting dog with kind=dog query parameter.

        Expected response:
        {
            "kind": "dog",
            "value": {
                "name": "Rex",
                "bark": false
            }
        }
        """
        result = client.envelope.object.default.get(kind="dog")
        assert result == dog_body
        assert isinstance(result, models.Dog)

    def test_put_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test sending cat with envelope serialization.

        Expected request:
        {
            "kind": "cat",
            "value": {
                "name": "Whiskers",
                "meow": true
            }
        }
        """
        result = client.envelope.object.default.put(cat_body)
        assert result == cat_body
        assert isinstance(result, models.Cat)


# Tests for Envelope / Object / Custom Properties (envelope with custom "petType" and "petData")
@pytest.mark.skip(reason="After completely support discriminated unions, enable these tests")
class TestEnvelopeObjectCustomProperties:
    """Test discriminated union with custom property names in envelope."""

    def test_get_default_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with default (no query param or petType=cat).

        Expected response:
        {
            "petType": "cat",
            "petData": {
                "name": "Whiskers",
                "meow": true
            }
        }
        """
        result = client.envelope.object.custom_properties.get()
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_pet_type_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test getting cat with petType=cat query parameter.

        Expected response:
        {
            "petType": "cat",
            "petData": {
                "name": "Whiskers",
                "meow": true
            }
        }
        """
        result = client.envelope.object.custom_properties.get(pet_type="cat")
        assert result == cat_body
        assert isinstance(result, models.Cat)

    def test_get_with_pet_type_dog(self, client: DiscriminatedClient, dog_body: models.Dog):
        """Test getting dog with petType=dog query parameter.

        Expected response:
        {
            "petType": "dog",
            "petData": {
                "name": "Rex",
                "bark": false
            }
        }
        """
        result = client.envelope.object.custom_properties.get(pet_type="dog")
        assert result == dog_body
        assert isinstance(result, models.Dog)

    def test_put_cat(self, client: DiscriminatedClient, cat_body: models.Cat):
        """Test sending cat with custom property names in envelope.

        Expected request:
        {
            "petType": "cat",
            "petData": {
                "name": "Whiskers",
                "meow": true
            }
        }
        """
        result = client.envelope.object.custom_properties.put(cat_body)
        assert result == cat_body
        assert isinstance(result, models.Cat)
