import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Game } from '../logic/GameLogic';
import Card from '../components/Card';
import Hand from '../components/Hand';
import Board from '../components/Board';
import Opponent from '../components/Opponent';
import Notification from '../components/Notification';
import MenuModal from '../components/MenuModal';
import EmojiPicker from '../components/EmojiPicker';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// The table (Board) occupies roughly 65% width and 65% of the available height (SCREEN_HEIGHT - 140)
const TABLE_W = SCREEN_WIDTH * 0.65;
const TABLE_H = (SCREEN_HEIGHT - 140) * 0.65;

// Radii for the oval path (slightly larger than the board to sit at the edge)
// Reduced to prevent players from being cut off in 6-player mode
const RX = TABLE_W / 2 + 50; // Reduced from 75 to 50
const RY = TABLE_H / 2 + 25; // Reduced from 35 to 25

const SEAT_DEFINITIONS: Record<string, { x: number, y: number }> = {
    'LEFT': { x: -RX, y: 0 },
    'TOP-LEFT': { x: -RX * 0.8, y: -RY * 0.8 },
    'TOP': { x: 0, y: -RY },
    'TOP-RIGHT': { x: RX * 0.8, y: -RY * 0.8 },
    'RIGHT': { x: RX, y: 0 },
    'BOTTOM-RIGHT': { x: RX * 0.8, y: RY * 0.8 },
    'BOTTOM': { x: 0, y: RY },
    'BOTTOM-LEFT': { x: -RX * 0.8, y: RY * 0.8 },
};

const SEAT_CONFIGS: Record<number, string[]> = {
    3: ['LEFT', 'TOP', 'RIGHT'],
    4: ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'],
    5: ['LEFT', 'TOP-LEFT', 'TOP-RIGHT', 'RIGHT', 'BOTTOM'],
    6: ['LEFT', 'TOP-LEFT', 'TOP-RIGHT', 'RIGHT', 'BOTTOM'], // 2 top, 2 bottom (1 is player), 1 left, 1 right
};

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const roomID = params.roomID as string;
    const isHost = params.isHost === 'true'; // Params are strings
    const playerName = params.playerName as string || 'You';
    const playerCount = params.playerCount ? parseInt(params.playerCount as string) : 4;
    const showCharacters = params.showCharacters === 'true';

    const [gameState, setGameState] = useState<any>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const gameRef = useRef<any>(null);

    useEffect(() => {
        // Initialize game with params
        gameRef.current = new Game((newState: any) => {
            setGameState(newState);
        }, {
            roomID: roomID,
            isHost: isHost,
            playerName: playerName,
            playerCharacter: params.playerCharacter as string || 'char1',
            playerCount: playerCount
        });

        // Auto-start for convenience if local or Host
        const timer = setTimeout(() => {
            if (gameRef.current && !gameRef.current.gameActive && (!roomID || isHost)) {
                console.log("Auto-starting game...");
                gameRef.current.startGame();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleRestartGame = () => {
        if (gameRef.current) {
            gameRef.current.startGame();
        }
    };

    const handleQuitGame = () => {
        // If online, maybe leave room logic here?
        // For now, just navigate back
        router.dismissAll();
        // Or router.replace('/');
    };

    const handleSendEmoji = (emoji: string) => {
        if (gameState && gameRef.current) {
            // Find my ID to send emoji
            const myPlayer = gameState.players.find((p: any) => p.name === playerName) || gameState.players[0];
            gameRef.current.setEmoji(myPlayer.id, emoji);
            setEmojiPickerVisible(false);
        }
    };

    if (!gameState) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Game...</Text>
                {roomID && <Text style={styles.loadingSubText}>Room: {roomID}</Text>}
            </View>
        );
    }

    // Identify "Me" and Opponents
    const myPlayer = gameState.players.find((p: any) => p.name === playerName) || gameState.players[0];
    const myIndex = gameState.players.findIndex((p: any) => p.id === myPlayer.id);
    const totalPlayers = gameState.players.length;

    // Get seat config for this player count
    const config = SEAT_CONFIGS[totalPlayers] || SEAT_CONFIGS[4];

    // Find the home/bottom seat index for the user's perspective
    // Original working configuration - player position in seat array
    const homeSeatMap: Record<number, number> = {
        3: 0,  // Player at index 0 (LEFT position conceptually)
        4: 3,  // Player at index 3 (BOTTOM)
        5: 4,  // Player at index 4 (BOTTOM)
        6: 4   // Player at index 4 (BOTTOM) - with new config this works
    };
    const homeIndex = homeSeatMap[totalPlayers] ?? 0;

    // Function to get seat for a player index
    const getSeatForPlayer = (playerIndex: number) => {
        // Shift seats so myIndex maps to homeIndex
        const seatIndex = (playerIndex - myIndex + homeIndex + totalPlayers) % totalPlayers;
        const seatName = config[seatIndex];
        return SEAT_DEFINITIONS[seatName] || SEAT_DEFINITIONS['TOP'];
    };

    return (
        <LinearGradient
            colors={['#1a0e0e', '#2d1b1b', '#1a2d1a']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar hidden={true} />

                {/* Settings Button */}
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <Ionicons name="settings-outline" size={28} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                {/* Emoji Button */}
                <TouchableOpacity
                    style={styles.emojiButton}
                    onPress={() => setEmojiPickerVisible(true)}
                >
                    <Text style={{ fontSize: 24 }}>😀</Text>
                </TouchableOpacity>

                {roomID && (
                    <View style={styles.roomCodeContainer}>
                        <Text style={styles.roomCodeText}>Room: {roomID}</Text>
                    </View>
                )}

                <MenuModal
                    visible={menuVisible}
                    onClose={() => setMenuVisible(false)}
                    onRestart={handleRestartGame}
                    onQuit={handleQuitGame}
                />

                <EmojiPicker
                    visible={emojiPickerVisible}
                    onClose={() => setEmojiPickerVisible(false)}
                    onSelect={handleSendEmoji}
                />

                {/* Game Table Content */}
                <View style={styles.gameTable}>

                    {/* Predefined Seat Opponent Layout */}
                    <View style={styles.opponentsContainer}>
                        {gameState.players.map((p: any, idx: number) => {
                            // Don't render "Me" as an opponent avatar if we have the Hand area
                            // But usually, in poker apps, "Me" also has an avatar.
                            // However, the existing layout has Hand at the bottom.
                            // If we use the seats exactly, "Me" occupies the bottom slot.
                            if (idx === myIndex) return null;

                            const seatPos = getSeatForPlayer(idx);

                            // "Face toward center" rotation
                            // Vector from seat to center (0,0) is (-seatPos.x, -seatPos.y)
                            const angleRad = Math.atan2(-seatPos.y, -seatPos.x);
                            let angleDeg = (angleRad * 180) / Math.PI;

                            const inverseAngle = -(angleDeg + 90);

                            return (
                                <View
                                    key={p.id}
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: [
                                            { translateX: seatPos.x - 40 },
                                            { translateY: seatPos.y - 30 },
                                            { rotate: `${angleDeg + 90}deg` }
                                        ],
                                        zIndex: 100
                                    }}
                                >
                                    <View style={{ transform: [{ rotate: `${inverseAngle}deg` }] }}>
                                        <Opponent
                                            player={p}
                                            isActive={gameState.currentTurn === p.id}
                                            showCharacters={showCharacters}

                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Central Board Area */}
                    <View style={styles.boardContainer}>
                        <Board
                            stack={gameState.stack}
                            ledSuit={gameState.ledSuit}
                            roundHistory={gameState.roundHistory}
                            lastWinner={gameState.lastWinner}
                            playerCount={gameState.players.length}
                            myPlayerId={myPlayer.id}
                            myIndex={myIndex}
                            phase={gameState.phase}
                            gameActive={gameState.gameActive}
                            myCharacterId={myPlayer.characterId}
                            showCharacters={showCharacters}
                        />

                        {!gameState.gameActive && (myPlayer.hand || []).length === 0 && (isHost || !roomID) && (
                            <View style={styles.startOverlay}>
                                <Text style={styles.startBtn} onPress={() => gameRef.current.startGame()}>
                                    START GAME
                                </Text>
                            </View>
                        )}
                        {/* Waiting for Host Message */}
                        {!gameState.gameActive && roomID && !isHost && (
                            <View style={styles.startOverlay}>
                                <Text style={styles.startBtn}>Waiting for Host...</Text>
                            </View>
                        )}
                    </View>

                    {/* Player Hand Area */}
                    <View style={styles.playerContainer}>
                        <View style={styles.playerInfo}>
                            {/* Player Character Avatar */}
                            {showCharacters && myPlayer.characterId && (
                                <View style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    overflow: 'hidden',
                                    borderWidth: 2,
                                    borderColor: '#f1c40f',
                                    marginRight: 10,
                                    backgroundColor: '#34495e'
                                }}>
                                    <Image
                                        source={
                                            myPlayer.characterId === 'char1' ? require('../assets/images/characters/char1_neutral.png') :
                                                myPlayer.characterId === 'char2' ? require('../assets/images/characters/char2_neutral.png') :
                                                    myPlayer.characterId === 'char3' ? require('../assets/images/characters/char3_neutral.png') :
                                                        myPlayer.characterId === 'char4' ? require('../assets/images/characters/char4_neutral.png') :
                                                            myPlayer.characterId === 'char5' ? require('../assets/images/characters/char5_neutral.png') :
                                                                myPlayer.characterId === 'char6' ? require('../assets/images/characters/char6_neutral.png') :
                                                                    myPlayer.characterId === 'char7' ? require('../assets/images/characters/char7_neutral.png') :
                                                                        myPlayer.characterId === 'char8' ? require('../assets/images/characters/char8_neutral.png') :
                                                                            myPlayer.characterId === 'char9' ? require('../assets/images/characters/char9_neutral.png') :
                                                                                myPlayer.characterId === 'char10' ? require('../assets/images/characters/char10_neutral.png') :
                                                                                    require('../assets/images/characters/char11_neutral.png')
                                        }
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}
                            <Text style={[styles.turnText, gameState.currentTurn === myPlayer.id && styles.yourTurn]}>
                                {gameState.currentTurn === myPlayer.id ? "YOUR TURN" :
                                    !gameState.gameActive ? "Game Over" : `${gameState.players[gameState.currentTurn].name}'s Turn`}
                            </Text>
                        </View>

                        {myPlayer.emoji ? (
                            <Animated.View
                                entering={FadeInDown.springify()}
                                exiting={FadeOut.duration(500)}
                                style={styles.userEmojiContainer}
                            >
                                <Text style={styles.emojiText}>{myPlayer.emoji}</Text>
                            </Animated.View>
                        ) : null}

                        <Hand
                            hand={myPlayer.hand || []}
                            onPlay={(index: number) => gameRef.current.playCard(index)}
                            currentTurn={gameState.currentTurn}
                            disabled={gameState.currentTurn !== myPlayer.id}
                            phase={gameState.phase}
                            ledSuit={gameState.ledSuit}
                        />
                    </View>
                </View>

                {/* Overlay Elements */}
                {/* Fancy Game Over Overlay */}
                {gameState.gameOver && (
                    <View style={styles.fullScreenOverlay}>
                        <View style={styles.gameOverContainer}>
                            <Text style={styles.overlayTitle}>GAME OVER</Text>
                            <Text style={styles.overlaySubtitle}>{gameState.loserName} Lost!</Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={[styles.actionButton, styles.playAgainButton]} onPress={handleRestartGame}>
                                    <Text style={styles.buttonText}>PLAY AGAIN</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.actionButton, styles.exitButton]} onPress={handleQuitGame}>
                                    <Text style={styles.buttonText}>EXIT</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {!gameState.gameActive && !roomID && !gameState.gameOver && (
                    <View style={styles.fullScreenOverlay}>
                        {/* Only show this large overlay in Local mode initial state for effect */}
                        {(myPlayer.hand || []).length === 0 && (
                            <Text style={styles.overlayTitle}>INBAWK</Text>
                        )}
                    </View>
                )}

                <Notification msg={gameState.notification} />

            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    gameTable: {
        flex: 1,
        // No column layout, we overlay
    },
    opponentsContainer: {
        ...StyleSheet.absoluteFillObject,
        top: 0,
        bottom: 140, // Reserve space for player hand
        zIndex: 100, // Highest priority: Player names/avatars
        pointerEvents: 'box-none'
    },
    boardContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible', // Allow animations to start outside board area
        zIndex: 1, // Sit below player avatars
        pointerEvents: 'box-none',
        marginTop: 0
    },
    playerContainer: {
        height: 140, // Increased for better touch target
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        zIndex: 100, // Ensure controls are on top
    },
    settingsButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 300,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20
    },
    roomCodeContainer: {
        position: 'absolute',
        top: 15,
        left: 70,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        zIndex: 250
    },
    roomCodeText: {
        color: '#f1c40f',
        fontWeight: 'bold'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    loadingText: {
        color: 'white',
        fontSize: 20,
    },
    loadingSubText: {
        color: '#aaa',
        marginTop: 10
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5
    },
    turnText: {
        color: '#bdc3c7',
        fontWeight: 'bold',
        fontSize: 14,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    yourTurn: {
        color: '#2ecc71',
        fontSize: 18,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    fullScreenOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
        pointerEvents: 'none' // Let touches pass through if just title
    },
    overlayTitle: {
        color: '#f1c40f',
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    overlaySubtitle: {
        color: '#ccc',
        marginTop: 20,
        fontSize: 16
    },
    startOverlay: {
        position: 'absolute',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    startBtn: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    gameOverContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f1c40f',
        width: '80%',
        maxWidth: 400
    },
    buttonContainer: {
        marginTop: 30,
        width: '100%',
        gap: 15
    },
    actionButton: {
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    playAgainButton: {
        backgroundColor: '#27ae60', // Green
        borderWidth: 2,
        borderColor: '#2ecc71'
    },
    exitButton: {
        backgroundColor: '#c0392b', // Red
        borderWidth: 2,
        borderColor: '#e74c3c'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1
    },
    emojiButton: {
        position: 'absolute',
        top: 10,
        left: 15,
        zIndex: 300,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20
    },
    userEmojiContainer: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        padding: 10,
        zIndex: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#ccc'
    },
    emojiText: {
        fontSize: 24,
    }
});
