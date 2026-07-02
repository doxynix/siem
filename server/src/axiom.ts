import { Axiom } from "@axiomhq/js";
import { env } from "@server/env";

export function getAxiom() {
  return new Axiom({ token: env.AXIOM_TOKEN });
}
