# Token Generation - Disable the refresh token

## Explanation

Token Generation is JWT Token with a "generation" system  
Required mysql database

### Generation system

All refresh tokens are created with a generation and all access tokens are only created when the refresh token's generation is valid

## Install

### BASH

```bash
npm install
```

### MYSQL

```sql
CREATE TABLE generation (
  id varchar(/*what you want*/) not null,
  generation int not null
);
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
})();
```
