import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

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

const Opponent = ({ player, isActive, showCharacters }: any) => {
    // Determine avatar display
    const useCharacterImage = showCharacters && player.characterId && CHARACTER_IMAGES[player.characterId];
    const bgColor = '#666';
    const avatarEmoji = player.name ? player.name.charAt(0).toUpperCase() : '?';

    return (
        <View style={[styles.container, isActive && styles.active]}>
            {useCharacterImage ? (
                <View style={styles.avatarContainer}>
                    <Image
                        source={CHARACTER_IMAGES[player.characterId]}
                        style={styles.avatarImage}
                        resizeMode="cover"
                    />
                </View>
            ) : (
                <View style={[styles.avatar, { backgroundColor: bgColor }]}>
                    <Text style={styles.avatarText}>{avatarEmoji}</Text>
                </View>
            )}
            <View style={styles.info}>
                <Text style={styles.name}>{player.name}</Text>
                <Text style={styles.cardCount}>{player.hand.length} Cards</Text>
            </View>
            {player.emoji && (
                <View style={styles.emojiContainer}>
                    <Text style={styles.emojiText}>{player.emoji}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 6,
        minWidth: 60,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    active: {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderColor: '#ffd700',
        borderWidth: 1
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 4,
        borderWidth: 2,
        borderColor: 'white',
        overflow: 'hidden',
        backgroundColor: '#333'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'white'
    },
    avatarText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold'
    },
    info: {
        alignItems: 'center'
    },
    name: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 2
    },
    cardCount: {
        color: '#f1c40f',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emojiContainer: {
        position: 'absolute',
        top: -30,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 5,
        zIndex: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4
    },
    emojiText: {
        fontSize: 28,
    }
});

export default Opponent;
