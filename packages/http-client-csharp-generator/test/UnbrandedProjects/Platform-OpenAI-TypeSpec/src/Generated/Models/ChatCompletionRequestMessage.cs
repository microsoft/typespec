// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace OpenAI.Models
{
    /// <summary> The ChatCompletionRequestMessage. </summary>
    public partial class ChatCompletionRequestMessage
    {
        /// <summary>
        /// Keeps track of any properties unknown to the library.
        /// <para>
        /// To assign an object to the value of this property use <see cref="BinaryData.FromObjectAsJson{T}(T, System.Text.Json.JsonSerializerOptions?)"/>.
        /// </para>
        /// <para>
        /// To assign an already formatted json string to this property use <see cref="BinaryData.FromString(string)"/>.
        /// </para>
        /// <para>
        /// Examples:
        /// <list type="bullet">
        /// <item>
        /// <term>BinaryData.FromObjectAsJson("foo")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("\"foo\"")</term>
        /// <description>Creates a payload of "foo".</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromObjectAsJson(new { key = "value" })</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// <item>
        /// <term>BinaryData.FromString("{\"key\": \"value\"}")</term>
        /// <description>Creates a payload of { "key": "value" }.</description>
        /// </item>
        /// </list>
        /// </para>
        /// </summary>
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        /// <summary> Initializes a new instance of <see cref="ChatCompletionRequestMessage"/>. </summary>
        /// <param name="role"> The role of the messages author. One of `system`, `user`, `assistant`, or `function`. </param>
        /// <param name="content">
        /// The contents of the message. `content` is required for all messages, and may be null for
        /// assistant messages with function calls.
        /// </param>
        public ChatCompletionRequestMessage(ChatCompletionRequestMessageRole role, string content)
        {
            Role = role;
            Content = content;
        }

        /// <summary> Initializes a new instance of <see cref="ChatCompletionRequestMessage"/>. </summary>
        /// <param name="role"> The role of the messages author. One of `system`, `user`, `assistant`, or `function`. </param>
        /// <param name="content">
        /// The contents of the message. `content` is required for all messages, and may be null for
        /// assistant messages with function calls.
        /// </param>
        /// <param name="name">
        /// The name of the author of this message. `name` is required if role is `function`, and it
        /// should be the name of the function whose response is in the `content`. May contain a-z,
        /// A-Z, 0-9, and underscores, with a maximum length of 64 characters.
        /// </param>
        /// <param name="functionCall"> The name and arguments of a function that should be called, as generated by the model. </param>
        /// <param name="serializedAdditionalRawData"> Keeps track of any properties unknown to the library. </param>
        internal ChatCompletionRequestMessage(ChatCompletionRequestMessageRole role, string content, string name, ChatCompletionRequestMessageFunctionCall functionCall, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            Role = role;
            Content = content;
            Name = name;
            FunctionCall = functionCall;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        /// <summary> Initializes a new instance of <see cref="ChatCompletionRequestMessage"/> for deserialization. </summary>
        internal ChatCompletionRequestMessage()
        {
        }

        /// <summary> The role of the messages author. One of `system`, `user`, `assistant`, or `function`. </summary>
        public ChatCompletionRequestMessageRole Role { get; }
        /// <summary>
        /// The contents of the message. `content` is required for all messages, and may be null for
        /// assistant messages with function calls.
        /// </summary>
        public string Content { get; }
        /// <summary>
        /// The name of the author of this message. `name` is required if role is `function`, and it
        /// should be the name of the function whose response is in the `content`. May contain a-z,
        /// A-Z, 0-9, and underscores, with a maximum length of 64 characters.
        /// </summary>
        public string Name { get; set; }
        /// <summary> The name and arguments of a function that should be called, as generated by the model. </summary>
        public ChatCompletionRequestMessageFunctionCall FunctionCall { get; set; }
    }
}
