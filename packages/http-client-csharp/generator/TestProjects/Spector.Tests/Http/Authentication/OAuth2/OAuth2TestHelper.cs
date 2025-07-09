// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.ClientModel;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Buffers;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http.Authentication.OAuth2
{
    internal class OAuth2TestHelper
    {
        public class ClientCredentialTokenProvider : AuthenticationTokenProvider
        {
            private readonly string _clientId;
            private readonly string _clientSecret;
            private readonly HttpResponseMessage _mockResponse;
            private readonly HttpClient _client;
            private const string TokenUriValue = "https://myauthserver.com/token";

            public ClientCredentialTokenProvider(string clientId, string clientSecret) : this(clientId, clientSecret, "foo")
            {

            }

            public ClientCredentialTokenProvider(string clientId, string clientSecret, string scope)
            {
                _clientId = clientId;
                _clientSecret = clientSecret;

                // Create a mock token response
                _mockResponse = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
    string.Format("""
{{
    "access_token": "{0}",
    "token_type": "Bearer",
    "expires_in": 3600
}}
""", scope), Encoding.UTF8, "application/json")
                };

                // Create a mock handler that returns the predefined response
                var mockHandler = new MockHttpMessageHandler(req =>
                {
                    Assert.AreEqual(req.RequestUri?.ToString(), TokenUriValue);
                    // Extract the Authorization header
                    var authHeader = req.Headers.Authorization;
                    Assert.IsNotNull(authHeader, "Authorization header is missing");
                    Assert.AreEqual("Basic", authHeader?.Scheme, "Authorization scheme should be 'Basic'");

                    // Decode the Base64 parameter
                    byte[] credentialBytes = Convert.FromBase64String(authHeader!.Parameter!);
                    string decodedCredentials = Encoding.ASCII.GetString(credentialBytes);

                    // Verify the decoded credentials
                    Assert.AreEqual($"{_clientId}:{_clientSecret}", decodedCredentials, "Decoded credentials don't match expected values");

                    // Validate form content
                    var content = req?.Content?.ReadAsStringAsync().GetAwaiter().GetResult();
                    Assert.That(content, Contains.Substring("grant_type=client_credentials"), "grant_type should be client_credentials");

                    return _mockResponse;
                });

                // Create an HttpClient with the mock handler
                _client = new HttpClient(mockHandler);
            }

            public override AuthenticationToken GetToken(GetTokenOptions properties, CancellationToken cancellationToken)
            {
                return GetAccessTokenInternal(false, properties, cancellationToken).GetAwaiter().GetResult();
            }

            public override async ValueTask<AuthenticationToken> GetTokenAsync(GetTokenOptions properties, CancellationToken cancellationToken)
            {
                return await GetAccessTokenInternal(true, properties, cancellationToken).ConfigureAwait(false);
            }

            public override GetTokenOptions? CreateTokenOptions(IReadOnlyDictionary<string, object> properties)
            {
                if (properties.TryGetValue(GetTokenOptions.ScopesPropertyName, out var scopes) && scopes is string[] scopeArray &&
                    properties.TryGetValue(GetTokenOptions.AuthorizationUrlPropertyName, out var authUri) && authUri is string authUriValue)
                {
                    return new GetTokenOptions(new Dictionary<string, object>
                    {
                        { GetTokenOptions.ScopesPropertyName, new ReadOnlyMemory<string>(scopeArray) },
                        { GetTokenOptions.AuthorizationUrlPropertyName, authUriValue },
                    });
                }
                return null;
            }

            internal async ValueTask<AuthenticationToken> GetAccessTokenInternal(bool async, GetTokenOptions properties, CancellationToken cancellationToken)
            {
                var request = new HttpRequestMessage(HttpMethod.Post, TokenUriValue);

                // Add Basic Authentication header
                var authBytes = System.Text.Encoding.ASCII.GetBytes($"{_clientId}:{_clientSecret}");
                var authHeader = Convert.ToBase64String(authBytes);
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);
                var scopes = ExtractScopes(properties.Properties);

                // Create form content
                var formContent = new FormUrlEncodedContent(
                [
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                    new KeyValuePair<string, string>("scope", string.Join(" ", scopes.ToArray()))
                ]);

                request.Content = formContent;

                using HttpResponseMessage response = async ?
                    await _client.SendAsync(request) :
                    _client.SendAsync(request).GetAwaiter().GetResult();

                response.EnsureSuccessStatusCode();

                // Deserialize the JSON response using System.Text.Json
                using var responseStream = await response.Content.ReadAsStreamAsync();
                using JsonDocument jsonDoc = await JsonDocument.ParseAsync(responseStream);
                JsonElement root = jsonDoc.RootElement;

                string? accessToken = root.GetProperty("access_token").GetString();
                string? tokenType = root.GetProperty("token_type").GetString();
                int expiresIn = root.GetProperty("expires_in").GetInt32();

                // Calculate expiration and refresh times based on current UTC time
                var now = DateTimeOffset.UtcNow;
                DateTimeOffset expiresOn = now.AddSeconds(expiresIn);
                DateTimeOffset refreshOn = now.AddSeconds(expiresIn * 0.85);

                return new AuthenticationToken(accessToken!, tokenType!, expiresOn, refreshOn);
            }

            private static ReadOnlyMemory<string> ExtractScopes(IReadOnlyDictionary<string, object> properties)
            {
                if (!properties.TryGetValue(GetTokenOptions.ScopesPropertyName, out var scopesValue) || scopesValue is null)
                {
                    return ReadOnlyMemory<string>.Empty;
                }

                return scopesValue switch
                {
                    ReadOnlyMemory<string> memory => memory,
                    Memory<string> memory => memory,
                    string[] array => new ReadOnlyMemory<string>(array),
                    ICollection<string> collection => new ReadOnlyMemory<string>([.. collection]),
                    IEnumerable<string> enumerable => new ReadOnlyMemory<string>([.. enumerable]),
                    _ => ReadOnlyMemory<string>.Empty
                };
            }
        }

        // Only for bypassing HTTPS check purpose
        public class MockBearerTokenAuthenticationPolicy : BearerTokenPolicy
        {
            private readonly PipelineTransport _transport;
            private readonly AuthenticationTokenProvider _tokenProvider;
            private readonly GetTokenOptions? _flowContext;

            public MockBearerTokenAuthenticationPolicy(
                AuthenticationTokenProvider tokenProvider,
                IEnumerable<IReadOnlyDictionary<string, object>> contexts,
                PipelineTransport transport) : base(tokenProvider, contexts)
            {
                _tokenProvider = tokenProvider;
                _flowContext = GetOptionsFromContexts(contexts, tokenProvider);
                _transport = transport;
            }

            public MockBearerTokenAuthenticationPolicy(
                AuthenticationTokenProvider tokenProvider,
                string scope,
                PipelineTransport transport) : base(tokenProvider, scope)
            {
                _tokenProvider = tokenProvider;
                _flowContext = new GetTokenOptions(new Dictionary<string, object>
                {
                    [GetTokenOptions.ScopesPropertyName] = new ReadOnlyMemory<string>([scope])
                });
                _transport = transport;
            }

            public override ValueTask ProcessAsync(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, int currentIndex)
            {
                return ProcessAsync(message, pipeline, true);
            }

            public override void Process(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, int currentIndex)
            {
                ProcessAsync(message, pipeline, false).GetAwaiter().GetResult();
            }

            protected async ValueTask ProcessNextAsync(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline)
            {
                await _transport.ProcessAsync(message).ConfigureAwait(false);
                await ProcessResponseBodyPolicyAsync(message, pipeline).ConfigureAwait(false);

                var response = message.Response;
                Type responseType = response!.GetType();
                PropertyInfo propInfo = responseType.GetProperty("IsErrorCore", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!;
                propInfo.SetValue(response, IsErrorResponse(message));
            }

            private static bool IsErrorResponse(PipelineMessage message)
            {
                var statusKind = message?.Response?.Status / 100;
                return statusKind == 4 || statusKind == 5;
            }

            private async ValueTask ProcessResponseBodyPolicyAsync(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline)
            {
                CancellationToken oldToken = message.CancellationToken;
                using CancellationTokenSource cts = CancellationTokenSource.CreateLinkedTokenSource(oldToken);

                Stream? responseContentStream = message.Response?.ContentStream;
                if (responseContentStream == null || responseContentStream.CanSeek)
                {
                    return;
                }

                if (message.BufferResponse)
                {
                    try
                    {
                        var bufferedStream = new MemoryStream();
                        await CopyToAsync(responseContentStream, bufferedStream, cts).ConfigureAwait(false);

                        responseContentStream.Dispose();
                        bufferedStream.Position = 0;
                        message.Response!.ContentStream = bufferedStream;
                    }
                    // We dispose stream on timeout or user cancellation so catch and check if cancellation token was cancelled
                    catch (Exception ex)
                        when (ex is ObjectDisposedException
                                  or IOException
                                  or OperationCanceledException
                                  or NotSupportedException)
                    {
                        throw;
                    }
                }

                async Task CopyToAsync(Stream source, Stream destination, CancellationTokenSource cancellationTokenSource)
                {
                    // Same value as Stream.CopyTo uses by default
                    int defaultCopyBufferSize = 81920;

                    var networkTimeout = TimeSpan.FromSeconds(100);
                    if (message.NetworkTimeout is TimeSpan networkTimeoutOverride)
                    {
                        networkTimeout = networkTimeoutOverride;
                    }

                    byte[] buffer = ArrayPool<byte>.Shared.Rent(defaultCopyBufferSize);
                    try
                    {
                        while (true)
                        {
                            cancellationTokenSource.CancelAfter(networkTimeout);
#pragma warning disable CA1835 // ReadAsync(Memory<>) overload is not available in all targets
                            int bytesRead = await source.ReadAsync(buffer, 0, buffer.Length, cancellationTokenSource.Token).ConfigureAwait(false);
#pragma warning restore // ReadAsync(Memory<>) overload is not available in all targets
                            if (bytesRead == 0)
                                break;
                            await destination.WriteAsync(new ReadOnlyMemory<byte>(buffer, 0, bytesRead), cancellationTokenSource.Token).ConfigureAwait(false);
                        }
                    }
                    finally
                    {
                        cancellationTokenSource.CancelAfter(Timeout.InfiniteTimeSpan);
                        ArrayPool<byte>.Shared.Return(buffer);
                    }
                }
            }

            protected void ProcessNext(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline)
            {
                _transport.Process(message);
            }

            private async ValueTask ProcessAsync(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, bool async)
            {
                AuthenticationToken? token = null;

                if (message.TryGetProperty(typeof(GetTokenOptions), out var rawContext) && rawContext is IEnumerable<IReadOnlyDictionary<string, object>> flowsContexts)
                {
                    var context = GetOptionsFromContexts(flowsContexts, _tokenProvider);
                    if (context is not null)
                    {
                        token = async ? await _tokenProvider.GetTokenAsync(context, message.CancellationToken).ConfigureAwait(false) :
                        _tokenProvider.GetToken(context, message.CancellationToken);
                    }
                }
                else if (_flowContext is not null && _flowContext.Properties.Count > 0)
                {
                    token = async ? await _tokenProvider.GetTokenAsync(_flowContext, message.CancellationToken).ConfigureAwait(false) :
                        _tokenProvider.GetToken(_flowContext, message.CancellationToken);
                }

                if (token is not null)
                {
                    message.Request.Headers.Set("Authorization", $"Bearer {token.TokenValue}");
                }

                if (async)
                {
                    await ProcessNextAsync(message, pipeline).ConfigureAwait(false);
                }
                else
                {
                    ProcessNext(message, pipeline);
                }
            }

            private static GetTokenOptions? GetOptionsFromContexts(IEnumerable<IReadOnlyDictionary<string, object>> contexts, AuthenticationTokenProvider tokenProvider)
            {
                foreach (var context in contexts)
                {
                    var options = tokenProvider.CreateTokenOptions(context);
                    if (options is not null)
                    {
                        return options;
                    }
                }
                return null;
            }
        }

        public class MockHttpMessageHandler : HttpMessageHandler
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _responseFactory;

            public MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
            {
                _responseFactory = responseFactory;
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(_responseFactory(request));
            }
        }
    }
}
