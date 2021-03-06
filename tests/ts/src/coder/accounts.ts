import { Layout } from "buffer-layout";
import { Idl } from "../idl";
import { IdlCoder } from "./idl";
import { sha256 } from "js-sha256";

/**
 * Number of bytes of the account discriminator.
 */
export const ACCOUNT_DISCRIMINATOR_SIZE = 8;

/**
 * Encodes and decodes account objects.
 */
export class AccountsCoder<A extends string = string> {
  /**
   * Maps account type identifier to a layout.
   */
  private accountLayouts: Map<A, Layout>;

  public constructor(idl: Idl) {
    if (idl.accounts === undefined) {
      this.accountLayouts = new Map();
      return;
    }
    const layouts: [A, Layout][] = idl.accounts.map((acc) => {
      return [acc.name as A, IdlCoder.typeDefLayout(acc, idl.types)];
    });

    this.accountLayouts = new Map(layouts);
  }

  public async encode<T = any>(accountName: A, account: T): Promise<Buffer> {
    const buffer = Buffer.alloc(1000); // TODO: use a tighter buffer.
    const layout = this.accountLayouts.get(accountName);
    if (!layout) {
      throw new Error(`Unknown account: ${accountName}`);
    }
    const len = layout.encode(account, buffer);
    let accountData = buffer.slice(0, len);
    let discriminator = AccountsCoder.accountDiscriminator(accountName);
    return Buffer.concat([discriminator, accountData]);
  }

  public decode<T = any>(accountName: A, ix: Buffer): T {
    // Chop off the discriminator before decoding.
    const data = ix.slice(8);
    const layout = this.accountLayouts.get(accountName);
    if (!layout) {
      throw new Error(`Unknown account: ${accountName}`);
    }
    return layout.decode(data);
  }

  /**
   * Calculates and returns a unique 8 byte discriminator prepended to all anchor accounts.
   *
   * @param name The name of the account to calculate the discriminator.
   */
  public static accountDiscriminator(name: string): Buffer {
    return Buffer.from(sha256.digest(`account:${name}`)).slice(0, 8);
  }
}
