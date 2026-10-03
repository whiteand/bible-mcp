#!/usr/bin/env node
import { Repository } from "../lib/repository.ts";

const repo = Repository.fromDirectory("./sources");

console.log(`Present bibles:`);
for (const bible of repo.bibles()) {
  console.log(`  ${bible.id}`);
}
