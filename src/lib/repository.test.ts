import { Repository } from "./repository.ts";
import { expect, describe } from "vitest";

describe("Repository", (it) => {
  it("is a class", () => {
    expect(Repository).toBeTypeOf("function");
  });
});
