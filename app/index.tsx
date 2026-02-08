import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database';
import { app } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GenericMenuScreen() {
    const router = useRouter();
    const [playerName, setPlayerName] = useState('');
    const [menuView, setMenuView] = useState<'MAIN' | 'ONLINE' | 'SETTINGS' | 'BOT_SELECT'>('MAIN');
    const [onlineTab, setOnlineTab] = useState<'CREATE' | 'JOIN'>('CREATE');

    // Online Form State
    const [roomCode, setRoomCode] = useState('');
    const [playerCount, setPlayerCount] = useState(4);
    const [loading, setLoading] = useState(false);

    // Bot Selection State
    const [botCount, setBotCount] = useState(3); // Total players (user + bots) = 4 by default

    // Settings Modal
    const [tempName, setTempName] = useState('');
    const [selectedChar, setSelectedChar] = useState('char1');

    const db = getDatabase(app);

    useEffect(() => {
        loadPlayerName();
    }, []);

    const loadPlayerName = async () => {
        try {
            const savedName = await AsyncStorage.getItem('playerName');
            const savedChar = await AsyncStorage.getItem('playerCharacter');


            if (savedName) {
                setPlayerName(savedName);
                setTempName(savedName);
            } else {
                setPlayerName('Player');
                setTempName('Player');
            }

            if (savedChar) {
                setSelectedChar(savedChar);
            }
        } catch (e) {
            console.error("Failed to load name", e);
        }
    };

    const savePlayerName = async () => {
        if (!tempName.trim()) {
            Alert.alert("Name", "Please enter a valid name.");
            return;
        }
        try {
            await AsyncStorage.setItem('playerName', tempName);
            await AsyncStorage.setItem('playerCharacter', selectedChar);

            setPlayerName(tempName);
            setMenuView('MAIN');
        } catch (e) {
            console.error("Failed to save name", e);
        }
    };

    const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handlePlaySolo = () => {
        if (!playerName.trim()) {
            setMenuView('SETTINGS');
            return;
        }
        setMenuView('BOT_SELECT');
    };

    const startSoloGame = () => {
        // Navigate to game with selected bot count
        router.push({
            pathname: '/game',
            params: {
                roomID: '', // Empty = Local
                playerName: playerName,
                playerCharacter: selectedChar,
                showCharacters: 'true',
                isHost: 'true',
                playerCount: String(botCount + 1) // botCount + user
            }
        });
    };

    const handleCreateRoom = async () => {
        if (!playerName.trim()) {
            setMenuView('SETTINGS');
            return;
        }

        setLoading(true);
        const newRoomCode = generateRoomCode();
        const roomRef = ref(db, `rooms/${newRoomCode}`);

        try {
            const snapshot = await get(roomRef);
            if (snapshot.exists()) {
                setLoading(false);
                handleCreateRoom(); // Retry
                return;
            }

            await set(roomRef, {
                host: playerName,
                status: 'WAITING',
                maxPlayers: playerCount,
                players: {
                    0: {
                        name: playerName,
                        id: 0,
                        characterId: selectedChar,
                        isHost: true,
                        ready: true
                    }
                },
                createdAt: Date.now()
            });

            setLoading(false);
            router.push({
                pathname: '/waiting-room',
                params: {
                    roomID: newRoomCode,
                    playerName: playerName,
                    playerCharacter: selectedChar,
                    showCharacters: 'true',
                    isHost: 'true'
                }
            });

        } catch (error) {
            console.error(error);
            setLoading(false);
            Alert.alert('Error', 'Could not create room.');
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim()) {
            setMenuView('SETTINGS');
            return;
        }
        if (!roomCode.trim()) {
            Alert.alert('Error', 'Please enter room code.');
            return;
        }

        setLoading(true);
        const code = roomCode.toUpperCase();
        const roomRef = ref(db, `rooms/${code}`);

        try {
            const snapshot = await get(roomRef);
            if (!snapshot.exists()) {
                setLoading(false);
                Alert.alert('Error', 'Room not found.');
                return;
            }

            const roomData = snapshot.val();
            if (roomData.status !== 'WAITING') {
                setLoading(false);
                Alert.alert('Error', 'Game already started.');
                return;
            }

            const currentPlayersCount = Object.keys(roomData.players || {}).length;
            if (currentPlayersCount >= roomData.maxPlayers) {
                setLoading(false);
                Alert.alert('Error', 'Room is full.');
                return;
            }

            let newPlayerId = 1;
            // Simplified ID generation for now (might collide if someone leaves? but okay for MVP)
            // Ideally: find first gap
            const existingIds = Object.values(roomData.players || {}).map((p: any) => p.id);
            while (existingIds.includes(newPlayerId)) {
                newPlayerId++;
            }

            const playerRef = child(roomRef, `players/${newPlayerId}`);
            await set(playerRef, {
                name: playerName,
                id: newPlayerId,
                characterId: selectedChar,
                isHost: false,
                ready: true
            });

            setLoading(false);
            router.push({
                pathname: '/waiting-room',
                params: {
                    roomID: code,
                    playerName: playerName,
                    isHost: 'false'
                }
            });

        } catch (error) {
            console.error(error);
            setLoading(false);
            Alert.alert('Error', 'Could not join room.');
        }
    };

    const renderMainMenu = () => (
        <View style={styles.menuContainer}>
            {/* Card Game Title with Suits */}
            <View style={styles.titleContainer}>
                <View style={styles.suitRow}>
                    <Text style={styles.suitSymbol}>♠</Text>
                    <Text style={styles.suitSymbol}>♥</Text>
                    <Text style={styles.suitSymbol}>♣</Text>
                    <Text style={styles.suitSymbol}>♦</Text>
                </View>
                <Text style={styles.gameTitle}>INBAWK</Text>
                <Text style={styles.gameSubtitle}>The Ultimate Card Game</Text>
            </View>

            {/* Player Card Badge */}
            <TouchableOpacity onPress={() => setMenuView('SETTINGS')} style={styles.playerCard}>
                <Text style={styles.playerLabel}>PLAYER</Text>
                <Text style={styles.playerNameText}>{playerName}</Text>
            </TouchableOpacity>

            {/* Playing Card Style Buttons */}
            <View style={styles.buttonGrid}>
                <TouchableOpacity
                    style={styles.cardButton}
                    onPress={handlePlaySolo}
                >
                    <View style={styles.cardCorner}>
                        <Text style={styles.cardRank}>A</Text>
                        <Text style={styles.cardSuit}>♠</Text>
                    </View>
                    <Text style={styles.cardButtonText}>SOLO PLAY</Text>
                    <Text style={styles.cardSubtext}>Against AI</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => setMenuView('ONLINE')}
                >
                    <View style={styles.cardCorner}>
                        <Text style={styles.cardRank}>K</Text>
                        <Text style={[styles.cardSuit, { color: '#e74c3c' }]}>♥</Text>
                    </View>
                    <Text style={styles.cardButtonText}>ONLINE</Text>
                    <Text style={styles.cardSubtext}>With Friends</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cardButton}
                    onPress={() => router.push('/rules')}
                >
                    <View style={styles.cardCorner}>
                        <Text style={styles.cardRank}>?</Text>
                        <Text style={styles.cardSuit}>♣</Text>
                    </View>
                    <Text style={styles.cardButtonText}>RULES</Text>
                    <Text style={styles.cardSubtext}>Learn to Play</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOnlineMenu = () => (
        <View style={styles.menuContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setMenuView('MAIN')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Online Multiplayer</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, onlineTab === 'CREATE' && styles.activeTab]}
                    onPress={() => setOnlineTab('CREATE')}
                >
                    <Text style={[styles.tabText, onlineTab === 'CREATE' && styles.activeTabText]}>Create Room</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, onlineTab === 'JOIN' && styles.activeTab]}
                    onPress={() => setOnlineTab('JOIN')}
                >
                    <Text style={[styles.tabText, onlineTab === 'JOIN' && styles.activeTabText]}>Join Room</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
                {onlineTab === 'CREATE' ? (
                    <>
                        <Text style={styles.label}>Max Players: {playerCount}</Text>
                        <View style={styles.playerCountRow}>
                            {[3, 4, 5, 6].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={[styles.countButton, playerCount === num && styles.countButtonSelected]}
                                    onPress={() => setPlayerCount(num)}
                                >
                                    <Text style={[styles.countText, playerCount === num && styles.countTextSelected]}>{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2ecc71' }]} onPress={handleCreateRoom} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Create Room</Text>}
                        </TouchableOpacity>
                        <Text style={styles.helperText}>You will be the host.</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Room Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Code (e.g. A1B2C3)"
                            placeholderTextColor="#7f8c8d"
                            value={roomCode}
                            onChangeText={setRoomCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3498db' }]} onPress={handleJoinRoom} disabled={loading}>
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Join Room</Text>}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    const renderBotSelection = () => (
        <View style={styles.menuContainer}>
            <View style={styles.titleContainer}>
                <Text style={styles.gameTitle}>SELECT PLAYERS</Text>
                <Text style={styles.gameSubtitle}>Choose Total Player Count</Text>
            </View>

            <View style={styles.buttonGrid}>
                {[2, 3, 4, 5, 6].map((count) => (
                    <TouchableOpacity
                        key={count}
                        style={[
                            styles.cardButton,
                            botCount === count - 1 && styles.selectedButton
                        ]}
                        onPress={() => setBotCount(count - 1)}
                    >
                        <View style={styles.cardCorner}>
                            <Text style={styles.cardRank}>{count}</Text>
                            <Text style={styles.cardSuit}>♠</Text>
                        </View>
                        <Text style={styles.cardButtonText}>{count} PLAYERS</Text>
                        <Text style={styles.cardSubtext}>
                            {count === 2 ? '1 Bot' : `${count - 1} Bots`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#7f8c8d', flex: 1 }]}
                    onPress={() => setMenuView('MAIN')}
                >
                    <Text style={styles.actionButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#27ae60', flex: 1 }]}
                    onPress={startSoloGame}
                >
                    <Text style={styles.actionButtonText}>Start Game</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSettings = () => (
        <View style={styles.menuContainer}>
            <View style={styles.titleContainer}>
                <Text style={styles.gameTitle}>SETTINGS</Text>
            </View>
            <View style={styles.formSection}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#95a5a6"
                    value={tempName}
                    onChangeText={setTempName}
                />

                <Text style={styles.label}>Choose Character</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                        { id: 'char1', img: require('../assets/images/characters/char1_neutral.png') },
                        { id: 'char2', img: require('../assets/images/characters/char2_neutral.png') },
                        { id: 'char3', img: require('../assets/images/characters/char3_neutral.png') },
                        { id: 'char4', img: require('../assets/images/characters/char4_neutral.png') },
                        { id: 'char5', img: require('../assets/images/characters/char5_neutral.png') },
                        { id: 'char6', img: require('../assets/images/characters/char6_neutral.png') },
                        { id: 'char7', img: require('../assets/images/characters/char7_neutral.png') },
                        { id: 'char8', img: require('../assets/images/characters/char8_neutral.png') },
                        { id: 'char9', img: require('../assets/images/characters/char9_neutral.png') },
                        { id: 'char10', img: require('../assets/images/characters/char10_neutral.png') },
                        { id: 'char11', img: require('../assets/images/characters/char11_neutral.png') },
                    ].map((char) => (
                        <TouchableOpacity
                            key={char.id}
                            onPress={() => setSelectedChar(char.id)}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                borderWidth: selectedChar === char.id ? 3 : 1,
                                borderColor: selectedChar === char.id ? '#f1c40f' : '#fff',
                                overflow: 'hidden',
                                backgroundColor: '#34495e',
                                margin: 5
                            }}
                        >
                            <Image
                                source={char.img}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9b59b6' }]} onPress={savePlayerName}>
                    <Text style={styles.actionButtonText}>Save Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <LinearGradient
            colors={['#c04000', '#8b2500', '#a0301a']}
            style={styles.container}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {menuView === 'MAIN' && renderMainMenu()}
                        {menuView === 'ONLINE' && renderOnlineMenu()}
                        {menuView === 'SETTINGS' && renderSettings()}
                        {menuView === 'BOT_SELECT' && renderBotSelection()}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </LinearGradient >
    );
}

const MenuButton = ({ title, subtitle, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color="white" />
        </View>
        <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter overlay to see background better
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    menuContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    // Card Game Menu Styles
    titleContainer: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    suitRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    suitSymbol: {
        fontSize: 24,
        color: '#fff',
        opacity: 0.9,
    },
    gameTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffd700',
        letterSpacing: 3,
        textTransform: 'uppercase',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    gameSubtitle: {
        fontSize: 10,
        color: '#fff',
        marginTop: 3,
        letterSpacing: 1,
        opacity: 0.8,
    },
    playerCard: {
        alignSelf: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
        marginBottom: 15,
        minWidth: 120,
        borderWidth: 2,
        borderColor: '#333',
    },
    playerLabel: {
        fontSize: 9,
        color: '#666',
        fontWeight: 'bold',
        letterSpacing: 1,
        textAlign: 'center',
    },
    playerNameText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 2,
    },
    buttonGrid: {
        gap: 10,
    },
    cardButton: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#333',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    cardCorner: {
        position: 'absolute',
        top: 6,
        left: 10,
        alignItems: 'center',
    },
    cardRank: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    cardSuit: {
        fontSize: 16,
        color: '#000',
    },
    cardButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    cardSubtext: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        marginTop: 3,
    },
    selectedButton: {
        backgroundColor: '#ffd700',
        borderColor: '#000',
        borderWidth: 3,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
    },
    formSection: {
        width: '100%',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 5
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        position: 'relative',
        minHeight: 50
    },
    buttonGroup: {
        gap: 15
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    menuTextContainer: {
        flex: 1
    },
    menuTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    menuSubtitle: {
        color: '#95a5a6',
        fontSize: 14
    },
    // Online Menu Styles
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.15)'
    },
    tabText: {
        color: '#95a5a6',
        fontWeight: 'bold'
    },
    activeTabText: {
        color: 'white'
    },
    formContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 20,
        borderRadius: 16
    },
    label: {
        color: '#bdc3c7',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase'
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    playerCountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    countButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    countButtonSelected: {
        backgroundColor: '#f1c40f',
        borderColor: '#f1c40f'
    },
    countText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    countTextSelected: {
        color: '#2c3e50'
    },
    actionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    helperText: {
        color: '#7f8c8d',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 12
    },
    charGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 20
    },
    charOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
        backgroundColor: '#333'
    },
    charOptionSelected: {
        borderColor: '#f1c40f',
        borderWidth: 3,
        transform: [{ scale: 1.1 }]
    },
    charImage: {
        width: '100%',
        height: '100%'
    }
});

