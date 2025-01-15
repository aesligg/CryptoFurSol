import fs from "fs";
import { validateCharacterConfig, stringToUuid } from "@elizaos/core";

export async function loadCharacter() {
  const character = JSON.parse(fs.readFileSync("./src/agent/character/crypto_fur.json", "utf-8"));

  validateCharacterConfig(character);

  character.id = character.id || stringToUuid(character.name);

  return character;
}
