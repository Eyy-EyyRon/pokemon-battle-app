// This is a setup script for json-server
// Run this with: node json-server-setup.js

import fs from "fs"
import { exec } from "child_process"

// Create a proper db.json file with all required endpoints
const dbContent = {
  team: [],
  battles: [],
  invites: [],
}

// Write the db.json file
fs.writeFileSync("db.json", JSON.stringify(dbContent, null, 2))

console.log("Created db.json file with proper structure")
console.log("To start json-server, run:")
console.log("json-server --watch db.json --port 3001")

// Optionally, start the server automatically
console.log("\nStarting json-server...")
const server = exec("json-server --watch db.json --port 3001")

server.stdout.on("data", (data) => {
  console.log(data)
})

server.stderr.on("data", (data) => {
  console.error(data)
})

console.log("json-server is now running on http://localhost:3001")
console.log("Press Ctrl+C to stop the server")
