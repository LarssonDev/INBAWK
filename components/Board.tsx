import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Image } from 'react-native';
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
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import Card from './Card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// The table (Board) occupies roughly 90% width and 80% of the available height (SCREEN_HEIGHT - 140)
const TABLE_W = SCREEN_WIDTH * 0.9;
const TABLE_H = (SCREEN_HEIGHT - 140) * 0.8;

// Radii for the oval path (slightly larger than the board to sit at the edge)
// Radii for the oval path (slightly larger than the board to sit at the edge)
const RX = TABLE_W / 2 + 25;
const RY = TABLE_H / 2 + 30;

const SEAT_DEFINITIONS: Record<string, { x: number, y: number }> = {
    'LEFT': { x: -RX, y: 0 },
    'TOP-LEFT': { x: -RX * 0.75, y: -RY * 0.85 },
    'TOP': { x: 0, y: -RY + 10 },
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

const CHARACTER_IMAGES: any = {
    char1: require('../assets/images/characters/char1_neutral.png'),
    char2: require('../assets/images/characters/char2_neutral.png'),
    char3: require('../assets/images/characters/char3_neutral.png'),
    char4: require('../assets/images/characters/char4_neutral.png'),
    char5: require('../assets/images/characters/char5_neutral.png'),
    char6: require('../assets/images/characters/char6_neutral.png'),
    char7: require('../assets/images/characters/char7_neutral.png'),
    char8: require('../assets/images/characters/char8_neutral.png'),
    char9: require('../assets/images/characters/char9_neutral.png'),
    char10: require('../assets/images/characters/char10_neutral.png'),
    char11: require('../assets/images/characters/char11_neutral.png'),
};

// SelfAvatar Component - Supports both character images and classic emojis
const SelfAvatar = ({ characterId, showCharacters }: { characterId?: string, showCharacters?: boolean }) => {
    const useCharacterImage = showCharacters && characterId && CHARACTER_IMAGES[characterId];

    if (useCharacterImage) {
        return (
            <View style={{
                position: 'absolute',
                bottom: -30,
                right: -10,
                width: 50,
                height: 50,
                borderRadius: 25,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: 'white',
                zIndex: 9999,
                elevation: 10,
                backgroundColor: '#34495e'
            }}>
                <Image
                    source={CHARACTER_IMAGES[characterId]}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Classic emoji fallback
    return (
        <View style={{
            position: 'absolute',
            bottom: -30,
            right: -10,
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#34495e',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'white',
            zIndex: 9999,
            elevation: 10
        }}>
            <Text style={{ fontSize: 30 }}>😐</Text>
        </View>
    );
};

// AnimatedCard Component
const AnimatedCard = ({ card, index, startPos, finalPos, lastWinner, winnerPos }: any) => {
    const randomRotation = React.useMemo(() => Math.random() * 60 - 30, []);

    const translateX = useSharedValue(startPos.x);
    const translateY = useSharedValue(startPos.y);
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);


    // Initial Entry Animation (Throw / Slam)
    useEffect(() => {
        async function playSlamSound() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
                const { sound } = await Audio.Sound.createAsync(
                    require('../Game_music/freesound_community-cardsound32562-37691.wav')
                );
                await sound.playAsync();
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        sound.unloadAsync();
                    }
                });
            } catch (error) {
                // Silently ignore audio errors
            }
        }

        playSlamSound();

        // Slam effect
        const slamDuration = 300;
        translateX.value = withTiming(finalPos.x, { duration: slamDuration, easing: Easing.out(Easing.quad) });
        translateY.value = withTiming(finalPos.y, { duration: slamDuration, easing: Easing.out(Easing.quad) });

        // Scale effect
        scale.value = withSequence(
            withTiming(1.2, { duration: 0 }),
            withTiming(1, { duration: slamDuration, easing: Easing.out(Easing.quad) })
        );

        rotation.value = withTiming(randomRotation, { duration: slamDuration });
    }, []);

    // Winning/Exit Animation (Swipe away)
    useEffect(() => {
        if (lastWinner == null || winnerPos == null) return;

        const exitDuration = 500;
        const baseDelay = 200;
        const exitDelay = baseDelay + index * 80;

        translateX.value = withDelay(exitDelay, withTiming(winnerPos.x, { duration: exitDuration, easing: Easing.in(Easing.quad) }));
        translateY.value = withDelay(exitDelay, withTiming(winnerPos.y, { duration: exitDuration, easing: Easing.in(Easing.quad) }));

        scale.value = withDelay(exitDelay, withTiming(0.5, { duration: exitDuration }));
    }, [lastWinner]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotation.value}deg` },
            { scale: scale.value }
        ]
    }));

    return (
        <Animated.View style={[styles.cardPos, animatedStyle, { zIndex: 1000 + index }]}>
            <Card suit={card.suit} rank={card.rank} disabled={true} noEntering={true} />
        </Animated.View>
    );
};

// ShufflingDeck Component
const ShufflingDeck = () => {
    const progress = useSharedValue(0);
    const leftPileCards = 8;
    const rightPileCards = 8;

    useEffect(() => {
        let sound: Audio.Sound | null = null;
        async function playShuffleSound() {
            try {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                });
                const { sound: s } = await Audio.Sound.createAsync(
                    require('../Game_music/shuffle.mp3')
                );
                sound = s;
                await s.playAsync();
            } catch (e) {
                // Silently ignore audio errors
            }
        }
        playShuffleSound();

        progress.value = withSequence(
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(2, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
            withTiming(3, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
            withTiming(4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withDelay(200, withTiming(0, { duration: 0 }))
        );

        const loopInterval = setInterval(() => {
            progress.value = withSequence(
                withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                withTiming(2, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
                withTiming(3, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
                withTiming(4, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withDelay(200, withTiming(0, { duration: 0 }))
            );
            playShuffleSound();
        }, 3000);

        return () => {
            clearInterval(loopInterval);
            if (sound) sound.unloadAsync();
        };
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
        const splitProgress = interpolate(p, [0, 1], [0, 1], Extrapolate.CLAMP);
        const splitX = pile === 'left' ? -40 * splitProgress : 40 * splitProgress;

        const riffleProgress = interpolate(p, [1, 2], [0, 1], Extrapolate.CLAMP);
        const cardDelay = index / totalCards;
        const riffleOffset = interpolate(riffleProgress, [cardDelay, cardDelay + 0.3], [0, 1], Extrapolate.CLAMP);
        const riffleX = interpolate(riffleOffset, [0, 1], [splitX, 0]);
        const riffleY = interpolate(riffleOffset, [0, 0.5, 1], [0, -20, 0]);

        const bridgeProgress = interpolate(p, [2, 3], [0, 1], Extrapolate.CLAMP);
        const bridgeY = interpolate(bridgeProgress, [0, 0.5, 1], [0, -60 + (index * 3), 0]);
        const bridgeRotation = interpolate(bridgeProgress, [0, 0.5, 1], [0, pile === 'left' ? -15 : 15, 0]);

        const finalX = interpolate(p, [0, 1, 2, 3, 4], [0, splitX, riffleX, 0, 0]);
        const finalY = interpolate(p, [0, 1, 2, 3, 4], [0, 0, riffleY, bridgeY, 0]);
        const finalRotation = interpolate(p, [0, 1, 2, 3, 4], [0, 0, 0, bridgeRotation, 0]);

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

// DealingDeals Component
const DealingDeals = ({ playerCount, myIndex, getSeatPosition }: any) => {
    const totalCards = 52;
    const cardsPerPlayer = Math.floor(totalCards / playerCount);
    const dealableCards = Array.from({ length: playerCount * cardsPerPlayer });

    return (
        <>
            {dealableCards.map((_, i) => {
                const targetPlayerId = i % playerCount;
                const config = SEAT_CONFIGS[playerCount] || SEAT_CONFIGS[4];
                const homeIndex = config.length - 1;
                const seatIndex = (targetPlayerId - myIndex + homeIndex + playerCount) % playerCount;
                let seatName = config[seatIndex];
                let seatPos = getSeatPosition(targetPlayerId);

                if (targetPlayerId === myIndex) {
                    seatName = 'BOTTOM';
                    seatPos = SEAT_DEFINITIONS['BOTTOM'];
                }

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

const DealingCard = ({ index, targetPos, seatName, playerCount, cardNumberForPlayer, totalCardsPerPlayer }: any) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const rotation = useSharedValue(0);

    useEffect(() => {
        const dealInterval = 80;
        const delay = index * dealInterval;
        const slideDuration = 600;

        // Play sound
        if (index % 2 === 0) {
            setTimeout(async () => {
                try {
                    await Audio.setAudioModeAsync({
                        playsInSilentModeIOS: true,
                        staysActiveInBackground: false,
                        shouldDuckAndroid: true,
                    });
                    const { sound } = await Audio.Sound.createAsync(
                        require('../Game_music/freesound_community-cardsound32562-37691.wav'),
                        { volume: 0.5 }
                    );
                    await sound.playAsync();
                    sound.setOnPlaybackStatusUpdate((s) => {
                        if (s.isLoaded && s.didJustFinish) sound.unloadAsync();
                    });
                } catch (e) {
                    // Silently ignore audio errors - not critical to gameplay
                }
            }, delay);
        }

        const rotations: any = {
            'BOTTOM': 0, 'BOTTOM-RIGHT': -45, 'RIGHT': -90, 'TOP-RIGHT': -135,
            'TOP': 180, 'TOP-LEFT': 135, 'LEFT': 90, 'BOTTOM-LEFT': 45,
        };
        const targetRotation = rotations[seatName] || 0;
        const fanSpread = 5;
        const fanOffset = (cardNumberForPlayer - totalCardsPerPlayer / 2) * fanSpread;

        let finalX = targetPos.x;
        let finalY = targetPos.y;

        if (seatName === 'BOTTOM') {
            finalX += fanOffset;
            finalY += 250;
        } else if (seatName === 'TOP') {
            finalX += fanOffset;
        } else if (seatName === 'LEFT' || seatName === 'RIGHT') {
            finalY += fanOffset;
        } else {
            finalX += fanOffset * 0.7;
            finalY += fanOffset * 0.7;
        }


        opacity.value = 1;
        scale.value = 1;
        rotation.value = 0;

        translateX.value = withDelay(delay, withTiming(finalX, { duration: slideDuration, easing: Easing.out(Easing.cubic) }));
        translateY.value = withDelay(delay, withTiming(finalY, { duration: slideDuration, easing: Easing.out(Easing.cubic) }));
        rotation.value = withDelay(delay, withTiming(targetRotation, { duration: slideDuration, easing: Easing.out(Easing.quad) }));

        scale.value = withDelay(delay + slideDuration,
            withSequence(
                withTiming(1.3, { duration: 150 }),
                withSpring(1.0, { damping: 8, stiffness: 150 })
            )
        );

        opacity.value = withDelay(delay + slideDuration - 200, withTiming(0, { duration: 200 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value - 30 },
                { translateY: translateY.value - 45 },
                { scale: scale.value },
                { rotate: `${rotation.value}deg` }
            ],
            opacity: opacity.value
        };
    });

    return (
        <Animated.View style={[styles.cardPos, animatedStyle, { zIndex: 9999 - index }]}>
            <Card suit="s" rank="A" disabled={true} back={true} noEntering={true} />
        </Animated.View>
    );
};

// Main Board Component
const Board = ({ stack, ledSuit, roundHistory, lastWinner, myPlayerId, myIndex, playerCount, phase, gameActive, myCharacterId, showCharacters }: any) => {

    const getSeatPosition = (playerId: number) => {
        const totalPlayers = playerCount || 4;
        const config = SEAT_CONFIGS[totalPlayers] || SEAT_CONFIGS[4];
        const homeIndex = config.length - 1;

        const absoluteIndex = playerId;
        const seatIndex = (absoluteIndex - myIndex + homeIndex + totalPlayers) % totalPlayers;
        const seatName = config[seatIndex];
        return SEAT_DEFINITIONS[seatName] || SEAT_DEFINITIONS['TOP'];
    };

    const getStartPosition = (playerId: any) => {
        if (playerId === myPlayerId) {
            return { x: 0, y: 600 };
        }
        const pos = getSeatPosition(playerId);
        return { x: pos.x * 1.5, y: pos.y * 1.5 };
    };

    const getWinnerPosition = (winnerId: any) => {
        const pos = getSeatPosition(winnerId);
        return { x: pos.x * 1.5, y: pos.y * 1.5 };
    };

    const getSuitSymbol = (suit: string) => {
        const symbols: any = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
        return symbols[suit] || suit;
    };

    return (
        <View style={styles.container}>
            <View style={styles.stackArea}>
                {/* Background Layer */}
                <View style={styles.feltContainer}>
                    <LinearGradient
                        colors={['#2d5a3d', '#1e3c29']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.goldRim} />
                </View>

                {/* Decorative Layer */}
                <View style={styles.decorationsContainer} pointerEvents="none">
                    {/* Central Logo */}
                    <View style={styles.centralLogoContainer}>
                        <Image
                            source={require('../assets/images/board.png')}
                            style={styles.centralLogo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Circular rings around the logo */}
                    <View style={styles.logoRing1} />
                    <View style={styles.logoRing2} />
                    <View style={styles.logoRing3} />

                    <View style={styles.innerRing} />
                    <View style={styles.innerRingSmall} />
                    <View style={[styles.diamond, styles.diamondTop]} />
                    <View style={[styles.diamond, styles.diamondBottom]} />
                    <View style={[styles.diamond, styles.diamondLeft]} />
                    <View style={[styles.diamond, styles.diamondRight]} />
                    <View style={styles.crossLineHorizontal} />
                    <View style={styles.crossLineVertical} />
                </View>

                {/* Content Layer */}
                <View style={styles.logoContainer}>
                    {/* Led Suit Display */}
                    {ledSuit && (
                        <View style={{
                            position: 'absolute',
                            top: -80,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            paddingHorizontal: 20,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: '#f1c40f',
                            zIndex: 100
                        }}>
                            <Text style={{
                                color: '#f1c40f',
                                fontSize: 16,
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                Led Suit: {getSuitSymbol(ledSuit)}
                            </Text>
                        </View>
                    )}

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

                    {/* Visual 3D Deck Stack */}
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

                            const IN_FRONT_SCALE = 0.4;
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
        </View>
    );
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
    },
    decorationsContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        // zIndex: -1, // Removed to ensure visibility over felt
    },
    centralLogoContainer: {
        position: 'absolute',
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: 90,
        borderWidth: 4,
        borderColor: 'rgba(212, 175, 55, 0.5)', // Gold with opacity
        // backgroundColor: '#1e3c29', // REMOVED as requested
        overflow: 'hidden',
        // elevation: 5, // REMOVED shadow/elevation
        opacity: 0.7, // "make the opacity little less" -> more transparent
    },
    centralLogo: {
        width: '100%', // Fill the container
        height: '100%',
    },
    logoRing1: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.6)',
        borderStyle: 'solid',
    },
    logoRing2: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.4)',
        borderStyle: 'dashed',
    },
    logoRing3: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        borderStyle: 'solid',
    },
    innerRing: {
        position: 'absolute',
        width: '85%',
        height: '85%',
        borderRadius: 200,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        borderStyle: 'dashed',
    },
    innerRingSmall: {
        position: 'absolute',
        width: '60%',
        height: '60%',
        borderRadius: 200,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.15)',
    },
    diamond: {
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: '#d4af37',
        transform: [{ rotate: '45deg' }],
        opacity: 0.6,
    },
    diamondTop: { top: 15 },
    diamondBottom: { bottom: 15 },
    diamondLeft: { left: 25 },
    diamondRight: { right: 25 },
    crossLineHorizontal: {
        position: 'absolute',
        width: '90%',
        height: 1,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    crossLineVertical: {
        position: 'absolute',
        width: 1,
        height: '90%',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14
    },
    cardPos: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -30 }, { translateY: -45 }]
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
    }
});

export default Board;
