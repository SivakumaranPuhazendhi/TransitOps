
async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mock' },
      body: JSON.stringify({ text: 'Dispatch TRK-007 with Driver 6' })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
