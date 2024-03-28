using TypeSpec.OpenAPI;

@@extension(OpenAI.Completions.create,
  "x-oaiMeta",
  {
    name: "Create chat completion",
    group: "chat",
    returns: """
      Returns a [chat completion](/docs/api-reference/chat/object) object, or a streamed sequence of
      [chat completion chunk](/docs/api-reference/chat/streaming) objects if the request is streamed.
      """,
    path: "create",
    examples: [
      {
        title: "No streaming",
        request: {
          curl: """
            curl https://api.openai.com/v1/chat/completions \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer $OPENAI_API_KEY" \\
            -d '{
              "model": "VAR_model_id",
              "messages": [
                {
                  "role": "system",
                  "content": "You are a helpful assistant."
                },
                {
                  "role": "user",
                  "content": "Hello!"
                }
              ]
            """,
          python: """
            import os
            import openai
            openai.api_key = os.getenv("OPENAI_API_KEY")

            completion = openai.ChatCompletion.create(
              model="VAR_model_id",
              messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
              ]
            )

            print(completion.choices[0].message)
            """,
          `node.js`: """
            import OpenAI from "openai";

            const openai = new OpenAI();

            async function main() {
              const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: "string" }],
                model: "VAR_model_id",
              });

              console.log(completion.choices[0]);
            }

            main();
            """,
        },
        response: """
          {
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1677652288,
            "model": "gpt-3.5-turbo-0613",
            "choices": [{
              "index": 0,
              "message": {
                "role": "assistant",
                "content": "\n\nHello there, how may I assist you today?",
              },
              "finish_reason": "stop"
            }],
            "usage": {
              "prompt_tokens": 9,
              "completion_tokens": 12,
              "total_tokens": 21
            }
          }
          """,
      },
      {
        title: "Streaming",
        request: {
          curl: """
            curl https://api.openai.com/v1/chat/completions \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer $OPENAI_API_KEY" \\
            -d '{
              "model": "VAR_model_id",
              "messages": [
                {
                  "role": "system",
                  "content": "You are a helpful assistant."
                },
                {
                  "role": "user",
                  "content": "Hello!"
                }
              ],
              "stream": true
            }'
            """,
          python: """
            import os
            import openai
            openai.api_key = os.getenv("OPENAI_API_KEY")

            completion = openai.ChatCompletion.create(
              model="VAR_model_id",
              messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
              ],
              stream=True
            )

            for chunk in completion:
              print(chunk.choices[0].delta)
            """,
          `node.js`: """
            import OpenAI from "openai";

            const openai = new OpenAI();

            async function main() {
              const completion = await openai.chat.completions.create({
                model: "VAR_model_id",
                messages: [
                  {"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": "Hello!"}
                ],
                stream: true,
              });

              for await (const chunk of completion) {
                console.log(chunk.choices[0].delta.content);
              }
            }

            main();
            """,
        },
        response: """
          {
            "id": "chatcmpl-123",
            "object": "chat.completion.chunk",
            "created": 1677652288,
            "model": "gpt-3.5-turbo",
            "choices": [{
              "index": 0,
              "delta": {
                "content": "Hello",
              },
              "finish_reason": "stop"
            }]
          }
          """,
      }
    ],
  }
);
