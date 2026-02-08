import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function RulesScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={['#c04000', '#8b2500', '#a0301a']}
            style={styles.container}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>HOW TO PLAY</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Objective</Text>
                    <Text style={styles.text}>
                        The goal is to win rounds and clear your hand. The last player with cards remaining is the loser ("INBAWK").
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Card Values</Text>
                    <Text style={styles.text}>
                        Rank needed to beat other cards (Low to High):
                    </Text>
                    <View style={styles.rankRow}>
                        <Text style={styles.rank}>2</Text>
                        <Text style={styles.rank}>3</Text>
                        <Text style={styles.rank}>4</Text>
                        <Text style={styles.rank}>5</Text>
                        <Text style={styles.rank}>6</Text>
                        <Text style={styles.rank}>7</Text>
                        <Text style={styles.rank}>8</Text>
                        <Text style={styles.rank}>9</Text>
                        <Text style={styles.rank}>10</Text>
                        <Text style={styles.rank}>J</Text>
                        <Text style={styles.rank}>Q</Text>
                        <Text style={styles.rank}>K</Text>
                        <Text style={styles.rankHigh}>A</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Determination Phase</Text>
                    <Text style={styles.text}>
                        At the start, everyone plays 1 card to determine who goes first.
                        {"\n\n"}
                        - **Highest Spade** starts.
                        {"\n"}
                        - If no Spades, the first player to **CUT** (play a different suit) starts.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Game Phase</Text>
                    <Text style={styles.text}>
                        The first player leads a suit. Everyone else must follow suit if they have it.
                        {"\n\n"}
                        - Highest card of the led suit wins the round.
                        {"\n"}
                        - If you cannot follow suit, you **MUST CUT** by playing any card of another suit.
                        {"\n\n"}
                        **CUT RULE:**
                        {"\n"}
                        If a cut happens, the player with the **Highest Card of the LED SUIT** played so far must pick up all cards on the table! The cutter then starts the next round.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Winning</Text>
                    <Text style={styles.text}>
                        When a player runs out of cards, they "Go Out". The game continues until only one player is left.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    backButton: {
        marginRight: 15,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#333',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    title: {
        color: '#ffd700', // Gold
        fontSize: 28,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    content: {
        padding: 20
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.9)', // Light card look for readability against red bg
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#333',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    sectionTitle: {
        color: '#c04000', // Theme Red
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5
    },
    text: {
        color: '#333',
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500'
    },
    rankRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 8
    },
    rank: {
        color: '#7f8c8d',
        fontSize: 16,
        fontWeight: 'bold'
    },
    rankHigh: {
        color: '#c04000',
        fontSize: 18,
        fontWeight: 'bold',
        textDecorationLine: 'underline'
    }
});
