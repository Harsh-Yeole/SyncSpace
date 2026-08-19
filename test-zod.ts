import { z } from "zod";
import { SignupFormSchema } from "./src/lib/types";

try {
  const result = SignupFormSchema.parse({});
  console.log("Success:", result);
} catch (e) {
  console.log("Failed:", e.errors);
}
