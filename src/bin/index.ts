#!/usr/bin/env node
import { Repository } from "../lib/repository.ts";

const repo = new Repository();

console.log("executable is run", repo);
