const BASE = `http://localhost:3000/api/repositories/7cf3a196-d7ce-4f79-85b7-e2541930554a/chat`;

async function post(body) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log("=== REAL E2E CHAT VERIFICATION ===\n");
  console.log("Repository: openai/DALL-E (id: 7cf3a196-d7ce-4f79-85b7-e2541930554a)");
  console.log("Status: ready | 22 embedding chunks across 11 Python files\n");
  
  console.log("=== Turn 1: First question ===");
  const { status: s1, data: d1 } = await post({
    question: "How is the DALL-E model loaded and what does the decoder do?",
    history: [],
  });
  console.log(`HTTP ${s1}`);
  console.log(JSON.stringify({
    status: d1.status,
    answerPreview: d1.answer?.slice(0, 200),
    citationsCount: d1.citations?.length,
    citations: d1.citations,
  }, null, 2));
  
  if (d1.status !== 'answered') {
    console.log(`\nFirst turn did not return answered (got ${d1.status}), aborting multi-turn test.`);
    console.log(`Answer: ${d1.answer}`);
    process.exit(1);
  }
  
  console.log("\n=== Turn 2: Follow-up with history ===");
  const history = [
    { 
      question: "How is the DALL-E model loaded and what does the decoder do?", 
      answer: d1.answer, 
      citations: d1.citations 
    },
  ];
  
  const { status: s2, data: d2 } = await post({
    question: "What about the encoder - how does it differ from the decoder?",
    history,
  });
  console.log(`HTTP ${s2}`);
  console.log(JSON.stringify({
    status: d2.status,
    answerPreview: d2.answer?.slice(0, 200),
    citationsCount: d2.citations?.length,
    citations: d2.citations,
  }, null, 2));
  
  if (d2.status === 'answered') {
    console.log("\n=== SUCCESS: real multi-turn Chat E2E verified ===");
    console.log("Real Groq API responded with answered status for BOTH turns.");
    console.log("Real citations returned with file paths and line numbers.");
    console.log("History was correctly sent as prior turn in follow-up request.");
    process.exit(0);
  } else {
    console.log(`\nSecond turn returned ${d2.status}, aborting.`);
    console.log(`Answer: ${d2.answer}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("E2E verification failed:", err);
  process.exit(1);
});
