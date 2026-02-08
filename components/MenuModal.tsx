import React, { useState } from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Hardcoded rules for simplicity in this component
const RULES_TEXT = `
1️⃣ Players & Cards
- Players: 3 to 8
- Deck: Standard 52-card deck (No Jokers)

2️⃣ Objective
- Finish all your cards as fast as possible.

3️⃣ Playing a Round
- The starting player plays any card.
- Others must play the same suit (higher or lower).
- If you don't have the suit, you "CUT" by playing a different suit.

4️⃣ Cut Rule (Critical!)
- When a cut happens (someone plays a different suit):
- The round ends immediately.
- The player with the highest card of the led suit BEFORE the cut picks up ALL cards played in that round.
- That player starts the next round.

5️⃣ No-Cut Round
- If everyone follows suit, cards are cleared.
- The player with the highest card starts the next round.

6️⃣ Game Over
- The game ends when only one player has cards left. That player loses.
`;

interface MenuModalProps {
    visible: boolean;
    onClose: () => void;
    onRestart: () => void;
    onQuit: () => void;
}

const MenuModal = ({ visible, onClose, onRestart, onQuit }: MenuModalProps) => {
    const [showRules, setShowRules] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const renderCardButton = (title: string, subtitle: string, rank: string, suit: string, color: string, onPress: () => void) => (
        <TouchableOpacity style={styles.cardButton} onPress={onPress}>
            <View style={styles.cardCorner}>
                <Text style={styles.cardRank}>{rank}</Text>
                <Text style={[styles.cardSuit, { color: color }]}>{suit}</Text>
            </View>
            <Text style={styles.cardButtonText}>{title}</Text>
            <Text style={styles.cardSubtext}>{subtitle}</Text>
            {/* Bottom-Right Corner for balance */}
            <View style={[styles.cardCorner, { top: undefined, bottom: 6, left: undefined, right: 10, transform: [{ rotate: '180deg' }] }]}>
                <Text style={styles.cardRank}>{rank}</Text>
                <Text style={[styles.cardSuit, { color: color }]}>{suit}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
            hardwareAccelerated={true}
        >
            <View style={styles.centeredView}>
                <LinearGradient
                    colors={['#c04000', '#8b2500', '#a0301a']}
                    style={styles.modalGradient}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>PAUSED</Text>

                        {showRules ? (
                            <View style={styles.rulesContainer}>
                                <Text style={styles.sectionTitle}>How to Play</Text>
                                <ScrollView style={styles.scrollView}>
                                    <Text style={styles.rulesText}>{RULES_TEXT}</Text>
                                </ScrollView>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => setShowRules(false)}
                                >
                                    <Text style={styles.actionButtonText}>Back</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.menuContainer}>
                                {/* Button Grid */}
                                <View style={styles.buttonGrid}>
                                    {renderCardButton("RESUME", "Continue Game", "▶", "♠", "black", onClose)}
                                    {renderCardButton("RESTART", "Start Over", "↺", "♣", "black", () => {
                                        onRestart();
                                        onClose();
                                    })}
                                    {renderCardButton("RULES", "How to Play", "?", "♦", "red", () => setShowRules(true))}
                                    {renderCardButton("QUIT", "Main Menu", "✕", "♥", "red", onQuit)}
                                </View>

                                {/* Sound Toggle */}
                                <View style={styles.settingRow}>
                                    <Text style={styles.settingText}>Sound Effects</Text>
                                    <Switch
                                        trackColor={{ false: "#767577", true: "#2ecc71" }}
                                        thumbColor={soundEnabled ? "#f4f3f4" : "#f4f3f4"}
                                        onValueChange={setSoundEnabled}
                                        value={soundEnabled}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker dim for focus
    },
    modalGradient: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 3, // Create a border effect if needed, or just container
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        borderWidth: 2,
        borderColor: '#ffd700', // Gold border
    },
    modalContent: {
        padding: 15,
        alignItems: 'center',
        width: '100%',
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#ffd700', // Gold
        marginBottom: 10,
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        textTransform: 'uppercase',
    },
    menuContainer: {
        width: '100%',
        alignItems: 'center',
    },
    buttonGrid: {
        width: '100%',
        gap: 8,
        marginBottom: 15,
    },
    // CARD BUTTON STYLES (Matching Index.tsx)
    cardButton: {
        backgroundColor: '#fff',
        paddingVertical: 10, // Slightly more compact than main menu
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    cardCorner: {
        position: 'absolute',
        top: 4,
        left: 10,
        alignItems: 'center',
    },
    cardRank: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    cardSuit: {
        fontSize: 12,
        color: '#000',
    },
    cardButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    cardSubtext: {
        fontSize: 9,
        color: '#666',
        textAlign: 'center',
        marginTop: 1,
    },
    // SETTINGS ROW
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 8,
        borderRadius: 10,
    },
    settingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // RULES
    rulesContainer: {
        width: '100%',
        height: 350, // Fixed height for rules
    },
    sectionTitle: {
        color: '#ffd700', // Gold
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        alignSelf: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.3)', // Darker background for readability
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)', // Gold border accent
    },
    rulesText: {
        color: '#fff',
        lineHeight: 22,
        fontSize: 14,
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#7f8c8d',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        width: '100%',
        borderWidth: 2,
        borderColor: '#333',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default MenuModal;
