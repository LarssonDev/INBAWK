import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, ImageBackground, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { getDatabase, ref, set, get, child, onValue } from 'firebase/database';
import { app } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GenericMenuScreen() {
    const router = useRouter();
    const [playerName, setPlayerName] = useState('');
    const [menuView, setMenuView] = useState<'MAIN' | 'ONLINE' | 'SETTINGS' | 'PROFILE' | 'BOT_SELECT'>('MAIN');
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
    // New Settings
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    const db = getDatabase(app);

    useEffect(() => {
        loadPlayerName();
    }, []);

    const loadPlayerName = async () => {
        try {
            const savedName = await AsyncStorage.getItem('playerName');
            const savedChar = await AsyncStorage.getItem('playerCharacter');
            const savedSound = await AsyncStorage.getItem('soundEnabled');
            const savedHaptics = await AsyncStorage.getItem('hapticsEnabled');


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

            if (savedSound !== null) setSoundEnabled(savedSound === 'true');
            if (savedHaptics !== null) setHapticsEnabled(savedHaptics === 'true');
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
            await AsyncStorage.setItem('soundEnabled', String(soundEnabled));
            await AsyncStorage.setItem('hapticsEnabled', String(hapticsEnabled));

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

    // Background Pattern Component
    const BackgroundPattern = () => (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Simpler, smaller, more pattern-like background */}
            {Array.from({ length: 40 }).map((_, i) => (
                <Text key={`bg-suit-${i}`} style={{
                    position: 'absolute',
                    top: `${(Math.floor(i / 5) * 12) + (Math.random() * 5)}%`, // Grid-ish rows
                    left: `${(i % 5 * 20) + (Math.random() * 10)}%`, // Grid-ish cols
                    opacity: 0.03 + (Math.random() * 0.02), // subtle variation
                    fontSize: 24 + Math.random() * 12, // Smaller
                    color: i % 2 === 0 ? '#fff' : '#f1c40f', // White and Gold mix
                    transform: [{ rotate: `${-15 + Math.random() * 30}deg` }]
                }}>
                    {['♠', '♥', '♣', '♦'][i % 4]}
                </Text>
            ))}
        </View>
    );

    const renderMainMenu = () => (
        <View style={styles.menuContainer}>
            {/* Header Section */}
            <View style={styles.titleContainer}>
                {/* 4 Suits Row */}
                <View style={styles.suitRow}>
                    <MaterialCommunityIcons name="cards-spade" size={26} color="#ecf0f1" />
                    <MaterialCommunityIcons name="cards-heart" size={26} color="#ff5252" />
                    <MaterialCommunityIcons name="cards-club" size={26} color="#ecf0f1" />
                    <MaterialCommunityIcons name="cards-diamond" size={26} color="#ff5252" />
                </View>
                {/* Title */}
                <Text style={styles.gameTitle}>INBAWK</Text>
                <Text style={styles.gameSubtitle}>The Ultimate Card</Text>
            </View>

            {/* Player Badge */}
            <TouchableOpacity onPress={() => setMenuView('PROFILE')} style={styles.playerBadge}>
                <View style={styles.playerBadgeHeader}>
                    <Text style={styles.playerLabel}>PLAYER</Text>
                </View>
                <Text style={styles.playerNameText}>{playerName}</Text>
            </TouchableOpacity>

            {/* Main Buttons */}
            <View style={styles.buttonGrid}>
                {/* SOLO PLAY */}
                <TouchableOpacity style={styles.mainMenuButton} onPress={handlePlaySolo}>
                    <View style={styles.cardCornerLeft}>
                        <Text style={styles.buttonRank}>A</Text>
                        <Text style={styles.buttonSuit}>♠</Text>
                    </View>

                    <View style={styles.buttonCenter}>
                        <Text style={styles.buttonTitle}>SOLO PLAY</Text>
                        <Text style={styles.buttonSubtitle}>Against AI</Text>
                    </View>
                </TouchableOpacity>

                {/* ONLINE */}
                <TouchableOpacity style={styles.mainMenuButton} onPress={() => setMenuView('ONLINE')}>
                    <View style={styles.cardCornerLeft}>
                        <Text style={[styles.buttonRank, { color: '#c0392b' }]}>K</Text>
                        <Text style={[styles.buttonSuit, { color: '#c0392b' }]}>♥</Text>
                    </View>

                    <View style={styles.buttonCenter}>
                        <Text style={styles.buttonTitle}>ONLINE</Text>
                        <Text style={styles.buttonSubtitle}>With Friends</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerBtn} onPress={() => setMenuView('SETTINGS')}>
                    <Ionicons name="settings-outline" size={20} color="#f1c40f" />
                    <Text style={styles.footerBtnText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerBtn} onPress={() => router.push('/rules')}>
                    <Ionicons name="book-outline" size={20} color="#f1c40f" />
                    <Text style={styles.footerBtnText}>Rules</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerBtn} onPress={() => Alert.alert("Contact Developer", "Email: support@inbawk.com")}>
                    <Ionicons name="mail-outline" size={20} color="#f1c40f" />
                    <Text style={styles.footerBtnText}>Contact</Text>
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setMenuView('MAIN')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Select Players</Text>
            </View>

            <View style={styles.buttonGrid}>
                {[2, 3, 4, 5, 6].map((count) => (
                    <TouchableOpacity
                        key={count}
                        style={[
                            styles.mainMenuButton, // Reuse new button style
                            botCount === count - 1 && styles.selectedButton
                        ]}
                        onPress={() => setBotCount(count - 1)}
                    >
                        <View style={styles.cardCornerLeft}>
                            <Text style={styles.buttonRank}>{count}</Text>
                            <Text style={styles.buttonSuit}>♠</Text>
                        </View>
                        <View style={styles.buttonCenter}>
                            <Text style={styles.buttonTitle}>{count} PLAYERS</Text>
                            <Text style={styles.buttonSubtitle}>
                                {count === 2 ? '1 Bot' : `${count - 1} Bots`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#27ae60', flex: 1, marginTop: 20 }]}
                    onPress={startSoloGame}
                >
                    <Text style={styles.actionButtonText}>Start Game</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderProfile = () => (
        <View style={styles.menuContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setMenuView('MAIN')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Edit Profile</Text>
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

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9b59b6', marginTop: 10 }]} onPress={savePlayerName}>
                    <Text style={styles.actionButtonText}>Save Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSettings = () => (
        <View style={styles.menuContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setMenuView('MAIN')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>Settings</Text>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.label}>Preferences</Text>
                <View style={styles.preferencesContainer}>
                    <View style={styles.preferenceRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="volume-high" size={20} color="white" />
                            <Text style={styles.preferenceLabel}>Sound Effects</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: "#2ecc71" }}
                            thumbColor={soundEnabled ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setSoundEnabled}
                            value={soundEnabled}
                        />
                    </View>
                    <View style={styles.preferenceRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="phone-portrait-outline" size={20} color="white" />
                            <Text style={styles.preferenceLabel}>Haptics / Vibration</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: "#2ecc71" }}
                            thumbColor={hapticsEnabled ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={setHapticsEnabled}
                            value={hapticsEnabled}
                        />
                    </View>
                </View>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3498db', marginTop: 10 }]} onPress={savePlayerName}>
                    <Text style={styles.actionButtonText}>Save Settings</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <LinearGradient
            // Green gradient for casino/poker feel
            // Top: #216335 (Forest Green), Mid: #123d1f, Bot: #051c0a
            colors={['#216335', '#123d1f', '#051c0a']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.container}
        >
            <BackgroundPattern />

            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    {menuView === 'MAIN' ? (
                        <View style={styles.fixedContent}>
                            {renderMainMenu()}
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {menuView === 'ONLINE' && renderOnlineMenu()}
                            {menuView === 'SETTINGS' && renderSettings()}
                            {menuView === 'PROFILE' && renderProfile()}
                            {menuView === 'BOT_SELECT' && renderBotSelection()}
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </View>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    fixedContent: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        width: '100%',
        maxWidth: 500, // Slightly wider to ensure fit
        alignSelf: 'center'
    },
    menuContainer: {
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center'
    },

    // TITLE
    titleContainer: { alignItems: 'center', marginBottom: 10, marginTop: 20 }, // Minimal margins
    suitRow: { flexDirection: 'row', gap: 10, marginBottom: 2, opacity: 0.7 },
    suitSymbol: {
        fontSize: 22,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2
    },
    gameTitle: {
        fontSize: 32, fontWeight: '900', color: '#f1c40f',
        letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6
    },
    gameSubtitle: {
        fontSize: 9, color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2, marginTop: 0, fontWeight: '600'
    },

    // PLAYER BADGE
    playerBadge: {
        alignSelf: 'center',
        width: 140,
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1c40f',
        marginBottom: 20,
        overflow: 'hidden'
    },
    playerBadgeHeader: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 3,
        alignItems: 'center'
    },
    playerLabel: {
        fontSize: 9, color: '#f1c40f', fontWeight: 'bold', letterSpacing: 1
    },
    playerNameText: {
        fontSize: 14, color: 'white', fontWeight: 'bold',
        textAlign: 'center', paddingVertical: 6, letterSpacing: 0.5
    },

    // BUTTONS
    buttonGrid: { gap: 12, marginBottom: 20, width: '100%' },
    mainMenuButton: {
        backgroundColor: '#fff',
        height: 60,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    cardCornerLeft: {
        alignItems: 'center',
        width: 30,
        marginRight: 10
    },
    buttonRank: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    buttonSuit: { fontSize: 16, color: '#000' },

    buttonCenter: {
        flex: 1,
        alignItems: 'center'
    },
    // Preferences
    preferencesContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20
    },
    preferenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    preferenceLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500'
    },

    buttonTitle: {
        fontSize: 16, fontWeight: 'bold', color: '#000', letterSpacing: 1
    },
    buttonSubtitle: {
        fontSize: 10, color: '#666', marginTop: 0, fontWeight: '500'
    },

    // FOOTER
    footerRow: {
        flexDirection: 'row', justifyContent: 'center', gap: 30, marginTop: 5
    },
    footerBtn: { alignItems: 'center' },
    footerBtnText: { color: '#fff', fontSize: 11, marginTop: 6, fontWeight: '500' },

    // ... (Keep existing shared styles for Forms, Online, etc.)
    screenTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    backButton: { position: 'absolute', left: 0, padding: 5, zIndex: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, minHeight: 50 },
    tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: 'rgba(255,255,255,0.15)' },
    tabText: { color: '#95a5a6', fontWeight: 'bold' },
    activeTabText: { color: 'white' },
    formContainer: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    label: { color: '#bdc3c7', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    input: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 15, color: 'white', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    playerCountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    countButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    countButtonSelected: { backgroundColor: '#f1c40f', borderColor: '#f1c40f' },
    countText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    countTextSelected: { color: '#2c3e50' },
    actionButton: { padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
    actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
    helperText: { color: '#7f8c8d', textAlign: 'center', marginTop: 15, fontSize: 12 },
    formSection: { width: '100%' },
    buttonRow: { flexDirection: 'row', marginTop: 10 },
    charGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, marginBottom: 20 },
    charOption: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', backgroundColor: '#333' },
    charOptionSelected: { borderColor: '#f1c40f', borderWidth: 3, transform: [{ scale: 1.1 }] },
    charImage: { width: '100%', height: '100%' },
    selectedButton: { borderWidth: 3, borderColor: '#f1c40f', backgroundColor: '#fffcf0' },
    iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    menuTextContainer: { flex: 1 },
    menuTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    menuSubtitle: { color: '#95a5a6', fontSize: 14 }
});

