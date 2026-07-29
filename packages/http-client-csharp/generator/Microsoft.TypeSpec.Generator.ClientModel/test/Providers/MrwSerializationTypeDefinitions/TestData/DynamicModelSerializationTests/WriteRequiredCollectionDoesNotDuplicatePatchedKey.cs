            if (Patch.Contains("$.tools"u8))
            {
                if (!Patch.IsRemoved("$.tools"u8))
                {
                    writer.WritePropertyName("tools"u8);
                    Patch.WriteTo(writer, "$.tools"u8);
                }
            }
            else
            {
                writer.WritePropertyName("tools"u8);
                writer.WriteStartArray();
                for (int i = 0; (i < Tools.Count); i++)
                {
                    if (Patch.IsRemoved(global::System.Text.Encoding.UTF8.GetBytes($"$.tools[{i}]")))
                    {
                        continue;
                    }
                    if ((Tools[i] == null))
                    {
                        writer.WriteNullValue();
                        continue;
                    }
                    writer.WriteStringValue(Tools[i]);
                }
                Patch.WriteTo(writer, "$.tools"u8);
                writer.WriteEndArray();
            }
