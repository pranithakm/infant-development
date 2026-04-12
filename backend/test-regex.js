const tests = [
  "show near by hospitals in pollachi",
  "hospitals near chennai",
  "doctor at madurai",
  "fever hospitals around tiruppur",
  "i am in New Delhi"
];

const re = /\b(?:in|near|at|around)\s+([a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,})?)\b/i;

tests.forEach(t => {
  const match = t.match(re);
  console.log(`${t} ->`, match ? match[1] : null);
});
