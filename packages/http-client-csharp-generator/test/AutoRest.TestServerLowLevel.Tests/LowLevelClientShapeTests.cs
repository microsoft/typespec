// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using Accessibility_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class LowLevelClientShapeTests
    {
        [Test]
        public void CredentialFieldPropertyPrivateInLLC ()
        {
            var client = typeof(AccessibilityClient);
            Assert.AreEqual(false, client.GetField ("_keyCredential", BindingFlags.NonPublic | BindingFlags.Instance).IsPublic, "_keyCredential should be private");
        }

        [Test]
        public void NoAuthHasNoAuthParam ()
        {
            var client = typeof(Accessibility_LowLevel_NoAuth.AccessibilityClient);
            Assert.NotNull(client.GetConstructor(new Type [] { typeof(Uri), typeof(Accessibility_LowLevel_NoAuth.AccessibilityClientOptions) }));
        }

        [Test]
        public void TokenAuthHasTokenCredential ()
        {
            var client = typeof(Accessibility_LowLevel_TokenAuth.AccessibilityClient);
            Assert.NotNull(client.GetConstructor(new Type [] { typeof(Uri), typeof(Azure.Core.TokenCredential), typeof(Accessibility_LowLevel_TokenAuth.AccessibilityClientOptions) }));
        }

        [Test]
        public void KeyAuthHasAzureKeyCredential ()
        {
            var client = typeof(Accessibility_LowLevel.AccessibilityClient);
            Assert.NotNull(client.GetConstructor(new Type [] { typeof(Uri), typeof(Azure.AzureKeyCredential), typeof(Accessibility_LowLevel.AccessibilityClientOptions) }));
        }
    }
}
