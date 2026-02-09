import { ref, set, onValue, push, remove, update, get } from 'firebase/database';
import { app } from '../firebaseConfig'; // Adjust path if needed
import { getDatabase } from 'firebase/database';

const SUITS = ['s', 'h', 'd', 'c']; // spades, hearts, diamonds, clubs
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const SYMBOLS = {
    's': '♠', 'h': '♥', 'd': '♦', 'c': '♣'
};

const db = getDatabase(app);

export class Card {
    constructor(suit, rank, id = null) {
        this.suit = suit;
        this.rank = rank;
        this.value = RANK_VALUES[rank];
        this.id = id || Math.random().toString(36).substr(2, 9); // Unique ID for React keys
    }

    toString() {
        return `${this.rank}${SYMBOLS[this.suit]}`;
    }

    // For Firebase serialization
    toJSON() {
        return {
            suit: this.suit,
            rank: this.rank,
            id: this.id
        };
    }

    static fromJSON(data) {
        return new Card(data.suit, data.rank, data.id);
    }
}

export class Player {
    constructor(id, isBot = true, name = '', characterId = null) {
        this.id = id;
        this.isBot = isBot;
        this.hand = [];
        this.name = name || (isBot ? `Bot ${id}` : 'Player');
        this.characterId = characterId || `char${(id % 5) + 1}`; // Default to char based on ID
        this.cutsReceived = { 's': 0, 'h': 0, 'd': 0, 'c': 0 }; // Track times this suit was cut
        this.emoji = ''; // For temporary emoji reactions
        this.emotion = 'neutral'; // For emotion display
    }

    receiveCard(card) {
        this.hand.push(card);
        this.sortHand();
    }

    sortHand() {
        // Sort by suit (spades first) then value
        this.hand.sort((a, b) => {
            if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
            return a.value - b.value;
        });
    }

    playCard(index) {
        return this.hand.splice(index, 1)[0];
    }

    hasSuit(suit) {
        return this.hand.some(c => c.suit === suit);
    }

    getSpades() {
        return this.hand.filter(c => c.suit === 's');
    }
}

export class Game {
    constructor(onStateChange, config = {}) {
        this.onStateChange = onStateChange;

        // Config
        this.isOnline = !!config.roomID;
        this.roomID = config.roomID;
        this.isHost = config.isHost !== false; // Default true (Local)
        this.myPlayerName = config.playerName || 'You';
        this.myPlayerCharacter = config.playerCharacter || 'char1'; // Store selected character
        this.playerCount = config.playerCount || 4; // Dynamic player count

        // State
        this.players = [];
        this.deck = [];
        this.stack = []; // Cards on table
        this.currentTurn = 0;
        this.ledSuit = null;
        this.lastWinner = null;
        this.roundHistory = [];
        this.gameActive = false;
        this.phase = 'GAME';
        this.notification = '';
        this.winnerPos = null;

        this.init();
    }

    init() {
        if (this.isOnline) {
            this.initOnline();
        } else {
            this.initLocal();
        }
    }

    initLocal() {
        // Create players locally
        this.players = [];
        for (let i = 0; i < this.playerCount; i++) {
            const isBot = i !== 0; // First player is human
            const name = isBot ? `Bot ${i}` : this.myPlayerName;
            const charId = i === 0 ? this.myPlayerCharacter : `char${((i - 1) % 11) + 1}`;
            this.players.push(new Player(i, isBot, name, charId));
        }
        this.notifyStateChange();
    }

    initOnline() {
        const roomRef = ref(db, `rooms/${this.roomID}`);

        if (this.isHost) {
            // HOST: Initialize Room and Listen for Joins
            // Fetch players from Lobby first
            const playersRef = ref(db, `rooms/${this.roomID}/players`);
            get(playersRef).then((snapshot) => {
                const lobbyPlayers = snapshot.val();
                if (lobbyPlayers) {
                    this.players = [];
                    // Ensure we respect max players or just take what's there
                    // Sort by ID to ensure consistent order: 0 (Host), 1, 2, ...
                    Object.values(lobbyPlayers).sort((a, b) => a.id - b.id).forEach(pData => {
                        // Create Player object. If it's me (Host/0), use my name.
                        const isMe = pData.id === 0;
                        const name = pData.name;
                        const charId = pData.characterId;

                        // NOTE: If we want to support Bots filling empty slots, we would need to merge lobbyPlayers with generated bots.
                        // For now, let's assume we play with who joined + bots for empty slots?
                        // The logic below REPLACES initLocal's pure bot generation with Lobby data.
                        this.players.push(new Player(pData.id, false, name, charId));
                    });

                    // Fill remaining slots with Bots if needed (optional, based on playerCount config)
                    while (this.players.length < this.playerCount) {
                        const nextId = this.players.length;
                        const botCharId = `char${((nextId - 1) % 11) + 1}`;
                        this.players.push(new Player(nextId, true, `Bot ${nextId}`, botCharId));
                    }

                    // Push initial state AFTER players are set
                    this.pushStateToFirebase();
                } else {
                    // Fallback if no lobby data (shouldn't happen if created correctly)
                    this.initLocal();
                    this.pushStateToFirebase();
                }
            });

            // Listen for Actions
            const actionsRef = ref(db, `rooms/${this.roomID}/actions`);
            onValue(actionsRef, (snapshot) => {
                const actions = snapshot.val();
                if (actions) {
                    Object.entries(actions).forEach(([key, action]) => {
                        this.handleClientAction(action);
                        remove(ref(db, `rooms/${this.roomID}/actions/${key}`));
                    });
                }
            });

        } else {
            // CLIENT: Listen to Game State
            console.log('[CLIENT] Setting up Firebase listener for gameState');
            const stateRef = ref(db, `rooms/${this.roomID}/gameState`);
            onValue(stateRef, (snapshot) => {
                console.log('[CLIENT] Firebase listener triggered');
                const remoteState = snapshot.val();
                console.log('[CLIENT] Received state:', {
                    hasState: !!remoteState,
                    stackLength: remoteState?.stack?.length,
                    playersLength: remoteState?.players?.length
                });
                if (remoteState) {
                    this.syncFromFirebase(remoteState);
                }
            });
        }
    }

    handleClientAction(action) {
        if (!this.gameActive) {
            // Maybe allow Start Game action?
            if (action.type === 'START_GAME') {
                this.startGame();
            }
            return;
        }

        if (action.type === 'PLAY_CARD') {
            if (action.playerIndex === this.currentTurn) {
                // Determine card index by value/suit since indices might desync?
                // Or trust index if we are consistent.
                // 3. Clear stack and add penalty cards to victim's hand
                const penaltyCards = [...this.stack, playedCard]; s[action.playerIndex];
                const player = this.players[action.playerIndex];
                const cardIndex = player.hand.findIndex(c => c.suit === action.card.suit && c.rank === action.rank);

                if (cardIndex !== -1) {
                    this.playCard(cardIndex);
                } else {
                    console.error("Card not found in hand (Host side) for action", action);
                }
            }
        } else if (action.type === 'EMOJI') {
            this.setEmoji(action.playerIndex, action.emoji);
        }
    }

    pushStateToFirebase() {
        if (!this.isOnline || !this.isHost) return;

        const statePayload = {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                isBot: p.isBot,
                emoji: p.emoji,
                emotion: p.emotion,
                characterId: p.characterId,

                hand: p.hand.map(c => c.toJSON()),
                cutsReceived: p.cutsReceived
            })),
            stack: this.stack.map(c => c.toJSON()),
            currentTurn: this.currentTurn,
            ledSuit: this.ledSuit,
            lastWinner: this.lastWinner,
            roundHistory: this.roundHistory.map(h => ({
                playerIndex: h.player.id,
                card: h.card.toJSON()
            })),
            gameActive: this.gameActive,
            phase: this.phase,
            notification: this.notification
        };

        console.log('[HOST] Pushing state to Firebase:', {
            stackLength: this.stack.length,
            playersLength: this.players.length,
            currentTurn: this.currentTurn
        });
        set(ref(db, `rooms/${this.roomID}/gameState`), statePayload);
    }

    // Helper to handle Firebase arrays that might come as objects
    safeArray(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return Object.values(data);
    }

    syncFromFirebase(remoteState) {
        console.log('[CLIENT] syncFromFirebase called', {
            stackLength: this.safeArray(remoteState.stack).length,
            currentTurn: remoteState.currentTurn
        });
        // Hydrate local state from remote JSON
        this.currentTurn = remoteState.currentTurn;
        this.ledSuit = remoteState.ledSuit;
        this.lastWinner = remoteState.lastWinner;
        this.gameActive = remoteState.gameActive;
        this.phase = remoteState.phase;
        this.notification = remoteState.notification;

        // Sync Stack
        this.stack = this.safeArray(remoteState.stack).map(Card.fromJSON);
        console.log('[CLIENT] After sync, local stack length:', this.stack.length);

        // Sync Players & Hands
        const playersData = this.safeArray(remoteState.players);
        // Ensure we have correct player count if data is missing/partial
        this.players = playersData.map(pData => {
            const p = new Player(pData.id, pData.isBot, pData.name, pData.characterId);
            p.emoji = pData.emoji || '';
            p.emotion = pData.emotion || 'neutral';

            p.cutsReceived = pData.cutsReceived || { 's': 0, 'h': 0, 'd': 0, 'c': 0 };
            p.hand = this.safeArray(pData.hand).map(Card.fromJSON);
            return p;
        });

        // Sync History (Needs to map indices back to player objects)
        this.roundHistory = this.safeArray(remoteState.roundHistory).map(h => {
            const player = this.players.find(p => p.id === h.playerIndex);
            // Fallback for missing player (shouldn't happen but prevents crash)
            const fallbackPlayer = new Player(h.playerIndex, false, `Unknown (${h.playerIndex})`);
            return {
                player: player || fallbackPlayer,
                card: Card.fromJSON(h.card)
            };
        });

        this.notifyStateChange();
    }

    startGame() {
        if (this.isOnline && !this.isHost) {
            push(ref(db, `rooms/${this.roomID}/actions`), { type: 'START_GAME' });
            return;
        }

        this.gameActive = true;

        // RESET STATE
        this.clearTable();
        this.players.forEach(p => {
            p.hand = [];
            p.cutsReceived = { 's': 0, 'h': 0, 'd': 0, 'c': 0 };
        });

        this.createDeck();

        // Phase 1: SHUFFLING (1.5s)
        this.phase = 'SHUFFLING';
        this.notifyStateChange();

        setTimeout(() => {
            // Phase 2: DEALING (2.5s)
            this.phase = 'DEALING';
            this.dealCards();
            this.notifyStateChange();

            setTimeout(() => {
                // Phase 3: START PLAYING
                this.startDeterminationPhase();
                if (this.isOnline) {
                    this.pushStateToFirebase();
                }
            }, 5000); // 5.0s is sufficient now that cards fade out quickly

        }, 1500); // Wait for shuffle animation

        if (this.isOnline) {
            this.pushStateToFirebase();
        }
    }

    startDeterminationPhase() {
        this.phase = 'DETERMINE';
        this.currentTurn = 0;
        this.ledSuit = 's';
        this.showNotification("Play a SPADE to decide who starts!");
        this.notifyStateChange();
    }

    createDeck() {
        this.deck = [];
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                this.deck.push(new Card(suit, rank));
            }
        }
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        let pIndex = 0;
        while (this.deck.length > 0) {
            this.players[pIndex].receiveCard(this.deck.pop());
            pIndex = (pIndex + 1) % this.playerCount;
        }
    }

    evaluateDeterminationRound() {
        let winner = null;
        let cutFound = false;

        // Check for cuts first
        for (let move of this.roundHistory) {
            if (move.card.suit !== 's') {
                winner = move.player;
                cutFound = true;
                this.showNotification(`${winner.name} CUTS and starts!`);
                break; // First cutter wins
            }
        }

        if (!cutFound) {
            // Find highest spade
            let maxVal = -1;
            for (let move of this.roundHistory) {
                if (move.card.value > maxVal) {
                    maxVal = move.card.value;
                    winner = move.player;
                }
            }
            this.showNotification(`${winner.name} has Highest Spade!`);

            // Corner case: if no one played spades? (Impossible by rules but...)
            if (!winner && this.roundHistory.length > 0) winner = this.roundHistory[0].player;
        }

        setTimeout(async () => {
            this.clearTable();
            this.phase = 'GAME';
            this.currentTurn = winner.id;

            this.showNotification(`Game Start! ${winner.name} leads.`);
            this.notifyStateChange();

            if (winner.isBot && this.isHost) { // Only Host manages bots
                setTimeout(() => this.botTurn(), 1000);
            }
        }, 1500);
    }

    async botTurn() {
        if (!this.gameActive) return;
        // Only HOST runs bots
        if (this.isOnline && !this.isHost) return;

        const bot = this.players[this.currentTurn];
        // Ensure it IS a bot (or disconnected player?)
        if (!bot || !bot.isBot) return;

        const delay = 500 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));

        // ... Bot Strategy (Same as before) ...
        let cardToPlay = null;
        let cardIndex = -1;

        if (this.phase === 'DETERMINE') {
            const spades = bot.getSpades();
            if (spades.length > 0) {
                const bestSpade = spades[spades.length - 1];
                cardIndex = bot.hand.indexOf(bestSpade);
            } else {
                if (bot.hand.length > 0) {
                    cardIndex = bot.hand.length - 1;
                }
            }
        } else if (this.stack.length === 0) {
            // Leading
            const suits = {};
            for (let c of bot.hand) {
                if (!suits[c.suit]) suits[c.suit] = [];
                suits[c.suit].push(c);
            }

            let bestSuit = null;
            const availableSuits = Object.keys(suits);

            // Sort suits by safety (cuts) then by strength
            availableSuits.sort((a, b) => {
                const cutsA = bot.cutsReceived[a];
                const cutsB = bot.cutsReceived[b];
                if (cutsA !== cutsB) return cutsA - cutsB;

                const maxA = suits[a][suits[a].length - 1].value;
                const maxB = suits[b][suits[b].length - 1].value;
                return maxB - maxA;
            });

            if (availableSuits.length > 0) {
                bestSuit = availableSuits[0];
                const cardsOfSuit = suits[bestSuit];
                const cardToPlayObj = cardsOfSuit[cardsOfSuit.length - 1];
                cardIndex = bot.hand.indexOf(cardToPlayObj);
            }

        } else {
            // Following
            const ledSuit = this.ledSuit;
            const validCards = bot.hand.filter(c => c.suit === ledSuit);

            if (validCards.length > 0) {
                const highestValid = validCards[validCards.length - 1];
                cardIndex = bot.hand.indexOf(highestValid);
            } else {
                cardIndex = bot.hand.length - 1;
            }
        }

        if (cardIndex !== -1) {
            this.playCard(cardIndex);
        }
    }

    playCard(cardIndex) {
        if (this.isOnline && !this.isHost) {
            // Client sends intent
            const myPlayer = this.players.find(p => p.name === this.myPlayerName); // Better way to identify self needed
            // Assumption: Client knows its index?
            // Helper: find index of self
            let myIndex = this.players.findIndex(p => p.name === this.myPlayerName); // Quick fix, ideally by ID

            // Client Logic: Optimistic update? No, wait for server.
            // Just push action
            const card = this.players[myIndex].hand[cardIndex];
            if (card) {
                push(ref(db, `rooms/${this.roomID}/actions`), {
                    type: 'PLAY_CARD',
                    playerIndex: myIndex,
                    card: card.toJSON(),
                    rank: card.rank // Redundant but explicit
                });
            }
            return;
        }

        // HOST / LOCAL LOGIC
        const player = this.players[this.currentTurn];
        const card = player.playCard(cardIndex);

        this.stack.push(card);
        this.roundHistory.push({ player: player, card: card });

        this.notifyStateChange();

        if (this.phase === 'DETERMINE') {
            if (this.stack.length === this.playerCount) {
                this.evaluateDeterminationRound();
            } else {
                this.nextTurn();
            }
            return;
        }

        // ONE CARD PLAYED (LEAD)
        if (this.stack.length === 1) {
            this.ledSuit = card.suit;
        }

        // CHECK CUT
        if (card.suit !== this.ledSuit && this.ledSuit !== null) {
            this.handleCut(player, card);
        } else {
            // Followed suit
            // Calculate active players (those who have cards + those who played their last card this round)
            const activePlayersWithCards = this.players.filter(p => p.hand.length > 0).length;
            const playersWhoFinishedInRound = this.roundHistory.filter(h => h.player.hand.length === 0).length;
            const expectedStackSize = activePlayersWithCards + playersWhoFinishedInRound;

            if (this.stack.length >= expectedStackSize) {
                this.handleRoundEnd(false);
            } else {
                this.nextTurn();
            }
        }
    }

    handleCut(cutter, cutCard) {
        this.showNotification(`${cutter.name} Cut with ${cutCard.toString()}!`);

        if (this.roundHistory.length > 0) {
            const leader = this.roundHistory[0].player;
            leader.cutsReceived[this.ledSuit]++;
        }

        // Identify victim
        let highestVal = -1;
        let victim = null;

        for (let move of this.roundHistory) {
            if (move.card === cutCard) break;
            if (move.card.suit === this.ledSuit) {
                if (move.card.value > highestVal) {
                    highestVal = move.card.value;
                    victim = move.player;
                }
            }
        }

        setTimeout(async () => {
            this.showNotification(`${victim.name} picks up ${this.stack.length} cards!`);
            this.lastWinner = victim.id;
            this.notifyStateChange();

            await new Promise(r => setTimeout(r, 2500));

            for (let c of this.stack) {
                victim.receiveCard(c);
            }

            this.clearTable();
            this.currentTurn = victim.id;
            this.checkWinCondition();
            this.notifyStateChange();

            if (victim.isBot && this.isHost) {
                setTimeout(() => this.botTurn(), 1500);
            }
        }, 1500);
    }

    handleRoundEnd(isCut) {
        let highestVal = -1;
        let winner = null;

        for (let move of this.roundHistory) {
            if (move.card.value > highestVal) {
                highestVal = move.card.value;
                winner = move.player;
            }
        }

        setTimeout(async () => {
            this.showNotification(`${winner.name} wins round!`);
            this.lastWinner = winner.id;
            this.notifyStateChange();

            await new Promise(r => setTimeout(r, 2500));

            this.clearTable();
            this.currentTurn = winner.id;

            // Pass lead if winner finished
            if (this.players[this.currentTurn].hand.length === 0 && this.isGameStillOn()) {
                let next = (this.currentTurn + 1) % this.playerCount;
                while (this.players[next].hand.length === 0) {
                    next = (next + 1) % this.playerCount;
                }
                this.currentTurn = next;
                this.showNotification(`${winner.name} finished! ${this.players[next].name} leads.`);
            }

            this.checkWinCondition();
            this.notifyStateChange();

            if (this.gameActive && this.isHost) {
                if (this.players[this.currentTurn].isBot) {
                    setTimeout(() => this.botTurn(), 1500);
                }
            }
        }, 1000);
    }

    clearTable() {
        this.stack = [];
        this.roundHistory = [];
        this.ledSuit = null;
        this.lastWinner = null;
        this.notifyStateChange();
    }

    nextTurn() {
        let next = (this.currentTurn + 1) % this.playerCount;
        while (this.players[next].hand.length === 0 && this.isGameStillOn()) {
            next = (next + 1) % this.playerCount;
        }
        this.currentTurn = next;

        this.notifyStateChange();

        if (this.gameActive && this.isHost && this.players[this.currentTurn].isBot) {
            setTimeout(() => this.botTurn(), 1000);
        }
    }

    isGameStillOn() {
        return this.players.filter(p => p.hand.length > 0).length > 1;
    }

    checkWinCondition() {
        const active = this.players.filter(p => p.hand.length > 0);

        if (active.length <= 1) {
            this.gameActive = false;
            const loser = active[0];

            if (active.length === 1) {
                this.showNotification(`Game Over! ${loser.name} is the loser!`);
            } else {
                this.showNotification("Game Over!");
            }
        }
    }

    showNotification(msg) {
        this.notification = msg;
        this.notifyStateChange();

        setTimeout(() => {
            if (this.notification === msg) {
                this.notification = '';
                this.notifyStateChange();
            }
        }, 2000);
    }

    setEmoji(playerId, emoji) {
        if (this.isOnline && !this.isHost) {
            // Push emoji action
            let myIndex = this.players.findIndex(p => p.name === this.myPlayerName);
            push(ref(db, `rooms/${this.roomID}/actions`), {
                type: 'EMOJI',
                playerIndex: myIndex,
                emoji: emoji
            });
            return;
        }

        // Host/Local
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.emoji = emoji;
            this.notifyStateChange();

            setTimeout(() => {
                if (player.emoji === emoji) {
                    player.emoji = '';
                    this.notifyStateChange();
                }
            }, 3000);
        }
    }

    notifyStateChange() {
        // Sync to Firebase if Host
        if (this.isHost && this.isOnline) {
            this.pushStateToFirebase();
        }

        if (this.onStateChange) {
            const playersSnapshot = this.players.map(p => ({
                id: p.id,
                name: p.name,
                isBot: p.isBot,
                hand: [...p.hand], // Create copy to ensure React detects change
                cutsReceived: p.cutsReceived,
                emoji: p.emoji,
                characterId: p.characterId  // Include characterId!
            }));

            this.onStateChange({
                players: playersSnapshot,
                stack: [...this.stack],
                currentTurn: this.currentTurn,
                ledSuit: this.ledSuit,
                gameActive: this.gameActive,
                phase: this.phase,
                notification: this.notification,
                roundHistory: [...this.roundHistory],
                lastWinner: this.lastWinner
            });
        }
    }
}


