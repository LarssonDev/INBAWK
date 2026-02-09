import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CharacterAssets from '../constants/CharacterAssets';

const Opponent = ({ player, isActive, showCharacters }: any) => {
    // Determine avatar display
    const charId = player.characterId;
    const hasAsset = charId && CharacterAssets[charId];
    const useCharacterImage = showCharacters && hasAsset;

    const bgColor = '#666';
    const avatarEmoji = player.name ? player.name.charAt(0).toUpperCase() : '?';

    return (
        <View style={[styles.container, isActive && styles.active]}>
            {useCharacterImage ? (
                <View style={styles.avatarContainer}>
                    <Image
                        source={CharacterAssets[charId].neutral}
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

                {/* Signal Strength Indicator */}
                <View style={styles.signalContainer}>
                    <Ionicons
                        name="cellular"
                        size={12}
                        color={
                            (player.ping || 50) < 80 ? '#2ecc71' :
                                (player.ping || 50) < 150 ? '#f1c40f' : '#e74c3c'
                        }
                    />
                    <Text style={[styles.pingText, {
                        color: (player.ping || 50) < 80 ? '#2ecc71' :
                            (player.ping || 50) < 150 ? '#f1c40f' : '#e74c3c'
                    }]}>
                        {player.ping != null ? `${player.ping}ms` : '...'}
                    </Text>
                </View>
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
    pingText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    signalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10
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
