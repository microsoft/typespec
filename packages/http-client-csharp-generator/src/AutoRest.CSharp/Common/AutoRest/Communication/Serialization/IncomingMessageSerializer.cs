// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Threading;
using AutoRest.CSharp.AutoRest.Communication.MessageHandling;
using AutoRest.CSharp.AutoRest.Communication.MessageHandling.Models;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.Serialization
{
    internal delegate bool ProcessAction(JsonRpcConnection connection, string pluginName, string sessionId);

    internal static class IncomingMessageSerializer
    {
        public static string GetPluginNames(this IncomingRequest _, params string[] pluginNames) => pluginNames.ToJsonArray();

        public static string Process(this IncomingRequest request, JsonRpcConnection connection, ProcessAction processAction)
        {
            var parameters = request.Params.ToStringArray();
            var (pluginName, sessionId) = (parameters![0], parameters![1]);
            return processAction(connection, pluginName, sessionId).ToJsonBool();
        }

        public static string Shutdown(this IncomingRequest _, CancellationTokenSource tokenSource)
        {
            tokenSource.Cancel();
            return String.Empty;
        }
    }
}
