// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.AutoRest.Communication.Serialization.Models;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.Serialization
{
    internal static class OutgoingMessageSerializer
    {
        private const string BasicRequestFormat = @"{{""jsonrpc"":""2.0"",""method"":{1},""params"":[{2},{3}],""id"":{0}}}";
        private const string BasicNotificationFormat = @"{{""jsonrpc"":""2.0"",""method"":{0},""params"":[{1},{2}]}}";

        private static string CreateRequestString(string requestId, string method, string sessionId, string? other) =>
            String.Format(BasicRequestFormat, requestId.ToJsonStringOrNull(), method.ToJsonStringOrNull(), sessionId.ToJsonStringOrNull(), other.ToStringLiteral().ToJsonStringOrNull());

        public static string ReadFile(string requestId, string sessionId, string filename) => CreateRequestString(requestId, nameof(ReadFile), sessionId, filename);
        public static string GetValue(string requestId, string sessionId, string key) => CreateRequestString(requestId, nameof(GetValue), sessionId, key);
        public static string ListInputs(string requestId, string sessionId, string? artifactType = null) => CreateRequestString(requestId, nameof(ListInputs), sessionId, artifactType);
        public static string ProtectFiles(string requestId, string sessionId, string path) => CreateRequestString(requestId, nameof(ProtectFiles), sessionId, path);
        public static string Message(string sessionId, IMessage message) => String.Format(BasicNotificationFormat, nameof(Message).ToJsonStringOrNull(), sessionId.ToJsonStringOrNull(), message);

        // Custom Messages
        public static string WriteFile(string sessionId, string filename, string content, string artifactType, RawSourceMap? sourceMap = null)
        {
            var artifact = new ArtifactRaw { Content = content, SourceMap = sourceMap, Type = artifactType, Uri = filename };
            var message = new ArtifactMessage { Channel = Channel.File, Details = artifact, Text = String.Empty };
            return Message(sessionId, message);
        }
        public static string WriteFile(string sessionId, string filename, string content, string artifactType, Mapping[] sourceMap)
        {
            var artifact = new ArtifactMapping { Content = content, SourceMap = sourceMap, Type = artifactType, Uri = filename };
            var message = new ArtifactMessage { Channel = Channel.File, Details = artifact, Text = String.Empty };
            return Message(sessionId, message);
        }

        private const string BasicResponseFormat = @"{{""jsonrpc"":""2.0"",""result"":{1},""id"":{0}}}";

        public static string Response(string responseId, string result) => String.Format(BasicResponseFormat, responseId.ToJsonStringOrNull(), result);
        public static string Header(int contentLength) => $"Content-Length: {contentLength}\r\n\r\n";
    }
}
