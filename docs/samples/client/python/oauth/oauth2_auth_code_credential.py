from typing import Any, Optional
import time
import httpx
from corehttp.credentials import AccessTokenInfo, TokenRequestOptions


class OAuth2AuthCodeCredential:
    """A credential that uses auth code to authenticate.

    This credential acquires tokens via auth code flow.

    :param str client_id: The client ID of the application.
    :param str authorization_code: The authorization code.
    :keyword str authority_url: The authority URL for token requests.
    :keyword str redirect_uri: The redirect URI.
    :keyword str client_secret: The client secret of the application.
    """

    def __init__(
        self,
        client_id: str,
        authorization_code: str,
        *,
        authority_url: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        client_secret: Optional[str] = None,
        **kwargs: Any
    ):
        """Create a OAuth2AuthCodeCredential with the provided client ID and authorization_code.

        :param str client_id: The client ID of the application.
        :param str authorization_code: The authorization code.
        :keyword str authority_url: The authority URL for token requests.
        :keyword str redirect_uri: The redirect URI.
        :keyword str client_secret: The client secret of the application.
        """
        self.client_id = client_id
        self.authorization_code = authorization_code
        self.authority_url = authority_url
        self.redirect_uri = redirect_uri
        self.client_secret = client_secret

    def get_token_info(
        self, *scopes: str, options: Optional[TokenRequestOptions] = None
    ) -> AccessTokenInfo:
        """Get an access token for the specified scopes.

        :param str scopes: The scopes for which the token should be valid.
            These may duplicate scopes defined in the auth flow (auth_flows[0]).
        :keyword options: A dictionary of options for the token request. Unknown options will be ignored. Optional.
        :paramtype options: TokenRequestOptions
        :return: An access token for the specified scopes.
        :rtype: ~corehttp.credentials.AccessTokenInfo
        :raises ValueError: If no scopes are provided or if authority URL is missing
        """
        if not scopes:
            raise ValueError("At least one scope must be provided.")

        authority_url = None
        auth_flows = options.get("auth_flows")
        # If there was at least one flow in the TypeSpec, pick the first one.
        # If your TypeSpec has several flows, you may want to loop to find the one you need
        if auth_flows:
            auth_flow = auth_flows[0]
            authority_url = auth_flow.get("authorizationUrl")
        authority_url = authority_url or self.authority_url
        if not authority_url:
            raise ValueError(
                "No authority URL provided. Provide it in the constructor or in the options."
            )

        # Prepare the token request
        data = {
            "scope": " ".join(scopes),
            "grant_type": "authorization_code",
            "code": self.authorization_code,
        }

        if self.redirect_uri:
            data["redirect_uri"] = self.redirect_uri

        with httpx.Client() as client:
            response = client.post(
                authority_url,
                auth=(
                    (self.client_id, self.client_secret) if self.client_secret else None
                ),
                data=data,
            )

            response.raise_for_status()

            token = response.json().get("access_token")
            expires_in = response.json().get("expires_in")
            expires_on = time.time() + expires_in

            return AccessTokenInfo(token, expires_on)
