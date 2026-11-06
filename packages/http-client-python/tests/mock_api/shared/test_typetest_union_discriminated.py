# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

# Passing placeholders only: Python does not support these unconstrained or envelope unions.
# These cases do not exercise generated SDKs or count as implemented Spector coverage.


@pytest.fixture(scope="session", autouse=True)
def testserver():
    yield


# Unsupported: inline unions without an explicit model constraint.
class TestNoEnvelopeDefault:
    """Test discriminated union with inline discriminator (no envelope)."""

    def test_get_default_cat(self):
        """Test getting cat with default (no query param or kind=cat).

        Expected response:
        {
            "kind": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        pass

    def test_get_with_kind_cat(self):
        """Test getting cat with kind=cat query parameter.

        Expected response:
        {
            "kind": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        pass

    def test_get_with_kind_dog(self):
        """Test getting dog with kind=dog query parameter.

        Expected response:
        {
            "kind": "dog",
            "name": "Rex",
            "bark": false
        }
        """
        pass

    def test_put_cat(self):
        """Test sending cat with inline discriminator.

        Expected request:
        {
            "kind": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        pass


# Unsupported: unconstrained inline unions with a custom discriminator.
class TestNoEnvelopeCustomDiscriminator:
    """Test discriminated union with inline discriminator and custom discriminator property name."""

    def test_get_default_cat(self):
        """Test getting cat with default (no query param or type=cat).

        Expected response:
        {
            "type": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        pass

    def test_get_with_type_cat(self):
        """Test getting cat with type=cat query parameter.

        Expected response:
        {
            "type": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        pass

    def test_get_with_type_dog(self):
        """Test getting dog with type=dog query parameter.

        Expected response:
        {
            "type": "dog",
            "name": "Rex",
            "bark": false
        }
        """
        pass

    def test_put_cat(self):
        """Test sending cat with inline custom discriminator.

        Expected request:
        {
            "type": "cat",
            "name": "Whiskers",
            "meow": true
        }
        """
        pass


# Unsupported: object-envelope unions.
class TestEnvelopeObjectDefault:
    """Test discriminated union with default envelope serialization."""

    def test_get_default_cat(self):
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
        pass

    def test_get_with_kind_cat(self):
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
        pass

    def test_get_with_kind_dog(self):
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
        pass

    def test_put_cat(self):
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
        pass


# Unsupported: object-envelope unions with custom property names.
class TestEnvelopeObjectCustomProperties:
    """Test discriminated union with custom property names in envelope."""

    def test_get_default_cat(self):
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
        pass

    def test_get_with_pet_type_cat(self):
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
        pass

    def test_get_with_pet_type_dog(self):
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
        pass

    def test_put_cat(self):
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
        pass
