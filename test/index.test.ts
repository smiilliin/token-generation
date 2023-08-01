import TokenGeneration, { IAccessToken, IRefreshToken } from "../src/generation";
import crypto from "crypto";
import dotenv from "dotenv";
import assert from "assert";
import mysql from "mysql";

dotenv.config();

describe(`Disable refresh token`, () => {
  const dbConfig = {
    host: process.env["DB_HOST"],
    user: process.env["DB_USER"],
    password: process.env["DB_PASSWORD"],
    database: process.env["DB_DATABASE"],
  };
  const pool = mysql.createPool(dbConfig);
  const hmacKey = Buffer.from(crypto.randomBytes(32)); //HMAC KEY
  const generation = new TokenGeneration(pool, hmacKey);

  const username = "test";

  let refreshToken: IRefreshToken;
  let accessToken: IAccessToken;

  it(`Create refresh token`, async () => {
    const _refreshToken = await generation.createRefreshToken(username, 20);
    assert.ok(_refreshToken);

    refreshToken = _refreshToken;
  });
  it(`Create access token`, async () => {
    const _accessToken = await generation.createAccessToken(refreshToken, 30);
    assert.ok(_accessToken);

    accessToken = _accessToken;
  });
  it(`Update refresh token`, async () => {
    const _refreshToken = await generation.updateRefreshToken(refreshToken, 20);

    assert.ok(_refreshToken);

    refreshToken = _refreshToken;
  });
  it(`Add generation`, async () => {
    await generation.addGeneration("test");
    const accessToken = await generation.createAccessToken(refreshToken, 30);
    assert.equal(accessToken, null);
  });
  it(`Token to string`, () => {
    const refreshTokenString = generation.tokenToString(refreshToken);
    const accessTokenString = generation.tokenToString(accessToken);

    assert(refreshTokenString);
    assert(accessTokenString);
  });
  it(`Close pool`, () => {
    generation.close();
  });
});
