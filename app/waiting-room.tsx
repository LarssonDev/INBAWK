import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Clipboard, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDatabase, ref, onValue, set, remove, update } from 'firebase/database';
import { app } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function WaitingRoomScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const roomID = params.roomID as string;
    const isHost = params.isHost === 'true';
    const playerName = params.playerName as string;

    const [players, setPlayers] = useState<any[]>([]);
    const [roomStatus, setRoomStatus] = useState<string>('WAITING');
    const [loading, setLoading] = useState(false);

    const db = getDatabase(app);

    useEffect(() => {
        if (!roomID) return;

        const statusUnsubscribe = onValue(ref(db, `rooms/${roomID}/status`), (snapshot) => {
            const status = snapshot.val();
            setRoomStatus(status);
            if (status === 'PLAYING') {
                router.replace({
                    pathname: '/game',
                    params: { roomID, playerName, isHost: params.isHost }
                });
            }
        });

        const playersUnsubscribe = onValue(ref(db, `rooms/${roomID}/players`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const playerList = Object.values(data).sort((a: any, b: any) => a.id - b.id);
                setPlayers(playerList);
            } else {
                setPlayers([]);
            }
        });

        return () => {
            statusUnsubscribe();
            playersUnsubscribe();
        };
    }, [roomID]);

    const handleStartGame = async () => {
        if (players.length < 2) {
            Alert.alert("Not enough players", "You need at least 2 players to start.");
            return;
        }
        setLoading(true);
        await update(ref(db, `rooms/${roomID}`), { status: 'PLAYING' });
    };

    const handleAddBot = async () => {
        if (players.length >= 6) {
            Alert.alert("Room Full", "Max 6 players allowed.");
            return;
        }
        setLoading(true);
        try {
            let nextId = 0;
            const ids = players.map(p => p.id);
            while (ids.includes(nextId)) nextId++;

            const newBot = {
                id: nextId,
                name: `Bot ${nextId}`,
                isBot: true,
                ready: true,
                emoji: '🤖'
            };
            await set(ref(db, `rooms/${roomID}/players/${nextId}`), newBot);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePlayer = async (playerId: number) => {
        if (!isHost) return;
        try {
            await remove(ref(db, `rooms/${roomID}/players/${playerId}`));
        } catch (error) {
            console.error("Failed to remove player", error);
            Alert.alert("Error", "Failed to remove player.");
        }
    };

    const copyRoomCode = () => {
        Clipboard.setString(roomID);
        Alert.alert("Copied!", `Room Code ${roomID} copied to clipboard.`);
    };

    const MAX_PLAYERS = 6;
    const slots = Array.from({ length: MAX_PLAYERS }, (_, i) => i);

    const renderPlayerSlot = (player: any) => (
        <View key={player.id} style={styles.playerItem}>
            <View style={styles.playerInfo}>
                <Text style={styles.avatar}>{player.isBot ? '🤖' : '👤'}</Text>
                <View>
                    <Text style={styles.playerName}>
                        {player.name} {player.name === playerName ? '(You)' : ''}
                    </Text>
                    {player.isHost && <Text style={styles.hostBadge}>HOST</Text>}
                </View>
            </View>
            <View style={styles.rightActions}>
                {isHost && player.isBot && (
                    <TouchableOpacity onPress={() => handleRemovePlayer(player.id)} style={styles.removeBtn}>
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                )}
                <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
            </View>
        </View>
    );

    const renderEmptySlot = (index: number) => (
        <View key={`empty-${index}`} style={[styles.playerItem, styles.emptySlot]}>
            <View style={styles.playerInfo}>
                <View style={[styles.avatar, styles.emptyAvatar]}>
                    <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={styles.emptyText}>Waiting...</Text>
            </View>
        </View>
    );

    const botCount = players.filter(p => p.isBot).length;

    return (
        <LinearGradient
            colors={['#1a0e0e', '#2d1b1b', '#3d2517']}
            style={styles.container}
        >    <View style={styles.splitLayout}>
                {/* LEFT PANEL: PLAYERS */}
                <View style={styles.leftPanel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>Players ({players.length}/{MAX_PLAYERS})</Text>
                        {botCount > 0 && <Text style={styles.botCountBadge}>{botCount} Bots</Text>}
                    </View>

                    <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
                        {slots.map(index => {
                            const p = players[index];
                            if (p) return renderPlayerSlot(p);
                            return renderEmptySlot(index);
                        })}
                    </ScrollView>
                </View>

                {/* RIGHT PANEL: ACTIONS & INFO */}
                <View style={styles.rightPanel}>
                    <View style={styles.codeSection}>
                        <Text style={styles.roomLabel}>ROOM CODE</Text>
                        <TouchableOpacity style={styles.codeBox} onPress={copyRoomCode}>
                            <Text style={styles.codeText}>{roomID}</Text>
                            <Ionicons name="copy-outline" size={24} color="#f1c40f" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.controlsSection}>
                        {isHost ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.bigButton, styles.botButton, (loading || players.length >= 6) && styles.disabledBtn]}
                                    onPress={handleAddBot}
                                    disabled={loading || players.length >= 6}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : (
                                        <>
                                            <Ionicons name="add-circle" size={32} color="white" />
                                            <Text style={styles.bigButtonText}>Add Bot</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.bigButton, styles.startButton, loading && styles.disabledBtn]}
                                    onPress={handleStartGame}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : (
                                        <>
                                            <Ionicons name="play-circle" size={32} color="white" />
                                            <Text style={styles.bigButtonText}>Start Game</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.waitingMessage}>
                                <ActivityIndicator color="#f1c40f" size="large" />
                                <Text style={styles.waitingText}>Waiting for host...</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    splitLayout: {
        flex: 1,
        flexDirection: 'row',
        padding: 20,
        gap: 20
    },
    leftPanel: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5
    },
    panelTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    botCountBadge: {
        backgroundColor: 'rgba(241, 196, 15, 0.2)',
        color: '#f1c40f',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        fontWeight: 'bold',
        fontSize: 12
    },
    listScroll: {
        flex: 1
    },
    listContent: {
        gap: 10,
        paddingBottom: 10
    },
    rightPanel: {
        width: 300,
        justifyContent: 'center',
        gap: 30
    },
    codeSection: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    roomLabel: {
        color: '#bdc3c7',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 2
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    codeText: {
        color: '#f1c40f',
        fontSize: 36,
        fontWeight: 'bold',
        letterSpacing: 3,
        textShadowColor: 'rgba(241, 196, 15, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10
    },
    controlsSection: {
        gap: 15
    },
    bigButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        gap: 15,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    botButton: {
        backgroundColor: '#34495e',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    startButton: {
        backgroundColor: '#27ae60',
        borderWidth: 1,
        borderColor: '#2ecc71'
    },
    disabledBtn: {
        opacity: 0.5
    },
    bigButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    avatar: {
        fontSize: 24
    },
    playerName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600'
    },
    hostBadge: {
        color: '#f1c40f',
        fontSize: 10,
        fontWeight: 'bold',
        backgroundColor: 'rgba(241, 196, 15, 0.1)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    removeBtn: {
        padding: 5,
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderRadius: 8
    },
    emptySlot: {
        backgroundColor: 'transparent',
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.2)'
    },
    emptyAvatar: {
        opacity: 0.5
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontStyle: 'italic'
    },
    waitingMessage: {
        alignItems: 'center',
        padding: 20
    },
    waitingText: {
        color: '#f1c40f',
        fontSize: 18,
        marginTop: 15,
        fontWeight: '500'
    }
});
