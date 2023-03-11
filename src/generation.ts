import mysql from "mysql";
import jwt from "jsonwebtoken";
import { addDays, addMinutes } from "./time";
import { v4 as createUUID } from "uuid";

interface IToken {
  type: string;
  expires: number;
}
interface IRefreshToken extends IToken {
  id: string;
  generation: number;
  uuid: string;
}
interface IAccessToken extends IToken {
  id: string;
  uuid: string;
}
interface IGeneration {
  id: string;
  generation: number;
}

class TokenGeneration {
  private pool: mysql.Pool;
  private hmacKey: Buffer;

  constructor(config: mysql.PoolConfig, hmacKey: Buffer) {
    this.pool = mysql.createPool(config);
    this.hmacKey = hmacKey;
  }
  /**
   * Get generation
   * @param id id
   * @returns returns user's generation
   */
  private async getGeneration(id: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        try {
          if (err) {
            return reject(err);
          }

          connection.query(`SELECT generation FROM generation WHERE id=?`, [id], (err, results: Array<IGeneration>) => {
            if (err) {
              return reject(err);
            }

            //ID without generation
            if (results.length == 0) {
              connection.query(`INSERT INTO generation VALUES(?, 0)`, [id]);
              return resolve(0);
            }

            return resolve(results[0].generation);
          });
        } finally {
          connection.release();
        }
      });
    });
  }
  /**
   * Disable refresh token
   * @param id id
   */
  async addGeneration(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          return reject(err);
        }

        try {
          connection.query(`UPDATE generation SET generation=generation+1 WHERE id=?;`, [id]);
          resolve();
        } finally {
          connection.release();
        }
      });
    });
  }
  /**
   * Check generation of token
   * @param token
   * @returns true or false
   */
  private async checkGeneration(token: IRefreshToken): Promise<boolean> {
    try {
      const _generation = await this.getGeneration(token.id);

      if (_generation > token.generation) {
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  /**
   * Create refresh token
   * @param id id
   * @param days days
   * @returns Refresh token
   */
  async createRefreshToken(id: string, days: number = 20): Promise<IRefreshToken | null> {
    try {
      const refreshToken: IRefreshToken = {
        type: "refresh",
        expires: addDays(days).getTime(),
        id: id,
        generation: await this.getGeneration(id),
        uuid: createUUID(),
      };
      return refreshToken;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  /**
   * Update expires of refresh token
   * @param token token
   * @param days days
   * @returns New refresh token
   */
  async updateRefreshToken(token: IRefreshToken, days: number = 20): Promise<IRefreshToken | null> {
    if (!(await this.checkGeneration(token))) return null;
    token.expires = addDays(days).getTime();

    return token;
  }
  /**
   * Create acceess token
   * @param refreshToken refresh token
   * @param minutes minutes
   * @returns Access token
   */
  async createAccessToken(refreshToken: IRefreshToken, minutes: number = 30): Promise<IAccessToken | null> {
    try {
      const { id } = refreshToken;
      if (!(await this.checkGeneration(refreshToken))) return null;

      const accessToken: IAccessToken = {
        type: "access",
        expires: addMinutes(minutes).getTime(),
        id: id,
        uuid: createUUID(),
      };

      return accessToken;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  /**
   * Sign for jwt token
   * @param token Token
   * @returns Token string
   */
  tokenToString(token: IToken): string {
    return jwt.sign(token, this.hmacKey, { algorithm: "HS256", noTimestamp: true });
  }
  /**
   * Verify token
   * @param tokenString
   * @returns
   */
  private verifyToken(tokenString: string): IToken | null {
    try {
      const token = jwt.verify(tokenString, this.hmacKey) as IToken;
      if (token.expires < new Date().getTime()) return null;
      return token;
    } catch (e) {
      return null;
    }
  }
  /**
   * Close database pool
   */
  close() {
    this.pool.end();
  }
  /**
   * Verify refresh token
   * @param refreshToken
   * @returns Refresh token or null
   */
  verifyRefreshToken(refreshToken?: string): IRefreshToken | null {
    if (!refreshToken) return null;
    const token = this.verifyToken(refreshToken);
    if (!token) return null;

    if (token.type !== "refresh") return null;
    else return token as IRefreshToken;
  }
  /**
   * Verify access token
   * @param refreshToken
   * @returns Access token or null
   */
  verifyAccessToken(accessToken?: string): IAccessToken | null {
    if (!accessToken) return null;
    const token = this.verifyToken(accessToken);
    if (!token) return null;

    if (token.type !== "access") return null;
    else return token as IAccessToken;
  }
}

export default TokenGeneration;
export { IToken, IRefreshToken, IAccessToken };
