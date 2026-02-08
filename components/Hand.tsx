import React from 'react';
import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import Card from './Card';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 60; // Updated to match new Card size
const MAX_HAND_WIDTH = SCREEN_WIDTH - 20; // 10px padding on each side

const Hand = ({ hand, onPlay, disabled, currentTurn, phase, ledSuit }: any) => {
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

    // Calculate overlap
    const totalCards = hand.length;
    let overlap = 0;

    // Total width if no overlap: totalCards * CARD_WIDTH
    // If that exceeds MAX_HAND_WIDTH, we need negative margin (overlap)
    if (totalCards > 1) {
        const totalNonOverlappingWidth = totalCards * CARD_WIDTH;
        if (totalNonOverlappingWidth > MAX_HAND_WIDTH) {
            // Formula to fit cards exactly in MAX_HAND_WIDTH
            overlap = (totalNonOverlappingWidth - MAX_HAND_WIDTH) / (totalCards - 1);
        } else {
            // If they fit content, add a small negative margin anyway for "fanned" look?
            // Or just 0 if they fit well.
            // Let's add slight overlap for aesthetics if they are many
            if (totalCards > 5) overlap = 15;
            else overlap = 5;
        }
    }

    // Limit overlap to avoid cards being too close (e.g., hiding rank)
    // Adjust if needed, but fitting on screen is priority as per user request

    // Check if player has cards of the led suit
    const hasLedSuit = ledSuit ? hand.some((c: any) => c.suit === ledSuit) : false;

    return (
        <View style={styles.container}>
            {(phase === 'SHUFFLING' || phase === 'DEALING') ? null : (
                <View style={styles.handContainer}>
                    {hand.map((card: any, index: any) => {
                        const isFocused = focusedIndex === index;

                        // During DETERMINE phase, only spades can be played
                        const isSpade = card.suit === 's';
                        let cardDisabled = disabled || (phase === 'DETERMINE' && !isSpade);

                        // Follow suit rule: if player has led suit, must play it
                        if (!cardDisabled && ledSuit && hasLedSuit) {
                            cardDisabled = card.suit !== ledSuit;
                        }

                        return (
                            <Pressable
                                key={card.id || index}
                                style={[
                                    styles.cardWrapper,
                                    {
                                        marginLeft: index === 0 ? 0 : -overlap,
                                        zIndex: isFocused ? 1000 : index, // Stack on top of left card, focused is top
                                        elevation: isFocused ? 1000 : index, // Android z-index
                                        transform: [
                                            { translateY: isFocused ? -40 : 0 },
                                            { scale: isFocused ? 1.25 : 1 }
                                        ]
                                    }
                                ]}
                                // Use PRESS IN/OUT for faster response than TOUCH START/END sometimes
                                onPressIn={() => setFocusedIndex(index)}
                                onPressOut={() => setFocusedIndex(null)}
                            >
                                <Card
                                    suit={card.suit}
                                    rank={card.rank}
                                    onPress={() => onPlay(index)}
                                    disabled={cardDisabled}
                                    style={styles.card}
                                />
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 110, // Reduced from 160
        paddingVertical: 5,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    handContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // No fixed width, let it grow up to screen width
    },
    cardWrapper: {
        // Wrapper manages positioning
    },
    card: {
        // Ensure card fits
    }
});

export default Hand;
