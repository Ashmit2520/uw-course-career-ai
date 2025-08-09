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

export async function vector_similarity_search(
  openai,
  supabaseClient,
  query_text,
  match_count,
  filter
) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query_text,
  });

  const embedding = embeddingResponse.data[0].embedding;

  const similarity_results = await supabaseClient.rpc("match_courses_new", {
    query_embedding: embedding,
    match_count: match_count,
    filter: filter,
  });

  return similarity_results;
}

export async function kwd_similarity_search(
  supabaseClient,
  query_text,
  match_count,
  filter
) {
  const kwd_results = await supabaseClient.rpc("kw_match_courses_new", {
    query_text: query_text,
    match_count: match_count,
    filter: filter,
  });

  return kwd_results;
}

export function formatAcademicPlan(plan) {
  return plan.yearPlans
    .map((yearPlan) => {
      const yearHeader = `Year ${yearPlan.year}`;
      const semestersText = yearPlan.semesters
        .map((sem) => {
          const courses = sem.courses.length
            ? sem.courses.map((c) => `    - ${c}`).join("\n")
            : "    (No courses)";
          return `  ${sem.name} Semester:\n${courses}`;
        })
        .join("\n");
      return `${yearHeader}:\n${semestersText}`;
    })
    .join("\n\n");
}
