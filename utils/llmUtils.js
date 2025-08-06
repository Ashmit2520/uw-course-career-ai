import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

export function getLastExchange(conversation) {
  const reversed = [...conversation].reverse();
  let userMsg = null;
  let assistantMsg = null;

  for (const message of reversed) {
    if (message.role === "user" && !userMsg) {
      userMsg = message;
    } else if (message.role === "assistant" && userMsg && !assistantMsg) {
      assistantMsg = message;
      break;
    }
  }

  return [assistantMsg, userMsg].filter(Boolean); // remove nulls
}

export async function retrieve_with_vector_similarity(query, count, filter) {
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small",
  });

  const vectorstore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: client,
    tableName: "courses_new",
    queryName: "match_courses_new", // your custom SQL function
  });
}
