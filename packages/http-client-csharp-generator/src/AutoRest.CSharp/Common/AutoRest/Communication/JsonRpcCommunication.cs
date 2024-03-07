// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Threading.Tasks;
using AutoRest.CSharp.AutoRest.Communication.MessageHandling;
using AutoRest.CSharp.AutoRest.Communication.Serialization;
using AutoRest.CSharp.AutoRest.Communication.Serialization.Models;

namespace AutoRest.CSharp.AutoRest.Communication
{
    internal class JsonRpcCommunication : IPluginCommunication
    {
        private readonly JsonRpcConnection _connection;
        private readonly string _sessionId;
        public string PluginName { get; }

        public JsonRpcCommunication(JsonRpcConnection connection, string pluginName, string sessionId)
        {
            _connection = connection;
            PluginName = pluginName;
            _sessionId = sessionId;
        }

        // Basic Interfaces
        public Task<string> ReadFile(string filename) => ProcessRequest<string>(requestId => OutgoingMessageSerializer.ReadFile(requestId, _sessionId, filename));
        public Task<T> GetValue<T>(string key) => ProcessRequest<T>(requestId => OutgoingMessageSerializer.GetValue(requestId, _sessionId, key));
        public Task<string[]> ListInputs(string? artifactType = null) => ProcessRequest<string[]>(requestId => OutgoingMessageSerializer.ListInputs(requestId, _sessionId, artifactType));
        public Task<string> ProtectFiles(string path) => ProcessRequest<string>(requestId => OutgoingMessageSerializer.ProtectFiles(requestId, _sessionId, path));
        public Task Message(IMessage message) => _connection.Notification(OutgoingMessageSerializer.Message(_sessionId, message));

        public Task WriteFile(string filename, string content, string artifactType, RawSourceMap? sourceMap = null) =>
            _connection.Notification(OutgoingMessageSerializer.WriteFile(_sessionId, filename, content, artifactType, sourceMap));
        public Task WriteFile(string filename, string content, string artifactType, Mapping[] sourceMap) =>
            _connection.Notification(OutgoingMessageSerializer.WriteFile(_sessionId, filename, content, artifactType, sourceMap));

        public Task Fatal(string text)
        {
            return Message(text, Channel.Fatal);
        }

        public Task Warning(string text)
        {
            return Message(text, Channel.Warning);
        }

        // Convenience Interfaces
        public Task Message(string text, Channel channel = Channel.Warning) => Message(new Message { Channel = channel, Text = text });

        private Task<T> ProcessRequest<T>(Func<string, string> requestMethod)
        {
            var requestId = Guid.NewGuid().ToString();
            return _connection.Request<T>(requestId, requestMethod(requestId));
        }
    }
}
