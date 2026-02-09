import React from 'react';
import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import Card from './Card';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 45; // Match new card size
const MAX_HAND_WIDTH = SCREEN_WIDTH - 10; // Maximized width

const Hand = ({ hand, onPlay, disabled, currentTurn, phase, ledSuit }: any) => {
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

    // Calculate overlap
    const totalCards = hand.length;
    let overlap = 0;

    if (totalCards > 1) {
        const totalNonOverlappingWidth = totalCards * CARD_WIDTH;
        if (totalNonOverlappingWidth > MAX_HAND_WIDTH) {
            // Formula to fit cards exactly in MAX_HAND_WIDTH
            overlap = (totalNonOverlappingWidth - MAX_HAND_WIDTH) / (totalCards - 1);
        } else {
            // If they fit content, add a small negative margin anyway for "fanned" look?
            if (totalCards > 5) overlap = 15;
            else overlap = 5;
        }
    }

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
                                        zIndex: isFocused ? 1000 : index,
                                        elevation: isFocused ? 1000 : index,
                                        transform: [
                                            { translateY: isFocused ? -40 : 0 },
                                            { scale: isFocused ? 1.25 : 1 }
                                        ]
                                    }
                                ]}
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
        height: 85,
        paddingVertical: 0,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        marginBottom: 2
    },
    handContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 5
    },
    cardWrapper: {
        // Wrapper manages positioning
    },
    card: {
        // Ensure card fits
    }
});

export default Hand;
