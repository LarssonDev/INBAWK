import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';

const SYMBOLS: any = {
    's': '♠', 'h': '♥', 'd': '♦', 'c': '♣'
};

const Card = ({ suit, rank, onPress, disabled, style, back, noEntering }: any) => {
    const { width } = useWindowDimensions();

    const styles = useMemo(() => {
        const BASE_WIDTH = 800;
        const RAW_SCALE = width / BASE_WIDTH;
        // Adjust scale for mobiles to ensure readability
        const SCALE = width < 500 ? 0.9 : Math.max(0.8, Math.min(1.4, RAW_SCALE));

        // Slightly increased from previous step (approx 60% of original)
        const CARD_WIDTH = 40 * SCALE;
        const CARD_HEIGHT = 60 * SCALE;

        return StyleSheet.create({
            card: {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: 'white',
                borderRadius: 3.5 * SCALE,
                padding: 2 * SCALE,
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1.5 },
                shadowOpacity: 0.25,
                shadowRadius: 2,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#ccc'
            },
            disabled: {
                backgroundColor: '#f0f0f0'
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
                fontSize: 8.5 * SCALE,
                fontWeight: 'bold',
                lineHeight: 9.5 * SCALE
            },
            largeSymbol: {
                fontSize: 16 * SCALE,
            },
            red: { color: '#e74c3c' },
            black: { color: '#2c3e50' },
            cardBack: {
                backgroundColor: '#2980b9',
                borderColor: '#fff',
                borderWidth: 2 * SCALE,
                padding: 4 * SCALE,
            },
            backPattern: {
                flex: 1,
                backgroundColor: '#3498db',
                borderRadius: 3 * SCALE,
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
                borderRadius: 1.5 * SCALE,
                justifyContent: 'center',
                alignItems: 'center',
            },
            backLogo: {
                color: 'white',
                fontSize: 20 * SCALE,
                fontWeight: 'bold',
                opacity: 0.5,
                fontStyle: 'italic',
            }
        });
    }, [width]);

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

export default Card;
