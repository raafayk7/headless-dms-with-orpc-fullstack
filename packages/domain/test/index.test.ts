// Test index file for domain package
// This file ensures all tests are discoverable and can be run together

// Import all test files to ensure they are loaded
import "./user/user.entity.test"
import "./user/user.errors.test"
import "./document/document.entity.test"
import "./document/document.errors.test"

// Re-export existing utility tests
export * from "./validation-error.test"
export * from "./fp-utils.test"
export * from "./parse-error-parse.test"
export * from "./compose-utils.test"

// This file serves as a central entry point for running all domain tests
// Tests can be run individually or together using: bun test packages/domain/test/
