/** Intentional insecure sample for live Action proof — do not ship. */
export function lookupUser(req: { query: { id: string } }) {
  // SQL injection: concatenates untrusted input into a query string
  const q = "SELECT * FROM users WHERE id = '" + req.query.id + "'";
  return q;
}

export const publicConfig = {
  // Credential leak: secret in a client-visible object
  SECRET_API_KEY: "sk_live_proof_do_not_use",
};
