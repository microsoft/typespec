from typing import Any, Optional
import time
import httpx
from corehttp.credentials import AccessTokenInfo, TokenRequestOptions


class OAuth2ClientCredential:
    """A credential that uses client ID and client secret to authenticate.

    This credential acquires tokens via client credentials flow.

    :param str client_id: The client ID of the application.
    :param str client_secret: The client secret of the application.
    """

    def __init__(self, client_id: str, client_secret: str, **kwargs: Any):
        """Create a OAuth2ClientCredential with the provided client ID and secret.

        :param str client_id: The client ID of the application.
        :param str client_secret: The client secret of the application.
        :keyword str authority_url: The token endpoint URL. If not provided, must be
         specified in options when getting token.
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.authority_url = kwargs.get("authority_url")

    def get_token_info(
        self, *scopes: str, options: Optional[TokenRequestOptions] = None
    ) -> AccessTokenInfo:
        """Get an access token for the specified scopes.

        :param str scopes: The scopes for which the token should be valid.
            These may duplicate scopes defined in the auth flow (auth_flows[0]).
        :keyword options: A dictionary of options for the token request. Unknown options will
         be ignored. Optional.
        :paramtype options: TokenRequestOptions
        :return: An access token for the specified scopes.
        :rtype: ~corehttp.credentials.AccessTokenInfo
        :raises ValueError: If no scopes are provided or no authority URL is available.
        :raises httpx.HTTPError: If the token request fails.
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
        data = {"scope": " ".join(scopes), "grant_type": "client_credentials"}

        with httpx.Client() as client:
            response = client.post(
                authority_url, auth=(self.client_id, self.client_secret), data=data
            )

            response.raise_for_status()

            token = response.json().get("access_token")
            expires_in = response.json().get("expires_in")
            expires_on = time.time() + expires_in

            return AccessTokenInfo(token, expires_on)
