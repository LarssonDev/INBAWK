import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';

const SYMBOLS: any = {
    's': '♠', 'h': '♥', 'd': '♦', 'c': '♣'
};

const Card = ({ suit, rank, onPress, disabled, style, back, noEntering }: any) => {
    const CardContent = (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || back}
            activeOpacity={back ? 1 : 0.8}
            style={[styles.card, (disabled && !back) && styles.disabled, back && styles.cardBack]}
        >
            {back ? (
                <View style={styles.backPattern}>
                    <View style={styles.backInner}>
                        <Text style={styles.backLogo}>I</Text>
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.topLeft}>
                        <Text style={[styles.text, ['h', 'd'].includes(suit) ? styles.red : styles.black]}>{rank}</Text>
                        <Text style={[styles.text, ['h', 'd'].includes(suit) ? styles.red : styles.black]}>{SYMBOLS[suit]}</Text>
                    </View>
                    <View style={styles.center}>
                        <Text style={[styles.largeSymbol, ['h', 'd'].includes(suit) ? styles.red : styles.black]}>{SYMBOLS[suit]}</Text>
                    </View>
                    <View style={styles.bottomRight}>
                        <Text style={[styles.text, ['h', 'd'].includes(suit) ? styles.red : styles.black]}>{rank}</Text>
                        <Text style={[styles.text, ['h', 'd'].includes(suit) ? styles.red : styles.black]}>{SYMBOLS[suit]}</Text>
                    </View>
                </>
            )}
        </TouchableOpacity>
    );

    if (noEntering) {
        return <View style={style}>{CardContent}</View>;
    }

    return (
        <Animated.View
            entering={ZoomIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={style}
        >
            {CardContent}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 60,  // Standard size (matches user preference)
        height: 90,
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 4,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#ccc'
    },
    disabled: {
        // opacity: 0.6, // Removed opacity to prevent "glass" look -> now solid
        backgroundColor: '#f0f0f0' // Subtle gray to indicate non-interactive but solid
    },
    topLeft: {
        alignItems: 'center',
    },
    bottomRight: {
        alignItems: 'center',
        transform: [{ rotate: '180deg' }]
    },
    center: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 12, // Reduced from 16
        fontWeight: 'bold',
    },
    largeSymbol: {
        fontSize: 24, // Reduced from 32
    },
    red: { color: '#e74c3c' },
    black: { color: '#2c3e50' },
    cardBack: {
        backgroundColor: '#2980b9', // Deep blue back
        borderColor: '#fff',
        borderWidth: 3,
        padding: 5,
    },
    backPattern: {
        flex: 1,
        backgroundColor: '#3498db',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backInner: {
        width: '80%',
        height: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backLogo: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        opacity: 0.5,
        fontStyle: 'italic',
    }
});

export default Card;
