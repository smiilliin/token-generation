import TokenGeneration, { IRefreshToken } from "../src/generation";
import crypto from "crypto";
import dotenv from "dotenv";
import assert from "assert";

dotenv.config();

describe(`Disable Refresh Token`, () => {
  const hmacKey = Buffer.from(crypto.randomBytes(32)); //HMAC KEY
  const generation = new TokenGeneration(
    {
      host: process.env["DB_HOST"],
      user: process.env["DB_USER"],
      password: process.env["DB_PASSWORD"],
      database: process.env["DB_DATABASE"],
    },
    hmacKey
  );

  const username = "test";

  let refreshToken: IRefreshToken;

  it(`Create Refresh Token`, async () => {
    const _refreshToken = await generation.createRefreshToken(username, 20);
    assert.ok(_refreshToken);

    refreshToken = _refreshToken;
  });
  it(`Create Access Token`, async () => {
    const accessToken = await generation.createAccessToken(refreshToken, 30);
    assert.ok(accessToken);
  });
  it(`Add Generation`, async () => {
    await generation.addGeneration("test");
    const accessToken = await generation.createAccessToken(refreshToken, 30);
    assert.equal(accessToken, null);
  });
  it(`Close Pool`, () => {
    generation.close();
  });
});
