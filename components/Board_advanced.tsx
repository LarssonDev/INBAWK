import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withSequence,
    Easing,
    runOnJS,
    FadeIn,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import Card from './Card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// The table (Board) occupies roughly 90% width and 80% of the available height (SCREEN_HEIGHT - 140)
const TABLE_W = SCREEN_WIDTH * 0.9;
const TABLE_H = (SCREEN_HEIGHT - 140) * 0.8;

// Radii for the oval path (slightly larger than the board to sit at the edge)
const RX = TABLE_W / 2 + 10;
const RY = TABLE_H / 2 + 20;

const SEAT_DEFINITIONS: Record<string, { x: number, y: number }> = {
    'LEFT': { x: -RX, y: 0 },
    'TOP-LEFT': { x: -RX * 0.75, y: -RY * 0.85 },
    'TOP': { x: 0, y: -RY + 35 },
    'TOP-RIGHT': { x: RX * 0.75, y: -RY * 0.85 },
    'RIGHT': { x: RX, y: 0 },
    'BOTTOM-RIGHT': { x: RX * 0.7, y: RY * 0.7 },
    'BOTTOM': { x: 0, y: RY + 20 },
    'BOTTOM-LEFT': { x: -RX * 0.7, y: RY * 0.7 },
};

const SEAT_CONFIGS: Record<number, string[]> = {
    3: ['LEFT', 'TOP', 'RIGHT'],
    4: ['LEFT', 'TOP', 'RIGHT', 'BOTTOM'],
    5: ['LEFT', 'TOP-LEFT', 'TOP-RIGHT', 'RIGHT', 'BOTTOM'],
    6: ['LEFT', 'TOP-LEFT', 'TOP-RIGHT', 'RIGHT', 'BOTTOM-RIGHT', 'BOTTOM-LEFT'],
};

const Board = ({ stack, ledSuit, roundHistory, lastWinner, myPlayerId, myIndex, playerCount, phase, gameActive }: any) => {

    const getSeatPosition = (playerId: number) => {
        const totalPlayers = playerCount || 4;
        const config = SEAT_CONFIGS[totalPlayers] || SEAT_CONFIGS[4];
        const homeIndex = config.length - 1; // Last seat is Bottom (Me)

        const absoluteIndex = playerId;
        const seatIndex = (absoluteIndex - myIndex + homeIndex + totalPlayers) % totalPlayers;
        const seatName = config[seatIndex];
        return SEAT_DEFINITIONS[seatName] || SEAT_DEFINITIONS['TOP'];
    };

    const getStartPosition = (playerId: any) => {
        // For local player, start from the Hand area (off-table)
        if (playerId === myPlayerId) {
            return { x: 0, y: 600 };
        }
        // For others, start from slightly BEYOND their seat for a clearer "fly in"
        const pos = getSeatPosition(playerId);
        return { x: pos.x * 1.5, y: pos.y * 1.5 };
    };

    const getWinnerPosition = (winnerId: any) => {
        const pos = getSeatPosition(winnerId);
        return { x: pos.x * 1.5, y: pos.y * 1.5 };
    };

    console.log('[BOARD] Rendering. Stack:', stack?.length);

    return (
        <View style={styles.container}>
            <View style={styles.infoArea}>
                <Text style={styles.infoText}>
                    Led Suit: {ledSuit ? getSuitSymbol(ledSuit) : 'None'}
                </Text>
            </View>
            <View style={styles.stackArea}>
                {/* Background Layer: Felt & Rim (Strictly Clipped) */}
                <View style={styles.feltContainer}>
                    <LinearGradient
                        colors={['#2d5a3d', '#1e3c29']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.goldRim} />
                </View>

                {/* Content Layer (Cards fly OVER the edges) */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>INBAWK</Text>
                    <View style={styles.logoUnderline} />
                </View>

                <View style={styles.centerCircle} />

                {phase === 'SHUFFLING' && <ShufflingDeck />}
                {phase === 'DEALING' && (
                    <View style={{ position: 'absolute', top: -100, zIndex: 9999 }}>
                        <Text style={{ color: 'gold', fontWeight: 'bold' }}>DEALING CARDS...</Text>
                    </View>
                )}
                {phase === 'DEALING' && (
                    <DealingDeals
                        playerCount={playerCount}
                        myIndex={myIndex}
                        getSeatPosition={getSeatPosition}
                    />
                )}
                {/* Visual 3D Deck Stack (Centerpiece) - Only show when NOT active and not in deal flow */}
                {!gameActive && phase !== 'SHUFFLING' && phase !== 'DEALING' && (
                    <View style={styles.deckPosition}>
                        {[...Array(10)].map((_, i) => (
                            <View key={i} style={[styles.shufflingCard, { bottom: i * 0.5, right: i * 0.2, opacity: 1 - i * 0.05, borderLeftWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }]}>
                                <Card back={true} noEntering={true} />
                            </View>
                        ))}
                    </View>
                )}

                {stack.length === 0 ? (
                    <Text style={styles.emptyText}></Text>
                ) : (
                    stack.map((card: any, index: any) => {
                        const playerMove = roundHistory[index];
                        const playerId = playerMove ? playerMove.player.id : -1;

                        const startPosition = getStartPosition(playerId);
                        const seatPos = getSeatPosition(playerId);

                        const IN_FRONT_SCALE = 0.55;
                        const jitterX = (Math.random() - 0.5) * 25;
                        const jitterY = (Math.random() - 0.5) * 25;

                        const finalPosition = {
                            x: (seatPos.x * IN_FRONT_SCALE) + jitterX,
                            y: (seatPos.y * IN_FRONT_SCALE) + jitterY
                        };

                        return (
                            <AnimatedCard
                                key={card.id || index}
                                card={card}
                                index={index}
                                startPos={startPosition}
                                finalPos={finalPosition}
                                lastWinner={lastWinner}
                                winnerPos={lastWinner != null ? getWinnerPosition(lastWinner) : null}
                            />
                        );
                    })
                )}
            </View>
        </View>
    );
};

const AnimatedCard = ({ card, index, startPos, finalPos, lastWinner, winnerPos }: any) => {
    const randomRotation = React.useMemo(() => Math.random() * 60 - 30, []);

    const translateX = useSharedValue(startPos.x);
    const translateY = useSharedValue(startPos.y);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    console.log('[ANIMATED_CARD] Created for card:', card.id, 'Initial opacity:', 1);

    // Initial Entry Animation (Throw / Slam)
    useEffect(() => {
        console.log('[ANIMATED_CARD] Entry animation for:', card.id);

        async function playSlamSound() {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    require('../Game_music/freesound_community-cardsound32562-37691.wav')
                );
                await sound.playAsync();
                // Automatically unload to free resources after playback
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        sound.unloadAsync();
                    }
                });
            } catch (error) {
                console.log('Error playing sound:', error);
            }
        }

        playSlamSound();

        // Slam effect: Fast entry with slight overshoot or just hard stop
        const slamDuration = 300;
        translateX.value = withTiming(finalPos.x, { duration: slamDuration, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(finalPos.y, { duration: slamDuration, easing: Easing.out(Easing.quad) });

        // Scale effect to emphasize impact (start slightly larger, slam down to 1)
        scale.value = withSequence(
            withTiming(1.2, { duration: 0 }), // Start big
            withTiming(1, { duration: slamDuration, easing: Easing.out(Easing.quad) }) // Slam to normal
        );

        rotation.value = withTiming(randomRotation, { duration: slamDuration });
    }, []);

    // Winning/Exit Animation (Swipe away)
    useEffect(() => {
        if (lastWinner == null || winnerPos == null) return;

        console.log('[ANIMATED_CARD] Triggering SWIPE animation for card:', card.id);

        const exitDuration = 500;
        const baseDelay = 200;
        const exitDelay = baseDelay + index * 80;

        translateX.value = withDelay(exitDelay, withTiming(winnerPos.x, { duration: exitDuration, easing: Easing.in(Easing.quad) }));
        translateY.value = withDelay(exitDelay, withTiming(winnerPos.y, { duration: exitDuration, easing: Easing.in(Easing.quad) }));
        opacity.value = withDelay(exitDelay, withTiming(0, { duration: exitDuration }));
        scale.value = withDelay(exitDelay, withTiming(0.5, { duration: exitDuration }));
    }, [lastWinner]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ],
        opacity: opacity.value
    }));

    return (
        <Animated.View style={[styles.cardPos, animatedStyle, { zIndex: 1000 + index }]}>
            <Card suit={card.suit} rank={card.rank} disabled={true} noEntering={true} />
        </Animated.View>
    );
};

// ADVANCED SHUFFLING ANIMATION with Riffle, Bridge, and 3D effects
const ShufflingDeck = () => {
    const progress = useSharedValue(0);

    // Create multiple card piles for riffle effect
    const leftPileCards = 8;
    const rightPileCards = 8;

    useEffect(() => {
        // Complete shuffle cycle: split -> riffle -> bridge -> square
        progress.value = withSequence(
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), // Split
            withTiming(2, { duration: 800, easing: Easing.inOut(Easing.cubic) }), // Riffle
            withTiming(3, { duration: 600, easing: Easing.out(Easing.back(1.5)) }), // Bridge
            withTiming(4, { duration: 400, easing: Easing.inOut(Easing.ease) }), // Square
            withDelay(200, withTiming(0, { duration: 0 })) // Reset and loop
        );

        // Loop the animation
        const loopInterval = setInterval(() => {
            progress.value = withSequence(
                withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                withTiming(2, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
                withTiming(3, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
                withTiming(4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withDelay(200, withTiming(0, { duration: 0 }))
            );
        }, 3000);

        return () => clearInterval(loopInterval);
    }, []);

    return (
        <View style={styles.deckPosition}>
            {/* Left Pile */}
            {[...Array(leftPileCards)].map((_, i) => (
                <ShuffleCard
                    key={`left-${i}`}
                    index={i}
                    pile="left"
                    totalCards={leftPileCards}
                    progress={progress}
                />
            ))}

            {/* Right Pile */}
            {[...Array(rightPileCards)].map((_, i) => (
                <ShuffleCard
                    key={`right-${i}`}
                    index={i}
                    pile="right"
                    totalCards={rightPileCards}
                    progress={progress}
                />
            ))}
        </View>
    );
};

const ShuffleCard = ({ index, pile, totalCards, progress }: any) => {
    const animatedStyle = useAnimatedStyle(() => {
        const p = progress.value;

        // Phase 0-1: Split the deck
        const splitProgress = interpolate(p, [0, 1], [0, 1], Extrapolate.CLAMP);
        const splitX = pile === 'left' ? -40 * splitProgress : 40 * splitProgress;

        // Phase 1-2: Riffle shuffle (interleave)
        const riffleProgress = interpolate(p, [1, 2], [0, 1], Extrapolate.CLAMP);
        const cardDelay = index / totalCards;
        const riffleOffset = interpolate(
            riffleProgress,
            [cardDelay, cardDelay + 0.3],
            [0, 1],
            Extrapolate.CLAMP
        );
        const riffleX = interpolate(riffleOffset, [0, 1], [splitX, 0]);
        const riffleY = interpolate(riffleOffset, [0, 0.5, 1], [0, -20, 0]); // Arc motion

        // Phase 2-3: Bridge effect (cards arch up)
        const bridgeProgress = interpolate(p, [2, 3], [0, 1], Extrapolate.CLAMP);
        const bridgeY = interpolate(
            bridgeProgress,
            [0, 0.5, 1],
            [0, -60 + (index * 3), 0]
        ); // Arching motion with cascade
        const bridgeRotation = interpolate(
            bridgeProgress,
            [0, 0.5, 1],
            [0, pile === 'left' ? -15 : 15, 0]
        );

        // Phase 3-4: Square the deck
        const squareProgress = interpolate(p, [3, 4], [0, 1], Extrapolate.CLAMP);

        // Combine all transformations
        const finalX = interpolate(p, [0, 1, 2, 3, 4], [0, splitX, riffleX, 0, 0]);
        const finalY = interpolate(p, [0, 1, 2, 3, 4], [0, 0, riffleY, bridgeY, 0]);
        const finalRotation = interpolate(p, [0, 1, 2, 3, 4], [0, 0, 0, bridgeRotation, 0]);

        // 3D depth effect
        const zOffset = interpolate(bridgeProgress, [0, 0.5, 1], [0, index * 2, 0]);
        const scale = interpolate(bridgeProgress, [0, 0.5, 1], [1, 1 + index * 0.02, 1]);

        return {
            transform: [
                { translateX: finalX },
                { translateY: finalY },
                { rotate: `${finalRotation}deg` },
                { scale: scale }
            ],
            zIndex: 100 + index + zOffset,
            opacity: 1,
        };
    });

    return (
        <Animated.View style={[styles.shufflingCard, animatedStyle, { bottom: index * 0.5, right: pile === 'left' ? index * 0.2 : -index * 0.2 }]}>
            <Card back={true} noEntering={true} />
        </Animated.View>
    );
};

// ADVANCED DEALING ANIMATION with arc trajectories and fan effects
const DealingDeals = ({ playerCount = 4, myIndex = 0, getSeatPosition }: any) => {
    const totalCards = 52;
    const safePlayerCount = Math.max(1, playerCount);
    const cardsPerPlayer = Math.floor(totalCards / safePlayerCount);
    const dealableCards = Array.from({ length: safePlayerCount * cardsPerPlayer });

    return (
        <>
            {dealableCards.map((_, i) => {
                const targetPlayerId = i % playerCount;
                const seatPos = getSeatPosition(targetPlayerId);

                // Determine seat name to calculate rotation
                const config = SEAT_CONFIGS[playerCount] || SEAT_CONFIGS[4];
                const homeIndex = config.length - 1;
                const seatIndex = (targetPlayerId - myIndex + homeIndex + playerCount) % playerCount;
                const seatName = config[seatIndex];

                // Calculate which card number this is for the player (for fan effect)
                const cardNumberForPlayer = Math.floor(i / playerCount);

                return (
                    <DealingCard
                        key={i}
                        index={i}
                        targetPos={seatPos}
                        seatName={seatName}
                        playerCount={playerCount}
                        cardNumberForPlayer={cardNumberForPlayer}
                        totalCardsPerPlayer={cardsPerPlayer}
                    />
                );
            })}
        </>
    );
};

const DealingCard = ({ index, targetPos, seatName, playerCount = 4, cardNumberForPlayer, totalCardsPerPlayer }: any) => {
    useEffect(() => {
        console.log('[DEALING_CARD] Rendering card', index, 'to', seatName);
    }, []);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        const dealInterval = 50; // Faster dealing
        const delay = index * dealInterval;
        const duration = 400; // Smoother flight

        // Play sound for every 3rd card for smoother audio
        if (index % 3 === 0) {
            setTimeout(async () => {
                try {
                    const { sound } = await Audio.Sound.createAsync(
                        require('../Game_music/freesound_community-cardsound32562-37691.wav'),
                        { volume: 0.4 }
                    );
                    await sound.playAsync();
                    sound.setOnPlaybackStatusUpdate((s) => {
                        if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
                    });
                } catch (e) {
                    console.log('Deal sound error:', e);
                }
            }, delay);
        }

        const rotations: any = {
            'BOTTOM': 0, 'BOTTOM-RIGHT': -45, 'RIGHT': -90, 'TOP-RIGHT': -135,
            'TOP': 180, 'TOP-LEFT': 135, 'LEFT': 90, 'BOTTOM-LEFT': 45,
        };
        const targetRotation = rotations[seatName] || 0;

        // Calculate fan offset for stacking effect
        const fanSpread = 3; // Pixels between cards
        const fanOffset = (cardNumberForPlayer - totalCardsPerPlayer / 2) * fanSpread;

        // Adjust final position based on seat orientation
        // Adjust final position based on seat orientation
        let finalX = targetPos.x;
        let finalY = targetPos.y;

        if (seatName === 'BOTTOM') {
            finalX += fanOffset;
            finalY += 250; // FLY INTO HAND (Overcome the "disappearing" issue)
        } else if (seatName === 'TOP') {
            finalX += fanOffset;
        } else if (seatName === 'LEFT') {
            finalY += fanOffset;
        } else if (seatName === 'RIGHT') {
            finalY += fanOffset;
        }

        // Appear with scale - Make it very obvious
        opacity.value = withDelay(delay, withTiming(1, { duration: 150 }));
        scale.value = withDelay(delay, withSequence(withTiming(1.3, { duration: 100 }), withSpring(1.0)));

        // Add spinning effect during flight
        rotation.value = withDelay(
            delay,
            withTiming(targetRotation + 720, { duration, easing: Easing.out(Easing.cubic) })
        );

        // Arc trajectory (Slightly exaggerated for visibility)
        const flightX = targetPos?.x || 0;
        const flightY = targetPos?.y || 0;

        console.log(`[DEALING_CARD ${index}] Flying to ${seatName} at (${flightX}, ${flightY})`);

        translateX.value = withDelay(delay, withTiming(finalX, { duration: 600, easing: Easing.out(Easing.quad) }));
        translateY.value = withDelay(delay, withTiming(finalY, { duration: 600, easing: Easing.out(Easing.quad) }));

        // Fade out after arrival - Hold for longer to ensure user sees it
        opacity.value = withDelay(delay + 600 + 1000, withTiming(0, { duration: 300 }));
        scale.value = withDelay(delay + 600 + 1000, withTiming(0.8, { duration: 300 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value - 30 }, // Apply centering offset here
                { translateY: translateY.value - 45 },
                { scale: scale.value },
                { rotate: `${rotation.value}deg` }
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Animated.View style={[styles.cardPos, animatedStyle, { zIndex: 9999 - index }]}>
            <Card suit="s" rank="A" disabled={true} back={true} noEntering={true} />
        </Animated.View>
    );
};

const getSuitSymbol = (suit: string) => {
    const symbols: any = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
    return symbols[suit] || suit;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    infoArea: {
        position: 'absolute',
        bottom: -30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 15,
        zIndex: 0
    },
    infoText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold'
    },
    stackArea: {
        width: '94%',
        height: '84%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2d5a3d',
        borderRadius: 200,
        borderWidth: 12,
        borderColor: '#3e2511',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 20,
        overflow: 'visible',
    },
    feltContainer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 200,
        overflow: 'hidden',
    },
    goldRim: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderColor: '#d4af37',
        borderRadius: 200,
        margin: 2,
        opacity: 0.8
    },
    logoContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.15,
    },
    logoText: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 10,
        fontStyle: 'italic',
    },
    logoUnderline: {
        width: '80%',
        height: 2,
        backgroundColor: '#fff',
        marginTop: -5,
    },
    centerCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14
    },
    cardPos: {
        position: 'absolute',
        top: '50%',
        left: '50%',
    },
    deckPosition: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        zIndex: 10,
        transform: [{ translateX: -30 }, { translateY: -45 }]
    },
    shufflingCard: {
        position: 'absolute',
        width: 60,
        height: 90,
        // Remove individual transforms here as they are handled by animated styles or deckPosition
    }
});

export default Board;
