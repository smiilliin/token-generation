# Token Generation - Disable the refresh token

## Explanation

All refresh tokens are created with a generation and all access tokens are only created when the refresh token's  generation is valid  
https://velog.io/@smiilliin/token-generation-구조  
Required mysql database

## Install

### BASH

```bash
npm install
```

### MYSQL

```sql
CREATE TABLE generation (
  id varchar(/* (id length) */) not null,
  generation int not null
);
```

## Usage

### TokenGeneration

```typescript
import TokenGeneration from "./generation";
import crypto from "crypto";

const hmacKey = Buffer.from(crypto.randomBytes(32)); //HMAC KEY

const generation = new TokenGeneration(
  {
    host: "localhost",
    user: "(user)",
    password: "(password)",
    database: "(database)",
  },
  hmacKey
);
```

### createRefreshToken

Create refresh token

```typescript
const refreshToken = await generation.createRefreshToken("smile", 20);
console.log(refreshToken);
```

### createAccessToken

Create access token

```typescript
const accessToken = await generation.createAccessToken(refreshToken, 30);
console.log(accessToken);
```

### updateRefreshToken

Update expires of refresh token

```typescript
const _refreshToken = await generation.updateRefreshToken(refreshToken, 20);
console.log(_refreshToken);
```

### tokenToString

Sign for jwt token

```typescript
const refreshTokenString = generation.tokenToString(refreshToken);
const accessTokenString = generation.tokenToString(accessToken);

console.log(refreshTokenString);
console.log(accessTokenString);
```

### addGeneration

Disable refresh token

```typescript
await generation.addGeneration("test");
```

## Example

```typescript
import TokenGeneration from "./generation";
import crypto from "crypto";

const hmacKey = Buffer.from(crypto.randomBytes(32)); //HMAC KEY

const generation = new TokenGeneration(
  {
    host: "localhost",
    user: "(user)",
    password: "(password)",
    database: "(database)",
  },
  hmacKey
);

(async () => {
  const refreshToken = await generation.createRefreshToken("test", 20);
  if (!refreshToken) throw new Error("Error generating refresh token");

  const accessToken = await generation.createAccessToken(refreshToken, 30);
  if (!accessToken) throw new Error("Error generating access token");

  console.log(generation.tokenToString(refreshToken));
  console.log(generation.tokenToString(accessToken));

  await generation.addGeneration("test"); //Disable refresh token

  console.log(generation.createAccessToken(refreshToken)); //It returns null

  generation.close();
})();
```
