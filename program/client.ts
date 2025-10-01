import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { serialize, deserialize } from 'borsh';

// Borsh schema definitions
class Assignable {
  constructor(properties: any) {
    Object.keys(properties).forEach((key) => {
      // @ts-ignore
      this[key] = properties[key];
    });
  }
}

export class InitializeGameArgs extends Assignable {
  max_players!: number;
}

export class JoinGameArgs extends Assignable {
  player_name!: string;
}

export class PlaceBetArgs extends Assignable {
  amount!: bigint;
}

export class RaiseArgs extends Assignable {
  amount!: bigint;
}

export class EndRoundArgs extends Assignable {
  winner_index!: number;
}

export class SpectatorContributeArgs extends Assignable {
  amount!: bigint;
}

// Instruction schemas
const SCHEMA = new Map([
  [
    InitializeGameArgs,
    {
      kind: 'struct',
      fields: [['max_players', 'u8']],
    },
  ],
  [
    JoinGameArgs,
    {
      kind: 'struct',
      fields: [['player_name', 'string']],
    },
  ],
  [
    PlaceBetArgs,
    {
      kind: 'struct',
      fields: [['amount', 'u64']],
    },
  ],
  [
    RaiseArgs,
    {
      kind: 'struct',
      fields: [['amount', 'u64']],
    },
  ],
  [
    EndRoundArgs,
    {
      kind: 'struct',
      fields: [['winner_index', 'u8']],
    },
  ],
  [
    SpectatorContributeArgs,
    {
      kind: 'struct',
      fields: [['amount', 'u64']],
    },
  ],
]);

// Instruction enum tags
enum PokerInstructionTag {
  InitializeGame = 0,
  JoinGame = 1,
  PlaceBet = 2,
  DealCards = 3,
  Fold = 4,
  Call = 5,
  Raise = 6,
  EndRound = 7,
  SpectatorContribute = 8,
}

export class PokerClient {
  constructor(
    private connection: Connection,
    private programId: PublicKey
  ) {}

  // Initialize a new game
  async initializeGame(
    authority: Keypair,
    gameStateAccount: Keypair,
    maxPlayers: number
  ): Promise<string> {
    const args = new InitializeGameArgs({ max_players: maxPlayers });
    const data = Buffer.concat([
      Buffer.from([PokerInstructionTag.InitializeGame]),
      Buffer.from(serialize(SCHEMA, args)),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [authority, gameStateAccount]
    );

    return signature;
  }

  // Join game
  async joinGame(
    player: Keypair,
    gameStateAccount: PublicKey,
    playerName: string
  ): Promise<string> {
    const args = new JoinGameArgs({ player_name: playerName });
    const data = Buffer.concat([
      Buffer.from([PokerInstructionTag.JoinGame]),
      Buffer.from(serialize(SCHEMA, args)),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [player]
    );

    return signature;
  }

  // Place bet
  async placeBet(
    player: Keypair,
    gameStateAccount: PublicKey,
    potAccount: PublicKey,
    amount: number
  ): Promise<string> {
    const args = new PlaceBetArgs({ amount: BigInt(amount) });
    const data = Buffer.concat([
      Buffer.from([PokerInstructionTag.PlaceBet]),
      Buffer.from(serialize(SCHEMA, args)),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
        { pubkey: potAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [player]
    );

    return signature;
  }

  // Deal cards
  async dealCards(
    authority: Keypair,
    gameStateAccount: PublicKey
  ): Promise<string> {
    const data = Buffer.from([PokerInstructionTag.DealCards]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [authority]
    );

    return signature;
  }

  // Fold
  async fold(
    player: Keypair,
    gameStateAccount: PublicKey
  ): Promise<string> {
    const data = Buffer.from([PokerInstructionTag.Fold]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [player]
    );

    return signature;
  }

  // Call
  async call(
    player: Keypair,
    gameStateAccount: PublicKey,
    potAccount: PublicKey
  ): Promise<string> {
    const data = Buffer.from([PokerInstructionTag.Call]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
        { pubkey: potAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [player]
    );

    return signature;
  }

  // Raise
  async raise(
    player: Keypair,
    gameStateAccount: PublicKey,
    potAccount: PublicKey,
    amount: number
  ): Promise<string> {
    const args = new RaiseArgs({ amount: BigInt(amount) });
    const data = Buffer.concat([
      Buffer.from([PokerInstructionTag.Raise]),
      Buffer.from(serialize(SCHEMA, args)),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: player.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
        { pubkey: potAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [player]
    );

    return signature;
  }

  // End round
  async endRound(
    authority: Keypair,
    gameStateAccount: PublicKey,
    potAccount: PublicKey,
    winnerAccount: PublicKey,
    winnerIndex: number
  ): Promise<string> {
    const args = new EndRoundArgs({ winner_index: winnerIndex });
    const data = Buffer.concat([
      Buffer.from([PokerInstructionTag.EndRound]),
      Buffer.from(serialize(SCHEMA, args)),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: false },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
        { pubkey: potAccount, isSigner: false, isWritable: true },
        { pubkey: winnerAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [authority]
    );

    return signature;
  }

  // Spectator contribute
  async spectatorContribute(
    spectator: Keypair,
    gameStateAccount: PublicKey,
    potAccount: PublicKey,
    amount: number
  ): Promise<string> {
    const args = new SpectatorContributeArgs({ amount: BigInt(amount) });
    const data = Buffer.concat([
      Buffer.from([PokerInstructionTag.SpectatorContribute]),
      Buffer.from(serialize(SCHEMA, args)),
    ]);

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: spectator.publicKey, isSigner: true, isWritable: true },
        { pubkey: gameStateAccount, isSigner: false, isWritable: true },
        { pubkey: potAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    });

    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [spectator]
    );

    return signature;
  }

  // Get game state
  async getGameState(gameStateAccount: PublicKey): Promise<any> {
    const accountInfo = await this.connection.getAccountInfo(gameStateAccount);
    if (!accountInfo) {
      throw new Error('Game state account not found');
    }
    // Parse the account data (you'll need to implement proper deserialization)
    return accountInfo.data;
  }
}

// Helper function to create a PDA for the pot
export function findPotPDA(
  gameStateAccount: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pot'), gameStateAccount.toBuffer()],
    programId
  );
}
